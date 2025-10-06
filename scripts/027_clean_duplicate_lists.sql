-- Script para limpiar listas duplicadas
-- Elimina "All Numbers" y "Todos los Números" duplicadas, manteniendo solo "All"

-- 1. Primero, mover todos los números de "All Numbers" a "All" si existe
UPDATE public.number_list_items 
SET list_id = (
  SELECT id FROM public.number_lists 
  WHERE name = 'All' AND list_type = 'all_numbers' 
  LIMIT 1
)
WHERE list_id IN (
  SELECT id FROM public.number_lists 
  WHERE name = 'All Numbers' AND list_type = 'all_numbers'
);

-- 2. Mover todos los números de "Todos los Números" a "All" si existe
UPDATE public.number_list_items 
SET list_id = (
  SELECT id FROM public.number_lists 
  WHERE name = 'All' AND list_type = 'all_numbers' 
  LIMIT 1
)
WHERE list_id IN (
  SELECT id FROM public.number_lists 
  WHERE name = 'Todos los Números' AND list_type = 'all_numbers'
);

-- 3. Eliminar las listas duplicadas "All Numbers" y "Todos los Números"
DELETE FROM public.number_lists 
WHERE name IN ('All Numbers', 'Todos los Números') 
AND list_type = 'all_numbers';

-- 4. Asegurar que solo existe "All" para all_numbers
-- Si no existe "All", crear una
INSERT INTO public.number_lists (
  user_id, 
  name, 
  description, 
  color, 
  icon, 
  is_default,
  list_type,
  is_system_list
)
SELECT 
  DISTINCT u.id,
  'All',
  'Lista principal que contiene todos los números de teléfono',
  '#3B82F6',
  'Phone',
  TRUE,
  'all_numbers',
  TRUE
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.number_lists 
  WHERE number_lists.user_id = u.id 
  AND number_lists.name = 'All'
  AND number_lists.list_type = 'all_numbers'
);

-- 5. Verificar el resultado
SELECT 
  'Listas después de limpieza' as mensaje,
  name,
  list_type,
  is_system_list,
  COUNT(*) as total_listas
FROM public.number_lists
WHERE list_type = 'all_numbers'
GROUP BY name, list_type, is_system_list
ORDER BY name;
