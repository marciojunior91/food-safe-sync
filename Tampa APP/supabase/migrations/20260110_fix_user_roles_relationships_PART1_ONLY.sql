-- ============================================================================
-- FIX USER ROLES ENUM AND RELATIONSHIPS - PART 1: Add Enum Values
-- Sprint 2 Module 1 - People & Authentication
-- Date: January 10, 2026
-- ============================================================================
-- 
-- NOTE: This must be run FIRST, separately from Part 2, because PostgreSQL
-- requires enum values to be committed before they can be used.
--
-- PROBLEM IDENTIFIED:
-- 1. user_roles table uses app_role ENUM: (admin, manager, leader_chef, staff)
-- 2. team_members uses team_member_role ENUM: (cook, barista, manager, leader_chef, admin)
-- 3. Dialogs need: admin, leader_chef, cook, barista, manager
-- 4. Missing: cook and barista in app_role enum
--
-- ============================================================================

-- Step 1: Add missing roles to app_role enum
-- This MUST be run in a separate transaction before Part 2
DO $$ 
BEGIN
  -- Add 'cook' if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'cook' AND enumtypid = 'app_role'::regtype) THEN
    ALTER TYPE app_role ADD VALUE 'cook';
    RAISE NOTICE 'Added cook role to app_role enum';
  ELSE
    RAISE NOTICE 'cook role already exists in app_role enum';
  END IF;
  
  -- Add 'barista' if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'barista' AND enumtypid = 'app_role'::regtype) THEN
    ALTER TYPE app_role ADD VALUE 'barista';
    RAISE NOTICE 'Added barista role to app_role enum';
  ELSE
    RAISE NOTICE 'barista role already exists in app_role enum';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not add enum values: %', SQLERRM;
END $$;

-- Verify the enum values were added
DO $$
BEGIN
  RAISE NOTICE 'Current app_role enum values:';
  RAISE NOTICE '  %', (
    SELECT string_agg(enumlabel::text, ', ' ORDER BY enumsortorder)
    FROM pg_enum 
    WHERE enumtypid = 'app_role'::regtype
  );
END $$;

-- ============================================================================
-- ✅ PART 1 COMPLETE!
-- ============================================================================
-- 
-- The enum values 'cook' and 'barista' have been added to app_role.
--
-- NEXT STEP: 
-- 1. Verify you see "cook" and "barista" in the output above
-- 2. Open a NEW SQL Editor tab (or click "New query")
-- 3. Run: 20260110_fix_user_roles_relationships_part2.sql
--
-- ⚠️ IMPORTANT: You MUST run Part 2 in a separate transaction!
-- ============================================================================
