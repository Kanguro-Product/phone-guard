-- Script para eliminar "All Numbers" que está marcada como default
-- COPIA Y PEGA TODO ESTO EN SUPABASE

-- 1. Ver qué tienes actualmente
SELECT name, list_type, is_system_list, is_default 
FROM public.number_lists 
WHERE list_type = 'all_numbers';

-- 2. Quitar la marca de "default" de "All Numbers"
UPDATE public.number_lists 
SET is_default = FALSE 
WHERE name = 'All Numbers' AND list_type = 'all_numbers';

-- 3. Asegurar que "All" sea la lista por defecto
UPDATE public.number_lists 
SET is_default = TRUE 
WHERE name = 'All' AND list_type = 'all_numbers';

-- 4. Ahora eliminar "All Numbers"
DELETE FROM public.number_lists 
WHERE name = 'All Numbers' AND list_type = 'all_numbers';

-- 5. Verificar resultado final
SELECT name, list_type, is_system_list, is_default 
FROM public.number_lists 
WHERE list_type = 'all_numbers';
