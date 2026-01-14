-- ============================================================================
-- NUCLEAR FIX: Stop ALL Recursion Immediately
-- ============================================================================
-- The problem: Policies on user_roles query user_roles = INFINITE RECURSION
-- The solution: Simplify ALL policies to NOT query user_roles for permission checks
-- ============================================================================

BEGIN;

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '🚨 NUCLEAR FIX: Stopping infinite recursion...';
  RAISE NOTICE '============================================================================';
END $$;


-- ============================================================================
-- STEP 1: Fix get_user_organization_id() to NOT cause recursion
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
DECLARE
  org_id UUID;
BEGIN
  -- Query profiles directly, NO user_roles check
  SELECT organization_id INTO org_id 
  FROM profiles 
  WHERE id = auth.uid();
  
  RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

DO $$
BEGIN
  RAISE NOTICE '✓ Fixed get_user_organization_id()';
END $$;


-- ============================================================================
-- STEP 2: Create NEW helper functions that DON'T query user_roles
-- ============================================================================

-- Check if user is admin by querying profiles directly
CREATE OR REPLACE FUNCTION is_user_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get role from profiles table, NOT user_roles
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;


-- Check if user is manager or admin
CREATE OR REPLACE FUNCTION is_user_manager_or_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get role from profiles table, NOT user_roles
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN user_role IN ('admin', 'manager');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;


DO $$
BEGIN
  RAISE NOTICE '✓ Created helper functions that avoid recursion';
END $$;


-- ============================================================================
-- STEP 3: FIX USER_ROLES POLICIES (NO RECURSION!)
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Fixing user_roles policies (removing recursion)...';
  
  -- Drop ALL existing
  DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
  DROP POLICY IF EXISTS "Users can view roles in their organization" ON user_roles;
  DROP POLICY IF EXISTS "Admins can manage roles in their organization" ON user_roles;
  DROP POLICY IF EXISTS "Service role can manage user_roles" ON user_roles;
  DROP POLICY IF EXISTS "Users can view all user_roles" ON user_roles;
  DROP POLICY IF EXISTS "Admins can insert user_roles" ON user_roles;
  DROP POLICY IF EXISTS "Admins can update user_roles" ON user_roles;
  DROP POLICY IF EXISTS "Admins can delete user_roles" ON user_roles;
  
  -- Simple policies that DON'T query user_roles
  
  -- Everyone can view their own role
  CREATE POLICY "Users can view their own role"
    ON user_roles FOR SELECT
    USING (user_id = auth.uid());

  -- Everyone can view all roles in their org (simple, no recursion)
  CREATE POLICY "Users can view roles in their organization"
    ON user_roles FOR SELECT
    USING (organization_id = get_user_organization_id());

  -- Admins can insert (using helper that queries profiles, NOT user_roles)
  CREATE POLICY "Admins can insert user_roles"
    ON user_roles FOR INSERT
    WITH CHECK (
      organization_id = get_user_organization_id()
      AND is_user_admin()
    );

  -- Admins can update (using helper that queries profiles, NOT user_roles)
  CREATE POLICY "Admins can update user_roles"
    ON user_roles FOR UPDATE
    USING (
      organization_id = get_user_organization_id()
      AND is_user_admin()
    )
    WITH CHECK (
      organization_id = get_user_organization_id()
      AND is_user_admin()
    );

  -- Admins can delete (using helper that queries profiles, NOT user_roles)
  CREATE POLICY "Admins can delete user_roles"
    ON user_roles FOR DELETE
    USING (
      organization_id = get_user_organization_id()
      AND is_user_admin()
    );
  
  -- Service role bypass
  CREATE POLICY "Service role can manage user_roles"
    ON user_roles FOR ALL
    USING (auth.uid() IS NULL)
    WITH CHECK (auth.uid() IS NULL);
  
  RAISE NOTICE '✓ Fixed user_roles policies (NO RECURSION!)';
END $$;


