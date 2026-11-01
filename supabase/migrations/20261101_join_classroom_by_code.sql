-- Students could never look up a classroom by its code: the only SELECT policy on
-- classrooms lets a student read the classroom they are already in. This function
-- joins the caller to the classroom with the given code without exposing the table.
CREATE OR REPLACE FUNCTION public.join_classroom(class_code TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id INTO target FROM classrooms WHERE code = upper(trim(class_code));
  IF target IS NULL THEN
    RAISE EXCEPTION 'Classroom not found';
  END IF;

  UPDATE profiles SET classroom_id = target WHERE id = auth.uid();
  RETURN target;
END;
$$;

REVOKE ALL ON FUNCTION public.join_classroom(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_classroom(TEXT) TO authenticated;
