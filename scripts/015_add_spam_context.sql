-- Add spam context and rotation protocol fields to phone_numbers table

-- Add spam context fields
ALTER TABLE public.phone_numbers
ADD COLUMN spam_reason TEXT,
ADD COLUMN spam_detected_by TEXT, -- 'api', 'user', 'automatic'
ADD COLUMN spam_detected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN spam_context JSONB, -- Additional context data
ADD COLUMN rotation_protocol TEXT DEFAULT 'immediate', -- 'immediate', 'scheduled', 'manual'
ADD COLUMN rotation_scheduled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN rotation_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN spam_resolved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN spam_resolution_reason TEXT;

-- Create spam_events table for tracking spam history
CREATE TABLE IF NOT EXISTS public.spam_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number_id UUID NOT NULL REFERENCES public.phone_numbers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'detected', 'resolved', 'rotation_started', 'rotation_completed'
    reason TEXT,
    detected_by TEXT, -- 'api', 'user', 'automatic'
    context JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_reason TEXT
);

-- Create rotation_queue table for managing number rotations
CREATE TABLE IF NOT EXISTS public.rotation_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number_id UUID NOT NULL REFERENCES public.phone_numbers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rotation_type TEXT NOT NULL, -- 'spam_rotation', 'scheduled_rotation', 'manual_rotation'
    priority INTEGER DEFAULT 1, -- 1=high, 2=medium, 3=low
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
    error_message TEXT,
    context JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_phone_numbers_spam_status ON public.phone_numbers(status) WHERE status = 'spam';
CREATE INDEX IF NOT EXISTS idx_phone_numbers_rotation_protocol ON public.phone_numbers(rotation_protocol);
CREATE INDEX IF NOT EXISTS idx_spam_events_phone_number_id ON public.spam_events(phone_number_id);
CREATE INDEX IF NOT EXISTS idx_spam_events_user_id ON public.spam_events(user_id);
CREATE INDEX IF NOT EXISTS idx_rotation_queue_user_id ON public.rotation_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_rotation_queue_status ON public.rotation_queue(status);
CREATE INDEX IF NOT EXISTS idx_rotation_queue_scheduled_at ON public.rotation_queue(scheduled_at);

-- Enable RLS
ALTER TABLE public.spam_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rotation_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for spam_events
CREATE POLICY "Users can view their own spam events" ON public.spam_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own spam events" ON public.spam_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own spam events" ON public.spam_events
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for rotation_queue
CREATE POLICY "Users can view their own rotation queue" ON public.rotation_queue
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rotation queue" ON public.rotation_queue
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rotation queue" ON public.rotation_queue
    FOR UPDATE USING (auth.uid() = user_id);

-- Create function to automatically create spam event when number is marked as spam
CREATE OR REPLACE FUNCTION create_spam_event()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create event if status changed to spam
    IF NEW.status = 'spam' AND (OLD.status IS NULL OR OLD.status != 'spam') THEN
        INSERT INTO public.spam_events (
            phone_number_id,
            user_id,
            event_type,
            reason,
            detected_by,
            context
        ) VALUES (
            NEW.id,
            NEW.user_id,
            'detected',
            NEW.spam_reason,
            NEW.spam_detected_by,
            NEW.spam_context
        );
        
        -- Add to rotation queue if protocol is immediate
        IF NEW.rotation_protocol = 'immediate' THEN
            INSERT INTO public.rotation_queue (
                phone_number_id,
                user_id,
                rotation_type,
                priority,
                context
            ) VALUES (
                NEW.id,
                NEW.user_id,
                'spam_rotation',
                1, -- High priority for spam
                jsonb_build_object(
                    'spam_reason', NEW.spam_reason,
                    'detected_by', NEW.spam_detected_by,
                    'original_status', OLD.status
                )
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for spam events
DROP TRIGGER IF EXISTS trigger_create_spam_event ON public.phone_numbers;
CREATE TRIGGER trigger_create_spam_event
    AFTER UPDATE ON public.phone_numbers
    FOR EACH ROW
    EXECUTE FUNCTION create_spam_event();

-- Create function to resolve spam events
CREATE OR REPLACE FUNCTION resolve_spam_event()
RETURNS TRIGGER AS $$
BEGIN
    -- Only resolve if status changed from spam
    IF OLD.status = 'spam' AND NEW.status != 'spam' THEN
        INSERT INTO public.spam_events (
            phone_number_id,
            user_id,
            event_type,
            reason,
            detected_by,
            context,
            resolved_at,
            resolution_reason
        ) VALUES (
            NEW.id,
            NEW.user_id,
            'resolved',
            NEW.spam_resolution_reason,
            'user',
            jsonb_build_object(
                'new_status', NEW.status,
                'resolved_at', NOW()
            ),
            NOW(),
            NEW.spam_resolution_reason
        );
        
        -- Update the original spam event
        UPDATE public.spam_events 
        SET resolved_at = NOW(), resolution_reason = NEW.spam_resolution_reason
        WHERE phone_number_id = NEW.id 
        AND event_type = 'detected' 
        AND resolved_at IS NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for spam resolution
DROP TRIGGER IF EXISTS trigger_resolve_spam_event ON public.phone_numbers;
CREATE TRIGGER trigger_resolve_spam_event
    AFTER UPDATE ON public.phone_numbers
    FOR EACH ROW
    EXECUTE FUNCTION resolve_spam_event();
