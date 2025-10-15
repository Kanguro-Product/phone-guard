-- Fix integrations table structure for A/B Caller Tool
-- This script ensures the table has all necessary columns

-- First, ensure the integrations table exists with basic structure
CREATE TABLE IF NOT EXISTS integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns if they don't exist
DO $$ 
BEGIN
  -- Add api_key column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'integrations' AND column_name = 'api_key') THEN
    ALTER TABLE integrations ADD COLUMN api_key TEXT;
  END IF;
  
  -- Add api_secret column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'integrations' AND column_name = 'api_secret') THEN
    ALTER TABLE integrations ADD COLUMN api_secret TEXT;
  END IF;
  
  -- Add credentials column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'integrations' AND column_name = 'credentials') THEN
    ALTER TABLE integrations ADD COLUMN credentials JSONB;
  END IF;
END $$;

-- Migrate existing data to credentials format
UPDATE integrations 
SET credentials = jsonb_build_object(
  'api_key', COALESCE(api_key, ''),
  'api_secret', COALESCE(api_secret, '')
)
WHERE (api_key IS NOT NULL OR api_secret IS NOT NULL) 
  AND (credentials IS NULL OR credentials = '{}'::jsonb);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_provider ON integrations(provider);
CREATE INDEX IF NOT EXISTS idx_integrations_enabled ON integrations(enabled);
CREATE INDEX IF NOT EXISTS idx_integrations_credentials ON integrations USING GIN (credentials);

-- Add RLS policies
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own integrations" ON integrations;
DROP POLICY IF EXISTS "Users can insert own integrations" ON integrations;
DROP POLICY IF EXISTS "Users can update own integrations" ON integrations;
DROP POLICY IF EXISTS "Users can delete own integrations" ON integrations;

-- Create RLS policies
CREATE POLICY "Users can view own integrations" ON integrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own integrations" ON integrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own integrations" ON integrations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own integrations" ON integrations
  FOR DELETE USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_integrations_updated_at ON integrations;
CREATE TRIGGER trigger_update_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_integrations_updated_at();

-- Add comment
COMMENT ON TABLE integrations IS 'User API integrations for various services';
COMMENT ON COLUMN integrations.credentials IS 'JSON configuration for provider-specific settings';
