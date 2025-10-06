-- Script para poblar las listas con números existentes
-- Este script asegura que todos los números estén en "Todos los Números"

-- 1. Crear listas obligatorias para todos los usuarios si no existen
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
    'Todos los Números',
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
    AND number_lists.name = 'Todos los Números'
);

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
    'Números Descartados',
    'Números que han sido marcados como descartados',
    '#EF4444',
    'Trash2',
    TRUE,
    'discarded',
    TRUE
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.number_lists 
    WHERE number_lists.user_id = u.id 
    AND number_lists.name = 'Números Descartados'
);

-- 2. Agregar TODOS los números existentes a "Todos los Números"
-- (excepto los que ya estén en "Números Descartados")
INSERT INTO public.number_list_items (list_id, phone_number_id, added_by, notes)
SELECT 
    nl.id,
    pn.id,
    pn.user_id,
    'Agregado automáticamente a lista principal'
FROM public.number_lists nl
JOIN public.phone_numbers pn ON nl.user_id = pn.user_id
WHERE nl.name = 'Todos los Números'
AND nl.list_type = 'all_numbers'
-- Excluir números que ya están en descartados
AND pn.id NOT IN (
    SELECT nli.phone_number_id 
    FROM public.number_list_items nli
    JOIN public.number_lists nl2 ON nli.list_id = nl2.id
    WHERE nl2.name = 'Números Descartados'
    AND nl2.user_id = pn.user_id
)
ON CONFLICT (list_id, phone_number_id) DO NOTHING;

-- 3. Verificar que los números descartados estén en su lista correspondiente
-- (esto es por si acaso hay números marcados como descartados pero no están en la lista)
INSERT INTO public.number_list_items (list_id, phone_number_id, added_by, notes)
SELECT 
    nl.id,
    pn.id,
    pn.user_id,
    'Número descartado agregado automáticamente'
FROM public.number_lists nl
JOIN public.phone_numbers pn ON nl.user_id = pn.user_id
WHERE nl.name = 'Números Descartados'
AND nl.list_type = 'discarded'
AND pn.status = 'deprecated'  -- Números marcados como en desuso
ON CONFLICT (list_id, phone_number_id) DO NOTHING;

-- 4. Actualizar contadores de listas (opcional, para mostrar números correctos)
-- Esto se puede hacer con una vista o función, pero por ahora lo dejamos así

-- 5. Mostrar resumen de lo que se hizo
SELECT 
    'Resumen de población de listas' as mensaje,
    COUNT(DISTINCT nl.id) as listas_creadas,
    COUNT(DISTINCT nli.phone_number_id) as numeros_agregados
FROM public.number_lists nl
LEFT JOIN public.number_list_items nli ON nl.id = nli.list_id
WHERE nl.list_type IN ('all_numbers', 'discarded');
