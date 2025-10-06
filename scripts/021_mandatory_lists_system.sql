-- Sistema de Listas Obligatorias
-- Garantiza que siempre existan 2 listas específicas con reglas propias

-- 1. Función para crear/verificar lista "Todos los Números"
CREATE OR REPLACE FUNCTION ensure_all_numbers_list(user_uuid UUID)
RETURNS UUID AS $$
DECLARE
    all_numbers_list_id UUID;
BEGIN
    -- Buscar lista "Todos los Números"
    SELECT id INTO all_numbers_list_id 
    FROM public.number_lists 
    WHERE user_id = user_uuid 
    AND name = 'Todos los Números'
    AND list_type = 'all_numbers';
    
    -- Crear si no existe
    IF all_numbers_list_id IS NULL THEN
        INSERT INTO public.number_lists (
            user_id, 
            name, 
            description, 
            color, 
            icon, 
            is_default,
            list_type,
            is_system_list
        ) VALUES (
            user_uuid, 
            'Todos los Números', 
            'Lista principal que contiene todos los números de teléfono del usuario', 
            '#3B82F6', 
            'Phone', 
            TRUE,
            'all_numbers',
            TRUE
        ) RETURNING id INTO all_numbers_list_id;
    END IF;
    
    RETURN all_numbers_list_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Función para crear/verificar lista "Números Descartados"
CREATE OR REPLACE FUNCTION ensure_discarded_list(user_uuid UUID)
RETURNS UUID AS $$
DECLARE
    discarded_list_id UUID;
BEGIN
    -- Buscar lista "Números Descartados"
    SELECT id INTO discarded_list_id 
    FROM public.number_lists 
    WHERE user_id = user_uuid 
    AND name = 'Números Descartados'
    AND list_type = 'discarded';
    
    -- Crear si no existe
    IF discarded_list_id IS NULL THEN
        INSERT INTO public.number_lists (
            user_id, 
            name, 
            description, 
            color, 
            icon, 
            is_default,
            list_type,
            is_system_list
        ) VALUES (
            user_uuid, 
            'Números Descartados', 
            'Números que han sido marcados como descartados o eliminados', 
            '#EF4444', 
            'Trash2', 
            TRUE,
            'discarded',
            TRUE
        ) RETURNING id INTO discarded_list_id;
    END IF;
    
    RETURN discarded_list_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Función para asegurar ambas listas obligatorias
CREATE OR REPLACE FUNCTION ensure_mandatory_lists(user_uuid UUID)
RETURNS TABLE(all_numbers_id UUID, discarded_id UUID) AS $$
DECLARE
    all_numbers_list_id UUID;
    discarded_list_id UUID;
BEGIN
    -- Crear/verificar ambas listas
    all_numbers_list_id := ensure_all_numbers_list(user_uuid);
    discarded_list_id := ensure_discarded_list(user_uuid);
    
    -- Retornar ambos IDs
    RETURN QUERY SELECT all_numbers_list_id, discarded_list_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger para mantener "Todos los Números" actualizada
CREATE OR REPLACE FUNCTION sync_all_numbers_list()
RETURNS TRIGGER AS $$
DECLARE
    all_numbers_list_id UUID;
BEGIN
    -- Obtener ID de lista "Todos los Números"
    SELECT id INTO all_numbers_list_id 
    FROM public.number_lists 
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    AND list_type = 'all_numbers';
    
    IF all_numbers_list_id IS NOT NULL THEN
        IF TG_OP = 'INSERT' THEN
            -- Agregar nuevo número a "Todos los Números"
            INSERT INTO public.number_list_items (list_id, phone_number_id, added_by, notes)
            VALUES (all_numbers_list_id, NEW.id, NEW.user_id, 'Agregado automáticamente a lista principal')
            ON CONFLICT (list_id, phone_number_id) DO NOTHING;
            
        ELSIF TG_OP = 'DELETE' THEN
            -- Remover número de "Todos los Números"
            DELETE FROM public.number_list_items 
            WHERE list_id = all_numbers_list_id 
            AND phone_number_id = OLD.id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger para números de teléfono
DROP TRIGGER IF EXISTS sync_all_numbers_on_phone_numbers ON public.phone_numbers;
CREATE TRIGGER sync_all_numbers_on_phone_numbers
    AFTER INSERT OR DELETE ON public.phone_numbers
    FOR EACH ROW EXECUTE FUNCTION sync_all_numbers_list();

