-- Fix security definer views by recreating them with proper security

DROP VIEW IF EXISTS public.waste_analytics;
DROP VIEW IF EXISTS public.efficiency_analytics;
DROP VIEW IF EXISTS public.compliance_summary;

-- Recreate views without security definer
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