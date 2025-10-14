-- A/B Tests Database Schema
-- Creates all necessary tables for the A/B Caller Tool

-- Main A/B tests table
CREATE TABLE IF NOT EXISTS ab_tests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    test_id VARCHAR(255) UNIQUE NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    config JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    paused_at TIMESTAMP WITH TIME ZONE,
    stopped_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A/B test call metrics
CREATE TABLE IF NOT EXISTS ab_test_call_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    test_id VARCHAR(255) NOT NULL,
    call_id VARCHAR(255) NOT NULL,
    lead_id VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    group_name VARCHAR(10) NOT NULL CHECK (group_name IN ('A', 'B')),
    cli VARCHAR(50) NOT NULL,
    attempt_number INTEGER NOT NULL,
    outcome VARCHAR(50) NOT NULL,
    duration INTEGER DEFAULT 0,
    provider_call_id VARCHAR(255),
    spam_internal_score DECIMAL(5,2),
    spam_internal_labels JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
);

-- A/B test aggregated metrics
CREATE TABLE IF NOT EXISTS ab_test_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    test_id VARCHAR(255) NOT NULL,
    group_name VARCHAR(10) CHECK (group_name IN ('A', 'B')),
    total_calls INTEGER DEFAULT 0,
    answered_calls INTEGER DEFAULT 0,
    failed_calls INTEGER DEFAULT 0,
    busy_calls INTEGER DEFAULT 0,
    rejected_calls INTEGER DEFAULT 0,
    voicemail_calls INTEGER DEFAULT 0,
    spam_blocked_calls INTEGER DEFAULT 0,
    answer_rate DECIMAL(5,2) DEFAULT 0,
    connect_rate DECIMAL(5,2) DEFAULT 0,
    spam_block_rate DECIMAL(5,2) DEFAULT 0,
    average_duration DECIMAL(10,2) DEFAULT 0,
    total_duration INTEGER DEFAULT 0,
    spam_flags INTEGER DEFAULT 0,
    hangup_rate DECIMAL(5,2) DEFAULT 0,
    leads_contacted INTEGER DEFAULT 0,
    leads_answered INTEGER DEFAULT 0,
    callbacks_2h INTEGER DEFAULT 0,
    callbacks_24h INTEGER DEFAULT 0,
    time_window_start TIMESTAMP WITH TIME ZONE,
    time_window_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice events from Vonage webhooks
CREATE TABLE IF NOT EXISTS ab_test_voice_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    call_id VARCHAR(255) NOT NULL,
    conversation_id VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    direction VARCHAR(20),
    from_number VARCHAR(50),
    to_number VARCHAR(50),
    duration INTEGER DEFAULT 0,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    rate DECIMAL(10,4),
    price DECIMAL(10,4),
    network VARCHAR(100),
    raw_event JSONB,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WhatsApp events from Meta webhooks
CREATE TABLE IF NOT EXISTS ab_test_whatsapp_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id VARCHAR(255) NOT NULL,
    from_number VARCHAR(50) NOT NULL,
    to_number VARCHAR(50),
    event_type VARCHAR(50) NOT NULL,
    message_type VARCHAR(50),
    message_text TEXT,
    button_payload VARCHAR(255),
    status VARCHAR(50),
    timestamp BIGINT,
    status_timestamp BIGINT,
    raw_event JSONB,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Callbacks and responses
CREATE TABLE IF NOT EXISTS ab_test_callbacks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    test_id VARCHAR(255) NOT NULL,
    lead_id VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    callback_type VARCHAR(50) NOT NULL,
    callback_payload VARCHAR(255),
    callback_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spam snapshots for monitoring
CREATE TABLE IF NOT EXISTS ab_test_spam_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    test_id VARCHAR(255) NOT NULL,
    snapshot_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_calls INTEGER DEFAULT 0,
    spam_flags INTEGER DEFAULT 0,
    spam_rate DECIMAL(5,2) DEFAULT 0,
    answer_rate DECIMAL(5,2) DEFAULT 0,
    hangup_rate DECIMAL(5,2) DEFAULT 0,
    spam_internal_score DECIMAL(5,2),
    spam_internal_labels JSONB,
    metadata JSONB
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ab_tests_test_id ON ab_tests(test_id);
CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON ab_tests(status);
CREATE INDEX IF NOT EXISTS idx_ab_tests_created_by ON ab_tests(created_by);
CREATE INDEX IF NOT EXISTS idx_ab_tests_created_at ON ab_tests(created_at);

CREATE INDEX IF NOT EXISTS idx_call_metrics_test_id ON ab_test_call_metrics(test_id);
CREATE INDEX IF NOT EXISTS idx_call_metrics_lead_id ON ab_test_call_metrics(lead_id);
CREATE INDEX IF NOT EXISTS idx_call_metrics_group ON ab_test_call_metrics(group_name);
CREATE INDEX IF NOT EXISTS idx_call_metrics_outcome ON ab_test_call_metrics(outcome);
CREATE INDEX IF NOT EXISTS idx_call_metrics_created_at ON ab_test_call_metrics(created_at);

