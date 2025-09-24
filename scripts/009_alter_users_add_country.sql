-- Add default country code per user for phone normalization (e.g., 'ES', 'US')
alter table if exists public.users
  add column if not exists default_country_code text;


