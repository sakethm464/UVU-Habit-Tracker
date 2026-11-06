# UVU — 03 · UX & Build Plan

Screens, PWA setup, build order, scope guardrails. Read `01-SYSTEM.md` and `02-BACKEND.md` first.

---

## 1. User flow

### Onboarding (first-time visitors)
Three static cards:
1. Make the habit you want to track
2. Scratch it off your day when done — it saves to your timeline automatically
3. Fill your timeline with color to earn your UVU streak

"Skip" top-right. Final screen → `Let's get started!` → Auth.

### Auth
- **Sign up:** Name, Email, Password (with visibility toggle). No last name, no re-enter password.
- **Log in:** Email, Password.
- **Forgot password:** standard Supabase Auth email flow.

### First-run (after first signup)
- Small prompt asking whether to enable push notifications. Outcome stored on profile; not re-shown in the same session if denied.
- Capture browser timezone → `profiles.timezone`; weekday of signup → `profiles.week_start`.
- Land on **Today** (empty state → "Create your first habit").

### Dashboard — 3 tabs, bottom nav

**Today**
- Week ribbon at top: rolling 7-day window starting from current date, Google-Calendar-style strip. Month + year label with `< >` chevrons. **Visual navigation only** — future-day taps do nothing in MVP.
- Habit list: each row = a habit required today, with icon, name, color accent, completion checkbox.
- Headline metrics: Daily UVU + Weekly UVU shown prominently.

**Habits**
- "+ Create New Habit" button opens a form:
  1. Habit Name
  2. Description (optional)
  3. Consistency Level — every day / specific days of the week
  4. Color — user picks; drives card + Timeline color
  - Icon: auto-assigned from the Claude-generated icon set based on habit name; no user-facing picker in MVP.
- Habit cards: name + icon, description, active-days chips (active days highlighted), pencil/edit icon.

**Timeline**
- Per-habit card with **Week / Month toggle** (Week = default). Color-coded grid of recent days; filled = completed, empty = missed.
- Tap a habit card → detail page with weekly / monthly / yearly consistency % as an animated fill circle. View-only; not a stored streak.

### Settings (4th sidebar item) and the profile modal

**Settings page** (`/settings`, sidebar item 4):
- **Notifications toggle.** On: request browser push permission, subscribe via Pusher Beams, set `profiles.push_enabled = true`. Off: unsubscribe the device, set `push_enabled = false`. If permission is blocked at browser/OS level, show re-enable instructions. On iOS without Add to Home Screen, show the install explainer instead (iOS 16.4+ only delivers push to installed PWAs).
- **Light / Dark / System.** Defaults to system. The override is stored in `localStorage` (`uvu-theme`, applied before paint, covers onboarding and auth) and mirrored to `profiles.theme`; a device with no stored choice adopts the profile value.
- **Timezone.** Auto-detected at signup into `profiles.timezone`; overridable with a searchable IANA picker. Used for all end-of-day and streak logic (cron re-reads it every run).
- **Delete account.** Type-to-confirm (`DELETE`), then `DELETE /api/account` (server route, service-role key) hard-deletes the auth user; `profiles`, `habits`, `completions`, `notification_log` cascade via FK `on delete cascade`. Then sign out and redirect to `/welcome`.

**Profile modal** (bottom-left sidebar profile card, 24px modal radius per `design/design.md`): contains only **Log out**, which detaches the push device, ends the Supabase session and redirects to `/login`.

---

## 2. PWA setup

- `next-pwa` scaffolds the PWA service worker and offline cache.
- `public/manifest.json` with name, icons (192 + 512), theme color, `display: standalone`.
- Add-to-Home-Screen prompt component shown to iOS users on first visit after signup (iOS 16.4+ required for push).
- Confirm service worker from `public/service-worker.js` is reachable at `/service-worker.js` for Pusher Beams.

---

## 3. Build order (suggested)

1. Scaffold Next.js + Tailwind + Framer Motion
2. Install Supabase CLI (`npm install supabase --save-dev`), `supabase init`, `supabase link`
3. Write migration: all four tables + RLS policies, `supabase db push`
4. Supabase Auth integration: signup, login, session hooks, timezone + week_start capture
5. Core data lib: Supabase clients, Habit + Completion CRUD
6. Today tab (week ribbon, habit list, tap-to-complete)
7. Habits tab (create form, cards, edit)
8. Streak computation (`lib/streaks.ts`) + wire into Today header
9. Timeline tab (Week/Month toggle, per-habit detail page with consistency %)
10. Settings page (push toggle + iOS/blocked help, theme, searchable timezone, type-to-confirm delete) + profile modal (log out)
11. PWA shell (`next-pwa`, manifest, `public/service-worker.js`)
12. Pusher Beams integration: `/api/beams/auth`, client subscribe on login
13. Edge Functions: `send-push`, `on-completion`
14. `pg_cron` job for streak_broken check (every 15 min)
15. Postgres trigger on `completions` for milestone pushes
16. Onboarding screens + first-run notification prompt
17. Polish: empty states, animations, light/dark theming

---

## 4. Out of scope for MVP

- Weekly-target habits (3x/week, any days)
- Per-habit reminder times
- Native iOS/Android apps
- Google/Apple OAuth
- Streak freezes or grace periods
- Social/sharing features
- Habit categories or folders
- Analytics (Sentry, PostHog)
