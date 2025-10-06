-- Add number lists functionality

-- Create number_lists table
CREATE TABLE IF NOT EXISTS public.number_lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color for list
    icon VARCHAR(50) DEFAULT 'Phone', -- Icon name for list
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create number_list_items table (relationship between lists and numbers)
CREATE TABLE IF NOT EXISTS public.number_list_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    list_id UUID NOT NULL REFERENCES public.number_lists(id) ON DELETE CASCADE,
    phone_number_id UUID NOT NULL REFERENCES public.phone_numbers(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by UUID REFERENCES auth.users(id),
    notes TEXT, -- Optional notes for this number in this specific list
    UNIQUE(list_id, phone_number_id) -- Prevent duplicate numbers in same list
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_number_lists_user_id ON public.number_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_number_lists_is_default ON public.number_lists(is_default);
CREATE INDEX IF NOT EXISTS idx_number_list_items_list_id ON public.number_list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_number_list_items_phone_number_id ON public.number_list_items(phone_number_id);

-- Enable RLS
ALTER TABLE public.number_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.number_list_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for number_lists
CREATE POLICY "Users can view their own number lists" ON public.number_lists
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own number lists" ON public.number_lists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own number lists" ON public.number_lists
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own number lists" ON public.number_lists
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for number_list_items
CREATE POLICY "Users can view number list items from their lists" ON public.number_list_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.number_lists 
            WHERE number_lists.id = number_list_items.list_id 
            AND number_lists.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert number list items to their lists" ON public.number_list_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.number_lists 
            WHERE number_lists.id = number_list_items.list_id 
            AND number_lists.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update number list items from their lists" ON public.number_list_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.number_lists 
            WHERE number_lists.id = number_list_items.list_id 
            AND number_lists.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete number list items from their lists" ON public.number_list_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.number_lists 
            WHERE number_lists.id = number_list_items.list_id 
            AND number_lists.user_id = auth.uid()
        )
    );

-- Create function to automatically create default list for new users
CREATE OR REPLACE FUNCTION create_default_number_list()
RETURNS TRIGGER AS $$
BEGIN
    -- Create a default list named "All Numbers" for new users
    INSERT INTO public.number_lists (user_id, name, description, color, icon, is_default)
    VALUES (NEW.id, 'All Numbers', 'Default list containing all phone numbers', '#3B82F6', 'Phone', TRUE);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new user registration (if you want to create default lists)
-- Note: This trigger only works if the users are created directly in the auth.users table
-- For Supabase Auth, you might want to create default lists manually or via RPC

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_number_list_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at
CREATE TRIGGER update_number_lists_updated_at
    BEFORE UPDATE ON public.number_lists
    FOR EACH ROW
    EXECUTE FUNCTION update_number_list_updated_at();

-- Create function to add all existing numbers to default list (run this manually if needed)
CREATE OR REPLACE FUNCTION populate_default_lists()
RETURNS void AS $$
DECLARE
    user_record RECORD;
    phone_number_record RECORD;
BEGIN
    -- For each user, get their default list and add all their numbers to it
    FOR user_record IN 
        SELECT id FROM auth.users
    LOOP
        -- Get the default list for this user
        DECLARE
            default_list_id UUID;
        BEGIN
            SELECT id INTO default_list_id 
            FROM public.number_lists 
            WHERE user_id = user_record.id AND is_default = TRUE;
            
            -- Insert all phone numbers for this user into their default list
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
