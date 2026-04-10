-- Create vocab table for flashcard content
CREATE TABLE vocab (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hanzi TEXT NOT NULL,
  pinyin TEXT NOT NULL,
  arabic_translation TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create attempts table for pronunciation tracking
CREATE TABLE attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vocab_id UUID REFERENCES vocab(id) ON DELETE CASCADE,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Create progress table for user achievements
CREATE TABLE progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avg_score DECIMAL(5,2) DEFAULT 0,
  completed_words INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  last_practice_date DATE,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create dashboard_summary for analytics
CREATE TABLE dashboard_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avg_score DECIMAL(5,2) DEFAULT 0,
  total_attempts INTEGER DEFAULT 0,
  top_difficult_words JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert sample vocabulary data
INSERT INTO vocab (hanzi, pinyin, arabic_translation, level) VALUES
('你好', 'nǐ hǎo', 'مرحبا', 'beginner'),
('谢谢', 'xiè xie', 'شكرا', 'beginner'),
('对不起', 'duì bu qǐ', 'آسف', 'beginner'),
('再见', 'zài jiàn', 'وداعا', 'beginner'),
('是', 'shì', 'نعم', 'beginner'),
('不是', 'bú shì', 'لا', 'beginner'),
('朋友', 'péng you', 'صديق', 'intermediate'),
('学习', 'xué xí', 'يدرس', 'intermediate'),
('老师', 'lǎo shī', 'معلم', 'intermediate'),
('学生', 'xué sheng', 'طالب', 'intermediate'),
('重要', 'zhòng yào', 'مهم', 'advanced'),
('成功', 'chéng gōng', 'نجاح', 'advanced'),
('机会', 'jī huì', 'فرصة', 'advanced'),
('文化', 'wén huà', 'ثقافة', 'advanced');

-- Initialize progress record
INSERT INTO progress (id, avg_score, completed_words, current_streak, total_xp) 
VALUES (gen_random_uuid(), 0, 0, 0, 0);

-- Initialize dashboard summary
INSERT INTO dashboard_summary (id, avg_score, total_attempts) 
VALUES (gen_random_uuid(), 0, 0);

-- Create indexes for performance
CREATE INDEX idx_vocab_level ON vocab(level);
CREATE INDEX idx_attempts_vocab ON attempts(vocab_id);
CREATE INDEX idx_attempts_timestamp ON attempts(timestamp DESC);