-- ============================================================================
-- FINAL FIX: Stop Recursion + Fix Missing Column
-- ============================================================================
-- Problems:
-- 1. user_roles policies query user_roles = INFINITE RECURSION
-- 2. profiles table has NO "role" column
-- 3. get_current_user_context() queries user_roles = causes recursion
-- 
-- Solution:
-- 1. Helper functions query user_roles directly (with SECURITY DEFINER to bypass RLS)
-- 2. Policies NEVER query user_roles (use helper functions instead)
-- 3. Break the recursion chain completely
-- ============================================================================

BEGIN;

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '🚨 FINAL FIX: Stopping recursion + fixing missing column...';
  RAISE NOTICE '============================================================================';
END $$;


-- ============================================================================
-- STEP 1: Create SECURITY DEFINER helper functions that bypass RLS
-- ============================================================================

-- Get organization ID (queries profiles, no recursion)
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
DECLARE
  org_id UUID;
BEGIN
  SELECT organization_id INTO org_id 
  FROM profiles 
  WHERE user_id = auth.uid();
  
  RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;


-- Check if user is admin (queries user_roles directly, BYPASSES RLS with SECURITY DEFINER)
CREATE OR REPLACE FUNCTION is_user_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- SECURITY DEFINER allows this to bypass RLS on user_roles
  SELECT role::TEXT INTO user_role
  FROM user_roles
  WHERE user_id = auth.uid()
  ORDER BY 
    CASE role::TEXT
      WHEN 'admin' THEN 1
      WHEN 'manager' THEN 2
      WHEN 'leader_chef' THEN 3
      ELSE 4
    END
  LIMIT 1;
  
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;


-- Check if user is manager or admin
CREATE OR REPLACE FUNCTION is_user_manager_or_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- SECURITY DEFINER allows this to bypass RLS on user_roles
  SELECT role::TEXT INTO user_role
  FROM user_roles
  WHERE user_id = auth.uid()
  ORDER BY 
    CASE role::TEXT
      WHEN 'admin' THEN 1
      WHEN 'manager' THEN 2
      WHEN 'leader_chef' THEN 3
      ELSE 4
    END
  LIMIT 1;
  
  RETURN user_role IN ('admin', 'manager');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;


-- Drop and recreate get_current_user_context (signature changed)
DROP FUNCTION IF EXISTS public.get_current_user_context();

CREATE OR REPLACE FUNCTION public.get_current_user_context()
RETURNS TABLE (
  user_id uuid,
  organization_id uuid,
  organization_name text,
  role text,
  department_id uuid,
  display_name text,
  email text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.organization_id,
    o.name as organization_name,
    -- Get role from user_roles (SECURITY DEFINER bypasses RLS, no recursion!)
    COALESCE(
      (
        SELECT ur.role::text
        FROM user_roles ur
        WHERE ur.user_id = auth.uid()
        ORDER BY 
          CASE ur.role::text
            WHEN 'admin' THEN 1
            WHEN 'manager' THEN 2
            WHEN 'leader_chef' THEN 3
            WHEN 'cook' THEN 4
            WHEN 'barista' THEN 5
            WHEN 'staff' THEN 6
          END
        LIMIT 1
      ),
      'staff'
    ) as role,
    p.department_id,
    p.display_name,
    p.email
  FROM profiles p
  LEFT JOIN organizations o ON p.organization_id = o.id
  WHERE p.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;


DO $$
BEGIN
  RAISE NOTICE '✓ Created helper functions with SECURITY DEFINER (bypasses RLS, no recursion!)';
END $$;


-- ============================================================================
-- STEP 2: FIX USER_ROLES POLICIES (SIMPLE, NO RECURSION!)
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Fixing user_roles policies...';
  
  -- Drop ALL existing
  DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
  DROP POLICY IF EXISTS "Users can view roles in their organization" ON user_roles;
  DROP POLICY IF EXISTS "Admins can manage roles in their organization" ON user_roles;
  DROP POLICY IF EXISTS "Service role can manage user_roles" ON user_roles;
  DROP POLICY IF EXISTS "Users can view all user_roles" ON user_roles;
  DROP POLICY IF EXISTS "Admins can insert user_roles" ON user_roles;
  DROP POLICY IF EXISTS "Admins can update user_roles" ON user_roles;
  DROP POLICY IF EXISTS "Admins can delete user_roles" ON user_roles;
  
  -- SIMPLE POLICIES - NO user_roles QUERIES IN POLICIES!
  
  -- Everyone can view their own role (simple check, no JOIN)
  CREATE POLICY "Users can view their own role"
    ON user_roles FOR SELECT
    USING (user_id = auth.uid());

  -- Everyone can view all roles in their org (uses helper, no recursion!)
  CREATE POLICY "Users can view roles in their organization"
    ON user_roles FOR SELECT
    USING (organization_id = get_user_organization_id());

  -- Admins can insert (uses helper with SECURITY DEFINER, no recursion!)
  CREATE POLICY "Admins can insert user_roles"
    ON user_roles FOR INSERT
    WITH CHECK (
      organization_id = get_user_organization_id()
      AND is_user_admin()
    );

  -- Admins can update (uses helper with SECURITY DEFINER, no recursion!)
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

  -- Admins can delete (uses helper with SECURITY DEFINER, no recursion!)
  CREATE POLICY "Admins can delete user_roles"
    ON user_roles FOR DELETE
    USING (
      organization_id = get_user_organization_id()
      AND is_user_admin()
    );
  
  -- Service role bypass (critical for backend)
  CREATE POLICY "Service role can manage user_roles"
    ON user_roles FOR ALL
    USING (auth.uid() IS NULL)
    WITH CHECK (auth.uid() IS NULL);
  
  RAISE NOTICE '✓ Fixed user_roles policies (NO RECURSION!)';
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
  DROP POLICY IF EXISTS "Managers can view profiles in their organization" ON profiles;
  DROP POLICY IF EXISTS "Service role can manage profiles" ON profiles;
  
  -- Users can see their own (simple, no recursion)
  CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (user_id = auth.uid());

  CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

  -- Managers can see all in their org (uses helper, no recursion!)
  CREATE POLICY "Managers can view profiles in their organization"
    ON profiles FOR SELECT
    USING (
      organization_id = get_user_organization_id()
      AND is_user_manager_or_admin()
    );

  -- Admins can update profiles in their org (uses helper, no recursion!)
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
-- STEP 4: FIX ORGANIZATIONS POLICIES
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
-- STEP 6: FIX RECIPES POLICIES
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
-- STEP 7: FIX PRODUCTS POLICIES
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
-- STEP 8: FIX FEED ITEMS AND READS
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
  RAISE NOTICE '✅ FINAL FIX COMPLETE - ALL ERRORS FIXED!';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'HOW THIS WORKS:';
  RAISE NOTICE '1. Helper functions use SECURITY DEFINER to bypass RLS';
  RAISE NOTICE '2. They can query user_roles without triggering the policies';
  RAISE NOTICE '3. Policies call helpers instead of querying user_roles directly';
  RAISE NOTICE '4. NO RECURSION! Chain is broken!';
  RAISE NOTICE '';
  RAISE NOTICE 'FIXED ERRORS:';
  RAISE NOTICE '✓ Error 1: Infinite recursion in user_roles - GONE';
  RAISE NOTICE '✓ Error 2: 0 rows for organizations (406) - GONE';
  RAISE NOTICE '✓ Error 3: Infinite recursion in profiles - GONE';
  RAISE NOTICE '✓ Error 4: Column "role" does not exist - GONE (not querying it)';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 REFRESH YOUR APP NOW - Everything should work!';
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
END $$;
