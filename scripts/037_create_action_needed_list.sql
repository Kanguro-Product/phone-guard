-- Create Action Needed predefined list for all users
-- This list will contain numbers that need attention based on time since last checkpoint

-- Function to ensure Action Needed list exists for a user
CREATE OR REPLACE FUNCTION ensure_action_needed_list_for_user(user_id UUID)
RETURNS UUID AS $$
DECLARE
    list_id UUID;
BEGIN
    -- Check if Action Needed list already exists for this user
    SELECT id INTO list_id
    FROM number_lists
    WHERE user_id = ensure_action_needed_list_for_user.user_id
    AND list_type = 'action_needed'
    AND is_system_list = true;
    
    -- If it doesn't exist, create it
    IF list_id IS NULL THEN
        INSERT INTO number_lists (
            user_id,
            name,
            description,
            color,
            icon,
            is_default,
            is_system_list,
            list_type,
            created_at,
            updated_at
        ) VALUES (
            ensure_action_needed_list_for_user.user_id,
            'Action Needed',
            'Numbers that need attention based on time since last checkpoint',
            '#FFD700', -- Yellow color
            '⚠️',
            false,
            true,
            'action_needed',
            NOW(),
            NOW()
        ) RETURNING id INTO list_id;
    END IF;
    
    RETURN list_id;
END;
$$ LANGUAGE plpgsql;

-- Create Action Needed list for all existing users
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id FROM auth.users LOOP
        PERFORM ensure_action_needed_list_for_user(user_record.id);
    END LOOP;
END $$;

-- Create trigger to automatically create Action Needed list for new users
CREATE OR REPLACE FUNCTION create_action_needed_list_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM ensure_action_needed_list_for_user(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists and create new one
DROP TRIGGER IF EXISTS trigger_create_action_needed_list ON auth.users;
CREATE TRIGGER trigger_create_action_needed_list
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_action_needed_list_for_new_user();

-- Add configuration table for Action Needed rules
CREATE TABLE IF NOT EXISTS action_needed_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    hours_threshold INTEGER NOT NULL DEFAULT 24 CHECK (hours_threshold > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS for action_needed_config table
ALTER TABLE action_needed_config ENABLE ROW LEVEL SECURITY;

-- RLS policies for action_needed_config
CREATE POLICY "action_needed_config_select_own" ON action_needed_config FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "action_needed_config_insert_own" ON action_needed_config FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "action_needed_config_update_own" ON action_needed_config FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "action_needed_config_delete_own" ON action_needed_config FOR DELETE USING (auth.uid() = user_id);

-- Create default configuration for all existing users
INSERT INTO action_needed_config (user_id, hours_threshold)
SELECT id, 24 FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Function to get numbers that need action based on configuration
CREATE OR REPLACE FUNCTION get_action_needed_numbers(user_id UUID)
RETURNS TABLE(phone_number_id UUID) AS $$
DECLARE
    threshold_hours INTEGER;
BEGIN
    -- Get user's threshold configuration
    SELECT hours_threshold INTO threshold_hours
    FROM action_needed_config
    WHERE action_needed_config.user_id = get_action_needed_numbers.user_id;
    
    -- Default to 24 hours if no configuration found
    IF threshold_hours IS NULL THEN
        threshold_hours := 24;
    END IF;
    
    -- Return numbers that haven't been checked in the threshold time
    RETURN QUERY
    SELECT pn.id
    FROM phone_numbers pn
    WHERE pn.user_id = get_action_needed_numbers.user_id
    AND (
        pn.last_checked IS NULL 
        OR pn.last_checked < (NOW() - INTERVAL '1 hour' * threshold_hours)
    )
    AND pn.status != 'deprecated';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
