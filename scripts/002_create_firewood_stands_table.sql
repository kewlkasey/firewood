-- Create firewood_stands table
CREATE TABLE IF NOT EXISTS firewood_stands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  stand_name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL,
  longitude DECIMAL,
  wood_types TEXT[] NOT NULL DEFAULT '{}',
  price_range TEXT NOT NULL,
  payment_methods TEXT[] NOT NULL DEFAULT '{}',
  additional_details TEXT,
  photo_url TEXT,
  onsite_person BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE firewood_stands ENABLE ROW LEVEL SECURITY;

-- Create policies for firewood_stands table
CREATE POLICY "Users can view approved stands" ON firewood_stands
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can view own stands" ON firewood_stands
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stands" ON firewood_stands
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stands" ON firewood_stands
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stands" ON firewood_stands
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_firewood_stands_user_id ON firewood_stands(user_id);
CREATE INDEX IF NOT EXISTS idx_firewood_stands_approved ON firewood_stands(is_approved);
CREATE INDEX IF NOT EXISTS idx_firewood_stands_location ON firewood_stands(latitude, longitude);
