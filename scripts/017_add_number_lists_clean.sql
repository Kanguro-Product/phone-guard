-- Add number lists functionality (Clean version)

-- Create number_lists table
CREATE TABLE IF NOT EXISTS public.number_lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50) DEFAULT 'Phone',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create number_list_items table
CREATE TABLE IF NOT EXISTS public.number_list_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    list_id UUID NOT NULL REFERENCES public.number_lists(id) ON DELETE CASCADE,
    phone_number_id UUID NOT NULL REFERENCES public.phone_numbers(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by UUID REFERENCES auth.users(id),
    notes TEXT,
    UNIQUE(list_id, phone_number_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_number_lists_user_id ON public.number_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_number_lists_is_default ON public.number_lists(is_default);
CREATE INDEX IF NOT EXISTS idx_number_list_items_list_id ON public.number_list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_number_list_items_phone_number_id ON public.number_list_items(phone_number_id);

-- Enable RLS
ALTER TABLE public.number_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.number_list_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (without error)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own number lists" ON public.number_lists;
    DROP POLICY IF EXISTS "Users can insert their own number lists" ON public.number_lists;
    DROP POLICY IF EXISTS "Users can update their own number lists" ON public.number_lists;
    DROP POLICY IF EXISTS "Users can delete their own number lists" ON public.number_lists;
    
    DROP POLICY IF EXISTS "Users can view number list items from their lists" ON public.number_list_items;
    DROP POLICY IF EXISTS "Users can insert number list items to their lists" ON public.number_list_items;
    DROP POLICY IF EXISTS "Users can update number list items from their lists" ON public.number_list_items;
    DROP POLICY IF EXISTS "Users can delete number list items from their lists" ON public.number_list_items;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

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

-- Create or replace functions
CREATE OR REPLACE FUNCTION update_number_list_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (drop if exists first)
DROP TRIGGER IF EXISTS update_number_lists_updated_at ON public.number_lists;
CREATE TRIGGER update_number_lists_updated_at
    BEFORE UPDATE ON public.number_lists
    FOR EACH ROW
    EXECUTE FUNCTION update_number_list_updated_at();

-- Function to populate default lists
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
            VALUES (user_record.id, 'All Numbers', 'Default list containing all phone numbers', '#3B82F6', 'Phone', TRUE)
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

-- Call function to populate default lists
SELECT populate_default_lists();
