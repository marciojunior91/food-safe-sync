-- ============================================
-- VERIFICATION SCRIPT
-- ============================================
-- Run this AFTER applying the PRODUCTION_FIX.sql
-- to verify everything was created correctly
-- ============================================

-- Check if prepared_items table exists (should already exist)
SELECT 
  'prepared_items' as table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'prepared_items'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- Check if waste_logs table exists
SELECT 
  'waste_logs' as table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'waste_logs'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- Check if compliance_checks table exists
SELECT 
  'compliance_checks' as table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'compliance_checks'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- Check if production_metrics table exists
SELECT 
  'production_metrics' as table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'production_metrics'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- Check if efficiency_analytics view exists
SELECT 
  'efficiency_analytics' as view_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.views 
      WHERE table_schema = 'public' AND table_name = 'efficiency_analytics'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- Check if waste_analytics view exists
SELECT 
  'waste_analytics' as view_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.views 
      WHERE table_schema = 'public' AND table_name = 'waste_analytics'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- Check if compliance_summary view exists
SELECT 
  'compliance_summary' as view_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.views 
      WHERE table_schema = 'public' AND table_name = 'compliance_summary'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- Show row counts (should be 0 for new tables)
SELECT 'Row Counts:' as info;
SELECT 'waste_logs' as table_name, COUNT(*) as rows FROM public.waste_logs;
SELECT 'compliance_checks' as table_name, COUNT(*) as rows FROM public.compliance_checks;
SELECT 'production_metrics' as table_name, COUNT(*) as rows FROM public.production_metrics;

-- ============================================
-- ALL CHECKS SHOULD SHOW ✅ EXISTS
-- If any show ❌ MISSING, re-run PRODUCTION_FIX.sql
-- ============================================
