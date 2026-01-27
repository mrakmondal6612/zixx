-- Create a different test user for demonstration
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_sent_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'demo@zixx.com',
  '$2a$10$ZOQgdPP5xwKG.aKCjzZ8Ge3i3ELp7LxN7TLMhLJfXKP7k9QgKSyEa', -- password: "testpass123"
  now(),
  now(),
  now(),
  now()
);

-- Create corresponding profile for the demo user
INSERT INTO public.profiles (
  user_id,
  display_name,
  phone,
  address,
  city,
  country,
  postal_code
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'Demo User',
  '+1987654321',
  '456 Demo Avenue',
  'Demo City',
  'Demo Country',
  '54321'
);