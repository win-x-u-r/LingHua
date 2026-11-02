-- Teacher's Corner set-up: each class has an age group and a Mandarin level.
-- The level sets where class activities start; teachers can change both later.
-- Teachers can have several classes (nothing limited them to one before either).
ALTER TABLE public.classrooms
  ADD COLUMN IF NOT EXISTS age_group TEXT
    CHECK (age_group IN ('4-6', '7-9', '10-12', '13-15', '16-18', 'adults')),
  ADD COLUMN IF NOT EXISTS level TEXT
    CHECK (level IN ('zero', 'beginner', 'intermediate', 'advanced', 'mixed'));