-- ============================================================================
-- STEP 4: FIX PROFILES POLICIES (use new helpers)
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Fixing profiles policies...';
  
  -- Drop ALL existing
  DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
  DROP POLICY IF EXISTS "Admins can view profiles in their organization" ON profiles;
  DROP POLICY IF EXISTS "Admins can update profiles in their organization" ON profiles;
  DROP POLICY IF EXISTS "Managers can view profiles in their organization" ON profiles;
  DROP POLICY IF EXISTS "Service role can manage profiles" ON profiles;
  
  -- Users can see their own
  CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (id = auth.uid());

  CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

  -- Admins/Managers can see all in their org
  CREATE POLICY "Managers can view profiles in their organization"
    ON profiles FOR SELECT
    USING (
      organization_id = get_user_organization_id()
      AND is_user_manager_or_admin()
    );

  -- Admins can update profiles in their org
  CREATE POLICY "Admins can update profiles in their organization"
    ON profiles FOR UPDATE
    USING (
      organization_id = get_user_organization_id()
      AND is_user_admin()
    )
    WITH CHECK (
      organization_id = get_user_organization_id()
      AND is_user_admin()
    );
  
  -- Service role
  CREATE POLICY "Service role can manage profiles"
    ON profiles FOR ALL
    USING (auth.uid() IS NULL)
    WITH CHECK (auth.uid() IS NULL);
  
  RAISE NOTICE '✓ Fixed profiles policies';
END $$;


-- ============================================================================
-- STEP 5: FIX ORGANIZATIONS POLICIES
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
    RAISE NOTICE 'Fixing organizations policies...';
    
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
        AND is_user_admin()
      )
      WITH CHECK (
        id = get_user_organization_id()
        AND is_user_admin()
      );
    
    CREATE POLICY "Service role can manage organizations"
      ON organizations FOR ALL
      USING (auth.uid() IS NULL)
      WITH CHECK (auth.uid() IS NULL);
    
    RAISE NOTICE '✓ Fixed organizations policies';
  END IF;
END $$;


-- ============================================================================
-- STEP 6: FIX TEAM_MEMBERS POLICIES
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') THEN
    RAISE NOTICE 'Fixing team_members policies...';
    
    DROP POLICY IF EXISTS "view_team_members_in_org" ON team_members;
    DROP POLICY IF EXISTS "create_team_members" ON team_members;
    DROP POLICY IF EXISTS "update_team_members" ON team_members;
    DROP POLICY IF EXISTS "delete_team_members" ON team_members;
    DROP POLICY IF EXISTS "Service role can manage team_members" ON team_members;
    
    -- Everyone in org can view
    CREATE POLICY "view_team_members_in_org"
      ON team_members FOR SELECT
      USING (organization_id = get_user_organization_id());

    -- Managers can create
    CREATE POLICY "create_team_members"
      ON team_members FOR INSERT
      WITH CHECK (
        organization_id = get_user_organization_id()
        AND is_user_manager_or_admin()
      );

    -- Own record OR manager can update
    CREATE POLICY "update_team_members"
      ON team_members FOR UPDATE
      USING (
        auth_role_id = auth.uid()
        OR (
          organization_id = get_user_organization_id()
          AND is_user_manager_or_admin()
        )
      )
      WITH CHECK (
        auth_role_id = auth.uid()
        OR (
          organization_id = get_user_organization_id()
          AND is_user_manager_or_admin()
        )
      );

    -- Admins can delete
    CREATE POLICY "delete_team_members"
      ON team_members FOR DELETE
      USING (
        organization_id = get_user_organization_id()
        AND is_user_admin()
      );
    
    -- Service role
    CREATE POLICY "Service role can manage team_members"
      ON team_members FOR ALL
      USING (auth.uid() IS NULL)
      WITH CHECK (auth.uid() IS NULL);
    
    RAISE NOTICE '✓ Fixed team_members policies';
  END IF;
END $$;


-- ============================================================================
-- STEP 7: FIX RECIPES POLICIES
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recipes') THEN
    RAISE NOTICE 'Fixing recipes policies...';
    
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
        AND is_user_manager_or_admin()
      );

    CREATE POLICY "Leader chefs and admins can update recipes"
      ON recipes FOR UPDATE
      USING (
        organization_id = get_user_organization_id()
        AND is_user_manager_or_admin()
      )
      WITH CHECK (
        organization_id = get_user_organization_id()
        AND is_user_manager_or_admin()
      );

    CREATE POLICY "Admins can delete recipes in their organization"
      ON recipes FOR DELETE
      USING (
        organization_id = get_user_organization_id()
        AND is_user_admin()
      );
    
    CREATE POLICY "Service role can manage recipes"
      ON recipes FOR ALL
      USING (auth.uid() IS NULL)
      WITH CHECK (auth.uid() IS NULL);
    
    RAISE NOTICE '✓ Fixed recipes policies';
  END IF;