CREATE INDEX IF NOT EXISTS idx_test_metrics_test_id ON ab_test_metrics(test_id);
CREATE INDEX IF NOT EXISTS idx_test_metrics_group ON ab_test_metrics(group_name);
CREATE INDEX IF NOT EXISTS idx_test_metrics_created_at ON ab_test_metrics(created_at);

CREATE INDEX IF NOT EXISTS idx_voice_events_call_id ON ab_test_voice_events(call_id);
CREATE INDEX IF NOT EXISTS idx_voice_events_status ON ab_test_voice_events(status);
CREATE INDEX IF NOT EXISTS idx_voice_events_received_at ON ab_test_voice_events(received_at);

CREATE INDEX IF NOT EXISTS idx_whatsapp_events_message_id ON ab_test_whatsapp_events(message_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_events_from_number ON ab_test_whatsapp_events(from_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_events_event_type ON ab_test_whatsapp_events(event_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_events_received_at ON ab_test_whatsapp_events(received_at);

CREATE INDEX IF NOT EXISTS idx_callbacks_test_id ON ab_test_callbacks(test_id);
CREATE INDEX IF NOT EXISTS idx_callbacks_lead_id ON ab_test_callbacks(lead_id);
CREATE INDEX IF NOT EXISTS idx_callbacks_phone ON ab_test_callbacks(phone);
CREATE INDEX IF NOT EXISTS idx_callbacks_created_at ON ab_test_callbacks(created_at);

CREATE INDEX IF NOT EXISTS idx_spam_snapshots_test_id ON ab_test_spam_snapshots(test_id);
CREATE INDEX IF NOT EXISTS idx_spam_snapshots_snapshot_time ON ab_test_spam_snapshots(snapshot_time);

-- Row Level Security (RLS) policies
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_call_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_voice_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_whatsapp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_callbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_spam_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS policies for ab_tests
CREATE POLICY "Users can view their own tests" ON ab_tests
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own tests" ON ab_tests
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own tests" ON ab_tests
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own tests" ON ab_tests
    FOR DELETE USING (auth.uid() = created_by);

-- RLS policies for ab_test_call_metrics
CREATE POLICY "Users can view metrics for their tests" ON ab_test_call_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ab_tests 
            WHERE ab_tests.test_id = ab_test_call_metrics.test_id 
            AND ab_tests.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can insert metrics for their tests" ON ab_test_call_metrics
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM ab_tests 
            WHERE ab_tests.test_id = ab_test_call_metrics.test_id 
            AND ab_tests.created_by = auth.uid()
        )
    );

-- RLS policies for ab_test_metrics
CREATE POLICY "Users can view aggregated metrics for their tests" ON ab_test_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ab_tests 
            WHERE ab_tests.test_id = ab_test_metrics.test_id 
            AND ab_tests.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can insert aggregated metrics for their tests" ON ab_test_metrics
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM ab_tests 
            WHERE ab_tests.test_id = ab_test_metrics.test_id 
            AND ab_tests.created_by = auth.uid()
        )
    );

-- RLS policies for voice events
CREATE POLICY "Users can view voice events for their tests" ON ab_test_voice_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ab_test_call_metrics 
            JOIN ab_tests ON ab_tests.test_id = ab_test_call_metrics.test_id
            WHERE ab_test_call_metrics.provider_call_id = ab_test_voice_events.call_id
            AND ab_tests.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can insert voice events for their tests" ON ab_test_voice_events
    FOR INSERT WITH CHECK (true); -- Webhook events are inserted by the system

-- RLS policies for WhatsApp events
CREATE POLICY "Users can view WhatsApp events for their tests" ON ab_test_whatsapp_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ab_test_callbacks 
            JOIN ab_tests ON ab_tests.test_id = ab_test_callbacks.test_id
            WHERE ab_test_callbacks.phone = ab_test_whatsapp_events.from_number
            AND ab_tests.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can insert WhatsApp events for their tests" ON ab_test_whatsapp_events
    FOR INSERT WITH CHECK (true); -- Webhook events are inserted by the system

-- RLS policies for callbacks
CREATE POLICY "Users can view callbacks for their tests" ON ab_test_callbacks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ab_tests 
            WHERE ab_tests.test_id = ab_test_callbacks.test_id 
            AND ab_tests.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can insert callbacks for their tests" ON ab_test_callbacks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM ab_tests 
            WHERE ab_tests.test_id = ab_test_callbacks.test_id 
            AND ab_tests.created_by = auth.uid()
        )
    );

-- RLS policies for spam snapshots
CREATE POLICY "Users can view spam snapshots for their tests" ON ab_test_spam_snapshots
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ab_tests 
            WHERE ab_tests.test_id = ab_test_spam_snapshots.test_id 
            AND ab_tests.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can insert spam snapshots for their tests" ON ab_test_spam_snapshots
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM ab_tests 
            WHERE ab_tests.test_id = ab_test_spam_snapshots.test_id 
            AND ab_tests.created_by = auth.uid()
        )
    );

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_ab_tests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ab_tests_updated_at
    BEFORE UPDATE ON ab_tests
    FOR EACH ROW
    EXECUTE FUNCTION update_ab_tests_updated_at();

