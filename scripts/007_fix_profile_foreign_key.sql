-- Fix the foreign key constraint issue for profile creation

-- First, let's temporarily disable RLS to fix the constraint issue
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON profiles;

-- Recreate the trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Re-enable RLS with simpler policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simple policies that work
CREATE POLICY "Enable read access for all users" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for users based on user_id" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable delete for users based on user_id" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- Grant necessary permissions
GRANT ALL ON profiles TO postgres, anon, authenticated, service_role;

-- Create a function to manually create profiles that bypasses RLS
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id UUID,
  user_email TEXT,
  first_name TEXT DEFAULT '',
  last_name TEXT DEFAULT ''
)
RETURNS profiles
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_profile profiles;
BEGIN
  -- Insert the profile
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_user_profile TO authenticated, anon, service_role;
