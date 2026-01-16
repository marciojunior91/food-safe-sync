-- Phase 4: Analytics - Waste Tracking and Compliance

-- ============================================
-- WASTE TRACKING
-- ============================================

CREATE TABLE public.waste_logs (
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

CREATE POLICY "Users can view waste logs in their organization"
ON public.waste_logs FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Staff can log waste"
ON public.waste_logs FOR INSERT
WITH CHECK (
  logged_by = auth.uid() AND
  organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Managers can update waste logs"
ON public.waste_logs FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  ) AND
  public.has_any_role(auth.uid(), ARRAY['admin', 'manager']::app_role[])
);

-- ============================================
-- COMPLIANCE REPORTS
-- ============================================

CREATE TABLE public.compliance_checks (
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

CREATE POLICY "Users can view compliance checks in their organization"
ON public.compliance_checks FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Staff can create compliance checks"
ON public.compliance_checks FOR INSERT
WITH CHECK (
  checked_by = auth.uid() AND
  organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Managers can update compliance checks"
ON public.compliance_checks FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  ) AND
  public.has_any_role(auth.uid(), ARRAY['admin', 'manager', 'leader_chef']::app_role[])
);

-- ============================================
-- EFFICIENCY METRICS
-- ============================================

CREATE TABLE public.production_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid,
  recipe_id uuid REFERENCES public.recipes(id) ON DELETE CASCADE,
  prep_session_id uuid REFERENCES public.prep_sessions(id) ON DELETE SET NULL,
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

CREATE POLICY "Users can view metrics in their organization"
ON public.production_metrics FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Staff can record metrics"
ON public.production_metrics FOR INSERT
WITH CHECK (
  recorded_by = auth.uid() AND
  organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  )
);

-- ============================================
-- ANALYTICS VIEWS
-- ============================================

CREATE OR REPLACE VIEW public.waste_analytics AS
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

CREATE OR REPLACE VIEW public.efficiency_analytics AS
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

CREATE OR REPLACE VIEW public.compliance_summary AS
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