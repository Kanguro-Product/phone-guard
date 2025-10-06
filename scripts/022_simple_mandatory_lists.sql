-- Script simplificado para agregar las columnas necesarias
-- Este script solo agrega las columnas que faltan sin crear funciones complejas

-- Agregar columnas necesarias a la tabla number_lists
ALTER TABLE public.number_lists 
ADD COLUMN IF NOT EXISTS list_type VARCHAR(50) DEFAULT 'custom',
ADD COLUMN IF NOT EXISTS is_system_list BOOLEAN DEFAULT FALSE;

-- Crear índices para las nuevas columnas
CREATE INDEX IF NOT EXISTS idx_number_lists_list_type ON public.number_lists(list_type);
CREATE INDEX IF NOT EXISTS idx_number_lists_is_system ON public.number_lists(is_system_list);

-- Crear listas obligatorias para usuarios existentes que no las tengan
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

-- Agregar todos los números existentes a la lista "Todos los Números"
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
ON CONFLICT (list_id, phone_number_id) DO NOTHING;
