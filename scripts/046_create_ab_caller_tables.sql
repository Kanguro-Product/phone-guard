-- Create A/B Caller Tool tables
-- This script creates all necessary tables for the A/B Caller Tool functionality

-- 1. AB Tests table
CREATE TABLE IF NOT EXISTS ab_tests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    test_id VARCHAR(255) UNIQUE NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    test_description TEXT,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
    runtime_status VARCHAR(50) DEFAULT 'stopped' CHECK (runtime_status IN ('stopped', 'running', 'paused', 'completed')),
    
    -- Group configuration
    group_a_label VARCHAR(100) DEFAULT 'Group A',
    group_b_label VARCHAR(100) DEFAULT 'Group B',
    group_a_percentage INTEGER DEFAULT 50 CHECK (group_a_percentage >= 0 AND group_a_percentage <= 100),
    group_b_percentage INTEGER DEFAULT 50 CHECK (group_b_percentage >= 0 AND group_b_percentage <= 100),
    
    -- Number configuration
    number_config JSONB,
    
    -- Lead configuration
    leads JSONB DEFAULT '[]'::jsonb,
    
    -- Nudge configuration
    nudges JSONB DEFAULT '{
        "whatsapp": {
            "enabled": false,
            "trigger": "after_attempt_1_fail",
            "delay": 30,
            "template": "Hi {{name}}, we tried calling you but couldn't connect. Best time to reach you?",
            "timeRestrictions": {
                "start": "09:00",
                "end": "18:00"
            },
            "daysOfWeek": [1,2,3,4,5]
        },
        "email": {
            "enabled": false,
            "trigger": "after_attempt_2_fail",
            "delay": 60,
            "template": "Hi {{name}}, we tried reaching you. When is the best time to call?",
            "timeRestrictions": {
                "start": "09:00",
                "end": "18:00"
            },
            "daysOfWeek": [1,2,3,4,5]
        },
        "sms": {
            "enabled": false,
            "trigger": "after_attempt_3_fail",
            "delay": 90,
            "template": "Hi {{name}}, we tried calling you. Best time to reach you? Reply STOP to opt out.",
            "timeRestrictions": {
                "start": "09:00",
                "end": "18:00"
            },
            "daysOfWeek": [1,2,3,4,5]
        }
    }'::jsonb,
    
    -- Spam protection configuration
    spam_protection JSONB DEFAULT '{
        "enabled": true,
        "threshold": 0.7,
        "action": "block",
        "quality_gate": {
            "enabled": true,
            "min_score": 0.3,
            "max_score": 0.9
        }
    }'::jsonb,
    
    -- Compliance configuration
    compliance JSONB DEFAULT '{
        "gdpr_compliant": true,
        "opt_out_mechanism": true,
        "data_retention_days": 365,
        "call_hours": {
            "start": "09:00",
            "end": "18:00"
        },
        "allowed_days": [1,2,3,4,5]
    }'::jsonb,
    
    -- Test configuration
    config JSONB DEFAULT '{}'::jsonb,
    
    -- Metrics and results
    current_metrics JSONB DEFAULT '{}'::jsonb,
    final_results JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- User reference
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Indexes
    CONSTRAINT valid_percentages CHECK (group_a_percentage + group_b_percentage = 100)
);

-- 2. AB Test Leads table
CREATE TABLE IF NOT EXISTS ab_test_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    test_id UUID REFERENCES ab_tests(id) ON DELETE CASCADE,
    lead_id VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    group_assignment VARCHAR(10) NOT NULL CHECK (group_assignment IN ('A', 'B')),
    sector VARCHAR(100),
    province VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'converted', 'failed', 'opted_out')),
    
    -- Contact information
    contact_attempts INTEGER DEFAULT 0,
    last_contact_attempt TIMESTAMP WITH TIME ZONE,
    first_contact_at TIMESTAMP WITH TIME ZONE,
    converted_at TIMESTAMP WITH TIME ZONE,
    
    -- Spam scoring
    spam_internal_score DECIMAL(3,2),
    spam_internal_labels JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint
    UNIQUE(test_id, lead_id)
);

