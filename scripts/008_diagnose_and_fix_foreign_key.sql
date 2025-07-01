-- Diagnose and fix the foreign key constraint issue

-- First, let's check what foreign key constraints exist
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='profiles';

-- Drop the existing foreign key constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Recreate the foreign key constraint with the correct reference
ALTER TABLE profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Also, let's create a simpler function that doesn't rely on foreign keys for testing
CREATE OR REPLACE FUNCTION create_profile_simple(
  user_id UUID,
  user_email TEXT,
  first_name TEXT DEFAULT '',
  last_name TEXT DEFAULT ''
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  -- First check if user exists in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
    RETURN json_build_object('error', 'User does not exist in auth.users');
  END IF;

  -- Try to insert the profile
  INSERT INTO profiles (id, email, first_name, last_name)
  VALUES (user_id, user_email, first_name, last_name);
  
  -- Return success
  SELECT json_build_object(
    'success', true,
    'id', id,
    'email', email,
    'first_name', first_name,
    'last_name', last_name
  ) INTO result
  FROM profiles 
  WHERE id = user_id;
  
  RETURN result;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists
    SELECT json_build_object(
      'success', true,
      'message', 'Profile already exists',
      'id', id,
      'email', email,
      'first_name', first_name,
      'last_name', last_name
    ) INTO result
    FROM profiles 
    WHERE id = user_id;
    RETURN result;
  WHEN others THEN
    RETURN json_build_object('error', SQLERRM, 'code', SQLSTATE);
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_profile_simple TO authenticated, anon, service_role;

-- Let's also create a diagnostic function to check what's in auth.users
CREATE OR REPLACE FUNCTION check_auth_users()
RETURNS TABLE(user_id UUID, user_email TEXT, created_at TIMESTAMPTZ)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT id, email, created_at
  FROM auth.users
  ORDER BY created_at DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION check_auth_users TO authenticated, anon, service_role;
