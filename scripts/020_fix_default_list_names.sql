-- Fix default list names to be consistent in Spanish
-- This script updates existing "All Numbers" lists to "Todos los Números"

-- Update existing "All Numbers" lists to "Todos los Números"
UPDATE public.number_lists 
SET name = 'Todos los Números',
    description = 'Lista por defecto que contiene todos los números de teléfono'
WHERE name = 'All Numbers' 
AND is_default = TRUE;

-- Update the function that creates default lists for new users
CREATE OR REPLACE FUNCTION create_default_number_list()
RETURNS TRIGGER AS $$
BEGIN
    -- Create a default list named "Todos los Números" for new users
    INSERT INTO public.number_lists (user_id, name, description, color, icon, is_default)
    VALUES (NEW.id, 'Todos los Números', 'Lista por defecto que contiene todos los números de teléfono', '#3B82F6', 'Phone', TRUE);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the populate function to use Spanish names
CREATE OR REPLACE FUNCTION populate_default_lists()
RETURNS void AS $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT id FROM auth.users
    LOOP
        DECLARE
            default_list_id UUID;
        BEGIN
            -- Create default list if it doesn't exist
            INSERT INTO public.number_lists (user_id, name, description, color, icon, is_default)
            VALUES (user_record.id, 'Todos los Números', 'Lista por defecto que contiene todos los números de teléfono', '#3B82F6', 'Phone', TRUE)
            ON CONFLICT DO NOTHING
            RETURNING id INTO default_list_id;
            
            -- Get existing default list if insert didn't happen
            IF default_list_id IS NULL THEN
                SELECT id INTO default_list_id 
                FROM public.number_lists 
                WHERE user_id = user_record.id AND is_default = TRUE;
            END IF;
            
            -- Add all phone numbers to default list
            IF default_list_id IS NOT NULL THEN
                INSERT INTO public.number_list_items (list_id, phone_number_id, added_by)
                SELECT default_list_id, id, user_record.id
                FROM public.phone_numbers 
                WHERE user_id = user_record.id
                ON CONFLICT (list_id, phone_number_id) DO NOTHING;
            END IF;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Ensure all users have a "Todos los Números" list
SELECT populate_default_lists();
