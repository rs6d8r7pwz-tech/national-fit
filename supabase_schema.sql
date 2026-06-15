-- ============================================================
-- NATIONAL FIT — Script de création des tables Supabase
-- Coller dans SQL Editor > New Query > Run
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- Suppression des policies existantes (pour éviter les conflits)
-- ============================================================
do $$ begin
  drop policy if exists "user own profile" on public.user_profiles;
  drop policy if exists "user own programs" on public.workout_programs;
  drop policy if exists "user own sessions" on public.workout_sessions;
  drop policy if exists "user own logs" on public.exercise_logs;
  drop policy if exists "anyone can read exercises" on public.exercise_library;
  drop policy if exists "user own prs" on public.personal_records;
  drop policy if exists "user own favorites" on public.favorite_programs;
  drop policy if exists "user own goals" on public.user_goals;
  drop policy if exists "user own notifs" on public.notifications;
  drop policy if exists "user own progress" on public.progress_entries;
  drop policy if exists "user own shopping" on public.shopping_lists;
  drop policy if exists "user own referrals" on public.referrals;
  drop policy if exists "user own recipes" on public.favorite_recipes;
  drop policy if exists "user own meals" on public.meal_plans;
exception when others then null;
end $$;

-- ============================================================
-- user_profiles
-- ============================================================
create table if not exists public.user_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  first_name text not null,
  age integer,
  gender text check (gender in ('homme','femme','autre')),
  height_cm numeric,
  weight_kg numeric,
  target_weight numeric,
  fitness_level text check (fitness_level in ('debutant','intermediaire','avance')),
  goal text check (goal in ('seche','prise_masse','maintien','force','cardio')),
  food_mode text check (food_mode in ('flexible','strict')),
  equipment text check (equipment in ('aucun','essentiel','salle_complete')),
  dietary_preference text check (dietary_preference in ('omnivore','vegetarien','vegan','sans_gluten','halal')),
  allergies text,
  injuries text,
  weak_muscles jsonb default '[]',
  available_days integer,
  meals_per_day integer,
  body_type_score numeric,
  ai_morphology_note text,
  photo_front_relaxed text,
  photo_front_flexed text,
  photo_back_relaxed text,
  photo_back_flexed text,
  xp_points integer default 0,
  streak_days integer default 0,
  last_workout_date text,
  onboarding_complete boolean default false,
  is_premium boolean default false,
  premium_expires_at text,
  premium_source text check (premium_source in ('stripe','trial')),
  trial_started_at text,
  trial_ends_at text,
  subscription_status text default 'free' check (subscription_status in ('free','premium')),
  subscription_plan text check (subscription_plan in ('monthly','yearly','trial')),
  stripe_customer_id text,
  subscription_end_date text,
  budget_level text check (budget_level in ('petit','moyen','confortable')),
  max_cooking_time_min integer,
  favorite_foods text,
  disliked_foods text,
  emblem_background text default 'slate',
  emblem_icon text default 'fire',
  emblem_border text default 'simple',
  emblem_unlocked_rewards jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.user_profiles enable row level security;
create policy "user own profile" on public.user_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- workout_programs
-- ============================================================
create table if not exists public.workout_programs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text,
  mode text check (mode in ('cool','efficace')),
  goal text,
  level text check (level in ('debutant','intermediaire','avance')),
  equipment text,
  body_type_score numeric,
  total_sessions integer default 0,
  sessions_done integer default 0,
  exercise_preferences jsonb,
  weak_muscles jsonb default '[]',
  sessions jsonb default '[]',
  is_active boolean default true,
  completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.workout_programs enable row level security;
create policy "user own programs" on public.workout_programs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- workout_sessions
-- ============================================================
create table if not exists public.workout_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  program_id text,
  program_title text,
  session_name text,
  date date not null,
  duration_min integer,
  calories_burned integer,
  perceived_difficulty text check (perceived_difficulty in ('facile','normal','difficile')),
  notes text,
  completed boolean default false,
  xp_earned integer default 0,
  total_volume_kg numeric,
  total_sets integer,
  new_prs integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.workout_sessions enable row level security;
