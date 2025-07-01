-- Add 10 more test firewood stands within 50 miles of 48047 (Chesterfield, MI)
-- This covers the Detroit metro area, including suburbs and rural areas

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
        VALUES (test_user_id, 'michigan@example.com', 'Michigan', 'Owner')
        ON CONFLICT (id) DO NOTHING;
    END IF;

    -- Insert Michigan area test firewood stands
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
        'Great Lakes Firewood',
        '12345 26 Mile Road, Chesterfield, MI 48047',
        42.6831,
        -82.8354,
        ARRAY['Oak', 'Maple', 'Ash', 'Cherry'],
        '$10-15/bundle',
        ARRAY['Cash Box', 'Venmo'],
        'Premium Michigan hardwood, seasoned 18+ months. Perfect for heating and campfires. Self-serve stand available 24/7.',
        NULL,
        false,
        true
    ),
    (
        test_user_id,
        'Motor City Wood Co.',
        '5678 Gratiot Avenue, Detroit, MI 48207',
        42.3314,
        -83.0458,
        ARRAY['Mixed Hardwood', 'Oak', 'Hickory'],
        '$5-10/bundle',
        ARRAY['Cash Box'],
        'Urban firewood stand serving Detroit. Quality wood at fair prices. Honor system - please leave exact change in the box.',
        NULL,
        false,
        true
    ),
    (
        test_user_id,
        'Thumb Area Timber',
        '9876 Lapeer Road, Davison, MI 48423',
        43.0364,
        -83.5188,
        ARRAY['Maple', 'Beech', 'Elm'],
        '$15+/bundle',
        ARRAY['Cash Box', 'PayPal', 'Zelle'],
        'Family business serving the Thumb area for 20+ years. All wood cut from our own property. Usually someone available during daylight.',
        NULL,
        true,
        true
    ),
    (
        test_user_id,
        'Lakeside Wood Stand',
        '2468 Lakeshore Drive, St. Clair Shores, MI 48080',
        42.4973,
        -82.8888,
        ARRAY['Oak', 'Cherry', 'Mixed Hardwood'],
        '$10-15/bundle',
        ARRAY['Cash Box', 'Venmo', 'PayPal'],
        'Located near Lake St. Clair. Great for lakeside campfires! Seasoned hardwood, cut and split to perfect size.',
        NULL,
        false,
        true
    ),
    (
        test_user_id,
        'Country Roads Firewood',
        '1357 Romeo Plank Road, Romeo, MI 48065',
        42.8022,
        -83.0127,
        ARRAY['Ash', 'Maple', 'Hickory', 'Black Locust'],
        'Varies',
        ARRAY['Cash Box', 'Zelle'],
        'Rural stand with variety of premium woods. Prices posted on stand. All wood seasoned minimum 2 years. Great for heating!',
        NULL,
        false,
        true
    ),
    (
        test_user_id,
        'Suburban Splits',
        '8642 Rochester Road, Troy, MI 48085',
        42.6064,
        -83.1499,
        ARRAY['Oak', 'Maple', 'Mixed Hardwood'],
        '$10-15/bundle',
        ARRAY['Cash Box', 'Venmo'],
        'Convenient suburban location. Perfect for backyard fire pits and small fireplaces. Clean, well-seasoned wood.',
        NULL,
        false,
        true
    ),
    (
        test_user_id,
        'Pine Valley Wood Works',
        '7531 Dixie Highway, Clarkston, MI 48346',
        42.7369,
        -83.4196,
        ARRAY['Pine', 'Mixed Softwood', 'Oak', 'Maple'],
        '$5-10/bundle',
        ARRAY['Cash Box'],
        'Mix of softwood and hardwood available. Great for camping and outdoor fires. Self-serve stand next to the workshop.',
        NULL,
        false,
        true
    ),
    (
        test_user_id,
        'Heritage Farm Firewood',
        '4680 Baldwin Road, Orion Township, MI 48359',
        42.7834,
        -83.2791,
        ARRAY['Cherry', 'Walnut', 'Maple', 'Oak'],
        '$15+/bundle',
        ARRAY['Cash Box', 'Venmo', 'PayPal', 'Zelle'],
        'Historic family farm selling premium firewood. Specializing in fruit woods perfect for smoking. Call ahead for large orders.',
        NULL,
        true,
        true
    ),
    (
        test_user_id,
        'Riverside Wood Supply',
        '3691 Fort Street, Lincoln Park, MI 48146',
        42.2505,
        -83.1785,
        ARRAY['Mixed Hardwood', 'Ash', 'Elm'],
        'Under $5/bundle',
        ARRAY['Cash Box'],
        'Budget-friendly firewood near the Detroit River. Good for casual fires and camping. Help yourself and drop payment in slot.',
        NULL,
        false,
        true
    ),
    (
        test_user_id,
        'North Woods Timber',
        '5924 Sashabaw Road, Clarkston, MI 48348',
        42.7508,
        -83.4057,
        ARRAY['Oak', 'Hickory', 'Beech', 'Ash'],
        '$15+/bundle',
        ARRAY['Cash Box', 'Zelle', 'PayPal'],
        'Premium northern Michigan hardwood. Perfect for wood stoves and heating. All wood kiln-dried and ready to burn. Owner usually on-site weekends.',
        NULL,
        true,
        true
    );

    RAISE NOTICE 'Successfully inserted 10 Michigan area test firewood stands';

EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error inserting Michigan test stands: %', SQLERRM;
END $$;

-- Update the get_test_stands function to show location info
CREATE OR REPLACE FUNCTION get_test_stands_with_location()
RETURNS TABLE(
    stand_name TEXT,
    address TEXT,
    latitude DECIMAL,
    longitude DECIMAL,
    wood_types TEXT[],
    price_range TEXT,
    payment_methods TEXT[],
    additional_details TEXT,
    is_approved BOOLEAN
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
        fs.payment_methods,
        fs.additional_details,
        fs.is_approved
    FROM firewood_stands fs
    ORDER BY fs.created_at DESC;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_test_stands_with_location TO authenticated, anon, service_role;
