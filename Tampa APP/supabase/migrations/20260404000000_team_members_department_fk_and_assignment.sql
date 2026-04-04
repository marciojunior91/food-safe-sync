-- Migration: Add FK on team_members.department_id + assign members to departments by position
-- Date: 2026-04-04

-- ============================================
-- 1. Clean orphaned department_id values
-- ============================================
UPDATE public.team_members
SET department_id = NULL
WHERE department_id IS NOT NULL
  AND department_id NOT IN (SELECT id FROM public.departments);

-- ============================================
-- 2. Add FK constraint on team_members.department_id → departments(id)
-- ============================================
DO $$ BEGIN
  ALTER TABLE public.team_members
    ADD CONSTRAINT fk_team_members_department
    FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create index for department lookups
CREATE INDEX IF NOT EXISTS idx_team_members_department_id
  ON public.team_members(department_id) WHERE department_id IS NOT NULL;

-- ============================================
-- 3. Assign team members to departments based on position
--    BOH        ← cook, chef, prep (kitchen roles)
--    FOH        ← barista, bar, waiter, garçom, service
--    Managers   ← manager, leader, executive, admin, head chef, kitchen manager
--    Maintenance← (no auto-assignment)
-- ============================================

-- Assign kitchen staff → BOH (cook, prep, line cook, sous chef, etc.)
UPDATE public.team_members tm
SET department_id = d.id
FROM public.departments d
WHERE d.organization_id = tm.organization_id
  AND d.name = 'BOH'
  AND tm.department_id IS NULL
  AND tm.position IS NOT NULL
  AND LOWER(tm.position) ~ '(cook|chef|prep)'
  AND LOWER(tm.position) NOT LIKE '%manager%'
  AND LOWER(tm.position) NOT LIKE '%executive%';

-- Assign front-of-house staff → FOH (barista, bar, waiter, garçom, service)
UPDATE public.team_members tm
SET department_id = d.id
FROM public.departments d
WHERE d.organization_id = tm.organization_id
  AND d.name = 'FOH'
  AND tm.department_id IS NULL
  AND tm.position IS NOT NULL
  AND LOWER(tm.position) ~ '(barista|bar|waiter|garcom|garçom|service|drinks)';

-- Assign management → Managers (manager, leader, executive, admin, kitchen manager)
UPDATE public.team_members tm
SET department_id = d.id
FROM public.departments d
WHERE d.organization_id = tm.organization_id
  AND d.name = 'Managers'
  AND tm.department_id IS NULL
  AND tm.position IS NOT NULL
  AND LOWER(tm.position) ~ '(manager|executive|admin|leader)';
