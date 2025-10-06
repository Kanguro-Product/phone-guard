-- Script mínimo para habilitar las listas
-- Solo agrega las columnas necesarias sin funciones complejas

-- Verificar que la tabla number_lists existe, si no, crearla
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

-- Verificar que la tabla number_list_items existe, si no, crearla
CREATE TABLE IF NOT EXISTS public.number_list_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    list_id UUID NOT NULL REFERENCES public.number_lists(id) ON DELETE CASCADE,
    phone_number_id UUID NOT NULL REFERENCES public.phone_numbers(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by UUID REFERENCES auth.users(id),
    notes TEXT,
    UNIQUE(list_id, phone_number_id)
);

-- Agregar columnas necesarias si no existen
DO $$ 
BEGIN
    -- Agregar list_type si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'number_lists' 
        AND column_name = 'list_type'
    ) THEN
        ALTER TABLE public.number_lists ADD COLUMN list_type VARCHAR(50) DEFAULT 'custom';
    END IF;
    
    -- Agregar is_system_list si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'number_lists' 
        AND column_name = 'is_system_list'
    ) THEN
        ALTER TABLE public.number_lists ADD COLUMN is_system_list BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_number_lists_user_id ON public.number_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_number_lists_list_type ON public.number_lists(list_type);
CREATE INDEX IF NOT EXISTS idx_number_lists_is_system ON public.number_lists(is_system_list);
CREATE INDEX IF NOT EXISTS idx_number_list_items_list_id ON public.number_list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_number_list_items_phone_number_id ON public.number_list_items(phone_number_id);

-- Habilitar RLS si no está habilitado
ALTER TABLE public.number_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.number_list_items ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS básicas si no existen
DO $$ 
BEGIN
    -- Política para number_lists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'number_lists' 
        AND policyname = 'Users can view their own number lists'
    ) THEN
        CREATE POLICY "Users can view their own number lists" ON public.number_lists
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'number_lists' 
        AND policyname = 'Users can insert their own number lists'
    ) THEN
        CREATE POLICY "Users can insert their own number lists" ON public.number_lists
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'number_lists' 
        AND policyname = 'Users can update their own number lists'
    ) THEN
        CREATE POLICY "Users can update their own number lists" ON public.number_lists
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'number_lists' 
        AND policyname = 'Users can delete their own number lists'
    ) THEN
        CREATE POLICY "Users can delete their own number lists" ON public.number_lists
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
    
    -- Políticas para number_list_items
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'number_list_items' 
        AND policyname = 'Users can view number list items from their lists'
    ) THEN
        CREATE POLICY "Users can view number list items from their lists" ON public.number_list_items
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.number_lists 
                    WHERE number_lists.id = number_list_items.list_id 
                    AND number_lists.user_id = auth.uid()
                )
            );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'number_list_items' 
        AND policyname = 'Users can insert number list items to their lists'
    ) THEN
        CREATE POLICY "Users can insert number list items to their lists" ON public.number_list_items
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.number_lists 
                    WHERE number_lists.id = number_list_items.list_id 
                    AND number_lists.user_id = auth.uid()
                )
            );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'number_list_items' 
        AND policyname = 'Users can update number list items from their lists'
    ) THEN
        CREATE POLICY "Users can update number list items from their lists" ON public.number_list_items
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM public.number_lists 
                    WHERE number_lists.id = number_list_items.list_id 
                    AND number_lists.user_id = auth.uid()
                )
            );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'number_list_items' 
        AND policyname = 'Users can delete number list items from their lists'
    ) THEN
        CREATE POLICY "Users can delete number list items from their lists" ON public.number_list_items
            FOR DELETE USING (
                EXISTS (
                    SELECT 1 FROM public.number_lists 
                    WHERE number_lists.id = number_list_items.list_id 
                    AND number_lists.user_id = auth.uid()
                )
            );
    END IF;
END $$;