-- 6. Trigger para usuarios nuevos
CREATE OR REPLACE FUNCTION create_mandatory_lists_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Crear ambas listas obligatorias para el nuevo usuario
    PERFORM ensure_mandatory_lists(NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS create_mandatory_lists_trigger ON auth.users;
CREATE TRIGGER create_mandatory_lists_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_mandatory_lists_for_new_user();

-- 7. Función para mover números a descartados
CREATE OR REPLACE FUNCTION move_to_discarded_list(user_uuid UUID, phone_number_ids UUID[])
RETURNS INTEGER AS $$
DECLARE
    discarded_list_id UUID;
    moved_count INTEGER := 0;
    number_id UUID;
BEGIN
    -- Obtener/crear lista descartados
    discarded_list_id := ensure_discarded_list(user_uuid);
    
    -- Mover cada número
    FOREACH number_id IN ARRAY phone_number_ids
    LOOP
        -- Remover de todas las otras listas
        DELETE FROM public.number_list_items 
        WHERE phone_number_id = number_id 
        AND list_id != discarded_list_id;
        
        -- Agregar a lista descartados
        INSERT INTO public.number_list_items (
            list_id, 
            phone_number_id, 
            added_by, 
            notes
        ) VALUES (
            discarded_list_id, 
            number_id, 
            user_uuid, 
            'Movido a descartados el ' || NOW()::text
        ) ON CONFLICT (list_id, phone_number_id) DO UPDATE SET
            notes = EXCLUDED.notes,
            added_at = NOW();
            
        moved_count := moved_count + 1;
    END LOOP;
    
    RETURN moved_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Función para restaurar números desde descartados
CREATE OR REPLACE FUNCTION restore_from_discarded_list(user_uuid UUID, phone_number_ids UUID[])
RETURNS INTEGER AS $$
DECLARE
    all_numbers_list_id UUID;
    restored_count INTEGER := 0;
    number_id UUID;
BEGIN
    -- Obtener lista "Todos los Números"
    all_numbers_list_id := ensure_all_numbers_list(user_uuid);
    
    -- Restaurar cada número
    FOREACH number_id IN ARRAY phone_number_ids
    LOOP
        -- Remover de descartados
        DELETE FROM public.number_list_items 
        WHERE phone_number_id = number_id 
        AND list_id IN (
            SELECT id FROM public.number_lists 
            WHERE user_id = user_uuid 
            AND list_type = 'discarded'
        );
        
        -- Agregar a "Todos los Números"
        INSERT INTO public.number_list_items (
            list_id, 
            phone_number_id, 
            added_by, 
            notes
        ) VALUES (
            all_numbers_list_id, 
            number_id, 
            user_uuid, 
            'Restaurado desde descartados el ' || NOW()::text
        ) ON CONFLICT (list_id, phone_number_id) DO UPDATE SET
            notes = EXCLUDED.notes,
            added_at = NOW();
            
        restored_count := restored_count + 1;
    END LOOP;
    
    RETURN restored_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Función para poblar listas existentes
CREATE OR REPLACE FUNCTION populate_mandatory_lists()
RETURNS void AS $$
DECLARE
    user_record RECORD;
    all_numbers_list_id UUID;
    discarded_list_id UUID;
BEGIN
    FOR user_record IN 
        SELECT id FROM auth.users
    LOOP
        -- Crear/verificar listas obligatorias
        SELECT * INTO all_numbers_list_id, discarded_list_id
        FROM ensure_mandatory_lists(user_record.id);
        
        -- Agregar todos los números existentes a "Todos los Números"
        INSERT INTO public.number_list_items (list_id, phone_number_id, added_by, notes)
        SELECT all_numbers_list_id, id, user_record.id, 'Migrado automáticamente a lista principal'
        FROM public.phone_numbers 
        WHERE user_id = user_record.id
        ON CONFLICT (list_id, phone_number_id) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Agregar columnas necesarias a la tabla number_lists
ALTER TABLE public.number_lists 
ADD COLUMN IF NOT EXISTS list_type VARCHAR(50) DEFAULT 'custom',
ADD COLUMN IF NOT EXISTS is_system_list BOOLEAN DEFAULT FALSE;

-- Crear índice para list_type
CREATE INDEX IF NOT EXISTS idx_number_lists_list_type ON public.number_lists(list_type);
CREATE INDEX IF NOT EXISTS idx_number_lists_is_system ON public.number_lists(is_system_list);

-- 11. Políticas RLS para listas del sistema
CREATE POLICY "Users can view system lists" ON public.number_lists
    FOR SELECT USING (
        auth.uid() = user_id AND 
        (is_system_list = TRUE OR list_type IN ('all_numbers', 'discarded'))
    );

-- 12. Ejecutar población inicial
SELECT populate_mandatory_lists();

-- 13. Permisos para funciones
GRANT EXECUTE ON FUNCTION ensure_all_numbers_list(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_discarded_list(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_mandatory_lists(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION move_to_discarded_list(UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_from_discarded_list(UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION populate_mandatory_lists() TO authenticated;