create policy "user own sessions" on public.workout_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- exercise_logs
-- ============================================================
create table if not exists public.exercise_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  session_id text not null,
  exercise_name text not null,
  muscle_group text,
  sets_completed integer,
  reps_per_set jsonb default '[]',
  weight_per_set jsonb default '[]',
  rest_seconds integer,
  rir numeric,
  is_pr boolean default false,
  pr_weight numeric,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.exercise_logs enable row level security;
create policy "user own logs" on public.exercise_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- exercise_library
-- ============================================================
create table if not exists public.exercise_library (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  muscle_group text not null,
  secondary_muscles jsonb default '[]',
  equipment text,
  difficulty text check (difficulty in ('debutant','intermediaire','avance')),
  movement_type text,
  is_compound boolean default false,
  instructions text,
  video_url text,
  calories_per_set_factor numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.exercise_library enable row level security;
create policy "anyone can read exercises" on public.exercise_library
  for select using (true);

-- ============================================================
-- personal_records
-- ============================================================
create table if not exists public.personal_records (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  exercise_name text not null,
  weight_kg numeric,
  reps integer,
  date text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.personal_records enable row level security;
create policy "user own prs" on public.personal_records
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- favorite_programs
-- ============================================================
create table if not exists public.favorite_programs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text,
  mode text check (mode in ('cool','efficace')),
  goal text,
  level text check (level in ('debutant','intermediaire','avance')),
  equipment text,
  body_type_score numeric,
  total_sessions integer default 0,
  sessions_done integer default 0,
  exercise_preferences jsonb,
  weak_muscles jsonb default '[]',
  sessions jsonb default '[]',
  is_active boolean default true,
  completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.favorite_programs enable row level security;
create policy "user own favorites" on public.favorite_programs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- user_goals
-- ============================================================
create table if not exists public.user_goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  target_value numeric,
  current_value numeric,
  unit text,
  deadline text,
  completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.user_goals enable row level security;
create policy "user own goals" on public.user_goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- notifications
-- ============================================================
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  message text,
  type text,
  read boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.notifications enable row level security;
create policy "user own notifs" on public.notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- progress_entries
-- ============================================================
create table if not exists public.progress_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  weight_kg numeric,
  body_fat_pct numeric,
  chest_cm numeric,
  waist_cm numeric,
  hips_cm numeric,
  arms_cm numeric,
  thighs_cm numeric,
  energy_level integer check (energy_level between 1 and 5),
  mood text check (mood in ('excellent','bien','moyen','fatigué')),
  workout_completed boolean,
  notes text,
  photo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.progress_entries enable row level security;
create policy "user own progress" on public.progress_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- shopping_lists
-- ============================================================
create table if not exists public.shopping_lists (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  items jsonb default '[]',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.shopping_lists enable row level security;
create policy "user own shopping" on public.shopping_lists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- referrals
-- ============================================================
create table if not exists public.referrals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  referral_code text unique,
  referred_email text,
  status text default 'pending',
  reward_given boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.referrals enable row level security;
create policy "user own referrals" on public.referrals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- favorite_recipes
-- ============================================================
create table if not exists public.favorite_recipes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  recipe_name text not null,
  meal_type text,
  ingredients jsonb default '[]',
  instructions text,
  calories integer,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  recipe_type text check (recipe_type in ('express','complete')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.favorite_recipes enable row level security;
create policy "user own recipes" on public.favorite_recipes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- meal_plans
-- ============================================================
create table if not exists public.meal_plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text,
  mode text check (mode in ('cool','efficace')),
  daily_calories integer,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  meals jsonb default '[]',
  dietary_preference text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.meal_plans enable row level security;
create policy "user own meals" on public.meal_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
