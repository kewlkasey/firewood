-- Fix the auth users function return type issue

-- Drop the problematic function completely
DROP FUNCTION IF EXISTS check_auth_users();

-- Create a much simpler version that just returns basic info
CREATE OR REPLACE FUNCTION check_auth_users()
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_auth_users TO authenticated, anon, service_role;
