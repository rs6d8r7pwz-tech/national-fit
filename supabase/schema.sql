-- ============================================================
-- NATIONAL FIT FRANCE — Schéma Supabase
-- À exécuter dans l'éditeur SQL de votre projet Supabase
-- ============================================================

create extension if not exists "uuid-ossp";

-- ── user_profiles ────────────────────────────────────────────
create table user_profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  first_name text not null,
  age numeric, gender text, height_cm numeric, weight_kg numeric,
  target_weight numeric, fitness_level text, goal text,
  food_mode text, equipment text, dietary_preference text,
  allergies text, injuries text,
  weak_muscles jsonb default '[]',
  available_days numeric, meals_per_day numeric,
  body_type_score numeric, ai_morphology_note text,
  photo_front_relaxed text, photo_front_flexed text,
  photo_back_relaxed text, photo_back_flexed text,
  xp_points numeric default 0,
  streak_days numeric default 0,
  last_workout_date text,
  onboarding_complete boolean default false,
  is_premium boolean default false,
  premium_expires_at text, premium_source text,
  trial_started_at text, trial_ends_at text,
  subscription_status text default 'free',
  subscription_plan text, stripe_customer_id text,
  subscription_end_date text, budget_level text,
  max_cooking_time_min numeric, favorite_foods text,
  disliked_foods text,
  emblem_background text default 'slate',
  emblem_icon text default 'fire',
  emblem_border text default 'simple',
  emblem_unlocked_rewards jsonb default '[]'
);
alter table user_profiles enable row level security;
create policy "user_profiles: own data" on user_profiles
  for all using (auth.uid() = user_id);

-- ── workout_programs ─────────────────────────────────────────
create table workout_programs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  title text not null,
  description text, mode text, goal text, level text, equipment text,
  body_type_score numeric,
  total_sessions numeric default 0,
  sessions_done numeric default 0,
  exercise_preferences jsonb,
  weak_muscles jsonb default '[]',
  sessions jsonb default '[]',
  is_active boolean default true,
  completed boolean default false
);
alter table workout_programs enable row level security;
create policy "workout_programs: own data" on workout_programs
  for all using (auth.uid() = user_id);

-- ── workout_sessions ─────────────────────────────────────────
create table workout_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  created_at timestamptz default now(),
  program_id text, program_title text, session_name text,
  date date not null,
  duration_min numeric, calories_burned numeric,
  perceived_difficulty text, notes text,
  completed boolean default false,
  xp_earned numeric default 0,
  total_volume_kg numeric, total_sets numeric,
  new_prs numeric default 0
);
alter table workout_sessions enable row level security;
create policy "workout_sessions: own data" on workout_sessions
  for all using (auth.uid() = user_id);

-- ── exercise_logs ────────────────────────────────────────────
create table exercise_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  created_at timestamptz default now(),
  session_id text not null,
  exercise_name text not null,
  muscle_group text,
  sets_completed numeric,
  reps_per_set jsonb default '[]',
  weight_per_set jsonb default '[]',
  rest_seconds numeric, rir numeric,
  is_pr boolean default false,
  pr_weight numeric, notes text
);
alter table exercise_logs enable row level security;
create policy "exercise_logs: own data" on exercise_logs
  for all using (auth.uid() = user_id);

-- ── personal_records ─────────────────────────────────────────
create table personal_records (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  created_at timestamptz default now(),
  exercise_name text, weight_kg numeric, reps numeric,
  date date, notes text
);
alter table personal_records enable row level security;
create policy "personal_records: own data" on personal_records
  for all using (auth.uid() = user_id);

-- ── progress_entries ─────────────────────────────────────────
create table progress_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  created_at timestamptz default now(),
  date date not null,
  weight_kg numeric, body_fat_pct numeric,
  chest_cm numeric, waist_cm numeric, hips_cm numeric,
  arms_cm numeric, thighs_cm numeric,
  energy_level numeric, mood text,
  workout_completed boolean, notes text, photo_url text,
  sleep_hours numeric, stress_level numeric,
  water_intake_l numeric, steps numeric, recovery_score numeric
);
alter table progress_entries enable row level security;
create policy "progress_entries: own data" on progress_entries
  for all using (auth.uid() = user_id);

-- ── meal_plans ───────────────────────────────────────────────
create table meal_plans (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  created_at timestamptz default now(),
  title text not null,
  description text, mode text,
  daily_calories numeric, protein_g numeric,
  carbs_g numeric, fat_g numeric,
  meals jsonb default '[]',
  dietary_preference text,
  is_active boolean default true
);
alter table meal_plans enable row level security;
create policy "meal_plans: own data" on meal_plans
  for all using (auth.uid() = user_id);

-- ── favorite_recipes ─────────────────────────────────────────
create table favorite_recipes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  created_at timestamptz default now(),
  name text, ingredients jsonb default '[]',
  instructions text, calories numeric,
  protein_g numeric, carbs_g numeric, fat_g numeric,
  prep_time_min numeric, meal_type text,
  dietary_preference text, image_url text
);
alter table favorite_recipes enable row level security;
create policy "favorite_recipes: own data" on favorite_recipes
  for all using (auth.uid() = user_id);

-- ── favorite_programs ────────────────────────────────────────
create table favorite_programs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  created_at timestamptz default now(),
  program_id text, title text, program_data jsonb
);
alter table favorite_programs enable row level security;
create policy "favorite_programs: own data" on favorite_programs
  for all using (auth.uid() = user_id);

-- ── user_goals ───────────────────────────────────────────────
create table user_goals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  created_at timestamptz default now(),
  title text, description text,
  target_value numeric, current_value numeric, unit text,
  category text, deadline date,
  completed boolean default false,
  progress_pct numeric default 0
);
alter table user_goals enable row level security;
create policy "user_goals: own data" on user_goals
  for all using (auth.uid() = user_id);

-- ── notifications ────────────────────────────────────────────
create table notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  created_at timestamptz default now(),
  title text, message text, type text,
  read boolean default false, action_url text
);
alter table notifications enable row level security;
create policy "notifications: own data" on notifications
  for all using (auth.uid() = user_id);

-- ── shopping_lists ───────────────────────────────────────────
create table shopping_lists (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  created_at timestamptz default now(),
  meal_plan_id text, title text,
  items jsonb default '[]',
  completed boolean default false
);
alter table shopping_lists enable row level security;
create policy "shopping_lists: own data" on shopping_lists
  for all using (auth.uid() = user_id);

-- ── referrals ────────────────────────────────────────────────
create table referrals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  created_at timestamptz default now(),
  referred_email text,
  status text default 'pending',
  reward_claimed boolean default false
);
alter table referrals enable row level security;
create policy "referrals: own data" on referrals
  for all using (auth.uid() = user_id);

-- ── exercise_library (partagée) ──────────────────────────────
create table exercise_library (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users,
  created_at timestamptz default now(),
  name text, muscle_groups jsonb default '[]',
  equipment text, difficulty text, instructions text,
  video_url text, image_url text, category text
);
alter table exercise_library enable row level security;
create policy "exercise_library: read all" on exercise_library
  for select using (true);
create policy "exercise_library: manage own" on exercise_library
  for all using (auth.uid() = user_id);
