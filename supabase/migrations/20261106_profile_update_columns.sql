-- Learners could change ANY column of their own profile, including role
-- (student -> teacher), kid_login and classroom_id. The "Users can update own
-- profile" policy only checks whose row it is, not which columns change.
--
-- Fix: learners may update only the settings the app lets them change.
-- Everything else is set by the server or by safe database functions:
--   role, full_name    sign-up trigger (handle_new_user)
--   classroom_id       join_classroom(code) function (checks the class code)
--   kid_login, kid_help_at, reminder_last_sent   backend with the service role key
-- Those keep working: the functions run as their owner and the backend's
-- service role is not affected by these grants.

REVOKE UPDATE ON public.profiles FROM anon, authenticated;

GRANT UPDATE (
  avatar_url,
  language_pref,
  daily_goal_minutes,
  reminder_enabled,
  reminder_time,
  reminder_timezone
) ON public.profiles TO authenticated;

-- Check (should list only the six columns above for "authenticated"):
-- SELECT grantee, column_name FROM information_schema.column_privileges
--  WHERE table_schema = 'public' AND table_name = 'profiles' AND privilege_type = 'UPDATE'
--  ORDER BY grantee, column_name;
