-- =====================================================
-- Spaced Repetition System
-- Tracks per-user review scheduling for each vocab word
-- =====================================================

CREATE TABLE IF NOT EXISTS word_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vocab_id UUID NOT NULL REFERENCES vocab(id) ON DELETE CASCADE,
  ease_factor DECIMAL(3,1) DEFAULT 2.5,        -- SM-2 ease factor
  interval_days INTEGER DEFAULT 0,              -- days until next review
  repetitions INTEGER DEFAULT 0,                -- successful review count
  next_review_date DATE DEFAULT CURRENT_DATE,   -- when to review next
  last_score INTEGER DEFAULT 0,                 -- last pronunciation score
  total_attempts INTEGER DEFAULT 0,             -- total times practiced
  best_score INTEGER DEFAULT 0,                 -- highest score achieved
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, vocab_id)
);

CREATE INDEX idx_word_reviews_user ON word_reviews(user_id);
CREATE INDEX idx_word_reviews_next ON word_reviews(user_id, next_review_date);
CREATE INDEX idx_word_reviews_score ON word_reviews(user_id, last_score);

-- RLS
ALTER TABLE word_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reviews"
  ON word_reviews FOR ALL
  USING (user_id = auth.uid());
