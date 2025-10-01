-- Allow NULL reputation_score for new numbers that haven't been validated yet
-- This ensures numbers appear without fake scores until they're validated with APIs

-- Remove the NOT NULL constraint and default value
ALTER TABLE public.phone_numbers 
ALTER COLUMN reputation_score DROP DEFAULT;

-- Update the CHECK constraint to allow NULL values
ALTER TABLE public.phone_numbers 
DROP CONSTRAINT IF EXISTS phone_numbers_reputation_score_check;

ALTER TABLE public.phone_numbers 
ADD CONSTRAINT phone_numbers_reputation_score_check 
CHECK (reputation_score IS NULL OR (reputation_score >= 0 AND reputation_score <= 100));

-- Also allow NULL for the new score columns
ALTER TABLE public.phone_numbers 
DROP CONSTRAINT IF EXISTS phone_numbers_numverify_score_check;

ALTER TABLE public.phone_numbers 
ADD CONSTRAINT phone_numbers_numverify_score_check 
CHECK (numverify_score IS NULL OR (numverify_score >= 0 AND numverify_score <= 100));

ALTER TABLE public.phone_numbers 
DROP CONSTRAINT IF EXISTS phone_numbers_openai_score_check;

ALTER TABLE public.phone_numbers 
ADD CONSTRAINT phone_numbers_openai_score_check 
CHECK (openai_score IS NULL OR (openai_score >= 0 AND openai_score <= 100));

ALTER TABLE public.phone_numbers 
DROP CONSTRAINT IF EXISTS phone_numbers_average_reputation_score_check;

ALTER TABLE public.phone_numbers 
ADD CONSTRAINT phone_numbers_average_reputation_score_check 
CHECK (average_reputation_score IS NULL OR (average_reputation_score >= 0 AND average_reputation_score <= 100));
