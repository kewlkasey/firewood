-- Fix all functions to return JSON instead of table structures

-- Drop problematic functions
DROP FUNCTION IF EXISTS get_auth_user_ids();
DROP FUNCTION IF EXISTS create_profile_for_existing_user(TEXT);

-- Create simple JSON-returning functions
CREATE OR REPLACE FUNCTION get_auth_user_ids()
RETURNS JSON
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'user_id', id,
      'user_email', email,
      'created_at', created_at
    )
  ) INTO result
  FROM auth.users
  ORDER BY created_at DESC
  LIMIT 10;
  
  RETURN COALESCE(result, '[]'::json);
EXCEPTION
  WHEN others THEN
    RETURN json_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Create profile creation function that returns JSON
CREATE OR REPLACE FUNCTION create_profile_for_existing_user(
  target_email TEXT DEFAULT 'wright.casey@gmail.com'
)
RETURNS JSON
SECURITY DEFINER
AS $$
DECLARE
  existing_user_id UUID;
  existing_user_email TEXT;
BEGIN
  -- Find an existing user ID from auth.users
  SELECT id, email INTO existing_user_id, existing_user_email
  FROM auth.users 
  WHERE email = target_email
  LIMIT 1;
  
  IF existing_user_id IS NULL THEN
    -- If target email not found, get any user
    SELECT id, email INTO existing_user_id, existing_user_email
    FROM auth.users 
    LIMIT 1;
  END IF;
  
  IF existing_user_id IS NULL THEN
    RETURN json_build_object('error', 'No users found in auth.users');
  END IF;
  
  -- Try to create profile for this existing user
  INSERT INTO profiles (id, email, first_name, last_name)
  VALUES (existing_user_id, existing_user_email, 'Casey', 'Wright');
  
  RETURN json_build_object(
    'success', true,
    'user_id', existing_user_id,
    'email', existing_user_email,
    'message', 'Profile created for existing user'
  );
  
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object(
      'success', true,
      'message', 'Profile already exists',
      'user_id', existing_user_id,
      'email', existing_user_email
    );
  WHEN foreign_key_violation THEN
    RETURN json_build_object(
      'error', 'Foreign key violation - user ID not found in auth.users',
      'user_id', existing_user_id,
      'email', existing_user_email
    );
  WHEN others THEN
    RETURN json_build_object(
      'error', SQLERRM,
      'code', SQLSTATE,
      'user_id', existing_user_id
    );
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_auth_user_ids TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION create_profile_for_existing_user TO authenticated, anon, service_role;
