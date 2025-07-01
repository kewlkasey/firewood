-- Add 10 more test firewood stands within 50 miles of 52577 (Strawberry Point, IA)
-- Also add "Test" prefix to all existing and new stand names

DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Try to get an existing user first
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    -- If no users exist, create a placeholder UUID for testing
    IF test_user_id IS NULL THEN
        test_user_id := gen_random_uuid();
        
        -- Insert a test profile (this will fail if no auth user exists, but that's ok for testing)
        INSERT INTO profiles (id, email, first_name, last_name) 
        VALUES (test_user_id, 'iowa@example.com', 'Iowa', 'Owner')
        ON CONFLICT (id) DO NOTHING;
    END IF;

    -- First, update all existing stands to have "Test" prefix
    UPDATE firewood_stands 
    SET stand_name = 'Test ' || stand_name 
    WHERE stand_name NOT LIKE 'Test %';

    RAISE NOTICE 'Updated existing stands with Test prefix';

    -- Insert Iowa area test firewood stands (all with Test prefix)
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
        photo_url,
        onsite_person,
        is_approved
    ) VALUES 
    (
        test_user_id,
        'Test Hawkeye Firewood',
        '1234 Highway 3, Strawberry Point, IA 52577',
        42.6847,
        -91.5354,
        ARRAY['Oak', 'Maple', 'Ash', 'Hickory'],
        '$10-15/bundle',
        ARRAY['Cash Box', 'Venmo'],
        'Iowa hardwood from local farms. Seasoned 18+ months. Perfect for heating and campfires. Self-serve stand available 24/7.',
        NULL,
        false,
        true
    ),
    (
        test_user_id,
        'Test Prairie Wood Co.',
        '5678 Main Street, Dubuque, IA 52001',
        42.5006,
        -90.6648,
        ARRAY['Oak', 'Cherry', 'Mixed Hardwood'],
        '$5-10/bundle',
        ARRAY['Cash Box', 'PayPal'],
        'Mississippi River valley hardwood. Quality wood at fair prices. Honor system - please leave payment in the metal box.',
        NULL,
        false,
        true
    ),
    (
        test_user_id,
        'Test Cornfield Timber',
        '9876 County Road W35, Elkader, IA 52043',
        42.8531,
        -91.4043,
        ARRAY['Walnut', 'Oak', 'Maple', 'Ash'],
        '$15+/bundle',
        ARRAY['Cash Box', 'Zelle', 'PayPal'],
        'Premium Iowa hardwood from century-old trees. Family operation for 30+ years. Usually someone available during daylight hours.',
        NULL,
        true,
        true
    ),
    (
        test_user_id,
        'Test River Valley Wood',
        '2468 Turkey River Road, Elkport, IA 52004',
        42.7331,
        -91.2543,
        ARRAY['Cottonwood', 'Ash', 'Oak', 'Elm'],
        '$5-10/bundle',
        ARRAY['Cash Box', 'Venmo'],
        'Located along the Turkey River. Great for outdoor fires and camping. Seasoned wood, cut and split to perfect size.',
        NULL,
        false,
        true
    ),
    (
        test_user_id,
        'Test Driftless Firewood',
        '1357 Scenic Drive, McGregor, IA 52157',
        43.2169,
        -91.1804,
        ARRAY['Oak', 'Hickory', 'Cherry', 'Black Locust'],
        'Varies',
        ARRAY['Cash Box', 'Zelle'],
        'Driftless Area hardwood with scenic Mississippi River views. Prices vary by wood type - see posted signs. All wood seasoned 2+ years.',
        NULL,
        false,
        true
    ),
    (
        test_user_id,
        'Test Farmstead Wood',
        '8642 Farm Road, Postville, IA 52162',
        43.0886,
        -91.5693,
        ARRAY['Maple', 'Oak', 'Ash'],
        '$10-15/bundle',
        ARRAY['Cash Box', 'Venmo', 'PayPal'],
        'Family farm selling excess firewood. Clean, well-seasoned hardwood perfect for heating. Self-serve stand next to the red barn.',
        NULL,
        false,
        true
    ),
    (
        test_user_id,
        'Test Bluff Country Splits',
        '7531 Bluff Road, Lansing, IA 52151',
        43.3614,
        -91.2232,
        ARRAY['Oak', 'Hickory', 'Mixed Hardwood'],
        '$15+/bundle',
        ARRAY['Cash Box', 'Zelle'],
        'Premium bluff country hardwood. Perfect for wood stoves and heating. All wood cut from our own timber. Great burning quality!',
        NULL,
        true,
        true
    ),
    (
        test_user_id,
        'Test Cedar Valley Wood',
        '4680 Cedar Street, West Union, IA 52175',
        42.9622,
        -91.8093,
        ARRAY['Cedar', 'Pine', 'Oak', 'Maple'],
        '$5-10/bundle',
        ARRAY['Cash Box'],
        'Mix of cedar, pine and hardwood. Great for kindling and campfires. Self-serve stand behind the white farmhouse.',
        NULL,
        false,
        true
    ),
    (
        test_user_id,
        'Test Countryside Timber',
        '3691 Country Lane, Monona, IA 52159',
        43.0447,
        -91.0954,
        ARRAY['Oak', 'Ash', 'Maple'],
        'Under $5/bundle',
        ARRAY['Cash Box'],
        'Budget-friendly firewood from local farm. Good for casual fires and camping. Help yourself and drop payment in the slot.',
        NULL,
        false,
        true
    ),
    (
        test_user_id,
        'Test Heritage Hardwoods',
        '5924 Heritage Trail, Guttenberg, IA 52052',
        42.7856,
        -91.0993,
        ARRAY['Walnut', 'Cherry', 'Oak', 'Hickory'],
        '$15+/bundle',
        ARRAY['Cash Box', 'Venmo', 'PayPal', 'Zelle'],
        'Specialty hardwoods including walnut and cherry. Perfect for smoking and premium heating. Historic German settlement area. Owner on-site weekends.',
        NULL,
        true,
        true
    );

    RAISE NOTICE 'Successfully inserted 10 Iowa area test firewood stands with Test prefix';

EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error inserting Iowa test stands: %', SQLERRM;
END $$;

-- Create a function to count stands by state/region
CREATE OR REPLACE FUNCTION get_stands_by_region()
RETURNS TABLE(
    region TEXT,
    stand_count BIGINT
)
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN address LIKE '%PA%' THEN 'Pennsylvania'
            WHEN address LIKE '%MI%' THEN 'Michigan'
            WHEN address LIKE '%IA%' THEN 'Iowa'
            ELSE 'Other'
        END as region,
        COUNT(*) as stand_count
    FROM firewood_stands
    WHERE is_approved = true
    GROUP BY region
    ORDER BY stand_count DESC;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_stands_by_region TO authenticated, anon, service_role;

-- Update the existing function to show the Test prefix
CREATE OR REPLACE FUNCTION get_all_test_stands()
RETURNS TABLE(
    stand_name TEXT,
    address TEXT,
    latitude DECIMAL,
    longitude DECIMAL,
    wood_types TEXT[],
    price_range TEXT,
    state TEXT
)
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fs.stand_name,
        fs.address,
        fs.latitude,
        fs.longitude,
        fs.wood_types,
        fs.price_range,
        CASE 
            WHEN fs.address LIKE '%PA%' THEN 'PA'
            WHEN fs.address LIKE '%MI%' THEN 'MI'
            WHEN fs.address LIKE '%IA%' THEN 'IA'
            ELSE 'Other'
        END as state
    FROM firewood_stands fs
    WHERE fs.is_approved = true
    ORDER BY fs.created_at DESC;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_all_test_stands TO authenticated, anon, service_role;
