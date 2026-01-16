-- ============================================================================
-- Iteration 13: Phase 1 - Foundation Migration
-- Date: December 27, 2025
-- ============================================================================

-- ============================================================================
-- 1. CREATE ORGANIZATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  logo_url TEXT,
  address JSONB,
  phone TEXT,
  email TEXT,
  website TEXT,
  industry TEXT,
  timezone TEXT DEFAULT 'UTC',
  settings JSONB DEFAULT '{}',
  subscription_tier TEXT DEFAULT 'basic',
  subscription_status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT check_subscription_tier CHECK (subscription_tier IN ('basic', 'professional', 'enterprise')),
  CONSTRAINT check_subscription_status CHECK (subscription_status IN ('active', 'suspended', 'cancelled', 'trial'))
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(subscription_status);

COMMENT ON TABLE organizations IS 'Multi-tenant organizations for future scalability';

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Organizations Policies
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update their organization"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 2. UPDATE PROFILES TABLE
-- ============================================================================

-- Note: organization_id already exists in profiles, we just need to add FK constraint
-- after seeding the default organization (done at the end of migration)

-- Add new columns for People module
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'cook',
ADD COLUMN IF NOT EXISTS position TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address JSONB,
ADD COLUMN IF NOT EXISTS admission_date DATE,
ADD COLUMN IF NOT EXISTS tfn_number TEXT,
ADD COLUMN IF NOT EXISTS employment_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_pin_change TIMESTAMP;

-- Add check constraints
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS check_role,
DROP CONSTRAINT IF EXISTS check_employment_status;

ALTER TABLE profiles
ADD CONSTRAINT check_role CHECK (role IN ('cook', 'barista', 'leader_chef', 'owner', 'admin')),
ADD CONSTRAINT check_employment_status CHECK (employment_status IN ('active', 'on_leave', 'terminated'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_employment_status ON profiles(employment_status);
CREATE INDEX IF NOT EXISTS idx_profiles_completion ON profiles(profile_completion_percentage);

-- Add comments
COMMENT ON COLUMN profiles.role IS 'User role: cook, barista, leader_chef, owner, admin';
COMMENT ON COLUMN profiles.profile_completion_percentage IS 'Percentage of profile completion (0-100)';
COMMENT ON COLUMN profiles.employment_status IS 'Employment status: active, on_leave, terminated';

-- ============================================================================
-- 3. CREATE TASK TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  tasks JSONB NOT NULL DEFAULT '[]',
  created_by UUID REFERENCES profiles(user_id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT check_task_type CHECK (task_type IN (
    'cleaning_daily',
    'cleaning_weekly',
    'temperature',
    'opening',
    'closing',
    'maintenance',
    'others'
  ))
);

CREATE INDEX IF NOT EXISTS idx_task_templates_org ON task_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_type ON task_templates(task_type);
CREATE INDEX IF NOT EXISTS idx_task_templates_default ON task_templates(is_default);

COMMENT ON TABLE task_templates IS 'Pre-defined templates for routine tasks';

-- ============================================================================
-- 4. CREATE ROUTINE TASKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS routine_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES task_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'not_started',
  assigned_to UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  completed_at TIMESTAMP,
  completed_by UUID REFERENCES profiles(user_id),
  notes TEXT,
  skip_reason TEXT,
  estimated_minutes INTEGER,
  actual_minutes INTEGER,
  requires_approval BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES profiles(user_id),
  approved_at TIMESTAMP,
  recurrence_pattern JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT check_task_type CHECK (task_type IN (
    'cleaning_daily',
    'cleaning_weekly',
    'temperature',
    'opening',
    'closing',
    'maintenance',
    'others'
  )),
  CONSTRAINT check_priority CHECK (priority IN ('critical', 'important', 'normal')),
  CONSTRAINT check_status CHECK (status IN (
    'not_started',
    'in_progress',
    'completed',
    'overdue',
    'skipped'
  ))
);

CREATE INDEX IF NOT EXISTS idx_routine_tasks_org ON routine_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_routine_tasks_assigned ON routine_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_routine_tasks_status ON routine_tasks(status);
CREATE INDEX IF NOT EXISTS idx_routine_tasks_date ON routine_tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_routine_tasks_type ON routine_tasks(task_type);

COMMENT ON TABLE routine_tasks IS 'Daily routine tasks and checklists';

-- ============================================================================
-- 5. CREATE TASK ATTACHMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES routine_tasks(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID REFERENCES profiles(user_id),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_task_attachments_task ON task_attachments(task_id);

COMMENT ON TABLE task_attachments IS 'Photo and document evidence for tasks';

-- ============================================================================
-- 6. CREATE FEED ITEMS TABLE (formerly notifications)
-- ============================================================================

CREATE TABLE IF NOT EXISTS feed_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  channel TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  created_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  related_entity_type TEXT,
  related_entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  
  CONSTRAINT check_feed_type CHECK (type IN (
    'task_delegated',
    'pending_docs',
    'custom_note',
    'maintenance',
    'system'
  )),
  CONSTRAINT check_channel CHECK (channel IN (
    'general',
    'baristas',
    'cooks',
    'maintenance'
  )),
  CONSTRAINT check_priority CHECK (priority IN ('critical', 'high', 'normal', 'low'))
);

CREATE INDEX IF NOT EXISTS idx_feed_items_org ON feed_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_feed_items_channel ON feed_items(channel);
CREATE INDEX IF NOT EXISTS idx_feed_items_type ON feed_items(type);
CREATE INDEX IF NOT EXISTS idx_feed_items_target ON feed_items(target_user_id);
CREATE INDEX IF NOT EXISTS idx_feed_items_created ON feed_items(created_at DESC);

COMMENT ON TABLE feed_items IS 'Activity feed and notifications';

-- ============================================================================
-- 7. CREATE FEED READS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS feed_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_item_id UUID REFERENCES feed_items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  read_at TIMESTAMP DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP,
  
  UNIQUE(feed_item_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_feed_reads_item ON feed_reads(feed_item_id);
CREATE INDEX IF NOT EXISTS idx_feed_reads_user ON feed_reads(user_id);

COMMENT ON TABLE feed_reads IS 'Tracking read status and acknowledgments';

-- ============================================================================
-- 8. CREATE USER PINS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL UNIQUE,
  pin_hash TEXT NOT NULL,
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_pins_user ON user_pins(user_id);

COMMENT ON TABLE user_pins IS 'User 4-digit PINs for profile security';

-- ============================================================================
-- 9. CREATE USER DOCUMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  issue_date DATE,
  expiration_date DATE,
  issuing_organization TEXT,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT check_status CHECK (status IN ('active', 'expired', 'pending_renewal', 'rejected'))
);

CREATE INDEX IF NOT EXISTS idx_user_documents_user ON user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_type ON user_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_user_documents_status ON user_documents(status);
CREATE INDEX IF NOT EXISTS idx_user_documents_expiration ON user_documents(expiration_date) WHERE expiration_date IS NOT NULL;

COMMENT ON TABLE user_documents IS 'User certificates and documents';

-- ============================================================================
-- 10. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 11. CREATE RLS POLICIES
-- ============================================================================

-- Task Templates Policies
CREATE POLICY "Users can view templates in their org"
  ON task_templates FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage templates"
  ON task_templates FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('leader_chef', 'owner', 'admin')
    )
  );

