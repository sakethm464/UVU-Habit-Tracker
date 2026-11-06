-- UVU initial schema + RLS. Source: architecture/02-BACKEND.md §1-2.
-- Deviations from the doc (all additive, noted in README "Decisions"):
--   * profiles row is created by a trigger on auth.users (reads signup metadata).
--   * completions: DB-level "no backfill" trigger + habit-ownership check in RLS.
--   * notification_log.detail so two milestone pushes (daily + weekly) on one day don't collide in dedup.
--   * CHECK constraints on frequency/active_days/color/theme.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  display_name  text,
  timezone      text not null default 'UTC',            -- IANA, e.g. 'America/New_York'
  push_enabled  boolean not null default false,
  theme         text not null default 'system' check (theme in ('light', 'dark', 'system')),
  week_start    int  not null default 0 check (week_start between 0 and 6),  -- 0=Sun..6=Sat, weekday of signup
  created_at    timestamptz not null default now()
);

create table public.habits (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  name            text not null check (char_length(btrim(name)) between 1 and 80),
  description     text check (description is null or char_length(description) <= 500),
  color           text check (color is null or color ~ '^#[0-9A-Fa-f]{6}$'),  -- drives card + Timeline color
  icon            text,                                  -- key into the static icon set
  frequency_type  text not null check (frequency_type in ('daily', 'specific_days')),
  active_days     int[] check (active_days is null or active_days <@ array[0,1,2,3,4,5,6]),
  created_at      timestamptz not null default now(),
  archived_at     timestamptz,                           -- soft delete so Timeline history survives
  constraint habits_active_days_match_frequency check (
    (frequency_type = 'daily') or
    (frequency_type = 'specific_days' and active_days is not null and cardinality(active_days) between 1 and 7)
  )
);

create index habits_user_active_idx on public.habits (user_id) where archived_at is null;

create table public.completions (
  id             uuid primary key default gen_random_uuid(),
  habit_id       uuid not null references public.habits (id) on delete cascade,
  user_id        uuid not null references auth.users (id) on delete cascade,  -- denormalized for RLS + speed
  completed_for  date not null,                          -- the day this counts for (user-local)
  completed_at   timestamptz not null default now(),
  unique (habit_id, completed_for)
);

create index completions_user_day_idx on public.completions (user_id, completed_for);

create table public.notification_log (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references auth.users (id) on delete cascade,
  habit_id  uuid,                                        -- nullable
  type      text not null check (type in ('streak_broken', 'streak_milestone')),
  detail    text,                                        -- e.g. 'daily:7', 'weekly:4' (milestones)
  sent_at   timestamptz not null default now()
);

-- Dedup key: (user_id, habit_id, type, detail, day). Prevents double-sends across overlapping cron runs.
create unique index notification_log_dedup_idx on public.notification_log (
  user_id,
  coalesce(habit_id, '00000000-0000-0000-0000-000000000000'::uuid),
  type,
  coalesce(detail, ''),
  ((sent_at at time zone 'UTC')::date)
);

-- ---------------------------------------------------------------------------
-- Row Level Security (non-negotiable)
-- ---------------------------------------------------------------------------

alter table public.profiles         enable row level security;
alter table public.habits           enable row level security;
alter table public.completions      enable row level security;
alter table public.notification_log enable row level security;

create policy "own rows" on public.profiles
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own rows" on public.habits
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- A completion must point at one of the caller's own habits.
create policy "own rows" on public.completions
  for all
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.habits h where h.id = habit_id and h.user_id = auth.uid())
  );

create policy "own rows" on public.notification_log
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Profile creation on signup
-- ---------------------------------------------------------------------------
-- Client passes { display_name, timezone, week_start } in signUp options.data.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  tz   text  := coalesce(nullif(meta ->> 'timezone', ''), 'UTC');
  ws   int;
begin
  if not exists (select 1 from pg_timezone_names where name = tz) then
    tz := 'UTC';
  end if;

  begin
    ws := (meta ->> 'week_start')::int;
  exception when others then
    ws := null;
  end;
  if ws is null or ws not between 0 and 6 then
    ws := extract(dow from (now() at time zone tz))::int;
  end if;

  insert into public.profiles (user_id, display_name, timezone, week_start)
  values (new.id, nullif(btrim(meta ->> 'display_name'), ''), tz, ws);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- No backfill, enforced in the database
-- ---------------------------------------------------------------------------
-- A completion may only be created/removed for "today" in the user's timezone.
-- Skipped for service-role/internal writes (auth.uid() is null) and for cascade deletes
-- (parent habit already gone).

create or replace function public.enforce_completion_today()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  tz    text;
  today date;
  rec   public.completions;
begin
  if auth.uid() is null then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_op = 'DELETE' then rec := old; else rec := new; end if;

  if tg_op = 'DELETE' and not exists (select 1 from public.habits where id = rec.habit_id) then
    return old;
  end if;

  select timezone into tz from public.profiles where user_id = rec.user_id;
  today := (now() at time zone coalesce(tz, 'UTC'))::date;

  if rec.completed_for <> today then
    raise exception 'Completions can only be changed for today (%), got %', today, rec.completed_for
      using errcode = 'check_violation';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger completions_today_only
  before insert or delete on public.completions
  for each row execute function public.enforce_completion_today();
