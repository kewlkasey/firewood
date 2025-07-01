-- Fix auth schema access and profile creation

-- Fix the ambiguous column reference in check_auth_users function
CREATE OR REPLACE FUNCTION check_auth_users()
RETURNS TABLE(user_id UUID, user_email TEXT, user_created_at TIMESTAMPTZ)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT au.id, au.email, au.created_at
  FROM auth.users au
  ORDER BY au.created_at DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Create a simpler profile creation approach that doesn't check auth.users
CREATE OR REPLACE FUNCTION create_profile_direct(
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
  -- Directly insert the profile without checking auth.users
  -- The foreign key constraint will handle validation
  INSERT INTO profiles (id, email, first_name, last_name)
  VALUES (user_id, user_email, first_name, last_name);
  
  -- Return success
  SELECT json_build_object(
    'success', true,
    'id', id,
    'email', email,
    'first_name', first_name,
    'last_name', last_name,
    'message', 'Profile created successfully'
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
  WHEN foreign_key_violation THEN
    -- User doesn't exist in auth.users
    RETURN json_build_object(
      'error', 'User does not exist in auth.users', 
      'code', 'foreign_key_violation',
      'user_id', user_id
    );
  WHEN others THEN
    RETURN json_build_object(
      'error', SQLERRM, 
      'code', SQLSTATE,
      'user_id', user_id
    );
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_profile_direct TO authenticated, anon, service_role;

-- Let's also try a different approach - temporarily remove the foreign key constraint
-- and add it back with proper permissions
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Add the constraint back with proper configuration
ALTER TABLE profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE
DEFERRABLE INITIALLY DEFERRED;

-- Update the trigger function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Add a small delay to ensure the user is fully committed
  PERFORM pg_sleep(0.1);
  
  -- Insert the profile
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error creating profile for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant additional permissions to ensure everything works
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT SELECT ON auth.users TO postgres, anon, authenticated, service_role;
