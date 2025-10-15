-- Fix integrations table constraints for N8N provider
-- This script removes NOT NULL constraints that are causing issues

-- First, make api_key and api_secret nullable
ALTER TABLE integrations 
ALTER COLUMN api_key DROP NOT NULL;

ALTER TABLE integrations 
ALTER COLUMN api_secret DROP NOT NULL;

-- Update existing records with empty strings to NULL for cleaner data
UPDATE integrations 
SET api_key = NULL 
WHERE api_key = '';

UPDATE integrations 
SET api_secret = NULL 
WHERE api_secret = '';

-- Add a check constraint to ensure at least one of api_key or credentials is provided
-- This is more flexible than NOT NULL on api_key
ALTER TABLE integrations 
ADD CONSTRAINT check_api_key_or_credentials 
CHECK (
  (api_key IS NOT NULL AND api_key != '') OR 
  (credentials IS NOT NULL AND credentials != '{}'::jsonb)
);

-- Add comment to document the constraint
COMMENT ON CONSTRAINT check_api_key_or_credentials ON integrations 
IS 'Ensures either api_key or credentials is provided for each integration';
