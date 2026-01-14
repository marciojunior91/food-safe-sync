-- ============================================================================
-- ROLLBACK: Restore Original Policies + Fix Security Issue
-- ============================================================================
-- This script restores ALL original policies that were working, then ONLY
-- adds the missing organization_id checks to admin/manager policies.
-- ============================================================================

BEGIN;

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'ROLLING BACK AND RESTORING ORIGINAL POLICIES...';
  RAISE NOTICE '============================================================================';
END $$;


-- ============================================================================
-- STEP 1: Create helper functions (for security fix only)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
DECLARE
  org_id UUID;
BEGIN
  SELECT organization_id INTO org_id FROM profiles WHERE id = auth.uid();
  RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ============================================================================
-- STEP 2: RESTORE PROFILES POLICIES (ORIGINAL + FIXED)
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Restoring profiles policies...';
  
  -- Drop any existing
  DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
  DROP POLICY IF EXISTS "Admins can view profiles in their organization" ON profiles;
  DROP POLICY IF EXISTS "Admins can update profiles in their organization" ON profiles;
  DROP POLICY IF EXISTS "Service role can manage profiles" ON profiles;
  
  -- Restore original working policies
  CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (id = auth.uid());

  CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

  -- Admin policies with FIXED organization check using helper function
  CREATE POLICY "Admins can view profiles in their organization"
    ON profiles FOR SELECT
    USING (
      organization_id = get_user_organization_id()
      AND EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
        AND organization_id = get_user_organization_id()
      )
    );

  CREATE POLICY "Admins can update profiles in their organization"
    ON profiles FOR UPDATE
    USING (
      organization_id = get_user_organization_id()
      AND EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
        AND organization_id = get_user_organization_id()
      )
    )
    WITH CHECK (
      organization_id = get_user_organization_id()
      AND EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
        AND organization_id = get_user_organization_id()
      )
    );
  
  CREATE POLICY "Service role can manage profiles"
    ON profiles FOR ALL
    USING (auth.uid() IS NULL)
    WITH CHECK (auth.uid() IS NULL);
  
  RAISE NOTICE '✓ Restored profiles policies';
END $$;


-- ============================================================================
-- STEP 3: RESTORE USER_ROLES POLICIES (ORIGINAL + FIXED)
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Restoring user_roles policies...';
  
  DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
  DROP POLICY IF EXISTS "Users can view roles in their organization" ON user_roles;
  DROP POLICY IF EXISTS "Admins can manage roles in their organization" ON user_roles;
  DROP POLICY IF EXISTS "Service role can manage user_roles" ON user_roles;
  
  CREATE POLICY "Users can view their own role"
    ON user_roles FOR SELECT
    USING (user_id = auth.uid());

  CREATE POLICY "Users can view roles in their organization"
    ON user_roles FOR SELECT
    USING (organization_id = get_user_organization_id());

  CREATE POLICY "Admins can manage roles in their organization"
    ON user_roles FOR ALL
    USING (
      organization_id = get_user_organization_id()
      AND EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
        AND ur.organization_id = get_user_organization_id()
      )
    )
    WITH CHECK (
      organization_id = get_user_organization_id()
      AND EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
        AND ur.organization_id = get_user_organization_id()
      )
    );
  
  CREATE POLICY "Service role can manage user_roles"
    ON user_roles FOR ALL
    USING (auth.uid() IS NULL)
    WITH CHECK (auth.uid() IS NULL);
  
  RAISE NOTICE '✓ Restored user_roles policies';
END $$;


-- ============================================================================
-- STEP 4: RESTORE TEAM_MEMBERS POLICIES (ORIGINAL + FIXED)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') THEN
    RAISE NOTICE 'Restoring team_members policies...';
    
    DROP POLICY IF EXISTS "view_team_members_in_org" ON team_members;
    DROP POLICY IF EXISTS "create_team_members" ON team_members;
    DROP POLICY IF EXISTS "update_team_members" ON team_members;
    DROP POLICY IF EXISTS "Service role can manage team_members" ON team_members;
    
    -- Simple view policy - works for everyone
    CREATE POLICY "view_team_members_in_org"
      ON team_members FOR SELECT
      USING (organization_id = get_user_organization_id());

    -- Create policy with proper org check
    CREATE POLICY "create_team_members"
      ON team_members FOR INSERT
      WITH CHECK (
        organization_id = get_user_organization_id()
        AND EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_id = auth.uid()
          AND role IN ('admin', 'manager')
          AND organization_id = get_user_organization_id()
        )
      );

    -- Update policy: own record OR manager
    CREATE POLICY "update_team_members"
      ON team_members FOR UPDATE
      USING (
        auth_role_id = auth.uid()
        OR (
          organization_id = get_user_organization_id()
          AND EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'manager')
            AND organization_id = get_user_organization_id()
          )
        )
      )
      WITH CHECK (
        auth_role_id = auth.uid()
        OR (
          organization_id = get_user_organization_id()
          AND EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'manager')
            AND organization_id = get_user_organization_id()
          )
        )
      );
    
    CREATE POLICY "Service role can manage team_members"
      ON team_members FOR ALL
      USING (auth.uid() IS NULL)
      WITH CHECK (auth.uid() IS NULL);
    
    RAISE NOTICE '✓ Restored team_members policies';
  END IF;
