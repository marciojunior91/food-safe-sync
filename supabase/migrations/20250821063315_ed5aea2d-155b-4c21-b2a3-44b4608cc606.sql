-- Add a default staff member for testing
INSERT INTO public.staff (name, role, is_active) 
VALUES ('Test User', 'Kitchen Staff', true)
ON CONFLICT DO NOTHING;

-- Add a few sample staff members for testing
INSERT INTO public.staff (name, role, is_active) 
VALUES 
  ('John Smith', 'Line Cook', true),
  ('Maria Garcia', 'Prep Cook', true),
  ('Georgia Jones', 'Sous Chef', true)
ON CONFLICT DO NOTHING;