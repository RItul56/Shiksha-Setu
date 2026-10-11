CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE CHECK (email IS NULL OR length(email) <= 254),
  phone TEXT UNIQUE CHECK (phone IS NULL OR length(phone) BETWEEN 8 AND 18),
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL CHECK (length(full_name) BETWEEN 1 AND 120),
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  consent_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((email IS NOT NULL) <> (phone IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS student_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  state TEXT NOT NULL DEFAULT '',
  education_level TEXT NOT NULL DEFAULT '',
  preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'hi')),
  avatar_data TEXT CHECK (avatar_data IS NULL OR length(avatar_data) <= 450000),
  data_saver BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS avatar_data TEXT CHECK (avatar_data IS NULL OR length(avatar_data) <= 450000);

CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash CHAR(64) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  csrf_hash CHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS auth_sessions_user_expiry_idx ON auth_sessions(user_id, expires_at);
CREATE INDEX IF NOT EXISTS auth_sessions_expiry_idx ON auth_sessions(expires_at);

CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  level TEXT NOT NULL DEFAULT 'Beginner',
  duration TEXT NOT NULL DEFAULT '',
  instructor TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  module_name TEXT NOT NULL DEFAULT '',
  duration_minutes SMALLINT NOT NULL DEFAULT 10 CHECK (duration_minutes BETWEEN 1 AND 240),
  content TEXT NOT NULL DEFAULT '',
  content_hi TEXT NOT NULL DEFAULT '',
  video_id TEXT,
  position SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lessons_course_position_idx ON lessons(course_id, position);

CREATE TABLE IF NOT EXISTS lesson_progress (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  seconds_spent INTEGER NOT NULL DEFAULT 0 CHECK (seconds_spent BETWEEN 0 AND 86400),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, lesson_id)
);
CREATE INDEX IF NOT EXISTS lesson_progress_user_update_idx ON lesson_progress(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS student_activity_days (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, activity_date)
);
CREATE INDEX IF NOT EXISTS student_activity_recent_idx ON student_activity_days(user_id, activity_date DESC);

CREATE TABLE IF NOT EXISTS timetable_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 120),
  course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_minute SMALLINT NOT NULL CHECK (start_minute BETWEEN 0 AND 1439),
  duration_minutes SMALLINT NOT NULL CHECK (duration_minutes BETWEEN 5 AND 360),
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, weekday, start_minute)
);
CREATE INDEX IF NOT EXISTS timetable_user_weekday_idx ON timetable_items(user_id, weekday, start_minute);

CREATE TABLE IF NOT EXISTS mentor_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mentor_name TEXT NOT NULL CHECK (length(mentor_name) BETWEEN 1 AND 120),
  topic TEXT NOT NULL DEFAULT 'Career guidance' CHECK (length(topic) <= 120),
  note TEXT NOT NULL DEFAULT '' CHECK (length(note) <= 1000),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mentor_requests_user_recent_idx ON mentor_requests(user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS privacy_audit (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS privacy_audit_created_idx ON privacy_audit(created_at DESC);

CREATE OR REPLACE VIEW admin_student_summary AS
SELECT u.id, u.full_name, u.created_at, p.state, p.education_level,
       count(lp.lesson_id) FILTER (WHERE lp.completed) AS lessons_completed,
       max(lp.updated_at) AS last_learning_at
FROM users u
LEFT JOIN student_profiles p ON p.user_id = u.id
LEFT JOIN lesson_progress lp ON lp.user_id = u.id
WHERE u.role = 'student'
GROUP BY u.id, u.full_name, u.created_at, p.state, p.education_level;
