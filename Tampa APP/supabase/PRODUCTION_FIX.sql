-- ============================================
-- PRODUCTION FIX: Apply Missing Migrations
-- ============================================
-- This script creates all missing tables and views
-- that are causing 404 errors in production
--
-- Run this in Supabase SQL Editor:
-- https://app.supabase.com/project/imnecvcvhypnlvujajpn
--
-- Date: January 16, 2026
-- ============================================

BEGIN;

-- ============================================
-- STEP 1: CREATE WASTE LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.waste_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid,
  logged_by uuid NOT NULL,
  item_name text NOT NULL,
  quantity numeric NOT NULL,
  unit text NOT NULL,
  reason text NOT NULL, -- spoilage, expired, preparation_error, over_production
  category text, -- protein, vegetable, dairy, grain, other
  estimated_cost numeric,
  notes text,
  logged_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.waste_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view waste logs in their organization" ON public.waste_logs;
CREATE POLICY "Users can view waste logs in their organization"
ON public.waste_logs FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM profiles WHERE user_id = auth.uid()
));

DROP POLICY IF EXISTS "Staff can log waste" ON public.waste_logs;
CREATE POLICY "Staff can log waste"
ON public.waste_logs FOR INSERT
WITH CHECK (
  logged_by = auth.uid() AND
  organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Managers can update waste logs" ON public.waste_logs;
CREATE POLICY "Managers can update waste logs"
ON public.waste_logs FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  ) AND
  public.has_any_role(auth.uid(), ARRAY['admin', 'manager']::app_role[])
);

-- ============================================
-- STEP 2: CREATE COMPLIANCE CHECKS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.compliance_checks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid,
  check_type text NOT NULL, -- temperature, sanitation, equipment, documentation
  area text NOT NULL, -- kitchen, storage, prep, service
  status text NOT NULL DEFAULT 'pending', -- pending, passed, failed, needs_attention
  checked_by uuid NOT NULL,
  temperature_reading numeric,
  notes text,
  corrective_action text,
  checked_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.compliance_checks ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view compliance checks in their organization" ON public.compliance_checks;
CREATE POLICY "Users can view compliance checks in their organization"
ON public.compliance_checks FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM profiles WHERE user_id = auth.uid()
));

DROP POLICY IF EXISTS "Staff can create compliance checks" ON public.compliance_checks;
CREATE POLICY "Staff can create compliance checks"
ON public.compliance_checks FOR INSERT
WITH CHECK (
  checked_by = auth.uid() AND
  organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Managers can update compliance checks" ON public.compliance_checks;
CREATE POLICY "Managers can update compliance checks"
ON public.compliance_checks FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  ) AND
  public.has_any_role(auth.uid(), ARRAY['admin', 'manager', 'leader_chef']::app_role[])
);

-- ============================================
-- STEP 3: CREATE PRODUCTION METRICS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.production_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid,
  recipe_id uuid REFERENCES public.recipes(id) ON DELETE CASCADE,
  prep_session_id uuid, -- Foreign key removed - prep_sessions table may not exist
  actual_time_minutes integer NOT NULL,
  planned_time_minutes integer,
  quantity_produced numeric NOT NULL,
  quality_rating integer CHECK (quality_rating >= 1 AND quality_rating <= 5),
  staff_count integer,
  notes text,
  recorded_by uuid NOT NULL,
  recorded_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.production_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view metrics in their organization" ON public.production_metrics;
CREATE POLICY "Users can view metrics in their organization"
ON public.production_metrics FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM profiles WHERE user_id = auth.uid()
));

DROP POLICY IF EXISTS "Staff can record metrics" ON public.production_metrics;
CREATE POLICY "Staff can record metrics"
ON public.production_metrics FOR INSERT
WITH CHECK (
  recorded_by = auth.uid() AND
  organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  )
);

-- ============================================
-- STEP 4: CREATE ANALYTICS VIEWS
-- ============================================

-- Drop existing views if any
DROP VIEW IF EXISTS public.waste_analytics;
DROP VIEW IF EXISTS public.efficiency_analytics;
DROP VIEW IF EXISTS public.compliance_summary;

-- Waste Analytics View
CREATE VIEW public.waste_analytics 
WITH (security_invoker=true) AS
SELECT 
  organization_id,
  DATE_TRUNC('day', logged_at) as date,
  reason,
  category,
  SUM(quantity) as total_quantity,
  SUM(estimated_cost) as total_cost,
  COUNT(*) as log_count
FROM public.waste_logs
GROUP BY organization_id, DATE_TRUNC('day', logged_at), reason, category;

-- Efficiency Analytics View
CREATE VIEW public.efficiency_analytics
WITH (security_invoker=true) AS
SELECT 
  pm.organization_id,
  r.name as recipe_name,
  r.category as recipe_category,
  AVG(pm.actual_time_minutes::numeric / NULLIF(pm.planned_time_minutes, 0)) as time_efficiency_ratio,
  AVG(pm.quality_rating) as avg_quality,
  SUM(pm.quantity_produced) as total_produced,
  COUNT(*) as production_count
FROM public.production_metrics pm
JOIN public.recipes r ON r.id = pm.recipe_id
WHERE pm.planned_time_minutes IS NOT NULL
GROUP BY pm.organization_id, r.id, r.name, r.category;

-- Compliance Summary View
CREATE VIEW public.compliance_summary
WITH (security_invoker=true) AS
SELECT 
  organization_id,
  DATE_TRUNC('day', checked_at) as date,
  check_type,
  area,
  COUNT(*) as total_checks,
  SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) as passed_count,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
  SUM(CASE WHEN status = 'needs_attention' THEN 1 ELSE 0 END) as needs_attention_count
FROM public.compliance_checks
GROUP BY organization_id, DATE_TRUNC('day', checked_at), check_type, area;

-- ============================================
-- STEP 5: VERIFY EVERYTHING WAS CREATED
-- ============================================

-- Check tables
SELECT 'Tables Created:' as status;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('waste_logs', 'compliance_checks', 'production_metrics')
ORDER BY table_name;

-- Check views
SELECT 'Views Created:' as status;
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name IN ('waste_analytics', 'efficiency_analytics', 'compliance_summary')
ORDER BY table_name;

COMMIT;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
-- If you see all 3 tables and 3 views listed above, 
-- the migration was successful! ✅
-- 
-- Next step: Redeploy your application on Vercel
-- ============================================
