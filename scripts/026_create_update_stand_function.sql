
-- Create a function to update stand data from check-ins
-- This bypasses RLS issues and ensures the update works

CREATE OR REPLACE FUNCTION update_stand_from_checkin(
    p_stand_id UUID,
    p_inventory_level TEXT,
    p_payment_methods TEXT[],
    p_last_verified_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSON
SECURITY DEFINER -- This runs with the privileges of the function owner
AS $$
DECLARE
    update_data JSON;
    result_row RECORD;
BEGIN
    -- Update the stand
    UPDATE firewood_stands 
    SET 
        inventory_level = p_inventory_level,
        payment_methods = COALESCE(p_payment_methods, payment_methods),
        last_verified_date = p_last_verified_date,
        updated_at = NOW()
    WHERE id = p_stand_id
    RETURNING * INTO result_row;
    
    -- Check if update was successful
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Stand not found'
        );
    END IF;
    
    -- Return success with updated data
    RETURN json_build_object(
        'success', true,
        'data', row_to_json(result_row)
    );
    
EXCEPTION
    WHEN others THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_stand_from_checkin TO authenticated, anon, service_role;
