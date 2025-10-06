-- Script para asegurar que la carpeta "Números Descartados" exista
-- Este script crea específicamente la lista de números descartados

-- 1. Crear "Números Descartados" para todos los usuarios que no la tengan
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
    'Números que han sido marcados como descartados o eliminados',
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

-- 2. Verificar que se crearon las listas
SELECT 
    'Listas creadas' as mensaje,
    COUNT(*) as total_listas,
    COUNT(CASE WHEN name = 'Todos los Números' THEN 1 END) as todos_los_numeros,
    COUNT(CASE WHEN name = 'Números Descartados' THEN 1 END) as numeros_descartados
FROM public.number_lists
WHERE list_type IN ('all_numbers', 'discarded');

-- 3. Mostrar las listas por usuario
SELECT 
    u.email,
    nl.name,
    nl.list_type,
    nl.is_system_list,
    nl.color
FROM auth.users u
LEFT JOIN public.number_lists nl ON u.id = nl.user_id
WHERE nl.list_type IN ('all_numbers', 'discarded')
ORDER BY u.email, nl.list_type;
