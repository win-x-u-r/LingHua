-- Teacher's Corner lessons: teachers decide what their class learns. A lesson
-- is a set of vocabulary words and grammar points; students in the class see
-- the lessons under "From your teacher" and practise them.
CREATE TABLE IF NOT EXISTS public.class_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  vocab_ids UUID[] NOT NULL DEFAULT '{}',
  grammar_ids TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS class_lessons_classroom_idx ON public.class_lessons (classroom_id);

ALTER TABLE public.class_lessons ENABLE ROW LEVEL SECURITY;

-- The class's own teacher adds, changes and removes its lessons
DROP POLICY IF EXISTS "Teachers manage their class lessons" ON public.class_lessons;
CREATE POLICY "Teachers manage their class lessons" ON public.class_lessons
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.classrooms c WHERE c.id = classroom_id AND c.teacher_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.classrooms c WHERE c.id = classroom_id AND c.teacher_id = auth.uid()));

-- Students read the lessons of the class they are in
DROP POLICY IF EXISTS "Students read their class lessons" ON public.class_lessons;
CREATE POLICY "Students read their class lessons" ON public.class_lessons
  FOR SELECT
  USING (classroom_id = (SELECT p.classroom_id FROM public.profiles p WHERE p.id = auth.uid()));
