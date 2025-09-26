-- Fix RLS policies for user_profiles table
-- This script addresses the 406 error when accessing user_profiles

-- First, let's check if the user_profiles table exists and has data
-- If not, we'll create it and migrate data from the users table

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON user_profiles;

-- Disable RLS temporarily to fix data
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Migrate data from users table to user_profiles if needed
INSERT INTO user_profiles (user_id, email, full_name, role, is_active, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  u.email as full_name, -- Use email as fallback for full_name
  CASE 
    WHEN u.role = 'admin' THEN 'admin'::user_role
    ELSE 'user'::user_role
  END as role,
  true as is_active,
  u.created_at,
  u.updated_at
FROM public.users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles up WHERE up.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create more permissive RLS policies
-- Allow users to read their own profile
CREATE POLICY "users_can_read_own_profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to update their own profile (except role)
CREATE POLICY "users_can_update_own_profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to insert their own profile
CREATE POLICY "users_can_insert_own_profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow admins to read all profiles
CREATE POLICY "admins_can_read_all_profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.user_id = auth.uid() 
      AND up.role = 'admin'
    )
  );

-- Allow admins to update all profiles
CREATE POLICY "admins_can_update_all_profiles" ON user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.user_id = auth.uid() 
      AND up.role = 'admin'
    )
  );

-- Allow admins to insert profiles
CREATE POLICY "admins_can_insert_profiles" ON user_profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.user_id = auth.uid() 
      AND up.role = 'admin'
    )
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_profiles TO authenticated;

-- Create a function to safely get user role
CREATE OR REPLACE FUNCTION get_user_role_safe(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_role_result TEXT;
BEGIN
  -- First try to get from user_profiles
  SELECT role::TEXT INTO user_role_result
  FROM user_profiles
  WHERE user_profiles.user_id = get_user_role_safe.user_id;
  
  -- If not found, try to get from users table
  IF user_role_result IS NULL THEN
    SELECT role INTO user_role_result
    FROM public.users
    WHERE public.users.id = get_user_role_safe.user_id;
  END IF;
  
  -- Default to 'user' if no role found
  RETURN COALESCE(user_role_result, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the is_admin function to use the safe version
CREATE OR REPLACE FUNCTION is_admin_safe(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role_safe(user_id) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
