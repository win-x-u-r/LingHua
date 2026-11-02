-- Teachers pick a learning path for their class when they create it. Students
-- who join the class follow it. Existing classes stay on Little Lanterns, which
-- is what class students followed before.
ALTER TABLE public.classrooms
  ADD COLUMN IF NOT EXISTS learning_path TEXT NOT NULL DEFAULT 'little_lanterns'
  CHECK (learning_path IN ('little_lanterns', 'hsk', 'my_mandarin', 'on_the_move'));
