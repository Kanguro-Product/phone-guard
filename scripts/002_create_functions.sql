-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger to create user profile on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update reputation score based on call results
CREATE OR REPLACE FUNCTION public.update_phone_reputation(
  phone_id UUID,
  call_status TEXT,
  user_id_param UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_score INTEGER;
  new_score INTEGER;
  score_change INTEGER := 0;
BEGIN
  -- Get current reputation score
  SELECT reputation_score INTO current_score
  FROM public.phone_numbers
  WHERE id = phone_id AND user_id = user_id_param;
  
  -- Calculate score change based on call status
  CASE call_status
    WHEN 'success' THEN score_change := 1;
    WHEN 'failed' THEN score_change := -2;
    WHEN 'spam_detected' THEN score_change := -10;
    WHEN 'busy' THEN score_change := 0;
    WHEN 'no_answer' THEN score_change := -1;
    ELSE score_change := 0;
  END CASE;
  
  -- Calculate new score (ensure it stays within bounds)
  new_score := GREATEST(0, LEAST(100, current_score + score_change));
  
  -- Update phone number reputation
  UPDATE public.phone_numbers
  SET 
    reputation_score = new_score,
    updated_at = NOW(),
    successful_calls = CASE WHEN call_status = 'success' THEN successful_calls + 1 ELSE successful_calls END,
    failed_calls = CASE WHEN call_status IN ('failed', 'spam_detected') THEN failed_calls + 1 ELSE failed_calls END,
    spam_reports = CASE WHEN call_status = 'spam_detected' THEN spam_reports + 1 ELSE spam_reports END
  WHERE id = phone_id AND user_id = user_id_param;
  
  -- Log the reputation change
  INSERT INTO public.reputation_logs (phone_number_id, old_score, new_score, reason, source, user_id)
  VALUES (phone_id, current_score, new_score, 'Call result: ' || call_status, 'call_result', user_id_param);
END;
$$;

-- Function to get next phone number in rotation
CREATE OR REPLACE FUNCTION public.get_next_phone_number(
  cadence_id_param UUID,
  user_id_param UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  phone_numbers_array UUID[];
  rotation_strategy_val TEXT;
  next_phone_id UUID;
  phone_count INTEGER;
  random_index INTEGER;
BEGIN
  -- Get cadence details
  SELECT phone_numbers, rotation_strategy
  INTO phone_numbers_array, rotation_strategy_val
  FROM public.cadences
  WHERE id = cadence_id_param AND user_id = user_id_param AND is_active = true;
  
  IF phone_numbers_array IS NULL OR array_length(phone_numbers_array, 1) = 0 THEN
    RETURN NULL;
  END IF;
  
  phone_count := array_length(phone_numbers_array, 1);
  
  -- Apply rotation strategy
  CASE rotation_strategy_val
    WHEN 'random' THEN
      random_index := floor(random() * phone_count) + 1;
      next_phone_id := phone_numbers_array[random_index];
    
    WHEN 'reputation_based' THEN
      -- Select phone number with highest reputation score
      SELECT id INTO next_phone_id
      FROM public.phone_numbers
      WHERE id = ANY(phone_numbers_array)
        AND user_id = user_id_param
        AND status = 'active'
      ORDER BY reputation_score DESC, random()
      LIMIT 1;
    
    ELSE -- 'round_robin' or default
      -- Simple round robin based on last used (simplified version)
      SELECT id INTO next_phone_id
      FROM public.phone_numbers
      WHERE id = ANY(phone_numbers_array)
        AND user_id = user_id_param
        AND status = 'active'
      ORDER BY last_checked ASC, random()
      LIMIT 1;
  END CASE;
  
  -- Update last_checked timestamp
  UPDATE public.phone_numbers
  SET last_checked = NOW()
  WHERE id = next_phone_id AND user_id = user_id_param;
  
  RETURN next_phone_id;
END;
$$;
