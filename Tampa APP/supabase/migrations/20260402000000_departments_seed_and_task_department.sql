-- Migration: Add default departments + department_id to routine_tasks
-- Date: 2026-04-02

-- ============================================
-- 1. Seed default departments for all existing organizations
-- ============================================

-- Insert default departments for every organization that doesn't already have them
INSERT INTO public.departments (name, description, organization_id)
SELECT d.name, d.description, o.id
FROM public.organizations o
CROSS JOIN (VALUES
  ('BOH', 'Back of House - Kitchen & Prep'),
  ('FOH', 'Front of House - Bar & Service'),
  ('Maintenance', 'Maintenance & Facilities'),
  ('Managers', 'Management Team')
) AS d(name, description)
WHERE NOT EXISTS (
  SELECT 1 FROM public.departments dep
  WHERE dep.organization_id = o.id AND dep.name = d.name
);

-- ============================================
-- 2. Add department_id to routine_tasks
-- ============================================

ALTER TABLE public.routine_tasks
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL;

-- Create index for efficient department filtering
CREATE INDEX IF NOT EXISTS idx_routine_tasks_department_id ON public.routine_tasks(department_id);

-- ============================================
-- 3. Create trigger to auto-seed departments for new organizations
-- ============================================

CREATE OR REPLACE FUNCTION public.seed_default_departments()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.departments (name, description, organization_id) VALUES
    ('BOH', 'Back of House - Kitchen & Prep', NEW.id),
    ('FOH', 'Front of House - Bar & Service', NEW.id),
    ('Maintenance', 'Maintenance & Facilities', NEW.id),
    ('Managers', 'Management Team', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS trigger_seed_departments ON public.organizations;
CREATE TRIGGER trigger_seed_departments
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_default_departments();
