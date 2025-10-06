-- Script para renombrar las carpetas del sistema
-- Cambia "Todos los Números" por "All" y "Números Descartados" por "Deleted"

-- 1. Renombrar "Todos los Números" a "All"
UPDATE public.number_lists 
SET name = 'All'
WHERE name = 'Todos los Números' 
AND list_type = 'all_numbers';

-- 2. Renombrar "Números Descartados" a "Deleted"
UPDATE public.number_lists 
SET name = 'Deleted'
WHERE name = 'Números Descartados' 
AND list_type = 'discarded';

-- 3. Verificar los cambios
SELECT 
    name,
    list_type,
    is_system_list,
    color
FROM public.number_lists
WHERE list_type IN ('all_numbers', 'discarded')
ORDER BY list_type;
