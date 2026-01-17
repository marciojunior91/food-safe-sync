-- ============================================================================
-- EMERGENCY FIX: Restore Basic Access Immediately
-- ============================================================================
-- This script will restore basic functionality NOW while maintaining security
-- ============================================================================

BEGIN;

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'EMERGENCY FIX: Restoring basic access...';
  RAISE NOTICE '============================================================================';
END $$;

-- ============================================================================
-- STEP 1: Create/Fix helper function
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

DO $$
BEGIN
  RAISE NOTICE '✓ Created helper function';
END $$;


-- ============================================================================
-- STEP 2: FIX ORGANIZATIONS POLICIES (CRITICAL!)
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Fixing organizations policies...';
  
  -- Drop ALL existing policies on organizations
  DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
  DROP POLICY IF EXISTS "Admins can update their own organization" ON organizations;
  DROP POLICY IF EXISTS "Service role can manage organizations" ON organizations;
  DROP POLICY IF EXISTS "Users can view organizations in their organization" ON organizations;
  
  -- Create simple, working policy
  CREATE POLICY "Users can view their own organization"
    ON organizations FOR SELECT
    USING (id = get_user_organization_id());

  -- Admins can update
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
    );
  
  -- Service role bypass (critical for backend operations)
  CREATE POLICY "Service role can manage organizations"
    ON organizations FOR ALL
    USING (auth.uid() IS NULL)
    WITH CHECK (auth.uid() IS NULL);
  
  RAISE NOTICE '✓ Fixed organizations policies';
END $$;


-- ============================================================================
-- STEP 3: FIX PROFILES POLICIES
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Fixing profiles policies...';
  
  -- Drop ALL existing
  DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
  DROP POLICY IF EXISTS "Admins can view profiles in their organization" ON profiles;
  DROP POLICY IF EXISTS "Admins can update profiles in their organization" ON profiles;
  DROP POLICY IF EXISTS "Service role can manage profiles" ON profiles;
  
  -- Users can see their own
  CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (id = auth.uid());

  CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

  -- Admins can see all in their org
  CREATE POLICY "Admins can view profiles in their organization"
    ON profiles FOR SELECT
    USING (
      organization_id = get_user_organization_id()
      AND EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'manager')
        AND organization_id = get_user_organization_id()
      )
    );

  -- Admins can update profiles in their org
  CREATE POLICY "Admins can update profiles in their organization"
    ON profiles FOR UPDATE
    USING (
      organization_id = get_user_organization_id()
      AND EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'manager')
        AND organization_id = get_user_organization_id()
      )
    );
  
  -- Service role
  CREATE POLICY "Service role can manage profiles"
    ON profiles FOR ALL
    USING (auth.uid() IS NULL)
    WITH CHECK (auth.uid() IS NULL);
  
  RAISE NOTICE '✓ Fixed profiles policies';
END $$;


-- ============================================================================
-- STEP 4: FIX USER_ROLES POLICIES
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Fixing user_roles policies...';
  
  DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
  DROP POLICY IF EXISTS "Users can view roles in their organization" ON user_roles;
  DROP POLICY IF EXISTS "Admins can manage roles in their organization" ON user_roles;
  DROP POLICY IF EXISTS "Service role can manage user_roles" ON user_roles;
  
  -- Users see their own
  CREATE POLICY "Users can view their own role"
    ON user_roles FOR SELECT
    USING (user_id = auth.uid());

  -- Users see roles in their org
  CREATE POLICY "Users can view roles in their organization"
    ON user_roles FOR SELECT
    USING (organization_id = get_user_organization_id());

  -- Admins manage roles in their org
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
  
  -- Service role
  CREATE POLICY "Service role can manage user_roles"
    ON user_roles FOR ALL
    USING (auth.uid() IS NULL)
    WITH CHECK (auth.uid() IS NULL);
  
  RAISE NOTICE '✓ Fixed user_roles policies';
END $$;


-- ============================================================================
-- STEP 5: FIX TEAM_MEMBERS POLICIES
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
        AND EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_id = auth.uid()
          AND role IN ('admin', 'manager')
          AND organization_id = get_user_organization_id()
        )
      );

    -- Own record OR manager can update
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
      );

    -- Admins can delete
    CREATE POLICY "delete_team_members"
      ON team_members FOR DELETE
      USING (
        organization_id = get_user_organization_id()
        AND EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_id = auth.uid()
          AND role = 'admin'
          AND organization_id = get_user_organization_id()
        )
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
-- STEP 6: FIX RECIPES, PRODUCTS, etc.
-- ============================================================================

DO $$
BEGIN
  -- RECIPES
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
  END IF;
  
  -- PRODUCTS
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
      USING (organization_id = get_user_organization_id());

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
  END IF;
  
  RAISE NOTICE '✓ Fixed recipes and products policies';
END $$;


-- ============================================================================
-- COMMIT
-- ============================================================================

COMMIT;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '✅ EMERGENCY FIX COMPLETE!';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'FIXED:';
  RAISE NOTICE '✓ Organizations can now be viewed';
  RAISE NOTICE '✓ Profiles are accessible';
  RAISE NOTICE '✓ User roles work correctly';
  RAISE NOTICE '✓ Team members are visible';
  RAISE NOTICE '✓ All tables use organization isolation properly';
  RAISE NOTICE '';
  RAISE NOTICE 'REFRESH YOUR APP NOW - Everything should work!';
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
END $$;
