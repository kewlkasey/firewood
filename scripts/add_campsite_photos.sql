
-- Add 3 campsite wood photos to stand 60ef2396-26ff-4a80-b77c-e9edfcd454cc
-- Using free placeholder images for campsite firewood

DO $$
BEGIN
    -- Update the stand with an array of 3 campsite wood photo URLs
    UPDATE firewood_stands 
    SET 
        photo_urls = ARRAY[
            'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1520637836862-4d197d17c3a4?w=800&h=600&fit=crop&crop=center'
        ],
        updated_at = NOW()
    WHERE id = '60ef2396-26ff-4a80-b77c-e9edfcd454cc';

    -- Check if the update was successful
    IF FOUND THEN
        RAISE NOTICE 'Successfully added 3 campsite wood photos to stand 60ef2396-26ff-4a80-b77c-e9edfcd454cc';
    ELSE
        RAISE NOTICE 'Stand with ID 60ef2396-26ff-4a80-b77c-e9edfcd454cc not found';
    END IF;

EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error adding photos to stand: %', SQLERRM;
END $$;

-- Verify the update
SELECT 
    id, 
    stand_name, 
    photo_urls,
    array_length(photo_urls, 1) as photo_count
FROM firewood_stands 
WHERE id = '60ef2396-26ff-4a80-b77c-e9edfcd454cc';