-- Routine Tasks Policies
CREATE POLICY "Users can view tasks in their org"
  ON routine_tasks FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can create tasks"
  ON routine_tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('leader_chef', 'owner', 'admin')
    )
  );

CREATE POLICY "Assigned users or admins can update tasks"
  ON routine_tasks FOR UPDATE
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('leader_chef', 'owner', 'admin')
    )
  );

-- Feed Items Policies
CREATE POLICY "Users can view relevant feed items"
  ON feed_items FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    ) AND (
      target_user_id IS NULL OR target_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can create feed items"
  ON feed_items FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('leader_chef', 'owner', 'admin')
    )
  );

-- User Documents Policies
CREATE POLICY "Users can view their own or admin can view all"
  ON user_documents FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('leader_chef', 'owner', 'admin')
    )
  );

CREATE POLICY "Users can manage their own documents"
  ON user_documents FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- User PINs Policies
CREATE POLICY "Users can only access their own PIN"
  ON user_pins FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 12. CREATE TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_task_templates_updated_at ON task_templates;
CREATE TRIGGER update_task_templates_updated_at
  BEFORE UPDATE ON task_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_routine_tasks_updated_at ON routine_tasks;
CREATE TRIGGER update_routine_tasks_updated_at
  BEFORE UPDATE ON routine_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_user_documents_updated_at ON user_documents;
CREATE TRIGGER update_user_documents_updated_at
  BEFORE UPDATE ON user_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_user_pins_updated_at ON user_pins;
CREATE TRIGGER update_user_pins_updated_at
  BEFORE UPDATE ON user_pins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 13. SEED DEFAULT ORGANIZATION (for current single-tenant setup)
-- ============================================================================

-- Insert default organization if none exists
INSERT INTO organizations (id, name, slug, subscription_tier, subscription_status)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Tampa APP',
  'tampa-app',
  'professional',
  'active'
WHERE NOT EXISTS (SELECT 1 FROM organizations LIMIT 1);

-- Update ALL existing profiles to reference the default organization
-- This ensures all profiles belong to the same organization (single-tenant)
UPDATE profiles 
SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Now add the foreign key constraint (after ALL data is updated)
DO $$ 
BEGIN
  -- Only add constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_profiles_organization'
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT fk_profiles_organization 
    FOREIGN KEY (organization_id) 
    REFERENCES organizations(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_organization ON profiles(organization_id);

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
