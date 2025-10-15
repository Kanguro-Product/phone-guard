-- Add credentials column to integrations table
-- This column will store JSON data for providers that need complex configuration

-- Add the credentials column
ALTER TABLE integrations 
ADD COLUMN IF NOT EXISTS credentials JSONB;

-- Update existing integrations to use the new structure
-- For providers that already have api_key and api_secret, migrate them to credentials
UPDATE integrations 
SET credentials = jsonb_build_object(
  'api_key', api_key,
  'api_secret', api_secret
)
WHERE api_key IS NOT NULL 
  AND credentials IS NULL;

-- For N8N specifically, we'll use webhook_url in credentials
-- This will be handled by the application when users save N8N configuration

-- Add index for better performance on credentials queries
CREATE INDEX IF NOT EXISTS idx_integrations_credentials 
ON integrations USING GIN (credentials);

-- Add comment to document the column
COMMENT ON COLUMN integrations.credentials IS 'JSON configuration for provider-specific settings (webhook URLs, API keys, etc.)';
