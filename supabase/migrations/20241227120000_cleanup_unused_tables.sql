-- ============================================================================
-- Cleanup Script: Remove Unused Tables
-- Date: December 27, 2025
-- ============================================================================
-- This script removes tables that are not part of the current application
-- architecture for Iteration 13 (Routine Tasks, Feed, People modules).
--
-- IMPORTANT: Review this script carefully before running!
-- Backup your database before executing!
-- ============================================================================

-- ============================================================================
-- 1. DROP OLD DAILY ROUTINES TABLES (replaced by new routine_tasks)
-- ============================================================================

-- These old tables are replaced by our new Iteration 13 structure:
-- - daily_routines → replaced by task_templates + routine_tasks
-- - routine_tasks (old) → replaced by routine_tasks (new, different structure)
-- - routine_completions → replaced by routine_tasks.status tracking

DROP TABLE IF EXISTS public.routine_completions CASCADE;
--DROP TABLE IF EXISTS public.routine_tasks CASCADE;  -- Note: conflicts with new table name
DROP TABLE IF EXISTS public.daily_routines CASCADE;

-- ============================================================================
-- 2. DROP OLD NOTIFICATIONS TABLE (replaced by feed_items)
-- ============================================================================

-- Old notifications table replaced by feed_items + feed_reads
DROP TABLE IF EXISTS public.notifications CASCADE;

-- ============================================================================
-- 3. DROP CHAT/MESSAGING TABLES (not in current scope)
-- ============================================================================

-- Chat functionality is not part of Iteration 13 scope
-- Can be re-added later if needed
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.chat_members CASCADE;
DROP TABLE IF EXISTS public.chat_channels CASCADE;

-- ============================================================================
-- 4. DROP TRAINING MODULE TABLES (not in current scope)
-- ============================================================================

-- Training/certifications not part of current People module scope
-- Can be re-added as part of future iterations
DROP TABLE IF EXISTS public.training_enrollments CASCADE;
DROP TABLE IF EXISTS public.training_courses CASCADE;
DROP TABLE IF EXISTS public.certifications CASCADE;

-- ============================================================================
-- 5. KEEP DEPARTMENTS TABLE (multiple locations in same restaurant)
-- ============================================================================

-- Departments/locations will be used for:
-- - Main Kitchen, Pastry Station, Coffee Bar, etc.
-- - Different physical locations within the same restaurant
-- KEEPING THIS TABLE - DO NOT DELETE

-- ============================================================================
-- 6. OPERATIONAL TRACKING TABLES (not in current scope)
-- ============================================================================

-- These were part of a more complex operational tracking system
-- Not needed for current Iteration 13 scope
DROP TABLE IF EXISTS public.production_metrics CASCADE;
DROP TABLE IF EXISTS public.compliance_checks CASCADE;
DROP TABLE IF EXISTS public.waste_logs CASCADE;

-- ============================================================================
-- 7. DROP PREPARED ITEMS TABLE (unclear usage)
-- ============================================================================

-- This table's purpose is unclear and doesn't fit current modules
DROP TABLE IF EXISTS public.prepared_items CASCADE;

-- ============================================================================
-- 8. DROP PREP SESSIONS & STAFF TABLES (redundant with profiles)
-- ============================================================================

-- Staff table is redundant with profiles table
-- Prep sessions not part of current scope
DROP TABLE IF EXISTS public.prep_sessions CASCADE;
--DROP TABLE IF EXISTS public.staff CASCADE;

-- ============================================================================
-- 9. KEEP USER_ROLES TABLE (important for role management)
-- ============================================================================

-- User roles table provides additional role management capabilities
-- beyond the simple role field in profiles table
-- KEEPING THIS TABLE - DO NOT DELETE

-- ============================================================================
-- 10. DROP ROLE_AUDIT_LOG TABLE (not in current scope)
-- ============================================================================

-- Audit logging can be re-added later if needed
DROP TABLE IF EXISTS public.role_audit_log CASCADE;

-- ============================================================================
-- TABLES TO KEEP (still in use)
-- ============================================================================

-- ✅ profiles - Core user management
-- ✅ organizations - Multi-tenant structure (new)
-- ✅ departments - Multiple locations within restaurant (Main Kitchen, Pastry, etc.)
-- ✅ user_roles - Role management system
-- ✅ recipes - Recipes module
-- ✅ products - Inventory/labeling
-- ✅ label_categories - Labeling module
-- ✅ label_subcategories - Labeling module
-- ✅ product_subcategories - Labeling module
-- ✅ allergens - Labeling module
-- ✅ product_allergens - Labeling module
-- ✅ measuring_units - Recipes/inventory
-- ✅ printed_labels - Labeling history
-- ✅ label_templates - Label customization
-- ✅ label_drafts - Label draft system
-- ✅ print_queue - Print queue system
-- ✅ task_templates - NEW (Routine Tasks module)
-- ✅ routine_tasks - NEW (Routine Tasks module)
-- ✅ task_attachments - NEW (Routine Tasks module)
-- ✅ feed_items - NEW (Feed module)
-- ✅ feed_reads - NEW (Feed module)
-- ✅ user_pins - NEW (People module)
-- ✅ user_documents - NEW (People module)

-- ============================================================================
-- SUMMARY OF DELETIONS
-- ============================================================================

-- Daily Routines (old): 2 tables
--   - daily_routines
--   - routine_completions
--   Note: routine_tasks (old) conflicts with new table, CASCADE will handle

-- Notifications (old): 1 table
--   - notifications

-- Chat/Messaging: 3 tables
--   - chat_channels, chat_members, chat_messages

-- Training: 3 tables
--   - training_courses, training_enrollments, certifications

-- Operations Tracking: 3 tables
--   - waste_logs, compliance_checks, production_metrics

-- Misc: 3 tables
--   - prepared_items, prep_sessions, role_audit_log

-- TOTAL: 15 tables removed

-- TABLES KEPT (that were originally considered for deletion):
-- ✅ departments - For multiple restaurant locations (Main Kitchen, Pastry, etc.)
-- ✅ user_roles - Role management system
-- ✅ staff - May be needed (commented out for safety)

-- ============================================================================
-- END OF CLEANUP SCRIPT
-- ============================================================================
