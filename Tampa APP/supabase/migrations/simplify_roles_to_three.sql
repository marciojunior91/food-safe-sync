-- ============================================================================
-- Migration: Remove role_type from team_members, unify roles in user_roles
-- ============================================================================
--
-- ARCHITECTURE (after this migration):
--
--   auth.users ──(1:1)── profiles ──(1:1)── user_roles (role: app_role)
--                              ↑
--                     team_members.auth_role_id
--
--   team_members has NO role column.
--   Position (Head Chef, Barista, etc.) is purely descriptive.
--   Permissions come ONLY from user_roles via the auth_role_id chain.
--
--   app_role enum: admin | manager | staff
--
-- ============================================================================

-- ── 1. Drop old sync trigger & functions ────────────────────────────────────

DROP TRIGGER IF EXISTS sync_team_member_role_trigger ON public.team_members;
DROP TRIGGER IF EXISTS sync_team_member_to_user_role ON public.team_members;
DROP FUNCTION IF EXISTS public.sync_team_member_role() CASCADE;
DROP FUNCTION IF EXISTS public.sync_team_member_to_user_role() CASCADE;

-- ── 2. Ensure app_role enum exists ──────────────────────────────────────────
-- (handles case where a previous CASCADE destroyed it)

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'staff');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 3. Ensure user_roles.role column exists and is app_role ─────────────────
-- (recovers from a failed DROP TYPE ... CASCADE that destroyed the column)

DO $$
DECLARE
  v_col_type text;
BEGIN
  SELECT udt_name INTO v_col_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'user_roles'
    AND column_name = 'role';

  IF v_col_type IS NULL THEN
    -- Column was destroyed by CASCADE, recreate it
    ALTER TABLE public.user_roles
      ADD COLUMN role app_role NOT NULL DEFAULT 'staff'::app_role;
    RAISE NOTICE 'RECOVERED: user_roles.role column recreated';

  ELSIF v_col_type = 'text' THEN
    -- Partial migration left it as TEXT, clean up and convert back
    UPDATE public.user_roles SET role = 'manager' WHERE role IN ('leader_chef');
    UPDATE public.user_roles SET role = 'admin'   WHERE role IN ('owner');
    UPDATE public.user_roles SET role = 'staff'   WHERE role NOT IN ('admin', 'manager', 'staff');
    ALTER TABLE public.user_roles ALTER COLUMN role TYPE app_role USING role::app_role;
    RAISE NOTICE 'RECOVERED: user_roles.role converted from text to app_role';

  ELSE
    -- Column exists as enum (original or already correct) — clean data
    BEGIN
      UPDATE public.user_roles SET role = 'manager'::app_role WHERE role::text = 'leader_chef';
      UPDATE public.user_roles SET role = 'admin'::app_role   WHERE role::text = 'owner';
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
END $$;

-- ── 4. Ensure unique constraint on user_roles(user_id) ──────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.user_roles'::regclass
      AND contype = 'u'
      AND array_length(conkey, 1) = 1
      AND EXISTS (
        SELECT 1 FROM pg_attribute a
        WHERE a.attrelid = conrelid
          AND a.attnum = conkey[1]
          AND a.attname = 'user_id'
      )
  ) THEN
    ALTER TABLE public.user_roles
      DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;
    ALTER TABLE public.user_roles
      ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);
    RAISE NOTICE 'Added UNIQUE(user_id) constraint to user_roles';
  END IF;
END $$;

-- ── 5. Migrate team_members.role_type data → user_roles ─────────────────────

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'team_members'
      AND column_name = 'role_type'
  ) THEN
    -- Ensure every linked team member has a user_roles entry
    INSERT INTO public.user_roles (user_id, role)
    SELECT DISTINCT ON (tm.auth_role_id)
      tm.auth_role_id,
      CASE
        WHEN tm.role_type::text = 'admin' THEN 'admin'::app_role
        WHEN tm.role_type::text IN ('manager', 'leader_chef') THEN 'manager'::app_role
        ELSE 'staff'::app_role
      END
    FROM public.team_members tm
    WHERE tm.auth_role_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.user_roles ur WHERE ur.user_id = tm.auth_role_id
      )
    ON CONFLICT (user_id) DO NOTHING;

    -- Drop the column
    ALTER TABLE public.team_members DROP COLUMN role_type;
    RAISE NOTICE 'team_members.role_type migrated to user_roles and dropped';
  ELSE
    RAISE NOTICE 'team_members.role_type already removed (skipping)';
  END IF;
END $$;

-- ── 6. Drop team_member_role enum ───────────────────────────────────────────

DROP TYPE IF EXISTS public.team_member_role;

-- ── 7. Recreate permission functions ────────────────────────────────────────

DROP FUNCTION IF EXISTS public.has_role(UUID, app_role);
DROP FUNCTION IF EXISTS public.has_role(UUID, text);
DROP FUNCTION IF EXISTS public.has_any_role(UUID, app_role[]);
DROP FUNCTION IF EXISTS public.has_any_role(UUID, text[]);
DROP FUNCTION IF EXISTS public.get_user_role(UUID);
DROP FUNCTION IF EXISTS public.get_team_member_role(UUID);

CREATE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE FUNCTION public.has_any_role(_user_id UUID, _roles app_role[])
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = ANY(_roles)
  );
$$;

CREATE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1;
$$;

-- Helper: get role for a team member via auth_role_id → user_roles chain
CREATE FUNCTION public.get_team_member_role(_team_member_id UUID)
RETURNS app_role
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT ur.role
  FROM public.team_members tm
  JOIN public.user_roles ur ON tm.auth_role_id = ur.user_id
  WHERE tm.id = _team_member_id
  LIMIT 1;
$$;
