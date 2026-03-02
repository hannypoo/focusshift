-- Offload v2 — Full Schema Migration
-- Run this in Supabase SQL Editor

-- ─── Enums ──────────────────────────────────────────────────────────
CREATE TYPE task_type AS ENUM ('task', 'appointment', 'homework', 'errand', 'self_care');
CREATE TYPE task_priority AS ENUM ('immediately', 'soon', 'whenever');
CREATE TYPE task_status AS ENUM ('pending', 'scheduled', 'in_progress', 'completed', 'skipped', 'rescheduled');
CREATE TYPE homework_type AS ENUM ('essay', 'reading', 'problem_set', 'project', 'quiz_prep');
CREATE TYPE recurrence_frequency AS ENUM ('daily', 'weekly', 'biweekly', 'monthly');
CREATE TYPE block_status AS ENUM ('pending', 'active', 'completed', 'skipped', 'interrupted', 'rescheduled');
CREATE TYPE energy_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE chat_role AS ENUM ('user', 'assistant');

-- ─── Profiles ───────────────────────────────────────────────────────
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL DEFAULT 'User',
  default_wake_time TIME NOT NULL DEFAULT '09:00',
  default_wind_down_time TIME NOT NULL DEFAULT '22:00',
  transition_minutes INT NOT NULL DEFAULT 5,
  adhd_buffer_minutes INT NOT NULL DEFAULT 10,
  enable_confetti BOOLEAN NOT NULL DEFAULT true,
  enable_sound BOOLEAN NOT NULL DEFAULT false,
  streak INT NOT NULL DEFAULT 0,
  last_active_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Categories ─────────────────────────────────────────────────────
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  priority INT NOT NULL CHECK (priority BETWEEN 1 AND 10),
  default_block_minutes INT NOT NULL DEFAULT 30,
  weekly_min_minutes INT,
  is_protected BOOLEAN NOT NULL DEFAULT false,
  is_fixed BOOLEAN NOT NULL DEFAULT false,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Locations ──────────────────────────────────────────────────────
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  is_home BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Travel Times ───────────────────────────────────────────────────
CREATE TABLE travel_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  from_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  to_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  duration_minutes INT NOT NULL,
  entry_count INT NOT NULL DEFAULT 1,
  total_minutes INT NOT NULL,
  UNIQUE (profile_id, from_location_id, to_location_id)
);

-- ─── Recurring Tasks ───────────────────────────────────────────────
CREATE TABLE recurring_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  task_type task_type NOT NULL DEFAULT 'task',
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  frequency recurrence_frequency NOT NULL DEFAULT 'weekly',
  days_of_week INT[],
  times_per_week INT,
  estimated_minutes INT NOT NULL DEFAULT 30,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  start_time TIME,
  end_time TIME,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Tasks ──────────────────────────────────────────────────────────
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  task_type task_type NOT NULL DEFAULT 'task',
  priority task_priority NOT NULL DEFAULT 'soon',
  status task_status NOT NULL DEFAULT 'pending',
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  -- scheduling
  estimated_minutes INT,
  ai_estimated_minutes INT,
  actual_minutes INT,
  due_date DATE,
  due_time TIME,
  scheduled_date DATE,
  scheduled_start_time TIME,
  scheduled_end_time TIME,
  -- location
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  needs_travel BOOLEAN NOT NULL DEFAULT false,
  prep_minutes INT DEFAULT 0,
  -- homework
  homework_type homework_type,
  course_name TEXT,
  syllabus_text TEXT,
  difficulty_score INT CHECK (difficulty_score BETWEEN 1 AND 10),
  -- recurrence
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurring_task_id UUID REFERENCES recurring_tasks(id) ON DELETE SET NULL,
  -- meta
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_profile_status ON tasks(profile_id, status);
CREATE INDEX idx_tasks_profile_date ON tasks(profile_id, scheduled_date);
CREATE INDEX idx_tasks_profile_due ON tasks(profile_id, due_date);

-- ─── Goals ──────────────────────────────────────────────────────────
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  target_count INT,
  target_minutes INT,
  current_count INT NOT NULL DEFAULT 0,
  current_minutes INT NOT NULL DEFAULT 0,
  week_start DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_goals_profile_week ON goals(profile_id, week_start);

-- ─── Schedule Blocks ────────────────────────────────────────────────
CREATE TABLE schedule_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INT NOT NULL,
  status block_status NOT NULL DEFAULT 'pending',
  is_fixed BOOLEAN NOT NULL DEFAULT false,
  is_protected BOOLEAN NOT NULL DEFAULT false,
  is_transition BOOLEAN NOT NULL DEFAULT false,
  is_travel BOOLEAN NOT NULL DEFAULT false,
  is_prep BOOLEAN NOT NULL DEFAULT false,
  ai_reason TEXT,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_blocks_profile_date ON schedule_blocks(profile_id, date);
CREATE INDEX idx_blocks_profile_date_status ON schedule_blocks(profile_id, date, status);

-- ─── Task History ───────────────────────────────────────────────────
CREATE TABLE task_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  task_type task_type,
  homework_type homework_type,
  estimated_minutes INT,
  actual_minutes INT,
  energy_level energy_level,
  day_of_week INT,
  time_of_day TIME,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_history_profile ON task_history(profile_id);
CREATE INDEX idx_history_category ON task_history(profile_id, category_id);

-- ─── Chat Messages ──────────────────────────────────────────────────
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role chat_role NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_profile ON chat_messages(profile_id, created_at);

-- ─── Weekly Check-ins ───────────────────────────────────────────────
CREATE TABLE weekly_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  energy_rating INT CHECK (energy_rating BETWEEN 1 AND 5),
  upcoming_events TEXT,
  changes_noted TEXT,
  ai_schedule_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, week_start)
);

-- ─── Daily Check-ins ────────────────────────────────────────────────
CREATE TABLE daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  energy_level energy_level NOT NULL DEFAULT 'medium',
  wake_time TIME,
  wind_down_time TIME,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, date)
);

-- ─── RLS (Row Level Security) ──────────────────────────────────────
-- For now single user, disable RLS for simplicity
-- Enable later when multi-user is needed

-- ─── Updated at trigger ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER blocks_updated_at BEFORE UPDATE ON schedule_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
