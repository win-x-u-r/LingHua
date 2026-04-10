-- ============================================================
-- Ling Hua Phase 3: Authentication, Gamification & Dashboard
-- ============================================================

-- 1. PROFILES TABLE (linked to Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher')) DEFAULT 'student',
  avatar_url TEXT DEFAULT 'panda',
  classroom_id UUID,
  language_pref TEXT DEFAULT 'en' CHECK (language_pref IN ('ar', 'en')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CLASSROOMS TABLE
CREATE TABLE classrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add FK constraint after classrooms exists
ALTER TABLE profiles ADD CONSTRAINT fk_classroom
  FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE SET NULL;

-- 3. BADGES TABLE
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  icon TEXT NOT NULL,
  xp_reward INTEGER DEFAULT 0,
  condition_type TEXT NOT NULL,
  condition_value INTEGER NOT NULL
);

-- 4. USER BADGES TABLE
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- 5. ADD user_id TO EXISTING TABLES
ALTER TABLE attempts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE progress ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- 6. INDEXES
CREATE INDEX idx_profiles_classroom ON profiles(classroom_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_classrooms_code ON classrooms(code);
CREATE INDEX idx_classrooms_teacher ON classrooms(teacher_id);
CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_attempts_user ON attempts(user_id);
CREATE INDEX idx_progress_user ON progress(user_id);

-- 7. SEED BADGES
INSERT INTO badges (name, name_ar, description, description_ar, icon, xp_reward, condition_type, condition_value) VALUES
('First Words',    'الكلمات الأولى',   'Complete 5 flashcards',           'أكمل 5 بطاقات تعليمية',       'baby',       10, 'flashcards_completed', 5),
('Tone Master',    'سيد النغمات',       'Score 90+ on 10 pronunciations', 'احصل على 90+ في 10 نطق',      'music',      25, 'high_scores',          10),
('Week Warrior',   'محارب الأسبوع',     '7-day practice streak',          'سلسلة تدريب 7 أيام',          'shield',     30, 'streak_days',          7),
('Polyglot',       'متعدد اللغات',      'Learn 50 vocabulary words',      'تعلم 50 كلمة',                'globe',      50, 'words_learned',        50),
('Perfect 10',     'عشرة مثالية',       'Score 100 on any word',          'احصل على 100 في أي كلمة',     'star',       20, 'perfect_score',        1);

-- 8. ROW LEVEL SECURITY

-- Profiles: users read/update own, teachers read classroom students
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Teachers can read classroom students"
  ON profiles FOR SELECT
  USING (
    classroom_id IN (
      SELECT c.id FROM classrooms c WHERE c.teacher_id = auth.uid()
    )
  );

-- Classrooms: teachers manage own
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage own classrooms"
  ON classrooms FOR ALL
  USING (teacher_id = auth.uid());

CREATE POLICY "Students can read their classroom"
  ON classrooms FOR SELECT
  USING (
    id IN (SELECT p.classroom_id FROM profiles p WHERE p.id = auth.uid())
  );

-- Badges: public read
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read badges"
  ON badges FOR SELECT
  USING (true);

-- User badges: users manage own
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own badges"
  ON user_badges FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can earn badges"
  ON user_badges FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Attempts: users manage own, teachers read classroom
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access for attempts" ON attempts;

CREATE POLICY "Users can insert own attempts"
  ON attempts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own attempts"
  ON attempts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Teachers can read classroom attempts"
  ON attempts FOR SELECT
  USING (
    user_id IN (
      SELECT p.id FROM profiles p
      WHERE p.classroom_id IN (
        SELECT c.id FROM classrooms c WHERE c.teacher_id = auth.uid()
      )
    )
  );

-- Progress: users manage own
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access for progress" ON progress;

CREATE POLICY "Users can manage own progress"
  ON progress FOR ALL
  USING (user_id = auth.uid());

-- Vocab: public read (keep existing)
-- Dashboard summary: keep existing policies

-- 9. AUTO-CREATE PROFILE ON SIGNUP (via trigger)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );

  -- Create progress record for new user
  INSERT INTO public.progress (user_id, total_xp, current_streak, completed_words)
  VALUES (NEW.id, 0, 0, 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
