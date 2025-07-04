
-- Create a function to delete a user and all their associated data
CREATE OR REPLACE FUNCTION delete_user_and_data(target_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id uuid;
  result json;
BEGIN
  -- Only allow specific admin users to execute this function
  IF auth.email() != 'wayne@waynetturner.com' THEN
    RAISE EXCEPTION 'Unauthorized: Only specific admin users can delete user data';
  END IF;

  -- Find the user by email
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = target_email;

  IF target_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'User not found');
  END IF;

  -- Delete associated data in order (to avoid foreign key conflicts)
  DELETE FROM public.exercises WHERE user_id = target_user_id;
  DELETE FROM public.workouts WHERE user_id = target_user_id;
  DELETE FROM public.coach_conversations WHERE user_id = target_user_id;
  DELETE FROM public.user_demographics WHERE user_id = target_user_id;
  DELETE FROM public.user_ui_settings WHERE user_id = target_user_id;
  DELETE FROM public.ai_responses WHERE user_id = target_user_id;
  DELETE FROM public.profiles WHERE id = target_user_id;

  -- Delete the user from auth.users (this requires admin privileges)
  DELETE FROM auth.users WHERE id = target_user_id;

  RETURN json_build_object(
    'success', true, 
    'message', 'User and all associated data deleted successfully',
    'deleted_user_id', target_user_id
  );
END;
$$;

-- Grant execute permission to authenticated users (function will check admin status internally)
GRANT EXECUTE ON FUNCTION delete_user_and_data(text) TO authenticated;
