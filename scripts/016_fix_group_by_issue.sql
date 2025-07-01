-- Fix the GROUP BY issue in the JSON function

DROP FUNCTION IF EXISTS get_auth_user_ids();

-- Create a simpler version without ORDER BY in the aggregate
CREATE OR REPLACE FUNCTION get_auth_user_ids()
RETURNS JSON
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Use a subquery to handle ordering properly
  SELECT json_agg(user_data) INTO result
  FROM (
    SELECT json_build_object(
      'user_id', id,
      'user_email', email,
      'created_at', created_at
    ) as user_data
    FROM auth.users
    ORDER BY created_at DESC
    LIMIT 10
  ) ordered_users;
  
  RETURN COALESCE(result, '[]'::json);
EXCEPTION
  WHEN others THEN
    RETURN json_build_object('error', SQLERRM, 'code', SQLSTATE);
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_auth_user_ids TO authenticated, anon, service_role;
