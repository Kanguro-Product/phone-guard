-- Add api_secret column for integrations that require key+secret (e.g., Vonage, Hiya)
alter table if exists public.integrations
  add column if not exists api_secret text;


