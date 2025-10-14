-- ============================================
-- LEADS AND WEBHOOKS TABLES
-- Version: 1.0
-- Date: 2025-01-20
-- Purpose: Store leads and webhook data for A/B Caller Tool
-- ============================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.webhook_logs CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;

-- ============================================
-- Table: leads
-- Stores imported leads for A/B testing
-- ============================================
CREATE TABLE public.leads (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    webhook_id TEXT,
    phone TEXT NOT NULL,
    name TEXT,
    email TEXT,
    company TEXT,
    source TEXT DEFAULT 'Manual Import',
    notes TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'unqualified')),
    quality_score INTEGER DEFAULT 50 CHECK (quality_score >= 0 AND quality_score <= 100),
    spam_score INTEGER DEFAULT 0 CHECK (spam_score >= 0 AND spam_score <= 100),
    assigned_test_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_contacted_at TIMESTAMPTZ,
    converted_at TIMESTAMPTZ
);

-- Add indexes for performance
CREATE INDEX idx_leads_user_id ON public.leads(user_id);
CREATE INDEX idx_leads_phone ON public.leads(phone);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_source ON public.leads(source);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX idx_leads_webhook_id ON public.leads(webhook_id);
CREATE INDEX idx_leads_assigned_test_id ON public.leads(assigned_test_id);

-- ============================================
-- Table: webhook_logs
-- Tracks webhook activity and payloads
-- ============================================
CREATE TABLE public.webhook_logs (
    id BIGSERIAL PRIMARY KEY,
    webhook_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_id BIGINT REFERENCES public.leads(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'error', 'pending')),
    payload JSONB,
    response JSONB,
    error_message TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_webhook_logs_webhook_id ON public.webhook_logs(webhook_id);
CREATE INDEX idx_webhook_logs_user_id ON public.webhook_logs(user_id);
CREATE INDEX idx_webhook_logs_lead_id ON public.webhook_logs(lead_id);
CREATE INDEX idx_webhook_logs_status ON public.webhook_logs(status);
CREATE INDEX idx_webhook_logs_created_at ON public.webhook_logs(created_at DESC);

-- ============================================
-- RLS (Row Level Security) Policies
-- ============================================

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Leads policies
CREATE POLICY "Users can view their own leads" ON public.leads
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own leads" ON public.leads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads" ON public.leads
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads" ON public.leads
    FOR DELETE USING (auth.uid() = user_id);

-- Webhook logs policies
CREATE POLICY "Users can view their own webhook logs" ON public.webhook_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own webhook logs" ON public.webhook_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE public.leads IS 'Imported leads for A/B testing campaigns';
COMMENT ON COLUMN public.leads.phone IS 'Phone number in E.164 format';
COMMENT ON COLUMN public.leads.name IS 'Contact name';
COMMENT ON COLUMN public.leads.email IS 'Email address';
COMMENT ON COLUMN public.leads.company IS 'Company name';
COMMENT ON COLUMN public.leads.source IS 'Lead source (Manual Import, Webhook, CSV, etc.)';
COMMENT ON COLUMN public.leads.notes IS 'Additional notes about the lead';
COMMENT ON COLUMN public.leads.status IS 'Lead status in the funnel';
COMMENT ON COLUMN public.leads.quality_score IS 'Lead quality score (0-100)';
COMMENT ON COLUMN public.leads.spam_score IS 'Spam risk score (0-100)';
COMMENT ON COLUMN public.leads.assigned_test_id IS 'A/B test this lead is assigned to';
COMMENT ON COLUMN public.leads.webhook_id IS 'Webhook ID if imported via webhook';

COMMENT ON TABLE public.webhook_logs IS 'Webhook activity and payload logs';
COMMENT ON COLUMN public.webhook_logs.webhook_id IS 'Unique webhook identifier';
COMMENT ON COLUMN public.webhook_logs.lead_id IS 'Associated lead ID if successful';
COMMENT ON COLUMN public.webhook_logs.status IS 'Webhook processing status';
COMMENT ON COLUMN public.webhook_logs.payload IS 'Incoming webhook payload';
COMMENT ON COLUMN public.webhook_logs.response IS 'Webhook response data';
COMMENT ON COLUMN public.webhook_logs.error_message IS 'Error message if processing failed';

-- ============================================
-- Functions for lead management
-- ============================================

-- Function to update lead status
CREATE OR REPLACE FUNCTION update_lead_status(
    lead_id BIGINT,
    new_status TEXT,
    user_uuid UUID
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.leads 
    SET 
        status = new_status,
        updated_at = NOW(),
        last_contacted_at = CASE 
            WHEN new_status = 'contacted' THEN NOW()
            ELSE last_contacted_at
        END,
        converted_at = CASE 
            WHEN new_status = 'converted' THEN NOW()
            ELSE converted_at
        END
    WHERE id = lead_id AND user_id = user_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get lead statistics
CREATE OR REPLACE FUNCTION get_lead_stats(user_uuid UUID)
RETURNS TABLE (
    total_leads BIGINT,
    new_leads BIGINT,
    contacted_leads BIGINT,
    qualified_leads BIGINT,
    converted_leads BIGINT,
    conversion_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_leads,
        COUNT(*) FILTER (WHERE status = 'new') as new_leads,
        COUNT(*) FILTER (WHERE status = 'contacted') as contacted_leads,
        COUNT(*) FILTER (WHERE status = 'qualified') as qualified_leads,
        COUNT(*) FILTER (WHERE status = 'converted') as converted_leads,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(*) FILTER (WHERE status = 'converted')::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
            ELSE 0
        END as conversion_rate
    FROM public.leads 
    WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
