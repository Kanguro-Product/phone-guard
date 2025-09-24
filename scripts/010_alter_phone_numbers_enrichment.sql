-- Enrichment columns for phone numbers (from Numverify/Hiya)
alter table if exists public.phone_numbers
  add column if not exists carrier text,
  add column if not exists line_type text,
  add column if not exists country_code text,
  add column if not exists country_name text,
  add column if not exists location text;

create index if not exists idx_phone_numbers_carrier on public.phone_numbers(carrier);
create index if not exists idx_phone_numbers_line_type on public.phone_numbers(line_type);

