-- Insert sample data for testing (optional)
-- This will only run if there are no existing stands

DO $$
BEGIN
    -- Only insert sample data if no stands exist
    IF NOT EXISTS (SELECT 1 FROM firewood_stands LIMIT 1) THEN
        
        -- Note: In a real scenario, you'd need actual user IDs
        -- This is just for demonstration - you can remove this file if not needed
        
        INSERT INTO firewood_stands (
            user_id,
            stand_name,
            address,
            latitude,
            longitude,
            wood_types,
            price_range,
            payment_methods,
            additional_details,
            onsite_person,
            is_approved
        ) VALUES 
        -- Sample data - replace with real user IDs when available
        (
            gen_random_uuid(), -- This would be a real user ID
            'Johnson Family Firewood',
            '123 Country Road, Rural Town, ST 12345',
            40.7128,
            -74.0060,
            ARRAY['Oak', 'Maple', 'Cherry'],
            '$5-10/bundle',
            ARRAY['Cash Box', 'Venmo'],
            'Quality seasoned hardwood. Self-service stand with cash box. Usually restocked on weekends.',
            false,
            true
        );
        
        RAISE NOTICE 'Sample data inserted successfully';
    ELSE
        RAISE NOTICE 'Sample data skipped - stands already exist';
    END IF;
END $$;