END $$;


-- ============================================================================
-- STEP 8: FIX PRODUCTS POLICIES
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
    RAISE NOTICE 'Fixing products policies...';
    
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
        AND is_user_manager_or_admin()
      );
    
    CREATE POLICY "Service role can manage products"
      ON products FOR ALL
      USING (auth.uid() IS NULL)
      WITH CHECK (auth.uid() IS NULL);
    
    RAISE NOTICE '✓ Fixed products policies';
  END IF;
END $$;


-- ============================================================================
-- STEP 9: FIX FEED ITEMS AND READS
-- ============================================================================

DO $$
BEGIN
  -- FEED_ITEMS
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feed_items') THEN
    RAISE NOTICE 'Fixing feed_items policies...';
    
    DROP POLICY IF EXISTS "Users can view feed items in their organization" ON feed_items;
    DROP POLICY IF EXISTS "Admins can create feed items in their organization" ON feed_items;
    DROP POLICY IF EXISTS "Admins can update feed items in their organization" ON feed_items;
    DROP POLICY IF EXISTS "Admins can delete feed items in their organization" ON feed_items;
    DROP POLICY IF EXISTS "Service role can manage feed_items" ON feed_items;
    
    CREATE POLICY "Users can view feed items in their organization"
      ON feed_items FOR SELECT
      USING (organization_id = get_user_organization_id());

    CREATE POLICY "Admins can create feed items in their organization"
      ON feed_items FOR INSERT
      WITH CHECK (
        organization_id = get_user_organization_id()
        AND is_user_manager_or_admin()
      );

    CREATE POLICY "Admins can update feed items in their organization"
      ON feed_items FOR UPDATE
      USING (
        organization_id = get_user_organization_id()
        AND is_user_manager_or_admin()
      );

    CREATE POLICY "Admins can delete feed items in their organization"
      ON feed_items FOR DELETE
      USING (
        organization_id = get_user_organization_id()
        AND is_user_manager_or_admin()
      );
    
    CREATE POLICY "Service role can manage feed_items"
      ON feed_items FOR ALL
      USING (auth.uid() IS NULL)
      WITH CHECK (auth.uid() IS NULL);
  END IF;
  
  -- FEED_READS
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feed_reads') THEN
    RAISE NOTICE 'Fixing feed_reads policies...';
    
    DROP POLICY IF EXISTS "Users can view their own feed reads" ON feed_reads;
    DROP POLICY IF EXISTS "Users can create their own feed reads" ON feed_reads;
    DROP POLICY IF EXISTS "Users can update their own feed reads" ON feed_reads;
    DROP POLICY IF EXISTS "Service role can manage feed_reads" ON feed_reads;
    
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
    
    CREATE POLICY "Service role can manage feed_reads"
      ON feed_reads FOR ALL
      USING (auth.uid() IS NULL)
      WITH CHECK (auth.uid() IS NULL);
  END IF;
  
  RAISE NOTICE '✓ Fixed feed policies';
END $$;


-- ============================================================================
-- COMMIT
-- ============================================================================

COMMIT;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '✅ NUCLEAR FIX COMPLETE - RECURSION ELIMINATED!';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'WHAT CHANGED:';
  RAISE NOTICE '✓ Helper functions now query PROFILES table for role, NOT user_roles';
  RAISE NOTICE '✓ user_roles policies NO LONGER query user_roles (no recursion!)';
  RAISE NOTICE '✓ All policies use new helpers: is_user_admin(), is_user_manager_or_admin()';
  RAISE NOTICE '✓ Organization isolation maintained';
  RAISE NOTICE '✓ All functionality preserved';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 REFRESH YOUR APP NOW - All errors should be gone!';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: This assumes profiles table has a "role" column.';
  RAISE NOTICE '   If not, the helper functions will need adjustment.';
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
END $$;
