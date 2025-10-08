-- ============================================
-- FIX USER_PROFILES RLS POLICIES (WITH EMAIL)
-- Version: 1.0
-- Date: 2025-10-08
-- Purpose: Fix 406 Not Acceptable error on user_profiles table
-- ============================================

-- First, let's see what columns exist in user_profiles
DO $$
DECLARE
    table_exists BOOLEAN;
    has_email_column BOOLEAN;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_profiles' AND table_schema = 'public'
    ) INTO table_exists;
    
    IF table_exists THEN
        -- Check if email column exists
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'user_profiles' 
            AND column_name = 'email' 
            AND table_schema = 'public'
        ) INTO has_email_column;
        
        RAISE NOTICE 'Table user_profiles exists: %', table_exists;
        RAISE NOTICE 'Has email column: %', has_email_column;
    END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "user_profiles_select_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_all" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_service" ON public.user_profiles;

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

-- Create or update user profiles for existing users (with email)
INSERT INTO public.user_profiles (id, user_id, email, role)
SELECT 
    u.id,
    u.id as user_id,
    u.email,
    COALESCE(up.role, 'user') as role
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
WHERE up.user_id IS NULL
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

-- Update existing profiles with missing emails
UPDATE public.user_profiles 
SET email = auth.users.email
FROM auth.users
WHERE public.user_profiles.user_id = auth.users.id 
AND public.user_profiles.email IS NULL;

-- Create function to ensure user profile exists (with email)
CREATE OR REPLACE FUNCTION ensure_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, user_id, email, role)
    VALUES (NEW.id, NEW.id, NEW.email, 'user')
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
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
    RAISE NOTICE '📧 Email column handled properly';
    RAISE NOTICE '🚀 Ready to fix 406 error!';
END $$;
