-- Simple fix for missing credentials column
-- Run this in your Supabase SQL Editor

-- Add the missing credentials column
ALTER TABLE integrations 
ADD COLUMN IF NOT EXISTS credentials JSONB;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_integrations_credentials 
ON integrations USING GIN (credentials);

-- That's it! The column is now available for use.
