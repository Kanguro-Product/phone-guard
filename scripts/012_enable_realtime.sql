-- Enable Realtime for tables that need live updates
-- This allows the application to receive real-time updates when data changes

-- Enable Realtime for phone_numbers table
ALTER PUBLICATION supabase_realtime ADD TABLE phone_numbers;

-- Enable Realtime for calls table
ALTER PUBLICATION supabase_realtime ADD TABLE calls;

-- Enable Realtime for cadences table
ALTER PUBLICATION supabase_realtime ADD TABLE cadences;

-- Enable Realtime for reputation_logs table
ALTER PUBLICATION supabase_realtime ADD TABLE reputation_logs;

-- Enable Realtime for integrations table (for API key changes)
ALTER PUBLICATION supabase_realtime ADD TABLE integrations;

-- Optional: Enable Row Level Security (RLS) for better security
-- This ensures users only see their own data in real-time updates

-- Enable RLS on phone_numbers
ALTER TABLE phone_numbers ENABLE ROW LEVEL SECURITY;

-- Enable RLS on calls
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

-- Enable RLS on cadences
ALTER TABLE cadences ENABLE ROW LEVEL SECURITY;

-- Enable RLS on reputation_logs
ALTER TABLE reputation_logs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on integrations
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Create policies to ensure users only see their own data
-- Phone numbers policy
CREATE POLICY "Users can only see their own phone numbers" ON phone_numbers
  FOR ALL USING (auth.uid() = user_id);

-- Calls policy
CREATE POLICY "Users can only see their own calls" ON calls
  FOR ALL USING (auth.uid() = user_id);

-- Cadences policy
CREATE POLICY "Users can only see their own cadences" ON cadences
  FOR ALL USING (auth.uid() = user_id);

-- Reputation logs policy
CREATE POLICY "Users can only see their own reputation logs" ON reputation_logs
  FOR ALL USING (auth.uid() = user_id);

-- Integrations policy
CREATE POLICY "Users can only see their own integrations" ON integrations
  FOR ALL USING (auth.uid() = user_id);
