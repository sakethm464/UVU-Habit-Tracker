-- Hardening pass from the supabase/ code review. Additive: earlier migrations are untouched
-- because they may already be applied to the hosted project.
--   * completions/habits: block UPDATEs that sidestep the "no backfill" rule
--   * notification_log: server-owned, authenticated users get read-only access
--   * run_streak_broken_check(): state-driven 2h window (survives skipped ticks / DST) and
--     re-sends after a failed publish, because send-push deletes its log row on failure
--   * notify_on_completion(): skip the HTTP call for users with push off; payload is user_id only

-- ---------------------------------------------------------------------------
-- 1. No backfill via UPDATE
-- ---------------------------------------------------------------------------
-- The insert/delete trigger checks completed_for = today, but an UPDATE bypassed it: insert for
-- today, then move the row to any past day. Identity columns of a completion are immutable for
-- signed-in users (service role / internal writes have auth.uid() = null and are unaffected).
create or replace function public.lock_completion_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and (new.completed_for is distinct from old.completed_for
          or new.habit_id    is distinct from old.habit_id
          or new.user_id     is distinct from old.user_id) then
    raise exception 'Completions cannot be moved; delete and re-create for today instead'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger completions_lock_columns
  before update on public.completions
  for each row execute function public.lock_completion_columns();

-- habits.created_at feeds "was this habit scheduled on day X", so backdating it would allow the
-- same trick. Ownership must not change either.
create or replace function public.lock_habit_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and (new.created_at is distinct from old.created_at
          or new.user_id is distinct from old.user_id) then
    raise exception 'habits.created_at and habits.user_id are read-only'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger habits_lock_columns
  before update on public.habits
  for each row execute function public.lock_habit_columns();

-- ---------------------------------------------------------------------------
-- 2. notification_log is server-owned
-- ---------------------------------------------------------------------------
-- Users could pre-insert a dedup row and silence their own pushes. Keep SELECT (own rows via RLS).
revoke insert, update, delete on public.notification_log from authenticated;

-- ---------------------------------------------------------------------------
-- 3. Milestone trigger: no HTTP call when push is off, no unused payload fields
-- ---------------------------------------------------------------------------
create or replace function public.notify_on_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.profiles where user_id = new.user_id and push_enabled) then
    perform public.uvu_edge_call('on-completion', jsonb_build_object('user_id', new.user_id));
  end if;
  return new;
exception when others then
  return new; -- a notification problem must never block a check-in
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Streak-broken check
-- ---------------------------------------------------------------------------
-- Acts for users whose local time is within the first 2 hours of a new day (was: 15 minutes,
-- which lost the push if a tick was skipped or local midnight did not exist due to DST).
-- Repeat ticks inside the window are cheap: a user is skipped once a notification_log row exists
-- for that missed day. send-push deletes its row when publishing fails, so the next tick retries.
--
-- The "is this habit scheduled on missed_day" predicate below mirrors isScheduledOn()
-- (lib/habits.ts, copied to functions/_shared/streaks.ts). Keep the three in sync.
create or replace function public.run_streak_broken_check()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  r          record;
  local_now  timestamp;
  missed_day date;
  called     integer := 0;
begin
  for r in
    select p.user_id, p.timezone
    from public.profiles p
    where p.push_enabled
  loop
    begin
      local_now := now() at time zone r.timezone;
      continue when local_now::time >= time '02:00';
      missed_day := local_now::date - 1;

      continue when exists (
        select 1 from public.notification_log n
        where n.user_id = r.user_id and n.type = 'streak_broken' and n.detail = missed_day::text
      );

      if exists (
        select 1
        from public.habits h
        where h.user_id = r.user_id
          and (h.created_at at time zone r.timezone)::date <= missed_day
          and (h.archived_at is null or (h.archived_at at time zone r.timezone)::date > missed_day)
          and (h.frequency_type = 'daily' or extract(dow from missed_day)::int = any (h.active_days))
          and not exists (
            select 1 from public.completions c where c.habit_id = h.id and c.completed_for = missed_day
          )
      ) then
        perform public.uvu_edge_call(
          'send-push',
          jsonb_build_object('user_id', r.user_id, 'type', 'streak_broken', 'detail', missed_day::text)
        );
        called := called + 1;
      end if;
    exception when others then
      continue; -- one bad row (e.g. an invalid timezone) must not stop the rest
    end;
  end loop;
  return called;
end;
$$;

revoke all on function public.run_streak_broken_check() from public, anon, authenticated;
revoke all on function public.lock_completion_columns() from public, anon, authenticated;
revoke all on function public.lock_habit_columns() from public, anon, authenticated;
