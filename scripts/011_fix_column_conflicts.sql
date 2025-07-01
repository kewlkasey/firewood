-- Fix column conflicts and function issues

-- Drop all problematic functions
DROP FUNCTION IF EXISTS check_auth_users();
DROP FUNCTION IF EXISTS create_profile_direct(UUID, TEXT, TEXT, TEXT);

-- Create a simpler auth users check function
CREATE OR REPLACE FUNCTION check_auth_users()
RETURNS TABLE(auth_user_id UUID, auth_user_email TEXT, auth_created_at TIMESTAMPTZ)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT au.id AS auth_user_id, au.email AS auth_user_email, au.created_at AS auth_created_at
  FROM auth.users au
  ORDER BY au.created_at DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Create a simpler profile creation function with explicit column references
CREATE OR REPLACE FUNCTION create_profile_direct(
  input_user_id UUID,
  input_email TEXT,
  input_first_name TEXT DEFAULT '',
  input_last_name TEXT DEFAULT ''
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result_json JSON;
BEGIN
  -- Insert the profile with explicit column names
  INSERT INTO profiles (id, email, first_name, last_name)
  VALUES (input_user_id, input_email, input_first_name, input_last_name);
  
  -- Return success with explicit column references
  SELECT json_build_object(
    'success', true,
    'id', p.id,
    'email', p.email,
    'first_name', p.first_name,
    'last_name', p.last_name,
    'message', 'Profile created successfully'
  ) INTO result_json
  FROM profiles p
  WHERE p.id = input_user_id;
  
  RETURN result_json;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists
    SELECT json_build_object(
      'success', true,
      'message', 'Profile already exists',
      'id', p.id,
      'email', p.email,
      'first_name', p.first_name,
      'last_name', p.last_name
    ) INTO result_json
    FROM profiles p
    WHERE p.id = input_user_id;
    RETURN result_json;
  WHEN foreign_key_violation THEN
    -- User doesn't exist in auth.users
    RETURN json_build_object(
      'error', 'User does not exist in auth.users', 
      'code', 'foreign_key_violation',
      'user_id', input_user_id::text
    );
  WHEN others THEN
    RETURN json_build_object(
      'error', SQLERRM, 
      'code', SQLSTATE,
      'user_id', input_user_id::text
    );
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_auth_users TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION create_profile_direct TO authenticated, anon, service_role;
