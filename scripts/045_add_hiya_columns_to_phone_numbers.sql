-- ============================================
-- ADD HIYA COLUMNS TO PHONE_NUMBERS
-- Version: 1.0
-- Date: 2025-10-10
-- Purpose: Store Hiya scraping results in phone_numbers table
-- ============================================

-- Add Hiya-specific columns to phone_numbers
ALTER TABLE public.phone_numbers 
ADD COLUMN IF NOT EXISTS hiya_label TEXT;

ALTER TABLE public.phone_numbers 
ADD COLUMN IF NOT EXISTS hiya_risk_score TEXT;

ALTER TABLE public.phone_numbers 
ADD COLUMN IF NOT EXISTS hiya_is_spam BOOLEAN DEFAULT false;

ALTER TABLE public.phone_numbers 
ADD COLUMN IF NOT EXISTS hiya_last_checked TIMESTAMPTZ;

ALTER TABLE public.phone_numbers 
ADD COLUMN IF NOT EXISTS hiya_registration_status TEXT;

ALTER TABLE public.phone_numbers 
ADD COLUMN IF NOT EXISTS hiya_raw_data JSONB;

-- Add comments for documentation
COMMENT ON COLUMN public.phone_numbers.hiya_label IS 'Business name/label from Hiya (e.g., "Kanguro Delivery®")';
COMMENT ON COLUMN public.phone_numbers.hiya_risk_score IS 'Risk level from Hiya (e.g., "Low risk", "High risk")';
COMMENT ON COLUMN public.phone_numbers.hiya_is_spam IS 'Whether Hiya considers this number as spam';
COMMENT ON COLUMN public.phone_numbers.hiya_last_checked IS 'When this number was last scraped from Hiya';
COMMENT ON COLUMN public.phone_numbers.hiya_registration_status IS 'Registration status in Hiya (e.g., "Registered", "Pending")';
COMMENT ON COLUMN public.phone_numbers.hiya_raw_data IS 'Raw JSON data from Hiya scraping';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_phone_numbers_hiya_is_spam ON public.phone_numbers(hiya_is_spam);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_hiya_last_checked ON public.phone_numbers(hiya_last_checked DESC);

-- Grant permissions (inherited from phone_numbers table)

-- ============================================
-- Success message
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Hiya columns added to phone_numbers successfully!';
    RAISE NOTICE '📋 New columns: hiya_label, hiya_risk_score, hiya_is_spam, hiya_last_checked, hiya_registration_status, hiya_raw_data';
    RAISE NOTICE '🚀 Ready to store Hiya data!';
END $$;

