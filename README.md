# UVU

Habit tracker (web app, installable PWA). Build two parallel streaks, **Daily UVU** and **Weekly UVU**, by completing habits each day. Desktop web only for the MVP.

## Reference docs (read-only, not app code)

| Path | Role | Precedence |
|---|---|---|
| `architecture/01-SYSTEM.md`, `02-BACKEND.md`, `03-UX-AND-BUILD.md` | Product logic, data model, backend, notifications, MVP scope | 1 (behavior) |
| `design/design.md` | Tokens, colors, type, radii, nav | 2 (visuals) |
| `design/uvu-sample-screens.html` | Visual mocks (look, not spec) | 3 (reference) |

Conflicts are flagged, not guessed. See **Decisions** below.

## Setup

```bash
npm install --legacy-peer-deps   # plain `npm install` hit an arborist peer-set bug on Node 20 here
                       # Node 22+ recommended (supabase-js storage dep declares >=22)
cp .env.example .env.local   # fill in Supabase + Pusher Beams credentials
npm run dev            # http://localhost:3000
```

Scripts: `npm run build`, `npm run lint`, `npm run typecheck`, `npm test` (Vitest).

### Supabase

```bash
npx supabase link --project-ref <ref>
npx supabase db push                                   # schema, RLS, notification triggers/functions
npx supabase secrets set BEAMS_INSTANCE_ID=... BEAMS_SECRET_KEY=... APP_URL=https://your-app.vercel.app
npx supabase functions deploy send-push on-completion
```

Then, once, in the SQL editor: store the function URL + service-role key in Vault and schedule the
15-minute `streak_broken` job. Both steps are in `supabase/cron/streak_broken.sql`. Until the Vault
secrets exist the DB functions are no-ops, so nothing breaks.

Edge Functions can't import from `lib/`, so the streak logic is copied (generated) into
`supabase/functions/_shared/streaks.ts`. After changing `lib/timezone.ts` or `lib/streaks/*` run
`npm run sync:edge` (a unit test fails if you forget).

### Pusher Beams

Create a Beams instance, enable Web Push, and put `NEXT_PUBLIC_BEAMS_INSTANCE_ID` / `BEAMS_SECRET_KEY`
in `.env.local` (and Vercel). `/api/beams/auth` mints a user token for the signed-in user only.
Push needs the production build (the service worker registers only in production): `npm run build && npm start`.

## Layout

```
app/            Next.js App Router: (onboarding), (auth), (app) route groups, api/
components/     by feature (today, habits, timeline, settings, ...) + shared ui/
lib/            supabase clients, streaks, timezone, beams, icons, theme
supabase/       migrations, edge functions, cron setup
public/         manifest, service worker, icons
architecture/   reference docs (do not put app code here)
design/         reference design (do not put app code here)
```

## Decisions

Conflicts between docs/mocks and the calls made (see `architecture/` docs for the originals):

1. **Navigation**: docs say 3 bottom tabs + a Settings modal; `design.md` lists 4 nav items including Settings. `design.md` wins: sidebar order Today, Manage Habits, Timeline, Settings; Settings is a page.
2. **Desktop only**: no mobile layouts and no iOS Add-to-Home-Screen prompt in this MVP (per product owner).
3. **No OAuth** (Google/Apple buttons in the mocks are out of MVP scope). Forgot-password is kept.
4. **Icons**: "AI generates the icon" in the mocks means a static icon set chosen by habit-name keywords (per `03-UX-AND-BUILD.md`), not runtime AI.
5. **Mock marketing copy** (fake user stats, "private beta", "streaks that forgive one off day") is not used.
6. **Service worker**: hand-written `public/service-worker.js` that imports Pusher Beams, rather than `next-pwa` (unmaintained, incompatible with the App Router).
7. **Next.js 16**: the `middleware` convention is named `proxy` there; the file follows that.
8. **Streak edge cases** the docs leave open: today-not-yet-done does not break a streak; habits count only from creation day through archive day; the in-progress week is not a break until it ends; non-required days are neutral (not "missed") in Timeline.
9. **Schema additions** (all additive to `02-BACKEND.md`): `notification_log.detail` (so a daily and weekly milestone on one day don't collide in dedup); DB trigger rejecting completions for any day but the user's local today (enforces no backfill); RLS on `completions` also checks the habit belongs to the caller; CHECK constraints on frequency/active_days/color/theme. The migration has not been run against a live database yet (no local Postgres; apply with `supabase db push`).
10. **PWA**: manifest + icons (192/512/maskable), hand-written service worker (Pusher Beams import, static-asset cache, offline page; authenticated HTML is never cached). Registered in production only. The iOS Add-to-Home-Screen prompt was dropped with the web-only scope.
11. **Notifications**: milestone push only fires when today completed the day/week (so extra check-ins never re-announce a streak); streak-broken push only fires when a streak that was alive the day before was actually lost. Dedup per `(user, habit, type, detail, UTC day)`.
12. **Profiles** are created by a trigger on `auth.users`, reading `timezone`, `week_start`, `display_name` from signup metadata.

Git: work happens on branch `uvu-build` in the parent repo; commits include only `UVU/`.
