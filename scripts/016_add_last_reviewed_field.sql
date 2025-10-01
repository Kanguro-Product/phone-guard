-- Add last_reviewed_at field to phone_numbers table

-- Add the last_reviewed_at field
ALTER TABLE public.phone_numbers
ADD COLUMN last_reviewed_at TIMESTAMP WITH TIME ZONE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_phone_numbers_last_reviewed_at ON public.phone_numbers(last_reviewed_at);

-- Update existing records to set last_reviewed_at to updated_at if not set
UPDATE public.phone_numbers 
SET last_reviewed_at = updated_at 
WHERE last_reviewed_at IS NULL;

-- Create function to update last_reviewed_at when number is validated
CREATE OR REPLACE FUNCTION update_last_reviewed()
RETURNS TRIGGER AS $$
BEGIN
    -- Update last_reviewed_at when any score is updated
    IF (OLD.reputation_score IS DISTINCT FROM NEW.reputation_score) OR
       (OLD.numverify_score IS DISTINCT FROM NEW.numverify_score) OR
       (OLD.openai_score IS DISTINCT FROM NEW.openai_score) OR
       (OLD.average_reputation_score IS DISTINCT FROM NEW.average_reputation_score) THEN
        NEW.last_reviewed_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update last_reviewed_at
DROP TRIGGER IF EXISTS trigger_update_last_reviewed ON public.phone_numbers;
CREATE TRIGGER trigger_update_last_reviewed
    BEFORE UPDATE ON public.phone_numbers
    FOR EACH ROW
    EXECUTE FUNCTION update_last_reviewed();
