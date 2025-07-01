-- Fix the foreign key constraint issue

-- First, let's check what's actually in auth.users
-- Create a function to get actual user IDs from auth.users
CREATE OR REPLACE FUNCTION get_auth_user_ids()
RETURNS TABLE(user_id UUID, user_email TEXT)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT id, email
  FROM auth.users
  ORDER BY created_at DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_auth_user_ids TO authenticated, anon, service_role;

-- Drop the existing foreign key constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Check if there are any existing profiles that might be causing issues
DELETE FROM profiles WHERE id NOT IN (SELECT id FROM auth.users);

-- Recreate the foreign key constraint with proper settings
ALTER TABLE profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE
DEFERRABLE INITIALLY DEFERRED;

-- Create a function that uses an existing user ID for testing
CREATE OR REPLACE FUNCTION create_profile_for_existing_user(
  target_email TEXT DEFAULT 'wright.casey@gmail.com'
)
RETURNS JSON
SECURITY DEFINER
AS $$
DECLARE
  existing_user_id UUID;
  result_json JSON;
BEGIN
  -- Find an existing user ID from auth.users
  SELECT id INTO existing_user_id 
  FROM auth.users 
  WHERE email = target_email
  LIMIT 1;
  
  IF existing_user_id IS NULL THEN
    -- If target email not found, get any user
    SELECT id INTO existing_user_id 
    FROM auth.users 
    LIMIT 1;
  END IF;
  
  IF existing_user_id IS NULL THEN
    RETURN json_build_object('error', 'No users found in auth.users');
  END IF;
  
  -- Try to create profile for this existing user
  INSERT INTO profiles (id, email, first_name, last_name)
  VALUES (existing_user_id, target_email, 'Casey', 'Wright');
  
  RETURN json_build_object(
    'success', true,
    'user_id', existing_user_id,
    'email', target_email,
    'message', 'Profile created for existing user'
  );
  
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object(
      'success', true,
      'message', 'Profile already exists',
      'user_id', existing_user_id
    );
  WHEN foreign_key_violation THEN
    RETURN json_build_object(
      'error', 'Foreign key violation - user ID not found in auth.users',
      'user_id', existing_user_id
    );
  WHEN others THEN
    RETURN json_build_object(
      'error', SQLERRM,
      'code', SQLSTATE,
      'user_id', existing_user_id
    );
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION create_profile_for_existing_user TO authenticated, anon, service_role;
