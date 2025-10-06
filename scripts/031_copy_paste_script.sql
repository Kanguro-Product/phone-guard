-- Script directo para eliminar "All Numbers" - COPIA Y PEGA TODO ESTO

-- 1. Primero ver qué tienes
SELECT name, list_type, is_system_list 
FROM public.number_lists 
WHERE list_type = 'all_numbers';

-- 2. Eliminar "All Numbers"
DELETE FROM public.number_lists 
WHERE name = 'All Numbers' AND list_type = 'all_numbers';

-- 3. Verificar resultado
SELECT name, list_type, is_system_list 
FROM public.number_lists 
WHERE list_type = 'all_numbers';
