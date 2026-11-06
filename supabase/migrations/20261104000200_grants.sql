-- Table privileges for the Data API roles.
-- Newer Supabase projects no longer auto-grant access on tables created in `public`, which
-- surfaces as "permission denied for table ..." before RLS is even consulted. RLS (initial
-- migration) still limits every signed-in user to their own rows; anon gets nothing.

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on public.profiles, public.habits, public.completions, public.notification_log to authenticated;

-- Edge Functions and the account-deletion route use the service role.
grant all on public.profiles, public.habits, public.completions, public.notification_log to service_role;