END $$;


-- ============================================================================
-- STEP 5: RESTORE ORGANIZATIONS POLICIES
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
    RAISE NOTICE 'Restoring organizations policies...';
    
    DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
    DROP POLICY IF EXISTS "Admins can update their own organization" ON organizations;
    DROP POLICY IF EXISTS "Service role can manage organizations" ON organizations;
    
    CREATE POLICY "Users can view their own organization"
      ON organizations FOR SELECT
      USING (id = get_user_organization_id());

    CREATE POLICY "Admins can update their own organization"
      ON organizations FOR UPDATE
      USING (
        id = get_user_organization_id()
        AND EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_id = auth.uid()
          AND role = 'admin'
          AND organization_id = get_user_organization_id()
        )
      )
      WITH CHECK (
        id = get_user_organization_id()
        AND EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_id = auth.uid()
          AND role = 'admin'
          AND organization_id = get_user_organization_id()
        )
      );
    
    CREATE POLICY "Service role can manage organizations"
      ON organizations FOR ALL
      USING (auth.uid() IS NULL)
      WITH CHECK (auth.uid() IS NULL);
    
    RAISE NOTICE '✓ Restored organizations policies';
  END IF;
END $$;


-- ============================================================================
-- STEP 6: RESTORE RECIPES POLICIES
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recipes') THEN
    RAISE NOTICE 'Restoring recipes policies...';
    
    DROP POLICY IF EXISTS "Users can view recipes in their organization" ON recipes;
    DROP POLICY IF EXISTS "Leader chefs and admins can create recipes" ON recipes;
    DROP POLICY IF EXISTS "Leader chefs and admins can update recipes" ON recipes;
    DROP POLICY IF EXISTS "Admins can delete recipes in their organization" ON recipes;
    DROP POLICY IF EXISTS "Service role can manage recipes" ON recipes;
    
    CREATE POLICY "Users can view recipes in their organization"
      ON recipes FOR SELECT
      USING (organization_id = get_user_organization_id());

    CREATE POLICY "Leader chefs and admins can create recipes"
      ON recipes FOR INSERT
      WITH CHECK (
        organization_id = get_user_organization_id()
        AND EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_id = auth.uid()
          AND role IN ('admin', 'manager', 'leader_chef')
          AND organization_id = get_user_organization_id()
        )
      );

    CREATE POLICY "Leader chefs and admins can update recipes"
      ON recipes FOR UPDATE
      USING (
        organization_id = get_user_organization_id()
        AND EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_id = auth.uid()
          AND role IN ('admin', 'manager', 'leader_chef')
          AND organization_id = get_user_organization_id()
        )
      )
      WITH CHECK (
        organization_id = get_user_organization_id()
        AND EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_id = auth.uid()
          AND role IN ('admin', 'manager', 'leader_chef')
          AND organization_id = get_user_organization_id()
        )
      );

    CREATE POLICY "Admins can delete recipes in their organization"
      ON recipes FOR DELETE
      USING (
        organization_id = get_user_organization_id()
        AND EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_id = auth.uid()
          AND role = 'admin'
          AND organization_id = get_user_organization_id()
        )
      );
    
    CREATE POLICY "Service role can manage recipes"
      ON recipes FOR ALL
      USING (auth.uid() IS NULL)
      WITH CHECK (auth.uid() IS NULL);
    
    RAISE NOTICE '✓ Restored recipes policies';
  END IF;
END $$;


