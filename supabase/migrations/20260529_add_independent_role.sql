-- Allow a third account type: "independent" (solo learner, no classroom/teacher).
-- The signup trigger (handle_new_user) already passes role through from auth metadata,
-- and RLS policies don't reference role literals, so only the CHECK constraint changes.
-- Backward-compatible: existing 'student'/'teacher' rows remain valid.

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('student', 'teacher', 'independent'));
