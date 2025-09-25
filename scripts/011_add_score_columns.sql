-- Add individual score columns to phone_numbers table
-- This allows storing scores from different providers separately

-- Add Numverify score column
ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS numverify_score INTEGER CHECK (numverify_score >= 0 AND numverify_score <= 100);

-- Add OpenAI score column  
ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS openai_score INTEGER CHECK (openai_score >= 0 AND openai_score <= 100);

-- Add average reputation score column
ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS average_reputation_score INTEGER CHECK (average_reputation_score >= 0 AND average_reputation_score <= 100);

-- Add comments for documentation
COMMENT ON COLUMN phone_numbers.numverify_score IS 'Reputation score from Numverify API based on carrier validation and line type';
COMMENT ON COLUMN phone_numbers.openai_score IS 'Reputation score from OpenAI ChatGPT analysis for pattern recognition and spam detection';
COMMENT ON COLUMN phone_numbers.average_reputation_score IS 'Combined average score from Numverify, OpenAI, and base reputation calculations';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_phone_numbers_numverify_score ON phone_numbers(numverify_score);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_openai_score ON phone_numbers(openai_score);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_average_score ON phone_numbers(average_reputation_score);
