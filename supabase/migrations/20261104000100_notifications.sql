-- Notifications plumbing. Source: architecture/02-BACKEND.md §6.
--   * completions INSERT trigger -> on-completion Edge Function (milestones), via pg_net
--   * run_streak_broken_check() -> send-push Edge Function, scheduled by pg_cron every 15 min
--     (the schedule itself lives in supabase/cron/streak_broken.sql)
--
-- The functions below read two Vault secrets and do nothing until they exist, so applying this
-- migration is always safe:
--     select vault.create_secret('https://<project-ref>.supabase.co/functions/v1', 'uvu_functions_url');
--     select vault.create_secret('<service role key>', 'uvu_service_role_key');

create extension if not exists pg_net;
create extension if not exists pg_cron;

-- ---------------------------------------------------------------------------
-- Internal: POST to an Edge Function with the service-role key
-- ---------------------------------------------------------------------------
create or replace function public.uvu_edge_call(fn text, payload jsonb)
returns void
language plpgsql
security definer
set search_path = public, extensions, vault, net
as $$
declare
  base text;
  key  text;
begin
  select decrypted_secret into base from vault.decrypted_secrets where name = 'uvu_functions_url';
  select decrypted_secret into key  from vault.decrypted_secrets where name = 'uvu_service_role_key';
  if base is null or key is null then
    return; -- not configured yet
  end if;

  perform net.http_post(
    url     := base || '/' || fn,
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || key),
    body    := payload
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Milestones: fire after each completion insert (pg_net sends after the transaction commits)
-- ---------------------------------------------------------------------------
create or replace function public.notify_on_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.uvu_edge_call(
    'on-completion',
    jsonb_build_object('user_id', new.user_id, 'habit_id', new.habit_id, 'completed_for', new.completed_for)
  );
  return new;
exception when others then
  return new; -- a notification problem must never block a check-in
end;
$$;

create trigger completions_notify
  after insert on public.completions
  for each row execute function public.notify_on_completion();

-- ---------------------------------------------------------------------------
-- Streak broken: for users whose local clock just crossed midnight, find anyone who missed a
-- required habit on the day that just ended. send-push re-verifies that a live streak was lost
-- (so people with nothing to lose are not pinged) and dedups via notification_log.
-- Timezones are re-read from profiles on every run (no caching), so travel just works.
-- ---------------------------------------------------------------------------
create or replace function public.run_streak_broken_check()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  r      record;
  called integer := 0;
begin
  for r in
    select p.user_id, p.timezone
    from public.profiles p
    where p.push_enabled
  loop
    begin
      -- only users whose local time is in the first 15 minutes of a new day
      if (now() at time zone r.timezone)::time >= time '00:15' then
        continue;
      end if;

      declare
        missed_day date := (now() at time zone r.timezone)::date - 1;
      begin
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
      end;
    exception when others then
      continue; -- one bad row (e.g. an invalid timezone) must not stop the rest
    end;
  end loop;
  return called;
end;
$$;

-- Not callable from the API: only triggers, cron and the service role use these.
revoke all on function public.uvu_edge_call(text, jsonb) from public, anon, authenticated;
revoke all on function public.run_streak_broken_check() from public, anon, authenticated;
