-- Add test firewood stands for development and demonstration

-- First, let's create a test user if one doesn't exist
-- (In production, you'd use real user IDs from auth.users)
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
        VALUES (test_user_id, 'test@example.com', 'Test', 'Owner')
        ON CONFLICT (id) DO NOTHING;
    END IF;

    -- Clear existing test data
    DELETE FROM firewood_stands WHERE stand_name LIKE '%Test%' OR stand_name LIKE '%Demo%';

    -- Insert test firewood stands
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
        'Johnson Family Firewood',
        '1234 Country Road, Millerville, PA 17551',
        40.1234,
        -76.5678,
        ARRAY['Oak', 'Maple', 'Cherry'],
        '$5-10/bundle',
        ARRAY['Cash Box', 'Venmo'],
        'Quality seasoned hardwood. Self-service stand with cash box. Usually restocked on weekends. Look for the red barn!',
        NULL,
        false,
        true
    ),
    (
        test_user_id,
        'Pine Ridge Wood Stand',
        '567 Mountain View Drive, Lancaster, PA 17602',
        40.0378,
        -76.3055,
        ARRAY['Pine', 'Mixed Softwood', 'Oak'],
        '$10-15/bundle',
        ARRAY['Cash Box', 'PayPal'],
        'Mix of seasoned pine and oak. Great for campfires and fire pits. Available 24/7. Cash box located under the blue tarp.',
        NULL,
        false,
        true
    ),
    (
        test_user_id,
        'Maple Grove Firewood',
        '890 Scenic Route 30, York, PA 17404',
        39.9626,
        -76.7277,
        ARRAY['Maple', 'Ash', 'Hickory'],
        '$15+/bundle',
        ARRAY['Cash Box', 'Zelle'],
        'Premium seasoned hardwood, perfect for heating. Cut and split this fall. Usually someone around during daylight hours.',
        NULL,
        true,
        true
    ),
    (
        test_user_id,
        'Roadside Wood Co.',
        '123 Old Mill Road, Ephrata, PA 17522',
        40.1803,
        -76.1786,
        ARRAY['Mixed Hardwood', 'Oak', 'Beech'],
        '$5-10/bundle',
        ARRAY['Cash Box'],
        'Honest pricing, quality wood. Help yourself and leave payment in the metal box. Thanks for supporting local!',
        NULL,
        false,
        true
    ),
    (
        test_user_id,
        'Sunset Farm Wood Stand',
        '456 Sunset Lane, Lititz, PA 17543',
        40.1548,
        -76.3077,
        ARRAY['Cherry', 'Walnut', 'Mixed Hardwood'],
        '$10-15/bundle',
        ARRAY['Cash Box', 'Venmo', 'PayPal'],
        'Small family farm selling excess firewood. Seasoned 1+ years. Multiple payment options available. Call if you need larger quantities.',
        NULL,
        true,
        true
    ),
    (
        test_user_id,
        'Heritage Woods',
        '789 Heritage Drive, Manheim, PA 17545',
        40.1637,
        -76.3955,
        ARRAY['Ash', 'Maple', 'Hickory', 'Oak'],
        'Varies',
        ARRAY['Cash Box', 'Zelle'],
        'Variety of premium hardwoods. Prices vary by wood type - see posted signs. All wood is seasoned minimum 18 months.',
        NULL,
        false,
        true
    ),
    (
        test_user_id,
        'Quick Stop Firewood',
        '321 Main Street, Mount Joy, PA 17552',
        40.1084,
        -76.5077,
        ARRAY['Mixed Hardwood', 'Pine'],
        'Under $5/bundle',
        ARRAY['Cash Box'],
        'Budget-friendly firewood for camping and casual use. Self-serve stand next to the garage. Exact change appreciated!',
        NULL,
        false,
        true
    ),
    (
        test_user_id,
        'Countryside Timber',
        '654 Timber Lane, Columbia, PA 17512',
        40.0342,
        -76.5044,
        ARRAY['Oak', 'Hickory', 'Black Locust'],
        '$15+/bundle',
        ARRAY['Cash Box', 'Venmo', 'PayPal', 'Zelle'],
        'Premium heating wood, seasoned 2+ years. Perfect for wood stoves and fireplaces. We take pride in our quality!',
        NULL,
        true,
        true
    );

    RAISE NOTICE 'Successfully inserted % test firewood stands', 8;

EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error inserting test stands: %', SQLERRM;
END $$;

-- Create a function to easily view the test stands
CREATE OR REPLACE FUNCTION get_test_stands()
RETURNS TABLE(
    stand_name TEXT,
    address TEXT,
    wood_types TEXT[],
    price_range TEXT,
    payment_methods TEXT[],
    is_approved BOOLEAN
)
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fs.stand_name,
        fs.address,
        fs.wood_types,
        fs.price_range,
        fs.payment_methods,
        fs.is_approved
    FROM firewood_stands fs
    ORDER BY fs.created_at DESC;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_test_stands TO authenticated, anon, service_role;
