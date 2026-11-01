-- Daily goal and Hua's reminders
-- 1. Each learner's daily goal (5, 10, 15 or 20 minutes) and reminder settings on their profile.
-- 2. Minutes learned per day, so the goal and streak follow the learner across devices.
-- 3. The sign-up trigger copies the goal from the sign-up details, so it is saved even
--    when email confirmation is on and the app cannot write to the profile yet.
-- Safe to run more than once.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_goal_minutes INTEGER NOT NULL DEFAULT 10;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reminder_time TEXT NOT NULL DEFAULT '19:00';

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_daily_goal_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_daily_goal_check
  CHECK (daily_goal_minutes IN (5, 10, 15, 20));
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_reminder_time_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_reminder_time_check
  CHECK (reminder_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');

CREATE TABLE IF NOT EXISTS daily_activity (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  seconds INTEGER NOT NULL DEFAULT 0 CHECK (seconds >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, day)
);

ALTER TABLE daily_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own daily activity" ON daily_activity;
CREATE POLICY "Users manage own daily activity"
  ON daily_activity FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Teachers read classroom daily activity" ON daily_activity;
CREATE POLICY "Teachers read classroom daily activity"
  ON daily_activity FOR SELECT
  USING (
    user_id IN (
      SELECT p.id FROM profiles p
      JOIN classrooms c ON c.id = p.classroom_id
      WHERE c.teacher_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  -- Read carefully: a bad value must never stop someone signing up
  goal_text TEXT := NEW.raw_user_meta_data->>'daily_goal_minutes';
  goal INTEGER := CASE WHEN goal_text ~ '^[0-9]{1,2}$' THEN goal_text::INTEGER ELSE 10 END;
  rtime TEXT := COALESCE(NEW.raw_user_meta_data->>'reminder_time', '19:00');
BEGIN
  IF goal NOT IN (5, 10, 15, 20) THEN goal := 10; END IF;
  IF rtime !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' THEN rtime := '19:00'; END IF;

  INSERT INTO public.profiles (id, full_name, role, daily_goal_minutes, reminder_enabled, reminder_time)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    goal,
    COALESCE(NEW.raw_user_meta_data->>'reminder_enabled', 'false') = 'true',
    rtime
  );

  INSERT INTO public.progress (user_id, total_xp, current_streak, completed_words)
  VALUES (NEW.id, 0, 0, 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
