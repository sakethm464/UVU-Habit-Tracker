# UVU — 02 · Backend & Data

Data model, security, API surface, streak computation, timezone, notifications. Read `01-SYSTEM.md` first for context.

---

## 1. Data model

One Postgres database, four tables. Supabase Auth owns `auth.users`.

```sql
-- One row per user, 1:1 with auth.users
profiles
  user_id        uuid primary key references auth.users on delete cascade
  display_name   text
  timezone       text          -- IANA, e.g. 'America/New_York'
  push_enabled   bool default false
  theme          text default 'system'   -- 'light' | 'dark' | 'system'
  week_start     int                      -- 0=Sun … 6=Sat; set to the weekday of signup
  created_at     timestamptz default now()

-- One row per habit
habits
  id              uuid primary key default gen_random_uuid()
  user_id         uuid references auth.users on delete cascade
  name            text not null
  description     text
  color           text                     -- hex; drives card + Timeline color
  icon            text                     -- key into Claude-generated icon set
  frequency_type  text not null            -- 'daily' | 'specific_days'
  active_days     int[]                    -- [0..6], used when 'specific_days'
  created_at      timestamptz default now()
  archived_at     timestamptz              -- soft-delete so Timeline history survives

-- One row per (habit, day) when completed
completions
  id              uuid primary key default gen_random_uuid()
  habit_id        uuid references habits on delete cascade
  user_id         uuid                     -- denormalized for RLS + speed
  completed_for   date not null            -- the day this counts for (user-local)
  completed_at    timestamptz default now()
  UNIQUE(habit_id, completed_for)

-- Dedup + debug log for notifications
notification_log
  id          uuid primary key default gen_random_uuid()
  user_id     uuid
  habit_id    uuid                         -- nullable
  type        text                         -- 'streak_broken' | 'streak_milestone'
  sent_at     timestamptz default now()
```

**Design calls:**
- `completed_for` is a `date`, not a timestamp — collapses time; `completed_at` keeps the raw moment for analytics.
- Habits are soft-deleted via `archived_at` so streak history survives.
- `user_id` denormalized on `completions` → simpler RLS, no joins on hot reads.
- `UNIQUE(habit_id, completed_for)` enforces no-double-complete at the DB level.
- No `push_subscriptions` table — Pusher Beams owns device/user mapping.

---

## 2. Row Level Security (non-negotiable)

Every table gets a policy of this shape:

```sql
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own rows" ON <table>
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

Apply to `profiles`, `habits`, `completions`, `notification_log`. Without RLS the anon key leaks every user's data.

---

## 3. API / operations

Called either directly from the browser via the Supabase JS client (RLS enforces access) or through Next.js route handlers for server-privileged work.

| Operation | Does |
|---|---|
| `createHabit(data)` | Insert into `habits` |
| `updateHabit(id, patch)` | Edit name, description, color, frequency |
| `archiveHabit(id)` | Set `archived_at = now()` |
| `toggleCompletion(habit_id)` | Upsert (or delete) today's `completions` row for that habit |
| `getToday()` | Active habits where today is a required day, plus completion status |
| `getTimeline(from, to)` | Grid of completions per habit across a range |
| `getStreaks()` | Daily UVU + Weekly UVU + per-habit current/longest |
| `getConsistency(habit_id, window)` | % = completed ÷ required, for 'week' | 'month' | 'year' |

---

## 4. Streak computation

Both computed on the fly from `completions` + `habits.frequency_type`. SQL window functions; no materialized tables unless slow at scale.

**Daily UVU:**
1. Collect user's habits where `frequency_type = 'daily'` and not archived.
2. For each day going back from today, check: did every daily habit have a completion row for that day?
3. Walk back day-by-day while the answer stays yes; break on the first no.
4. Return the count.

**Weekly UVU:**
1. Anchor weeks to the user's `profiles.week_start` weekday.
2. For each 7-day week going back from this week, enumerate every required instance of every habit (daily contributes 7; specific-days contributes the count of active days falling in that week).
3. Check every required instance has a matching `completions` row.
4. Walk back week-by-week while yes; break on the first no.
5. Return the count.

**Consistency % (Timeline detail view):**
- `completed ÷ required` within the selected window (week/month/year).
- For specific-days habits, "required" counts only the active weekdays that fell in the window.
- Today counts as a required day like any other: an unfinished today lowers the percentage until it is completed.
- View-only metric. Not a stored streak.

---

## 5. Timezone handling

- On signup, read `Intl.DateTimeFormat().resolvedOptions().timeZone` from the browser and write to `profiles.timezone`.
- Every "today" computation uses `profiles.timezone`, not UTC and not the server's zone.
- Settings exposes a searchable IANA timezone picker (override for users who travel).
- Cron jobs re-read `profiles.timezone` on every run — no caching.

---

## 6. Notifications architecture

### Stack
- **Pusher Beams** for delivery (Web Push mode).
- **Supabase Edge Function** `send-push` calls Pusher's REST API using `BEAMS_SECRET_KEY`.
- **`pg_cron`** schedules the "end-of-day" check across timezones.
- **Postgres trigger** on `completions` insert fires milestone pushes.
- **Beams user auth:** Next.js route `/api/beams/auth` issues Beams user tokens, so devices subscribe by `user_id` (not device interests). Client calls `start()` + `setUserId()` on login.

### Public service worker
`public/service-worker.js`:
```js
importScripts("https://js.pusher.com/beams/service-worker.js");
```
Must be served at `/service-worker.js` from the site root. If `next-pwa` generates a different service worker, merge both by having the PWA worker `importScripts()` Pusher's URL.

### Flow — streak_broken
1. `pg_cron` runs every 15 min.
2. For each user whose local time has just crossed midnight (per `profiles.timezone`), find habits that were required yesterday with no `completions` row for yesterday.
3. Call `send-push` Edge Function with `{ user_id, type: 'streak_broken' }`.
4. Edge Function writes a `notification_log` row (dedup check first), then calls Pusher Beams.

### Flow — streak_milestone
1. Postgres trigger on `INSERT INTO completions` fires.
2. Trigger calls `on-completion` Edge Function via `pg_net`.
3. Function recomputes Daily UVU + Weekly UVU.
4. If either just crossed a milestone (**Daily:** 7, 30, then every +30 — 60, 90, 120, …; **Weekly:** every +4 — 4, 8, 12, …), dedup check, log, publish.

### Message copy (MVP placeholders — polish before launch)
| Type | Message |
|---|---|
| `streak_broken` | "You missed a habit today — your UVU is reset. Ready to start again tomorrow?" |
| `streak_milestone` | "🔥 {N}-day UVU! Keep it going." |

### Edge cases
- **Timezone drift (user travels):** cron re-reads `profiles.timezone` every run.
- **Permission denied:** set `profiles.push_enabled = false`; show a one-time in-app explainer, no nagging.
- **iOS:** push only works for users who've installed the PWA to home screen (iOS 16.4+). Show an install prompt for iOS users.
- **Dedup:** `notification_log` row keyed by `(user_id, habit_id, type, date)` prevents double-sends across overlapping cron runs.
