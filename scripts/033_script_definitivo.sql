-- SCRIPT DEFINITIVO PARA ARREGLAR TODO - COPIA Y PEGA EN SUPABASE
-- Este script maneja todos los casos posibles y arregla todo de una vez

-- 1. Ver el estado actual
SELECT 'ESTADO INICIAL:' as info;
SELECT name, list_type, is_system_list, is_default, user_id
FROM public.number_lists 
WHERE list_type = 'all_numbers'
ORDER BY name;

-- 2. Mover todos los números de "All Numbers" a "All" (si existen)
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

-- 3. Quitar todas las marcas de default de "All Numbers"
UPDATE public.number_lists 
SET is_default = FALSE, is_system_list = FALSE
WHERE name = 'All Numbers' AND list_type = 'all_numbers';

-- 4. Asegurar que "All" sea la única lista por defecto
UPDATE public.number_lists 
SET is_default = TRUE, is_system_list = TRUE
WHERE name = 'All' AND list_type = 'all_numbers';

-- 5. Eliminar "All Numbers" definitivamente
DELETE FROM public.number_lists 
WHERE name = 'All Numbers' AND list_type = 'all_numbers';

-- 6. Si no existe "All", crearla para todos los usuarios
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

-- 7. Verificar el resultado final
SELECT 'ESTADO FINAL:' as info;
SELECT name, list_type, is_system_list, is_default, user_id
FROM public.number_lists 
WHERE list_type = 'all_numbers'
ORDER BY name;

-- 8. Mostrar resumen por usuario
SELECT 'RESUMEN POR USUARIO:' as info;
SELECT 
  u.email,
  nl.name,
  nl.list_type,
  nl.is_system_list,
  nl.is_default
FROM auth.users u
LEFT JOIN public.number_lists nl ON u.id = nl.user_id
WHERE nl.list_type = 'all_numbers'
ORDER BY u.email, nl.name;
