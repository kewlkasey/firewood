-- Create the absolute simplest auth check function

-- Drop the problematic function
DROP FUNCTION IF EXISTS check_auth_users();

-- Create the simplest possible function that just returns a count
CREATE OR REPLACE FUNCTION check_auth_users()
RETURNS INTEGER
SECURITY DEFINER
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users;
  RETURN user_count;
EXCEPTION
  WHEN others THEN
    RETURN -1; -- Return -1 to indicate error
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_auth_users TO authenticated, anon, service_role;
