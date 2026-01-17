-- APPLY ONBOARDING MIGRATIONS TO REMOTE DATABASE
-- Run this script in Supabase Dashboard > SQL Editor
-- Date: January 7, 2026

-- ============================================================================
-- MIGRATION 1: ONBOARDING SUPPORT TABLES
-- ============================================================================

-- STEP 1: Add columns to existing tables FIRST (before creating new tables)
-- This ensures foreign keys and policies can reference these columns

-- Add organization_id to profiles if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Add onboarding completion tracking to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index for profiles organization_id
CREATE INDEX IF NOT EXISTS idx_profiles_organization ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user ON profiles(user_id);

-- STEP 2: Add 'owner' to the app_role enum if it doesn't exist
-- The user_roles table uses the app_role enum type, not a CHECK constraint

DO $$ 
BEGIN
  -- Check if 'owner' value already exists in the app_role enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'owner' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
  ) THEN
    -- Add 'owner' to the app_role enum
    ALTER TYPE app_role ADD VALUE 'owner';
    RAISE NOTICE '✅ Added "owner" to app_role enum';
  ELSE
    RAISE NOTICE 'ℹ️ "owner" already exists in app_role enum';
  END IF;
END $$;

-- STEP 3: Add organization_id column to existing user_roles table
-- The user_roles table already exists, we just need to add the organization_id column
ALTER TABLE user_roles 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Indexes for user_roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_organization ON user_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- User Invitations Table
CREATE TABLE IF NOT EXISTS user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'leader_chef')),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  personal_message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for user_invitations
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_organization ON user_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON user_invitations(status);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_expires ON user_invitations(expires_at);

-- Function to clean up expired invitations
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_invitations
  SET status = 'expired'
  WHERE status = 'pending'
  AND expires_at < now();
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_invitations_updated_at ON user_invitations;
CREATE TRIGGER update_user_invitations_updated_at
  BEFORE UPDATE ON user_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION 2: ADD ORGANIZATION ONBOARDING FIELDS
-- ============================================================================

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS business_type TEXT CHECK (business_type IN (
  'restaurant', 'café', 'bar', 'bakery', 'hotel', 'catering', 'other'
)),
ADD COLUMN IF NOT EXISTS abn TEXT,
ADD COLUMN IF NOT EXISTS acn TEXT,
ADD COLUMN IF NOT EXISTS address_street TEXT,
ADD COLUMN IF NOT EXISTS address_city TEXT,
ADD COLUMN IF NOT EXISTS address_state TEXT,
ADD COLUMN IF NOT EXISTS address_postcode TEXT,
ADD COLUMN IF NOT EXISTS address_country TEXT DEFAULT 'Australia',
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_organizations_business_type ON organizations(business_type);
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_abn ON organizations(abn) WHERE abn IS NOT NULL;

-- Update comments
COMMENT ON COLUMN organizations.business_type IS 'Type of food business (restaurant, café, bar, etc.)';
COMMENT ON COLUMN organizations.abn IS 'Australian Business Number (11 digits)';
COMMENT ON COLUMN organizations.acn IS 'Australian Company Number (9 digits)';
COMMENT ON COLUMN organizations.owner_id IS 'Reference to the user who owns/created this organization';

-- ============================================================================
-- STEP 4: CREATE RLS POLICIES (AFTER ALL TABLES AND COLUMNS EXIST)
-- ============================================================================

-- Enable RLS on tables
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_invitations
DROP POLICY IF EXISTS "Users can view their own invitations" ON user_invitations;
CREATE POLICY "Users can view their own invitations"
  ON user_invitations
  FOR SELECT
  USING (email = auth.jwt()->>'email');

DROP POLICY IF EXISTS "Admins can manage invitations" ON user_invitations;
CREATE POLICY "Admins can manage invitations"
  ON user_invitations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.organization_id = user_invitations.organization_id
      AND user_roles.role::text IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Allow insert during onboarding" ON user_invitations;
CREATE POLICY "Allow insert during onboarding"
  ON user_invitations
  FOR INSERT
  WITH CHECK (invited_by = auth.uid());

-- RLS Policies for user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
CREATE POLICY "Users can view their own roles"
  ON user_roles
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
CREATE POLICY "Admins can manage roles"
  ON user_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.organization_id = user_roles.organization_id
      AND ur.role::text IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Allow role insert during setup" ON user_roles;
CREATE POLICY "Allow role insert during setup"
  ON user_roles
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Add table comments
COMMENT ON TABLE user_invitations IS 'Stores email invitations for new auth users to join organizations';
COMMENT ON TABLE user_roles IS 'Tracks role assignments for auth users within organizations';
COMMENT ON COLUMN profiles.onboarding_completed IS 'Indicates if user has completed the onboarding flow';
COMMENT ON COLUMN profiles.onboarding_completed_at IS 'Timestamp when onboarding was completed';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if tables were created
SELECT 
  'user_invitations' as table_name,
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_invitations') as exists
UNION ALL
SELECT 
  'user_roles',
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_roles')
UNION ALL
SELECT
  'profiles.onboarding_completed',
  EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'onboarding_completed')
UNION ALL
SELECT
  'organizations.business_type',
  EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'business_type');

-- Check RLS policies
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('user_invitations', 'user_roles')
ORDER BY tablename, policyname;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Onboarding migrations applied successfully!';
  RAISE NOTICE '📊 Tables created: user_invitations, user_roles';
  RAISE NOTICE '🔒 RLS policies: 6 policies created';
  RAISE NOTICE '📝 Columns added to profiles and organizations';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next step: Regenerate TypeScript types';
  RAISE NOTICE 'Run: npx supabase gen types typescript --project-id imnecvcvhypnlvujajpn > src/integrations/supabase/types.ts';
END $$;