-- 3. AB Test Call Attempts table
CREATE TABLE IF NOT EXISTS ab_test_call_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    test_id UUID REFERENCES ab_tests(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES ab_test_leads(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL,
    
    -- Call details
    phone_number VARCHAR(20) NOT NULL,
    cli_number VARCHAR(20) NOT NULL,
    call_status VARCHAR(50) NOT NULL CHECK (call_status IN ('initiated', 'ringing', 'answered', 'voicemail', 'busy', 'no_answer', 'failed', 'blocked')),
    call_duration INTEGER DEFAULT 0, -- in seconds
    call_started_at TIMESTAMP WITH TIME ZONE,
    call_ended_at TIMESTAMP WITH TIME ZONE,
    
    -- Vonage integration
    vonage_call_id VARCHAR(255),
    vonage_status VARCHAR(50),
    vonage_recording_url TEXT,
    
    -- Spam check results
    spam_checked BOOLEAN DEFAULT FALSE,
    spam_score DECIMAL(3,2),
    spam_labels JSONB DEFAULT '[]'::jsonb,
    spam_action VARCHAR(50) CHECK (spam_action IN ('allow', 'block', 'flag')),
    
    -- Quality gate results
    quality_gate_passed BOOLEAN DEFAULT TRUE,
    quality_gate_reason TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    UNIQUE(test_id, lead_id, attempt_number)
);

-- 4. AB Test Nudges table
CREATE TABLE IF NOT EXISTS ab_test_nudges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    test_id UUID REFERENCES ab_tests(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES ab_test_leads(id) ON DELETE CASCADE,
    nudge_type VARCHAR(20) NOT NULL CHECK (nudge_type IN ('whatsapp', 'email', 'sms')),
    
    -- Nudge details
    trigger_reason VARCHAR(100) NOT NULL,
    message_template TEXT NOT NULL,
    personalized_message TEXT,
    
    -- Delivery details
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- External service IDs
    whatsapp_message_id VARCHAR(255),
    email_message_id VARCHAR(255),
    sms_message_id VARCHAR(255),
    
    -- Response tracking
    response_received BOOLEAN DEFAULT FALSE,
    response_text TEXT,
    response_received_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. AB Test Metrics table
CREATE TABLE IF NOT EXISTS ab_test_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    test_id UUID REFERENCES ab_tests(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    group_assignment VARCHAR(10) NOT NULL CHECK (group_assignment IN ('A', 'B', 'overall')),
    
    -- Metric values
    value DECIMAL(15,4) NOT NULL,
    percentage DECIMAL(5,2),
    count INTEGER,
    
    -- Statistical data
    confidence_interval_lower DECIMAL(15,4),
    confidence_interval_upper DECIMAL(15,4),
    p_value DECIMAL(10,6),
    statistical_significance BOOLEAN DEFAULT FALSE,
    
    -- Time period
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint
    UNIQUE(test_id, metric_type, metric_name, group_assignment, period_start)
);

-- 6. AB Test Events table (for audit trail)
CREATE TABLE IF NOT EXISTS ab_test_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    test_id UUID REFERENCES ab_tests(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_name VARCHAR(100) NOT NULL,
    event_data JSONB DEFAULT '{}'::jsonb,
    
    -- User who triggered the event
    triggered_by UUID REFERENCES auth.users(id),
    
    -- Event details
    description TEXT,
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON ab_tests(status);
CREATE INDEX IF NOT EXISTS idx_ab_tests_created_by ON ab_tests(created_by);
CREATE INDEX IF NOT EXISTS idx_ab_tests_created_at ON ab_tests(created_at);

CREATE INDEX IF NOT EXISTS idx_ab_test_leads_test_id ON ab_test_leads(test_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_leads_group_assignment ON ab_test_leads(group_assignment);
CREATE INDEX IF NOT EXISTS idx_ab_test_leads_status ON ab_test_leads(status);
CREATE INDEX IF NOT EXISTS idx_ab_test_leads_phone ON ab_test_leads(phone);

CREATE INDEX IF NOT EXISTS idx_ab_test_call_attempts_test_id ON ab_test_call_attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_call_attempts_lead_id ON ab_test_call_attempts(lead_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_call_attempts_call_status ON ab_test_call_attempts(call_status);
CREATE INDEX IF NOT EXISTS idx_ab_test_call_attempts_created_at ON ab_test_call_attempts(created_at);

CREATE INDEX IF NOT EXISTS idx_ab_test_nudges_test_id ON ab_test_nudges(test_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_nudges_lead_id ON ab_test_nudges(lead_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_nudges_nudge_type ON ab_test_nudges(nudge_type);
CREATE INDEX IF NOT EXISTS idx_ab_test_nudges_status ON ab_test_nudges(status);

CREATE INDEX IF NOT EXISTS idx_ab_test_metrics_test_id ON ab_test_metrics(test_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_metrics_metric_type ON ab_test_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_ab_test_metrics_group_assignment ON ab_test_metrics(group_assignment);

CREATE INDEX IF NOT EXISTS idx_ab_test_events_test_id ON ab_test_events(test_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_events_event_type ON ab_test_events(event_type);
CREATE INDEX IF NOT EXISTS idx_ab_test_events_created_at ON ab_test_events(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_ab_tests_updated_at BEFORE UPDATE ON ab_tests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ab_test_leads_updated_at BEFORE UPDATE ON ab_test_leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ab_test_call_attempts_updated_at BEFORE UPDATE ON ab_test_call_attempts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ab_test_nudges_updated_at BEFORE UPDATE ON ab_test_nudges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ab_test_metrics_updated_at BEFORE UPDATE ON ab_test_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_call_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_nudges ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own ab_tests" ON ab_tests FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Users can insert their own ab_tests" ON ab_tests FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own ab_tests" ON ab_tests FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own ab_tests" ON ab_tests FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Users can view ab_test_leads for their tests" ON ab_test_leads FOR SELECT USING (
    EXISTS (SELECT 1 FROM ab_tests WHERE ab_tests.id = ab_test_leads.test_id AND ab_tests.created_by = auth.uid())
);
CREATE POLICY "Users can insert ab_test_leads for their tests" ON ab_test_leads FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM ab_tests WHERE ab_tests.id = ab_test_leads.test_id AND ab_tests.created_by = auth.uid())
);
CREATE POLICY "Users can update ab_test_leads for their tests" ON ab_test_leads FOR UPDATE USING (
    EXISTS (SELECT 1 FROM ab_tests WHERE ab_tests.id = ab_test_leads.test_id AND ab_tests.created_by = auth.uid())
);
CREATE POLICY "Users can delete ab_test_leads for their tests" ON ab_test_leads FOR DELETE USING (
    EXISTS (SELECT 1 FROM ab_tests WHERE ab_tests.id = ab_test_leads.test_id AND ab_tests.created_by = auth.uid())
);

-- Similar policies for other tables...
CREATE POLICY "Users can view ab_test_call_attempts for their tests" ON ab_test_call_attempts FOR SELECT USING (
    EXISTS (SELECT 1 FROM ab_tests WHERE ab_tests.id = ab_test_call_attempts.test_id AND ab_tests.created_by = auth.uid())
);
CREATE POLICY "Users can insert ab_test_call_attempts for their tests" ON ab_test_call_attempts FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM ab_tests WHERE ab_tests.id = ab_test_call_attempts.test_id AND ab_tests.created_by = auth.uid())
);
CREATE POLICY "Users can update ab_test_call_attempts for their tests" ON ab_test_call_attempts FOR UPDATE USING (
    EXISTS (SELECT 1 FROM ab_tests WHERE ab_tests.id = ab_test_call_attempts.test_id AND ab_tests.created_by = auth.uid())
);

CREATE POLICY "Users can view ab_test_nudges for their tests" ON ab_test_nudges FOR SELECT USING (
    EXISTS (SELECT 1 FROM ab_tests WHERE ab_tests.id = ab_test_nudges.test_id AND ab_tests.created_by = auth.uid())
);
CREATE POLICY "Users can insert ab_test_nudges for their tests" ON ab_test_nudges FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM ab_tests WHERE ab_tests.id = ab_test_nudges.test_id AND ab_tests.created_by = auth.uid())
);
CREATE POLICY "Users can update ab_test_nudges for their tests" ON ab_test_nudges FOR UPDATE USING (
    EXISTS (SELECT 1 FROM ab_tests WHERE ab_tests.id = ab_test_nudges.test_id AND ab_tests.created_by = auth.uid())
);

CREATE POLICY "Users can view ab_test_metrics for their tests" ON ab_test_metrics FOR SELECT USING (
    EXISTS (SELECT 1 FROM ab_tests WHERE ab_tests.id = ab_test_metrics.test_id AND ab_tests.created_by = auth.uid())
);
CREATE POLICY "Users can insert ab_test_metrics for their tests" ON ab_test_metrics FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM ab_tests WHERE ab_tests.id = ab_test_metrics.test_id AND ab_tests.created_by = auth.uid())
);
CREATE POLICY "Users can update ab_test_metrics for their tests" ON ab_test_metrics FOR UPDATE USING (
    EXISTS (SELECT 1 FROM ab_tests WHERE ab_tests.id = ab_test_metrics.test_id AND ab_tests.created_by = auth.uid())
);

CREATE POLICY "Users can view ab_test_events for their tests" ON ab_test_events FOR SELECT USING (
    EXISTS (SELECT 1 FROM ab_tests WHERE ab_tests.id = ab_test_events.test_id AND ab_tests.created_by = auth.uid())
);
CREATE POLICY "Users can insert ab_test_events for their tests" ON ab_test_events FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM ab_tests WHERE ab_tests.id = ab_test_events.test_id AND ab_tests.created_by = auth.uid())
);

-- Insert sample data for testing
INSERT INTO ab_tests (
    test_id, test_name, test_description, status, group_a_label, group_b_label,
    leads, created_by
) VALUES (
    'test_001', 'Morning vs Afternoon Call Optimization', 
    'Testing optimal call times for lead conversion',
    'active', 'Morning Calls', 'Afternoon Calls',
    '[
        {"lead_id": "lead_001", "phone": "+34600000001", "sector": "Technology", "province": "Madrid"},
        {"lead_id": "lead_002", "phone": "+34600000002", "sector": "Finance", "province": "Barcelona"},
        {"lead_id": "lead_003", "phone": "+34600000003", "sector": "Healthcare", "province": "Valencia"}
    ]'::jsonb,
    (SELECT id FROM auth.users LIMIT 1)
) ON CONFLICT (test_id) DO NOTHING;
