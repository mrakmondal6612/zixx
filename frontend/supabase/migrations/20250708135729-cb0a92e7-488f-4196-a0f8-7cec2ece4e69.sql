-- Create a test user for demonstration
-- Insert a test user into the auth.users table (this is normally done through Supabase Auth)
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
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'test@zixx.com',
  '$2a$10$ZOQgdPP5xwKG.aKCjzZ8Ge3i3ELp7LxN7TLMhLJfXKP7k9QgKSyEa', -- password: "testpass123"
  now(),
  now(),
  now(),
  now()
);

-- Create corresponding profile for the test user
INSERT INTO public.profiles (
  user_id,
  display_name,
  phone,
  address,
  city,
  country,
  postal_code
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Test User',
  '+1234567890',
  '123 Test Street',
  'Test City',
  'Test Country',
  '12345'
);