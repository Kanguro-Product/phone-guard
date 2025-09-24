-- Crear usuario fake para testing
-- Email: admin@test.com
-- Password: admin123

-- Primero insertar en auth.users (esto simula el registro de Supabase)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'admin@test.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Luego insertar en public.users (nuestro perfil personalizado)
INSERT INTO public.users (
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'admin@test.com',
  'Admin User',
  'admin',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  updated_at = now();

-- Crear algunos números de teléfono de ejemplo para el usuario admin
INSERT INTO phone_numbers (
  user_id,
  phone_number,
  status,
  reputation_score,
  provider,
  created_at
) VALUES 
  ('550e8400-e29b-41d4-a716-446655440000'::uuid, '+1234567890', 'active', 85.5, 'Twilio', now()),
  ('550e8400-e29b-41d4-a716-446655440000'::uuid, '+1234567891', 'active', 92.0, 'Vonage', now()),
  ('550e8400-e29b-41d4-a716-446655440000'::uuid, '+1234567892', 'paused', 78.3, 'Twilio', now());
