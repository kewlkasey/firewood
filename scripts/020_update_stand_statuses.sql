-- Update some stands to have different statuses for testing

DO $$
DECLARE
    stand_ids UUID[];
    random_id UUID;
    i INTEGER;
BEGIN
    -- Get all stand IDs
    SELECT ARRAY(SELECT id FROM firewood_stands ORDER BY created_at) INTO stand_ids;
    
    -- Randomly set about 30% of stands to pending status
    FOR i IN 1..ARRAY_LENGTH(stand_ids, 1) LOOP
        -- Use random number to decide if this stand should be pending
        IF RANDOM() < 0.3 THEN
            UPDATE firewood_stands 
            SET is_approved = false 
            WHERE id = stand_ids[i];
            
            RAISE NOTICE 'Set stand % to pending status', stand_ids[i];
        END IF;
    END LOOP;
    
    -- Also specifically set a few stands to pending for variety
    -- Update some specific stands by name pattern
    UPDATE firewood_stands 
    SET is_approved = false 
    WHERE stand_name LIKE '%Motor City%' 
       OR stand_name LIKE '%Quick Stop%'
       OR stand_name LIKE '%Pine Valley%'
       OR stand_name LIKE '%Cedar Valley%';
    
    RAISE NOTICE 'Updated stand statuses - some are now pending approval';
    
    -- Show the current status distribution
    RAISE NOTICE 'Current status distribution:';
    RAISE NOTICE 'Active stands: %', (SELECT COUNT(*) FROM firewood_stands WHERE is_approved = true);
    RAISE NOTICE 'Pending stands: %', (SELECT COUNT(*) FROM firewood_stands WHERE is_approved = false);

EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error updating stand statuses: %', SQLERRM;
END $$;

-- Create a function to easily check stand statuses
CREATE OR REPLACE FUNCTION get_stand_status_summary()
RETURNS TABLE(
    status TEXT,
    count BIGINT,
    example_stands TEXT[]
)
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN is_approved THEN 'Active'
            ELSE 'Pending'
        END as status,
        COUNT(*) as count,
        ARRAY_AGG(stand_name ORDER BY stand_name LIMIT 3) as example_stands
    FROM firewood_stands
    GROUP BY is_approved
    ORDER BY is_approved DESC;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_stand_status_summary TO authenticated, anon, service_role;
