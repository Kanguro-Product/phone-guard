-- Fix bulk actions functionality
-- Ensure all required tables and policies exist

-- First, verify that the tables exist and recreate them if needed
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

CREATE TABLE IF NOT EXISTS public.number_list_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    list_id UUID NOT NULL REFERENCES public.number_lists(id) ON DELETE CASCADE,
    phone_number_id UUID NOT NULL REFERENCES public.phone_numbers(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by UUID REFERENCES auth.users(id),
    notes TEXT,
    UNIQUE(list_id, phone_number_id)
);

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_number_lists_user_id ON public.number_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_number_list_items_list_id ON public.number_list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_number_list_items_phone_number_id ON public.number_list_items(phone_number_id);

-- Enable RLS
ALTER TABLE public.number_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.number_list_items ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to ensure they're correct
DROP POLICY IF EXISTS "Users can view their own number lists" ON public.number_lists;
DROP POLICY IF EXISTS "Users can insert their own number lists" ON public.number_lists;
DROP POLICY IF EXISTS "Users can update their own number lists" ON public.number_lists;
DROP POLICY IF EXISTS "Users can delete their own number lists" ON public.number_lists;

DROP POLICY IF EXISTS "Users can view number list items from their lists" ON public.number_list_items;
DROP POLICY IF EXISTS "Users can insert number list items to their lists" ON public.number_list_items;
DROP POLICY IF EXISTS "Users can update number list items from their lists" ON public.number_list_items;
DROP POLICY IF EXISTS "Users can delete number list items from their lists" ON public.number_list_items;

-- Recreate policies
CREATE POLICY "Users can view their own number lists" ON public.number_lists
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own number lists" ON public.number_lists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own number lists" ON public.number_lists
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own number lists" ON public.number_lists
    FOR DELETE USING (auth.uid() = user_id);

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

-- Function to create discarded numbers list if it doesn't exist
CREATE OR REPLACE FUNCTION create_discarded_list_if_not_exists(user_uuid UUID)
RETURNS UUID AS $$
DECLARE
    discarded_list_id UUID;
BEGIN
    -- Check if discarded list exists
    SELECT id INTO discarded_list_id 
    FROM public.number_lists 
    WHERE user_id = user_uuid 
    AND name = 'Números Descartados';
    
    -- Create if it doesn't exist
    IF discarded_list_id IS NULL THEN
        INSERT INTO public.number_lists (user_id, name, description, color, icon, is_default)
        VALUES (user_uuid, 'Números Descartados', 'Números que han sido marcados como descartados', '#EF4444', 'Trash2')
        RETURNING id INTO discarded_list_id;
    END IF;
    
    RETURN discarded_list_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_discarded_list_if_not_exists(UUID) TO authenticated;
