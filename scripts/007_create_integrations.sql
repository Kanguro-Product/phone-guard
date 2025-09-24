-- Integrations table to store per-user API credentials for external providers
create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  provider text not null, -- e.g., 'twilio', 'nexmo', 'truecaller', etc.
  api_key text not null,
  enabled boolean not null default true,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, provider)
);

-- RLS
alter table public.integrations enable row level security;

-- Policies: a user can see/manage only their own integrations
create policy "integrations_select_own" on public.integrations for select using (auth.uid() = user_id);
create policy "integrations_insert_own" on public.integrations for insert with check (auth.uid() = user_id);
create policy "integrations_update_own" on public.integrations for update using (auth.uid() = user_id);
create policy "integrations_delete_own" on public.integrations for delete using (auth.uid() = user_id);

-- Trigger to auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_integrations_updated_at on public.integrations;
create trigger set_integrations_updated_at
before update on public.integrations
for each row execute function public.set_updated_at();

-- Helpful index
create index if not exists idx_integrations_user_provider on public.integrations(user_id, provider);


