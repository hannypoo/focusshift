-- Offload v2 Enhancements — Schema Migration
-- Run after 001_initial_schema.sql + 002_seed_data.sql

-- ─── New Enum ─────────────────────────────────────────────────────
CREATE TYPE task_difficulty AS ENUM ('easy', 'medium', 'hard');

-- ─── Profiles — New Columns ──────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN productivity_zones JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN meal_times JSONB DEFAULT '{"breakfast":{"time":"08:00","enabled":true},"lunch":{"time":"12:00","enabled":true},"dinner":{"time":"18:00","enabled":true}}'::jsonb,
  ADD COLUMN water_reminders BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN meal_reminders BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN wake_buffer_minutes INT NOT NULL DEFAULT 15,
  ADD COLUMN wind_down_buffer_minutes INT NOT NULL DEFAULT 30,
  ADD COLUMN chore_block_minutes INT NOT NULL DEFAULT 30,
  ADD COLUMN chore_block_time TIME DEFAULT '14:00',
  ADD COLUMN treats TEXT[] DEFAULT '{}',
  ADD COLUMN multitask_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN self_care_auto BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN onboarding_version INT NOT NULL DEFAULT 0;

-- ─── Tasks — New Columns ─────────────────────────────────────────
ALTER TABLE tasks
  ADD COLUMN difficulty task_difficulty DEFAULT 'medium',
  ADD COLUMN is_multitaskable BOOLEAN NOT NULL DEFAULT false;

-- ─── Schedule Blocks — New Columns ───────────────────────────────
ALTER TABLE schedule_blocks
  ADD COLUMN block_type TEXT NOT NULL DEFAULT 'task',
  ADD COLUMN is_meal BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN is_self_care BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN is_buffer BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN is_chore_block BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN difficulty task_difficulty;

-- ─── Rewards Table ───────────────────────────────────────────────
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL DEFAULT 'completion',
  label TEXT NOT NULL,
  treat_suggestion TEXT,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rewards_profile_date ON rewards(profile_id, date);

-- ─── Daily Summaries Table ───────────────────────────────────────
CREATE TABLE daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  blocks_completed INT NOT NULL DEFAULT 0,
  blocks_missed INT NOT NULL DEFAULT 0,
  blocks_skipped INT NOT NULL DEFAULT 0,
  total_productive_minutes INT NOT NULL DEFAULT 0,
  hard_tasks_completed INT NOT NULL DEFAULT 0,
  ai_summary TEXT,
  mood_rating INT CHECK (mood_rating BETWEEN 1 AND 5),
  user_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, date)
);

CREATE INDEX idx_daily_summaries_profile_date ON daily_summaries(profile_id, date);

-- ─── RLS Policies (enable in Phase 3 with auth) ─────────────────
-- Placeholder: RLS will be enabled in 004_auth_rls.sql
