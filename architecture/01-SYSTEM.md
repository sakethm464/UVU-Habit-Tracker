# UVU — 01 · System Overview

A build-ready reference for Claude Code. Read this first. Two sibling docs cover the rest:
- `02-BACKEND.md` — data model, RLS, API, streak logic, timezone, notifications
- `03-UX-AND-BUILD.md` — user flow, PWA setup, build order, out of scope

---

## 1. Project overview

UVU is a web-based habit tracker. Users define habits with a schedule (daily or specific weekdays), tap to complete them each day, and build two parallel streaks called "UVUs." Push notifications celebrate milestones and gently flag broken streaks.

**Deliverable:** installable PWA, no backfill, works on desktop + mobile.

---

## 2. Core concepts

| Concept | Definition |
|---|---|
| **Habit** | A thing the user wants to repeat on a schedule they define. Either daily or specific days of the week. |
| **Completion** | A tap that marks a habit done for a given day. One per (habit, day). |
| **Daily UVU** | Streak counting consecutive days where every one of the user's daily habits was completed. Only exists if the user has at least one daily habit. |
| **Weekly UVU** | Streak counting consecutive weeks where every required instance of every habit (daily + specific-days) was completed. Always shown if the user has any habit. |

**Rules:**
- **No backfill.** A habit can only be marked for today.
- **End-of-day is sharp.** 11:59pm counts for today; 12:00am counts for the next day. No grace period.
- **Week start = user's signup weekday.** Stored on `profiles.week_start`. A user who signs up on Tuesday has weeks that run Tue → Mon.
- **"Today" is user-local**, computed from `profiles.timezone` (IANA string).
- **Streak breaks the moment a required instance is missed** at end-of-day in the user's timezone.

---

## 3. Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) |
| Styling | TailwindCSS |
| Animation | Framer Motion v12 |
| Database / Auth | Supabase (Postgres + Supabase Auth) |
| Serverless logic | Supabase Edge Functions |
| Scheduling | Supabase `pg_cron` + `pg_net` |
| Push notifications | Pusher Beams (Web Push, Authenticated Users mode) |
| Hosting | Vercel |
| PWA | `next-pwa` |

---

## 4. Project structure

```
uvu/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (onboarding)/
│   │   └── welcome/page.tsx
│   ├── (app)/
│   │   ├── today/page.tsx
│   │   ├── habits/page.tsx
│   │   ├── timeline/page.tsx
│   │   └── timeline/[habitId]/page.tsx
│   ├── api/
│   │   └── beams/auth/route.ts        # issues Pusher Beams user tokens
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── today/
│   ├── habits/
│   ├── timeline/
│   ├── settings/
│   └── ui/                            # shared primitives
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  # browser client
│   │   └── server.ts                  # server client w/ service role
│   ├── streaks.ts                     # Daily + Weekly UVU logic
│   ├── timezone.ts
│   └── beams.ts
├── supabase/
│   ├── migrations/
│   │   └── 20261104000000_initial_schema.sql
│   └── functions/
│       ├── send-push/
│       └── on-completion/
├── public/
│   ├── service-worker.js              # one-liner for Pusher Beams
│   ├── manifest.json
│   └── icons/
├── .env.local
├── next.config.js                     # next-pwa config
└── package.json
```

---

## 5. Environment variables

`.env.local` (git-ignored):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_BEAMS_INSTANCE_ID=
BEAMS_SECRET_KEY=
```

Same vars must be set in Vercel's env settings post-deploy.
