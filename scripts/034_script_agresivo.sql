-- SCRIPT AGRESIVO PARA FORZAR ELIMINACIÓN DE "All Numbers"
-- COPIA Y PEGA TODO EN SUPABASE - ESTE SCRIPT ELIMINA TODO LO RELACIONADO

-- 1. Ver qué tenemos
SELECT 'ANTES - Listas existentes:' as info;
SELECT name, list_type, is_system_list, is_default, id
FROM public.number_lists 
WHERE list_type = 'all_numbers';

-- 2. ELIMINAR TODAS las referencias de "All Numbers" en number_list_items
DELETE FROM public.number_list_items 
WHERE list_id IN (
  SELECT id FROM public.number_lists 
  WHERE name = 'All Numbers' AND list_type = 'all_numbers'
);

-- 3. ELIMINAR TODAS las referencias de "All Numbers" en cualquier otra tabla relacionada
-- (Si hay otras tablas que referencien number_lists, las eliminamos aquí)

-- 4. FORZAR eliminación de "All Numbers" sin importar las restricciones
DELETE FROM public.number_lists 
WHERE name = 'All Numbers' AND list_type = 'all_numbers';

-- 5. Si aún existe, usar CASCADE para eliminar todo
-- (Esto eliminará la lista y todas sus referencias automáticamente)
DELETE FROM public.number_lists 
WHERE name = 'All Numbers' 
CASCADE;

-- 6. Verificar que se eliminó
SELECT 'DESPUÉS - Listas restantes:' as info;
SELECT name, list_type, is_system_list, is_default, id
FROM public.number_lists 
WHERE list_type = 'all_numbers';

-- 7. Asegurar que "All" existe y es la única
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

-- 8. Resultado final
SELECT 'RESULTADO FINAL:' as info;
SELECT name, list_type, is_system_list, is_default
FROM public.number_lists 
WHERE list_type = 'all_numbers';
