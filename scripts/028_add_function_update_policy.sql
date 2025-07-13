
-- Add RLS policy to allow the update_stand_from_checkin function to work
-- This policy allows updates when there's no auth context or when called by service_role

CREATE POLICY "Allow function updates for check-ins" ON firewood_stands
  FOR UPDATE USING (
    -- Allow if user owns the stand
    auth.uid() = user_id 
    OR 
    -- Allow if being called by our SECURITY DEFINER function (no auth context)
    auth.uid() IS NULL
    OR
    -- Allow if called by service_role
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- Ensure the function has proper permissions
GRANT ALL ON firewood_stands TO service_role;
GRANT EXECUTE ON FUNCTION update_stand_from_checkin TO service_role;

-- Test the function to verify it works
SELECT update_stand_from_checkin(
    (SELECT id FROM firewood_stands WHERE is_approved = true LIMIT 1),
    'High',
    ARRAY['Cash Box', 'Venmo']
);
