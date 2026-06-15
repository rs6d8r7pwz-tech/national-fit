-- ============================================================
-- NATIONAL FIT — Policies Admin (à exécuter UNE FOIS)
-- Remplace 'TON_EMAIL_ADMIN@example.com' par ton vrai email
-- ============================================================

-- 1. Marquer ton compte comme admin dans Supabase
-- (remplace l'email ci-dessous par celui de ton compte)
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
where email = 'b.brochier@outlook.fr';

-- 2. Ajouter les policies admin-bypass sur chaque table

-- user_profiles
drop policy if exists "admin read all profiles" on public.user_profiles;
create policy "admin read all profiles" on public.user_profiles
  for select using (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- workout_programs
drop policy if exists "admin read all programs" on public.workout_programs;
create policy "admin read all programs" on public.workout_programs
  for select using (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- workout_sessions
drop policy if exists "admin read all sessions" on public.workout_sessions;
create policy "admin read all sessions" on public.workout_sessions
  for select using (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- exercise_logs
drop policy if exists "admin read all logs" on public.exercise_logs;
create policy "admin read all logs" on public.exercise_logs
  for select using (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- progress_entries
drop policy if exists "admin read all progress" on public.progress_entries;
create policy "admin read all progress" on public.progress_entries
  for select using (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- personal_records
drop policy if exists "admin read all prs" on public.personal_records;
create policy "admin read all prs" on public.personal_records
  for select using (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- referrals
drop policy if exists "admin read all referrals" on public.referrals;
create policy "admin read all referrals" on public.referrals
  for select using (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- notifications
drop policy if exists "admin read all notifs" on public.notifications;
create policy "admin read all notifs" on public.notifications
  for select using (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ============================================================
-- Ajout colonne email dans user_profiles (si pas déjà là)
-- ============================================================
alter table public.user_profiles add column if not exists email text;

-- Policy admin pour UPDATE user_profiles
drop policy if exists "admin update all profiles" on public.user_profiles;
create policy "admin update all profiles" on public.user_profiles
  for update using (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
