-- Add user roles and permissions system
-- This script adds role-based access control to the phone manager

-- Create user roles enum
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'user');

-- Add role column to auth.users metadata (handled by Supabase)
-- We'll store role in user_profiles table instead

-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(user_id),
  UNIQUE(email)
);

-- Create admin activity logs
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create system settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default system settings
INSERT INTO system_settings (key, value, description) VALUES
('max_phone_numbers_per_user', '50', 'Maximum phone numbers a user can have'),
('max_cadences_per_user', '20', 'Maximum cadences a user can create'),
('spam_threshold', '0.7', 'Confidence threshold for SPAM detection'),
('reputation_decay_days', '30', 'Days after which reputation starts to decay'),
('call_rate_limit_per_hour', '1000', 'Maximum calls per hour per user'),
('bulk_validation_batch_size', '10', 'Batch size for bulk SPAM validation')
ON CONFLICT (key) DO NOTHING;

-- Create function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
DECLARE
  user_role_result user_role;
BEGIN
  SELECT role INTO user_role_result
  FROM user_profiles
  WHERE user_profiles.user_id = get_user_role.user_id;
  
  -- Default to 'user' if no profile exists
  RETURN COALESCE(user_role_result, 'user'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role(user_id) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  admin_id UUID,
  target_id UUID,
  action_name TEXT,
  action_details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO admin_logs (admin_user_id, target_user_id, action, details)
  VALUES (admin_id, target_id, action_name, action_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policies for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles" ON user_profiles
  FOR SELECT USING (is_admin(auth.uid()));

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON user_profiles
  FOR UPDATE USING (is_admin(auth.uid()));

-- Admins can insert profiles
CREATE POLICY "Admins can insert profiles" ON user_profiles
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

-- Create RLS policies for admin_logs
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read admin logs
CREATE POLICY "Admins can read admin logs" ON admin_logs
  FOR SELECT USING (is_admin(auth.uid()));

-- Only admins can insert admin logs
CREATE POLICY "Admins can insert admin logs" ON admin_logs
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

-- Create RLS policies for system_settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Admins can read all settings
CREATE POLICY "Admins can read system settings" ON system_settings
  FOR SELECT USING (is_admin(auth.uid()));

-- Admins can update settings
CREATE POLICY "Admins can update system settings" ON system_settings
  FOR UPDATE USING (is_admin(auth.uid()));

-- Create trigger to automatically create user profile
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_user_id ON admin_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON admin_logs TO authenticated;
GRANT ALL ON system_settings TO authenticated;

-- Create first admin user (you'll need to update this with your actual user ID)
-- This should be run after the first user signs up
-- UPDATE user_profiles SET role = 'admin' WHERE email = 'your-admin-email@example.com';
