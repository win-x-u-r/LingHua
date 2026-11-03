-- Teacher's Corner learning paths. A teacher can follow a ready-made LingHua
-- path, adapt it, or build lessons from scratch. Using a path copies its
-- lessons into class_lessons, so each class owns its own version and the
-- original LingHua path (defined in the app) never changes.
--   position:   the lesson order the teacher set for this class
--   source_key: which LingHua path lesson this one started from (NULL = the
--               teacher's own lesson)
ALTER TABLE public.class_lessons ADD COLUMN IF NOT EXISTS position INTEGER;
ALTER TABLE public.class_lessons ADD COLUMN IF NOT EXISTS source_key TEXT;
