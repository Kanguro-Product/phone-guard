-- Script SIMPLE para eliminar "All Numbers" y mantener solo "All"
-- Ejecuta este script en Supabase SQL Editor

-- 1. Ver qué listas tienes actualmente
SELECT 'ANTES - Listas actuales:' as estado;
SELECT name, list_type, is_system_list, COUNT(*) as cantidad
FROM public.number_lists 
WHERE list_type = 'all_numbers'
GROUP BY name, list_type, is_system_list;

-- 2. Mover todos los números de "All Numbers" a "All"
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

-- 3. Eliminar "All Numbers"
DELETE FROM public.number_lists 
WHERE name = 'All Numbers' AND list_type = 'all_numbers';

-- 4. Ver el resultado final
SELECT 'DESPUÉS - Listas finales:' as estado;
SELECT name, list_type, is_system_list, COUNT(*) as cantidad
FROM public.number_lists 
WHERE list_type = 'all_numbers'
GROUP BY name, list_type, is_system_list;

-- 5. Mostrar todas las listas por usuario
SELECT 'Listas por usuario:' as estado;
SELECT 
  u.email,
  nl.name,
  nl.list_type,
  nl.is_system_list
FROM auth.users u
LEFT JOIN public.number_lists nl ON u.id = nl.user_id
WHERE nl.list_type = 'all_numbers'
ORDER BY u.email, nl.name;
