-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_firewood_stands_updated_at 
    BEFORE UPDATE ON firewood_stands 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at 
    BEFORE UPDATE ON reviews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for stands with owner information and average rating
CREATE OR REPLACE VIEW stands_with_details AS
SELECT 
    fs.*,
    p.first_name || ' ' || p.last_name as owner_name,
    p.email as owner_email,
    COALESCE(AVG(r.rating), 0) as average_rating,
    COUNT(r.id) as review_count
FROM firewood_stands fs
LEFT JOIN profiles p ON fs.user_id = p.id
LEFT JOIN reviews r ON fs.id = r.stand_id
GROUP BY fs.id, p.first_name, p.last_name, p.email;

-- Create function to get nearby stands
CREATE OR REPLACE FUNCTION get_nearby_stands(
    user_lat DECIMAL,
    user_lng DECIMAL,
    radius_miles INTEGER DEFAULT 25
)
RETURNS TABLE (
    id UUID,
    stand_name TEXT,
    address TEXT,
    latitude DECIMAL,
    longitude DECIMAL,
    wood_types TEXT[],
    price_range TEXT,
    payment_methods TEXT[],
    additional_details TEXT,
    photo_url TEXT,
    onsite_person BOOLEAN,
    owner_name TEXT,
    average_rating DECIMAL,
    review_count BIGINT,
    distance_miles DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        swd.id,
        swd.stand_name,
        swd.address,
        swd.latitude,
        swd.longitude,
        swd.wood_types,
        swd.price_range,
        swd.payment_methods,
        swd.additional_details,
        swd.photo_url,
        swd.onsite_person,
        swd.owner_name,
        swd.average_rating,
        swd.review_count,
        (
            3959 * acos(
                cos(radians(user_lat)) * 
                cos(radians(swd.latitude)) * 
                cos(radians(swd.longitude) - radians(user_lng)) + 
                sin(radians(user_lat)) * 
                sin(radians(swd.latitude))
            )
        )::DECIMAL as distance_miles
    FROM stands_with_details swd
    WHERE swd.is_approved = true
        AND swd.latitude IS NOT NULL 
        AND swd.longitude IS NOT NULL
        AND (
            3959 * acos(
                cos(radians(user_lat)) * 
                cos(radians(swd.latitude)) * 
                cos(radians(swd.longitude) - radians(user_lng)) + 
                sin(radians(user_lat)) * 
                sin(radians(swd.latitude))
            )
        ) <= radius_miles
    ORDER BY distance_miles;
END;
$$ LANGUAGE plpgsql;
