
-- Enable RLS on stand_verifications table (if not already enabled)
ALTER TABLE stand_verifications ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to insert check-ins (for both authenticated and anonymous users)
CREATE POLICY "Allow check-in submissions" ON stand_verifications
    FOR INSERT
    WITH CHECK (true);

-- Policy to allow anyone to read check-ins
CREATE POLICY "Allow reading check-ins" ON stand_verifications
    FOR SELECT
    USING (true);

-- Policy to allow users to update their own check-ins
CREATE POLICY "Allow users to update own check-ins" ON stand_verifications
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy to allow users to delete their own check-ins
CREATE POLICY "Allow users to delete own check-ins" ON stand_verifications
    FOR DELETE
    USING (auth.uid() = user_id);
