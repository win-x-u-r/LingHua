-- Little Lanterns: kids in a class log in with their class code, their name and
-- 3 secret pictures instead of an email. The backend creates those accounts;
-- this column marks them so the class list shows only picture-login kids.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS kid_login BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS profiles_kid_login_classroom_idx
  ON public.profiles (classroom_id)
  WHERE kid_login;
