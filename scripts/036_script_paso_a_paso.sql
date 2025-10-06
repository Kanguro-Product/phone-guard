-- SCRIPT DEFINITIVO PARA ELIMINAR "All Numbers" - EJECUTA PASO A PASO

-- PASO 1: Ver el estado actual
SELECT 'PASO 1 - Estado actual:' as info;
SELECT id, name, list_type, is_system_list, is_default, user_id
FROM public.number_lists 
WHERE name = 'All Numbers' OR (list_type = 'all_numbers' AND name = 'All');

-- PASO 2: Eliminar TODAS las restricciones de "All Numbers"
UPDATE public.number_lists 
SET is_default = FALSE, 
    is_system_list = FALSE,
    list_type = 'custom'
WHERE name = 'All Numbers';

-- PASO 3: Eliminar TODAS las referencias en number_list_items
DELETE FROM public.number_list_items 
WHERE list_id IN (
  SELECT id FROM public.number_lists WHERE name = 'All Numbers'
);

-- PASO 4: Ahora eliminar "All Numbers" sin restricciones
DELETE FROM public.number_lists 
WHERE name = 'All Numbers';

-- PASO 5: Verificar que se eliminó
SELECT 'PASO 5 - Verificación:' as info;
SELECT id, name, list_type, is_system_list, is_default
FROM public.number_lists 
WHERE name = 'All Numbers' OR list_type = 'all_numbers';

-- PASO 6: Si aún existe, forzar eliminación por ID
-- (Ejecuta esto solo si el paso anterior no funcionó)
-- DELETE FROM public.number_lists WHERE name = 'All Numbers' OR (list_type = 'all_numbers' AND name != 'All');
