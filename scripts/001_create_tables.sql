-- Create users table for authentication and user management
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS policies for users
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Create phone numbers table
CREATE TABLE IF NOT EXISTS public.phone_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked', 'spam')),
  reputation_score INTEGER DEFAULT 100 CHECK (reputation_score >= 0 AND reputation_score <= 100),
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  spam_reports INTEGER DEFAULT 0,
  successful_calls INTEGER DEFAULT 0,
  failed_calls INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE
);

-- Enable RLS for phone_numbers table
ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;

-- RLS policies for phone_numbers
CREATE POLICY "phone_numbers_select_own" ON public.phone_numbers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "phone_numbers_insert_own" ON public.phone_numbers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "phone_numbers_update_own" ON public.phone_numbers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "phone_numbers_delete_own" ON public.phone_numbers FOR DELETE USING (auth.uid() = user_id);

-- Create cadences table for A/B testing
CREATE TABLE IF NOT EXISTS public.cadences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  phone_numbers UUID[] NOT NULL, -- Array of phone number IDs
  rotation_strategy TEXT NOT NULL DEFAULT 'round_robin' CHECK (rotation_strategy IN ('round_robin', 'random', 'reputation_based')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE
);

-- Enable RLS for cadences table
ALTER TABLE public.cadences ENABLE ROW LEVEL SECURITY;

-- RLS policies for cadences
CREATE POLICY "cadences_select_own" ON public.cadences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cadences_insert_own" ON public.cadences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cadences_update_own" ON public.cadences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "cadences_delete_own" ON public.cadences FOR DELETE USING (auth.uid() = user_id);

-- Create calls table for logging
CREATE TABLE IF NOT EXISTS public.calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number_id UUID NOT NULL REFERENCES public.phone_numbers(id) ON DELETE CASCADE,
  cadence_id UUID REFERENCES public.cadences(id) ON DELETE SET NULL,
  destination_number TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'busy', 'no_answer', 'spam_detected')),
  duration INTEGER, -- in seconds
  cost DECIMAL(10,4), -- cost in currency units
  call_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB, -- additional call data
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE
);

-- Enable RLS for calls table
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

-- RLS policies for calls
CREATE POLICY "calls_select_own" ON public.calls FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "calls_insert_own" ON public.calls FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "calls_update_own" ON public.calls FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "calls_delete_own" ON public.calls FOR DELETE USING (auth.uid() = user_id);

-- Create reputation_logs table for tracking reputation changes
CREATE TABLE IF NOT EXISTS public.reputation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number_id UUID NOT NULL REFERENCES public.phone_numbers(id) ON DELETE CASCADE,
  old_score INTEGER NOT NULL,
  new_score INTEGER NOT NULL,
  reason TEXT NOT NULL,
  source TEXT NOT NULL, -- 'manual', 'api_check', 'call_result'
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE
);

-- Enable RLS for reputation_logs table
ALTER TABLE public.reputation_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for reputation_logs
CREATE POLICY "reputation_logs_select_own" ON public.reputation_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reputation_logs_insert_own" ON public.reputation_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_phone_numbers_user_id ON public.phone_numbers(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_status ON public.phone_numbers(status);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_reputation ON public.phone_numbers(reputation_score);
CREATE INDEX IF NOT EXISTS idx_calls_phone_number_id ON public.calls(phone_number_id);
CREATE INDEX IF NOT EXISTS idx_calls_user_id ON public.calls(user_id);
CREATE INDEX IF NOT EXISTS idx_calls_call_time ON public.calls(call_time);
CREATE INDEX IF NOT EXISTS idx_cadences_user_id ON public.cadences(user_id);
CREATE INDEX IF NOT EXISTS idx_reputation_logs_phone_number_id ON public.reputation_logs(phone_number_id);
