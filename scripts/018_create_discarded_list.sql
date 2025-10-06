-- Create default discarded numbers list for all users
-- This ensures every user has a discarded list automatically created

-- Create a function to ensure every user has a discarded list
CREATE OR REPLACE FUNCTION ensure_discarded_list_for_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user already has a discarded list
  IF NOT EXISTS (
    SELECT 1 FROM public.number_lists 
    WHERE user_id = NEW.id 
    AND name = 'Números Descartados'
  ) THEN
    -- Create the discarded list for the new user
    INSERT INTO public.number_lists (
      user_id, 
      name, 
      description, 
      color, 
      icon, 
      is_default
    ) VALUES (
      NEW.id, 
      'Números Descartados', 
      'Números que han sido marcados como descartados', 
      '#EF4444', 
      'Trash2', 
      TRUE
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
DROP TRIGGER IF EXISTS create_discarded_list_trigger ON auth.users;
CREATE TRIGGER create_discarded_list_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION ensure_discarded_list_for_user();

-- Create discarded lists for existing users who don't have one
INSERT INTO public.number_lists (
  user_id, 
  name, 
  description, 
  color, 
  icon, 
  is_default,
  created_at,
  updated_at
)
SELECT 
  DISTINCT u.id,
  'Números Descartados',
  'Números que han sido marcados como descartados',
  '#EF4444',
  'Trash2',
  TRUE,
  NOW(),
  NOW()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.number_lists 
  WHERE number_lists.user_id = u.id 
  AND number_lists.name = 'Números Descartados'
);
