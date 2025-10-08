-- ============================================
-- FIX USER_PROFILES RLS POLICIES
-- Version: 1.0
-- Date: 2025-10-08
-- Purpose: Fix 406 Not Acceptable error on user_profiles table
-- ============================================

-- Check if user_profiles table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public') THEN
        RAISE NOTICE 'Table user_profiles does not exist. Creating it...';
        
        -- Create user_profiles table
        CREATE TABLE public.user_profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Create index
        CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);
        
        -- Enable RLS
        ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE '✅ user_profiles table created successfully!';
    ELSE
        RAISE NOTICE '✅ user_profiles table already exists';
    END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "user_profiles_select_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_all" ON public.user_profiles;

-- Create new RLS policies
CREATE POLICY "user_profiles_select_own" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_profiles_insert_own" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_profiles_update_own" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow service role to read all profiles (for admin functionality)
CREATE POLICY "user_profiles_select_service" ON public.user_profiles
    FOR SELECT USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;

-- Create or update user profiles for existing users
INSERT INTO public.user_profiles (id, user_id, role)
SELECT 
    u.id,
    u.id as user_id,
    'user' as role
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
WHERE up.user_id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Create function to ensure user profile exists
CREATE OR REPLACE FUNCTION ensure_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, user_id, role)
    VALUES (NEW.id, NEW.id, 'user')
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create user profile
DROP TRIGGER IF EXISTS trigger_ensure_user_profile ON auth.users;
CREATE TRIGGER trigger_ensure_user_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION ensure_user_profile();

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ user_profiles RLS policies fixed!';
    RAISE NOTICE '🔒 Policies: user_profiles_select_own, user_profiles_insert_own, user_profiles_update_own, user_profiles_select_service';
    RAISE NOTICE '🚀 Ready to fix 406 error!';
END $$;