-- ============================================================================
-- STEP 7: RESTORE PRODUCTS POLICIES
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
    RAISE NOTICE 'Restoring products policies...';
    
    DROP POLICY IF EXISTS "Users can view products in their organization" ON products;
    DROP POLICY IF EXISTS "Users can create products in their organization" ON products;
    DROP POLICY IF EXISTS "Users can update products in their organization" ON products;
    DROP POLICY IF EXISTS "Managers can delete products in their organization" ON products;
    DROP POLICY IF EXISTS "Service role can manage products" ON products;
    
    CREATE POLICY "Users can view products in their organization"
      ON products FOR SELECT
      USING (organization_id = get_user_organization_id());

    CREATE POLICY "Users can create products in their organization"
      ON products FOR INSERT
      WITH CHECK (organization_id = get_user_organization_id());

    CREATE POLICY "Users can update products in their organization"
      ON products FOR UPDATE
      USING (organization_id = get_user_organization_id())
      WITH CHECK (organization_id = get_user_organization_id());

    CREATE POLICY "Managers can delete products in their organization"
      ON products FOR DELETE
      USING (
        organization_id = get_user_organization_id()
        AND EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_id = auth.uid()
          AND role IN ('admin', 'manager')
          AND organization_id = get_user_organization_id()
        )
      );
    
    CREATE POLICY "Service role can manage products"
      ON products FOR ALL
      USING (auth.uid() IS NULL)
      WITH CHECK (auth.uid() IS NULL);
    
    RAISE NOTICE '✓ Restored products policies';
  END IF;
END $$;


-- ============================================================================
-- STEP 8: RESTORE OTHER TABLE POLICIES (simple ones)
-- ============================================================================

DO $$
BEGIN
  -- FEED_READS
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feed_reads') THEN
    RAISE NOTICE 'Restoring feed_reads policies...';
    
    DROP POLICY IF EXISTS "Users can view their own feed reads" ON feed_reads;
    DROP POLICY IF EXISTS "Users can create their own feed reads" ON feed_reads;
    DROP POLICY IF EXISTS "Users can update their own feed reads" ON feed_reads;
    
    CREATE POLICY "Users can view their own feed reads"
      ON feed_reads FOR SELECT
      USING (user_id = auth.uid());

    CREATE POLICY "Users can create their own feed reads"
      ON feed_reads FOR INSERT
      WITH CHECK (user_id = auth.uid());

    CREATE POLICY "Users can update their own feed reads"
      ON feed_reads FOR UPDATE
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
  
  -- FEED_ITEMS
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feed_items') THEN
    RAISE NOTICE 'Restoring feed_items policies...';
    
    DROP POLICY IF EXISTS "Users can view feed items in their organization" ON feed_items;
    DROP POLICY IF EXISTS "Admins can create feed items in their organization" ON feed_items;
    DROP POLICY IF EXISTS "Admins can update feed items in their organization" ON feed_items;
    DROP POLICY IF EXISTS "Admins can delete feed items in their organization" ON feed_items;
    
    CREATE POLICY "Users can view feed items in their organization"
      ON feed_items FOR SELECT
      USING (organization_id = get_user_organization_id());

    CREATE POLICY "Admins can create feed items in their organization"
      ON feed_items FOR INSERT
      WITH CHECK (
        organization_id = get_user_organization_id()
        AND EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_id = auth.uid()
          AND role IN ('admin', 'manager')
          AND organization_id = get_user_organization_id()
        )
      );

    CREATE POLICY "Admins can update feed items in their organization"
      ON feed_items FOR UPDATE
      USING (
        organization_id = get_user_organization_id()
        AND EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_id = auth.uid()
          AND role IN ('admin', 'manager')
          AND organization_id = get_user_organization_id()
        )
      );

    CREATE POLICY "Admins can delete feed items in their organization"
      ON feed_items FOR DELETE
      USING (
        organization_id = get_user_organization_id()
        AND EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_id = auth.uid()
          AND role IN ('admin', 'manager')
          AND organization_id = get_user_organization_id()
        )
      );
  END IF;
  
  RAISE NOTICE '✓ Restored other policies';
END $$;


-- ============================================================================
-- COMMIT
-- ============================================================================

COMMIT;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '✅ ROLLBACK COMPLETE - ORIGINAL POLICIES RESTORED + SECURITY FIXED';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'WHAT WAS DONE:';
  RAISE NOTICE '✓ Restored ALL original working policies';
  RAISE NOTICE '✓ Used helper function get_user_organization_id() to avoid recursion';
  RAISE NOTICE '✓ Fixed admin/manager policies to check organization_id properly';
  RAISE NOTICE '✓ Preserved all user-level policies (view own, update own)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  TEST NOW:';
  RAISE NOTICE '1. Check if restaurant name appears';
  RAISE NOTICE '2. Check if team members appear';
  RAISE NOTICE '3. Check if you can view/edit data';
  RAISE NOTICE '4. Everything should work as before!';
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
END $$;