CREATE TRIGGER trigger_update_ab_test_metrics_updated_at
    BEFORE UPDATE ON ab_test_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_ab_tests_updated_at();

-- Function to automatically update aggregated metrics
CREATE OR REPLACE FUNCTION update_ab_test_aggregated_metrics()
RETURNS TRIGGER AS $$
DECLARE
    test_exists BOOLEAN;
BEGIN
    -- Check if test exists
    SELECT EXISTS(SELECT 1 FROM ab_tests WHERE test_id = NEW.test_id) INTO test_exists;
    
    IF NOT test_exists THEN
        RAISE EXCEPTION 'Test % does not exist', NEW.test_id;
    END IF;
    
    -- Update aggregated metrics for the test and group
    INSERT INTO ab_test_metrics (
        test_id,
        group_name,
        total_calls,
        answered_calls,
        failed_calls,
        busy_calls,
        rejected_calls,
        voicemail_calls,
        spam_blocked_calls,
        answer_rate,
        connect_rate,
        spam_block_rate,
        average_duration,
        total_duration,
        spam_flags,
        hangup_rate,
        leads_contacted,
        leads_answered,
        time_window_start,
        time_window_end
    )
    SELECT 
        NEW.test_id,
        NEW.group_name,
        COUNT(*) as total_calls,
        COUNT(*) FILTER (WHERE outcome = 'answered') as answered_calls,
        COUNT(*) FILTER (WHERE outcome = 'failed') as failed_calls,
        COUNT(*) FILTER (WHERE outcome = 'busy') as busy_calls,
        COUNT(*) FILTER (WHERE outcome = 'rejected') as rejected_calls,
        COUNT(*) FILTER (WHERE outcome = 'voicemail') as voicemail_calls,
        COUNT(*) FILTER (WHERE outcome = 'spam_blocked') as spam_blocked_calls,
        CASE 
            WHEN COUNT(*) > 0 THEN (COUNT(*) FILTER (WHERE outcome = 'answered')::DECIMAL / COUNT(*)) * 100
            ELSE 0
        END as answer_rate,
        CASE 
            WHEN COUNT(*) > 0 THEN ((COUNT(*) FILTER (WHERE outcome = 'answered') + COUNT(*) FILTER (WHERE outcome = 'voicemail'))::DECIMAL / COUNT(*)) * 100
            ELSE 0
        END as connect_rate,
        CASE 
            WHEN COUNT(*) > 0 THEN (COUNT(*) FILTER (WHERE outcome = 'spam_blocked')::DECIMAL / COUNT(*)) * 100
            ELSE 0
        END as spam_block_rate,
        CASE 
            WHEN COUNT(*) FILTER (WHERE outcome = 'answered') > 0 THEN AVG(duration) FILTER (WHERE outcome = 'answered')
            ELSE 0
        END as average_duration,
        SUM(duration) as total_duration,
        COUNT(*) FILTER (WHERE spam_internal_labels IS NOT NULL AND jsonb_array_length(spam_internal_labels) > 0) as spam_flags,
        CASE 
            WHEN COUNT(*) FILTER (WHERE outcome = 'answered') > 0 THEN (COUNT(*) FILTER (WHERE outcome = 'answered' AND duration < 10)::DECIMAL / COUNT(*) FILTER (WHERE outcome = 'answered')) * 100
            ELSE 0
        END as hangup_rate,
        COUNT(DISTINCT lead_id) as leads_contacted,
        COUNT(DISTINCT lead_id) FILTER (WHERE outcome = 'answered') as leads_answered,
        MIN(created_at) as time_window_start,
        MAX(created_at) as time_window_end
    FROM ab_test_call_metrics
    WHERE test_id = NEW.test_id AND group_name = NEW.group_name
    ON CONFLICT (test_id, group_name) DO UPDATE SET
        total_calls = EXCLUDED.total_calls,
        answered_calls = EXCLUDED.answered_calls,
        failed_calls = EXCLUDED.failed_calls,
        busy_calls = EXCLUDED.busy_calls,
        rejected_calls = EXCLUDED.rejected_calls,
        voicemail_calls = EXCLUDED.voicemail_calls,
        spam_blocked_calls = EXCLUDED.spam_blocked_calls,
        answer_rate = EXCLUDED.answer_rate,
        connect_rate = EXCLUDED.connect_rate,
        spam_block_rate = EXCLUDED.spam_block_rate,
        average_duration = EXCLUDED.average_duration,
        total_duration = EXCLUDED.total_duration,
        spam_flags = EXCLUDED.spam_flags,
        hangup_rate = EXCLUDED.hangup_rate,
        leads_contacted = EXCLUDED.leads_contacted,
        leads_answered = EXCLUDED.leads_answered,
        time_window_start = EXCLUDED.time_window_start,
        time_window_end = EXCLUDED.time_window_end,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_aggregated_metrics
    AFTER INSERT OR UPDATE ON ab_test_call_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_ab_test_aggregated_metrics();

-- Add unique constraint for aggregated metrics
ALTER TABLE ab_test_metrics ADD CONSTRAINT unique_test_group UNIQUE (test_id, group_name);
