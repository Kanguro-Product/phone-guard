-- ============================================
-- HIYA SCRAPING TABLES
-- Version: 1.0
-- Date: 2025-10-08
-- Purpose: Store scraped data from Hiya dashboard
-- ============================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.hiya_runs CASCADE;
DROP TABLE IF EXISTS public.hiya_numbers CASCADE;

-- ============================================
-- Table: hiya_numbers
-- Stores scraped phone number data from Hiya
-- ============================================
CREATE TABLE public.hiya_numbers (
    phone TEXT PRIMARY KEY,
    is_spam BOOLEAN NOT NULL DEFAULT false,
    label TEXT,
    score NUMERIC,
    last_seen TIMESTAMPTZ,
    checked_at TIMESTAMPTZ DEFAULT NOW(),
    raw JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for filtering spam numbers
CREATE INDEX idx_hiya_numbers_is_spam ON public.hiya_numbers(is_spam);
CREATE INDEX idx_hiya_numbers_checked_at ON public.hiya_numbers(checked_at DESC);

-- Add comment for documentation
COMMENT ON TABLE public.hiya_numbers IS 'Phone numbers scraped from Hiya dashboard with spam status';
COMMENT ON COLUMN public.hiya_numbers.phone IS 'Phone number in E.164 format';
COMMENT ON COLUMN public.hiya_numbers.is_spam IS 'Derived from label/score containing spam keywords';
COMMENT ON COLUMN public.hiya_numbers.label IS 'Label from Hiya (e.g., "Spam Risk", "Scam Likely")';
COMMENT ON COLUMN public.hiya_numbers.score IS 'Spam score from Hiya (if available)';
COMMENT ON COLUMN public.hiya_numbers.last_seen IS 'Last seen timestamp from Hiya';
COMMENT ON COLUMN public.hiya_numbers.checked_at IS 'When this record was last scraped';
COMMENT ON COLUMN public.hiya_numbers.raw IS 'Raw JSON data from the scraped row';

-- ============================================
-- Table: hiya_runs
-- Tracks scraping executions for rate limiting
-- ============================================
CREATE TABLE public.hiya_runs (
    id BIGSERIAL PRIMARY KEY,
    run_at TIMESTAMPTZ DEFAULT NOW(),
    rows_count INTEGER NOT NULL DEFAULT 0,
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    duration_ms INTEGER,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for rate limit queries
CREATE INDEX idx_hiya_runs_run_at ON public.hiya_runs(run_at DESC);
CREATE INDEX idx_hiya_runs_user_id ON public.hiya_runs(user_id);

-- Add comment for documentation
COMMENT ON TABLE public.hiya_runs IS 'Log of Hiya scraping executions for rate limiting and monitoring';
COMMENT ON COLUMN public.hiya_runs.run_at IS 'When the scraping started';
COMMENT ON COLUMN public.hiya_runs.rows_count IS 'Number of rows successfully scraped';
COMMENT ON COLUMN public.hiya_runs.success IS 'Whether the scraping completed successfully';
COMMENT ON COLUMN public.hiya_runs.error_message IS 'Error message if scraping failed';
COMMENT ON COLUMN public.hiya_runs.duration_ms IS 'How long the scraping took in milliseconds';

-- ============================================
-- Function: Auto-update updated_at on hiya_numbers
-- ============================================
CREATE OR REPLACE FUNCTION update_hiya_numbers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-update
DROP TRIGGER IF EXISTS trigger_hiya_numbers_updated_at ON public.hiya_numbers;
CREATE TRIGGER trigger_hiya_numbers_updated_at
    BEFORE UPDATE ON public.hiya_numbers
    FOR EACH ROW
    EXECUTE FUNCTION update_hiya_numbers_updated_at();

-- ============================================
-- RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE public.hiya_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hiya_runs ENABLE ROW LEVEL SECURITY;

-- hiya_numbers policies (read-only for authenticated users)
CREATE POLICY "hiya_numbers_select_all" ON public.hiya_numbers
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only service role can insert/update (API route only)
CREATE POLICY "hiya_numbers_insert_service" ON public.hiya_numbers
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "hiya_numbers_update_service" ON public.hiya_numbers
    FOR UPDATE USING (auth.role() = 'service_role');

-- hiya_runs policies (read for authenticated, write for service role)
CREATE POLICY "hiya_runs_select_all" ON public.hiya_runs
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "hiya_runs_insert_service" ON public.hiya_runs
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- Grant permissions
-- ============================================
GRANT SELECT ON public.hiya_numbers TO authenticated;
GRANT ALL ON public.hiya_numbers TO service_role;

GRANT SELECT ON public.hiya_runs TO authenticated;
GRANT ALL ON public.hiya_runs TO service_role;
GRANT USAGE, SELECT ON SEQUENCE hiya_runs_id_seq TO service_role;

-- ============================================
-- Utility function: Get last scrape info
-- ============================================
CREATE OR REPLACE FUNCTION get_last_hiya_scrape()
RETURNS TABLE (
    last_run_at TIMESTAMPTZ,
    rows_count INTEGER,
    success BOOLEAN,
    minutes_since_last_run NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.run_at,
        r.rows_count,
        r.success,
        EXTRACT(EPOCH FROM (NOW() - r.run_at)) / 60 AS minutes_since_last_run
    FROM public.hiya_runs r
    ORDER BY r.run_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_last_hiya_scrape() TO authenticated;

-- ============================================
-- Success message
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Hiya scraping tables created successfully!';
    RAISE NOTICE '📋 Tables: hiya_numbers, hiya_runs';
    RAISE NOTICE '🔒 RLS enabled with proper policies';
    RAISE NOTICE '🚀 Ready to scrape!';
END $$;

