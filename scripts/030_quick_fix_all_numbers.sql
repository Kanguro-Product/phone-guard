-- ALTERNATIVA: Script de una sola línea para ejecutar directamente
-- Copia y pega esto en Supabase SQL Editor:

-- Opción 1: Solo eliminar "All Numbers" (si ya tienes "All")
DELETE FROM public.number_lists WHERE name = 'All Numbers' AND list_type = 'all_numbers';

-- Opción 2: Si quieres verificar primero qué tienes
SELECT name, list_type FROM public.number_lists WHERE list_type = 'all_numbers';

-- Opción 3: Si quieres renombrar "All Numbers" a "All"
UPDATE public.number_lists SET name = 'All' WHERE name = 'All Numbers' AND list_type = 'all_numbers';
