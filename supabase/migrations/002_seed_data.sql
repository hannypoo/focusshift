-- Seed initial profile + default categories
-- Run after 001_initial_schema.sql

-- Create the single user profile
INSERT INTO profiles (id, display_name, default_wake_time, default_wind_down_time, transition_minutes, adhd_buffer_minutes)
VALUES ('00000000-0000-0000-0000-000000000001', 'Hanna', '09:00', '22:00', 5, 10);

-- Seed default categories
INSERT INTO categories (id, profile_id, name, icon, color, priority, default_block_minutes, weekly_min_minutes, is_protected, is_fixed) VALUES
  ('son-time',           '00000000-0000-0000-0000-000000000001', 'Son Time',             'Heart',        'rose',    10, 60, 300, true,  false),
  ('class-appointments', '00000000-0000-0000-0000-000000000001', 'Class / Appointments',  'Calendar',     'blue',     9, 90, NULL, false, true),
  ('homework',           '00000000-0000-0000-0000-000000000001', 'Homework',              'BookOpen',     'purple',   8, 45, 600, false, false),
  ('self-care',          '00000000-0000-0000-0000-000000000001', 'Self-Care',             'Sparkles',     'teal',     7, 30, 210, false, false),
  ('givewize',           '00000000-0000-0000-0000-000000000001', 'GiveWiZe',              'Rocket',       'orange',   6, 45, 180, false, false),
  ('job-search',         '00000000-0000-0000-0000-000000000001', 'Job Search',            'Briefcase',    'amber',    5, 30, 180, false, false),
  ('cleaning',           '00000000-0000-0000-0000-000000000001', 'Cleaning',              'Home',         'cyan',     4, 25, 120, false, false),
  ('networking',         '00000000-0000-0000-0000-000000000001', 'Networking',            'Users',        'violet',   3, 30,  90, false, false),
  ('errands',            '00000000-0000-0000-0000-000000000001', 'Errands',               'ShoppingCart', 'emerald',  2, 30,  60, false, false),
  ('general-todo',       '00000000-0000-0000-0000-000000000001', 'General To-Do',         'CheckSquare',  'gray',     1, 20, NULL, false, false);

-- Seed default locations
INSERT INTO locations (profile_id, name, is_home) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Home', true);
