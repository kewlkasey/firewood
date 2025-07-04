
-- Add 10 more firewood stands within 1 mile of 48047 (Chesterfield, MI)
-- This adds to the existing 28 stands to bring total to 38

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
        VALUES (test_user_id, 'chesterfield2@example.com', 'Chesterfield2', 'Owner')
        ON CONFLICT (id) DO NOTHING;
    END IF;

    -- Insert 10 additional Chesterfield area firewood stands within 1 mile of 48047
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
        'Test Chesterfield Marina Wood',
        '50789 Marina Dr, Chesterfield, MI 48047',
        42.6823,
        -82.8267,
        ARRAY['Oak', 'Maple', 'Cedar'],
        '$10-15/bundle',
        ARRAY['Cash Box', 'Venmo'],
        'Marina location with premium seasoned hardwood. Perfect for waterfront campfires. Self-serve available all hours.',
        NULL,
        false,
        true
    ),
    (
        test_user_id,
        'Test Fairchild Road Firewood',
        '48234 Fairchild Rd, Chesterfield, MI 48047',
        42.6901,
        -82.8423,
        ARRAY['Hickory', 'Apple', 'Oak'],
        '$15+/bundle',
        ARRAY['Cash Box', 'PayPal', 'Zelle'],
        'Specialty fruit woods including apple for smoking. Premium pricing for premium quality. Family owned since 1995.',
        NULL,
        true,
        true
    ),
    (
        test_user_id,
        'Test Chesterfield Oaks Wood',
        '49123 Chesterfield Oaks Blvd, Chesterfield, MI 48047',
        42.6756,
        -82.8445,
        ARRAY['Oak', 'Ash', 'Mixed Hardwood'],
        '$5-10/bundle',
        ARRAY['Cash Box'],
        'Neighborhood firewood stand in Chesterfield Oaks subdivision. Affordable prices, honor system payment.',
        NULL,
        false,
        true
    ),
    (
        test_user_id,
        'Test Cotton Road Wood Stand',
        '47890 Cotton Rd, Chesterfield, MI 48047',
        42.6867,
        -82.8512,
        ARRAY['Maple', 'Cherry', 'Birch'],
        '$10-15/bundle',
        ARRAY['Cash Box', 'Venmo', 'PayPal'],
        'Cotton Road location with beautiful cherry and birch wood. Great for heating and decorative fires.',
        NULL,
        false,
        true
    ),
    (
        test_user_id,
        'Test Selfridge Base Wood',
        '50567 Base Line Rd, Chesterfield, MI 48047',
        42.6934,
        -82.8178,
        ARRAY['Oak', 'Hickory', 'Black Locust'],
        'Varies',
        ARRAY['Cash Box', 'Zelle'],
        'Near Selfridge base. Premium hardwoods including black locust - burns hot and long. Prices vary by wood type.',
        NULL,
        false,
        true
    ),
    (
        test_user_id,
        'Test Anchor Point Firewood',
        '51234 Anchor Point Dr, Chesterfield, MI 48047',
        42.6712,
        -82.8334,
        ARRAY['Mixed Hardwood', 'Pine', 'Maple'],
        'Under $5/bundle',
        ARRAY['Cash Box'],
        'Budget-friendly option at Anchor Point. Mix of hardwood and softwood perfect for casual fires and camping.',
        NULL,
        false,
        true
    ),
    (
        test_user_id,
        'Test Chesterfield Commons East',
        '50890 Commons East Dr, Chesterfield, MI 48047',
        42.6798,
        -82.8234,
        ARRAY['Oak', 'Maple', 'Ash', 'Elm'],
        '$10-15/bundle',
        ARRAY['Cash Box', 'Venmo', 'PayPal', 'Zelle'],
        'East side Commons location. Full service firewood with multiple payment options. Consistently well-stocked.',
        NULL,
        true,
        true
    ),
    (
        test_user_id,
        'Test Macomb County Wood',
        '49456 County Line Rd, Chesterfield, MI 48047',
        42.6845,
        -82.8389,
        ARRAY['Hickory', 'Oak', 'Beech'],
        '$15+/bundle',
        ARRAY['Cash Box', 'Zelle', 'Venmo'],
        'County line location specializing in dense hardwoods. Perfect for long-burning heating fires. Premium quality.',
        NULL,
        false,
        true
    ),
    (
        test_user_id,
        'Test Lakeshore Woods',
        '50123 N Lakeshore Dr, Chesterfield, MI 48047',
        42.6923,
        -82.8156,
        ARRAY['Cedar', 'Pine', 'Mixed Softwood'],
        '$5-10/bundle',
        ARRAY['Cash Box'],
        'North lakeshore location with aromatic cedar and pine. Perfect for campfires and outdoor gatherings.',
        NULL,
        false,
        true
    ),
    (
        test_user_id,
        'Test Chesterfield Township East',
        '51567 Township East Rd, Chesterfield, MI 48047',
        42.6778,
        -82.8267,
        ARRAY['Oak', 'Maple', 'Walnut', 'Cherry'],
        '$15+/bundle',
        ARRAY['Cash Box', 'Venmo', 'PayPal', 'Zelle'],
        'Premium township location with specialty woods including walnut. Perfect for high-end heating and smoking.',
        NULL,
        true,
        true
    );

    RAISE NOTICE 'Successfully inserted 10 additional Chesterfield area firewood stands within 1 mile of 48047';

EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error inserting additional Chesterfield stands: %', SQLERRM;
END $$;

-- Function to count total stands
CREATE OR REPLACE FUNCTION get_total_stand_count()
RETURNS TABLE(
    total_stands BIGINT,
    approved_stands BIGINT,
    pending_stands BIGINT
)
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_stands,
        COUNT(*) FILTER (WHERE is_approved = true) as approved_stands,
        COUNT(*) FILTER (WHERE is_approved = false) as pending_stands
    FROM firewood_stands;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_total_stand_count TO authenticated, anon, service_role;
