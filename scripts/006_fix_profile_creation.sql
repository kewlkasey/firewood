-- Fix profile creation issues

-- First, let's check and fix the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER -- This is important for permissions
SET search_path = public
AS $$
BEGIN
  -- Insert the profile with error handling
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
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies to be more permissive for profile creation
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id OR 
    auth.role() = 'service_role' OR
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Add a policy for the trigger to work
DROP POLICY IF EXISTS "System can insert profiles" ON profiles;
CREATE POLICY "System can insert profiles" ON profiles
  FOR INSERT WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;

-- Create a function to manually create missing profiles
CREATE OR REPLACE FUNCTION create_profile_for_user(user_id UUID, user_email TEXT, first_name TEXT DEFAULT '', last_name TEXT DEFAULT '')
RETURNS profiles
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_profile profiles;
BEGIN
  INSERT INTO profiles (id, email, first_name, last_name)
  VALUES (user_id, user_email, first_name, last_name)
  RETURNING * INTO new_profile;
  
  RETURN new_profile;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, return it
    SELECT * INTO new_profile FROM profiles WHERE id = user_id;
    RETURN new_profile;
  WHEN others THEN
    RAISE EXCEPTION 'Failed to create profile: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION create_profile_for_user TO authenticated, anon;
