-- Schedules the end-of-day "streak broken" check. Run once in the Supabase SQL editor
-- AFTER `supabase db push` and `supabase functions deploy send-push on-completion`.
--
-- 1) One-time: store the function URL + service-role key in Vault (the DB functions read them).
--    Replace the placeholders, run these two lines once, then delete them from your history.
--
--      select vault.create_secret('https://<project-ref>.supabase.co/functions/v1', 'uvu_functions_url');
--      select vault.create_secret('<service role key>', 'uvu_service_role_key');
--
-- 2) Schedule: every 15 minutes. Each run only acts on users whose local time is in the first
--    2 hours of a new day and who have no streak_broken log row for the day that just ended
--    (profiles.timezone is re-read every run). NOTE: this file is NOT a migration, so
--    `supabase db push` never applies it; a new environment has no schedule until you run it.

select cron.unschedule('uvu-streak-broken')
where exists (select 1 from cron.job where jobname = 'uvu-streak-broken');

select cron.schedule(
  'uvu-streak-broken',
  '*/15 * * * *',
  $$ select public.run_streak_broken_check(); $$
);
