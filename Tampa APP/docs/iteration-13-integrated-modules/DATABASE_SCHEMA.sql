-- ============================================================================
-- Iteration 13: Integrated Modules - Database Schema
-- Modules: Routine Tasks, Feed, People
-- Date: December 27, 2025
-- ============================================================================

-- ============================================================================
-- 1. UPDATE EXISTING TABLES
-- ============================================================================

-- Update profiles table with new fields for People module
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
ADD CONSTRAINT check_role CHECK (role IN ('cook', 'barista', 'leader_chef', 'owner', 'admin')),
ADD CONSTRAINT check_employment_status CHECK (employment_status IN ('active', 'on_leave', 'terminated'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_organization ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_employment_status ON profiles(employment_status);
CREATE INDEX IF NOT EXISTS idx_profiles_completion ON profiles(profile_completion_percentage);

-- Add comments
COMMENT ON COLUMN profiles.role IS 'User role: cook, barista, leader_chef, owner, admin';
COMMENT ON COLUMN profiles.profile_completion_percentage IS 'Percentage of profile completion (0-100)';

-- ============================================================================
-- 2. ROUTINE TASKS MODULE
-- ============================================================================

-- Task Templates Table
CREATE TABLE IF NOT EXISTS task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  tasks JSONB NOT NULL DEFAULT '[]', -- Array of {title, description, estimated_minutes, requires_approval}
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

CREATE INDEX idx_task_templates_org ON task_templates(organization_id);
CREATE INDEX idx_task_templates_type ON task_templates(task_type);
CREATE INDEX idx_task_templates_default ON task_templates(is_default);

COMMENT ON TABLE task_templates IS 'Pre-defined templates for routine tasks';
COMMENT ON COLUMN task_templates.is_default IS 'System default templates (opening, closing, cleaning)';

-- Routine Tasks Table
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
  recurrence_pattern JSONB, -- {frequency: 'daily', interval: 1, days: [1,2,3,4,5], end_date: '2025-12-31'}
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

CREATE INDEX idx_routine_tasks_org ON routine_tasks(organization_id);
CREATE INDEX idx_routine_tasks_assigned ON routine_tasks(assigned_to);
CREATE INDEX idx_routine_tasks_status ON routine_tasks(status);
CREATE INDEX idx_routine_tasks_date ON routine_tasks(scheduled_date);
CREATE INDEX idx_routine_tasks_type ON routine_tasks(task_type);
CREATE INDEX idx_routine_tasks_priority ON routine_tasks(priority);

COMMENT ON TABLE routine_tasks IS 'Daily routine tasks and checklists';
COMMENT ON COLUMN routine_tasks.recurrence_pattern IS 'JSONB pattern for recurring tasks';

-- Task Attachments Table
CREATE TABLE IF NOT EXISTS task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES routine_tasks(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID REFERENCES profiles(user_id),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB, -- {timestamp, geolocation: {lat, lng}, notes}
  
  CONSTRAINT check_file_type CHECK (file_type IN ('image/jpeg', 'image/png', 'image/webp', 'application/pdf'))
);

CREATE INDEX idx_task_attachments_task ON task_attachments(task_id);
CREATE INDEX idx_task_attachments_uploader ON task_attachments(uploaded_by);

COMMENT ON TABLE task_attachments IS 'Photo and document evidence for completed tasks';

-- Task Audit Log
CREATE TABLE IF NOT EXISTS task_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES routine_tasks(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL, -- created, assigned, started, completed, skipped, approved
  performed_by UUID REFERENCES profiles(user_id),
  old_values JSONB,
  new_values JSONB,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT check_action CHECK (action IN (
    'created',
    'assigned',
    'started',
    'completed',
    'skipped',
    'approved',
    'updated'
  ))
);

CREATE INDEX idx_task_audit_task ON task_audit_log(task_id);
CREATE INDEX idx_task_audit_action ON task_audit_log(action);
CREATE INDEX idx_task_audit_created ON task_audit_log(created_at);

COMMENT ON TABLE task_audit_log IS 'Audit trail for all task changes';

-- ============================================================================
-- 3. FEED MODULE (formerly Notifications)
-- ============================================================================

-- Feed Items Table
CREATE TABLE IF NOT EXISTS feed_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  channel TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  created_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE, -- null for channel-wide
  related_entity_type TEXT, -- task, profile, maintenance
  related_entity_id UUID,
  metadata JSONB, -- Additional data, links, etc
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
    'maintenance',
    'custom'
  )),
  CONSTRAINT check_priority CHECK (priority IN ('critical', 'high', 'normal', 'low'))
);

CREATE INDEX idx_feed_items_org ON feed_items(organization_id);
CREATE INDEX idx_feed_items_channel ON feed_items(channel);
CREATE INDEX idx_feed_items_type ON feed_items(type);
CREATE INDEX idx_feed_items_target ON feed_items(target_user_id);
CREATE INDEX idx_feed_items_created ON feed_items(created_at DESC);
CREATE INDEX idx_feed_items_expires ON feed_items(expires_at) WHERE expires_at IS NOT NULL;

COMMENT ON TABLE feed_items IS 'Activity feed and notifications';
COMMENT ON COLUMN feed_items.target_user_id IS 'Specific user notification, null for channel broadcast';

-- Feed Reads Table (track who has read what)
CREATE TABLE IF NOT EXISTS feed_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_item_id UUID REFERENCES feed_items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  read_at TIMESTAMP DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP,
  
  UNIQUE(feed_item_id, user_id)
);

CREATE INDEX idx_feed_reads_item ON feed_reads(feed_item_id);
CREATE INDEX idx_feed_reads_user ON feed_reads(user_id);
CREATE INDEX idx_feed_reads_acknowledged ON feed_reads(acknowledged);

COMMENT ON TABLE feed_reads IS 'Tracking read status and acknowledgments';

-- ============================================================================
-- 4. PEOPLE MODULE ENHANCEMENTS
-- ============================================================================

-- User PINs Table (4-digit PIN for profile security)
CREATE TABLE IF NOT EXISTS user_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL UNIQUE,
  pin_hash TEXT NOT NULL, -- bcrypt hashed PIN
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_pins_user ON user_pins(user_id);

COMMENT ON TABLE user_pins IS 'User 4-digit PINs for profile security';
COMMENT ON COLUMN user_pins.failed_attempts IS 'Failed PIN attempt counter for rate limiting';

-- User Documents Table
CREATE TABLE IF NOT EXISTS user_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL, -- certificate, id_card, work_card, food_handler, etc
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

CREATE INDEX idx_user_documents_user ON user_documents(user_id);
CREATE INDEX idx_user_documents_type ON user_documents(document_type);
CREATE INDEX idx_user_documents_status ON user_documents(status);
CREATE INDEX idx_user_documents_expiration ON user_documents(expiration_date) WHERE expiration_date IS NOT NULL;

COMMENT ON TABLE user_documents IS 'User certificates and documents';
COMMENT ON COLUMN user_documents.expiration_date IS 'Alert users before expiration';

-- Document Verification Log
CREATE TABLE IF NOT EXISTS document_verification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES user_documents(id) ON DELETE CASCADE NOT NULL,
  verified_by UUID REFERENCES profiles(user_id),
  action TEXT NOT NULL, -- uploaded, verified, rejected, expired
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT check_action CHECK (action IN ('uploaded', 'verified', 'rejected', 'expired', 'renewed'))
);

CREATE INDEX idx_doc_verification_document ON document_verification_log(document_id);
CREATE INDEX idx_doc_verification_verifier ON document_verification_log(verified_by);

COMMENT ON TABLE document_verification_log IS 'Audit trail for document verification';

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_verification_log ENABLE ROW LEVEL SECURITY;

-- Task Templates Policies
CREATE POLICY "Users can view templates in their organization"
  ON task_templates FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can create templates"
  ON task_templates FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('leader_chef', 'owner', 'admin')
    )
  );

-- Routine Tasks Policies
CREATE POLICY "Users can view tasks in their organization"
  ON routine_tasks FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can create tasks"
  ON routine_tasks FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('leader_chef', 'owner', 'admin')
    )
  );

CREATE POLICY "Assigned users can update their tasks"
  ON routine_tasks FOR UPDATE
  USING (
    assigned_to = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('leader_chef', 'owner', 'admin')
    )
  );

-- Feed Items Policies
CREATE POLICY "Users can view feed in their organization and channel"
  ON feed_items FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    ) AND (
      target_user_id IS NULL OR target_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can create feed items"
  ON feed_items FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('leader_chef', 'owner', 'admin')
    )
  );

-- User Documents Policies
CREATE POLICY "Users can view their own documents"
  ON user_documents FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('leader_chef', 'owner', 'admin')
    )
  );

CREATE POLICY "Users can upload their own documents"
  ON user_documents FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- User PINs Policies
CREATE POLICY "Users can only access their own PIN"
  ON user_pins FOR ALL
  USING (user_id = auth.uid());

-- ============================================================================
-- 6. FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_task_templates_updated_at
  BEFORE UPDATE ON task_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_routine_tasks_updated_at
  BEFORE UPDATE ON routine_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_documents_updated_at
  BEFORE UPDATE ON user_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_pins_updated_at
  BEFORE UPDATE ON user_pins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to calculate profile completion percentage
CREATE OR REPLACE FUNCTION calculate_profile_completion()
RETURNS TRIGGER AS $$
DECLARE
  completion_pct INTEGER := 0;
  required_fields INTEGER := 0;
  filled_fields INTEGER := 0;
BEGIN
  -- Count required fields
  required_fields := 8; -- name, email, role, position, phone, dob, admission_date, tfn_number
  
  -- Count filled fields
  IF NEW.display_name IS NOT NULL AND NEW.display_name != '' THEN filled_fields := filled_fields + 1; END IF;
  IF NEW.email IS NOT NULL AND NEW.email != '' THEN filled_fields := filled_fields + 1; END IF;
  IF NEW.role IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
  IF NEW.position IS NOT NULL AND NEW.position != '' THEN filled_fields := filled_fields + 1; END IF;
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN filled_fields := filled_fields + 1; END IF;
  IF NEW.date_of_birth IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
  IF NEW.admission_date IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
  IF NEW.tfn_number IS NOT NULL AND NEW.tfn_number != '' THEN filled_fields := filled_fields + 1; END IF;
  
  -- Calculate percentage
  completion_pct := (filled_fields * 100) / required_fields;
  NEW.profile_completion_percentage := completion_pct;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_profile_completion_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION calculate_profile_completion();

-- Function to create feed item when task is delegated
CREATE OR REPLACE FUNCTION notify_task_delegation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL AND (OLD.assigned_to IS NULL OR OLD.assigned_to != NEW.assigned_to) THEN
    INSERT INTO feed_items (
      organization_id,
      type,
      channel,
      title,
      message,
      priority,
      target_user_id,
      related_entity_type,
      related_entity_id,
      created_by
    ) VALUES (
      NEW.organization_id,
      'task_delegated',
      'general',
      'New Task Assigned',
      'You have been assigned: ' || NEW.title,
      NEW.priority,
      NEW.assigned_to,
      'task',
      NEW.id,
      COALESCE(NEW.completed_by, auth.uid())
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_task_delegation_trigger
  AFTER INSERT OR UPDATE ON routine_tasks
  FOR EACH ROW EXECUTE FUNCTION notify_task_delegation();

-- Function to check document expiration and create feed items
CREATE OR REPLACE FUNCTION check_document_expiration()
RETURNS void AS $$
DECLARE
  doc RECORD;
BEGIN
  FOR doc IN 
    SELECT * FROM user_documents 
    WHERE status = 'active' 
    AND expiration_date IS NOT NULL 
    AND expiration_date <= (CURRENT_DATE + INTERVAL '30 days')
    AND expiration_date > CURRENT_DATE
  LOOP
    -- Create feed item for user
    INSERT INTO feed_items (
      organization_id,
      type,
      channel,
      title,
      message,
      priority,
      target_user_id,
      related_entity_type,
      related_entity_id
    )
    SELECT 
      p.organization_id,
      'pending_docs',
      'general',
      'Document Expiring Soon',
      'Your ' || doc.document_name || ' expires on ' || doc.expiration_date,
      'high',
      doc.user_id,
      'document',
      doc.id
    FROM profiles p
    WHERE p.user_id = doc.user_id
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. SEED DATA (Default Templates)
-- ============================================================================

-- Insert default task templates
INSERT INTO task_templates (organization_id, name, description, task_type, is_default, tasks)
SELECT 
  o.id,
  'Opening Checklist',
  'Standard morning opening procedures',
  'opening',
  true,
  '[
    {"title": "Unlock doors and disable alarm", "estimated_minutes": 5},
    {"title": "Turn on all equipment", "estimated_minutes": 10},
    {"title": "Check refrigeration temperatures", "estimated_minutes": 5, "requires_approval": true},
    {"title": "Inspect prep areas for cleanliness", "estimated_minutes": 10},
    {"title": "Check inventory levels", "estimated_minutes": 15},
    {"title": "Prepare cash register", "estimated_minutes": 5}
  ]'::jsonb
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM task_templates 
  WHERE organization_id = o.id 
  AND name = 'Opening Checklist'
);

INSERT INTO task_templates (organization_id, name, description, task_type, is_default, tasks)
SELECT 
  o.id,
  'Closing Checklist',
  'Standard evening closing procedures',
  'closing',
  true,
  '[
    {"title": "Clean and sanitize all work surfaces", "estimated_minutes": 20},
    {"title": "Empty and clean trash bins", "estimated_minutes": 10},
    {"title": "Turn off non-essential equipment", "estimated_minutes": 5},
    {"title": "Check refrigeration temperatures", "estimated_minutes": 5, "requires_approval": true},
    {"title": "Secure inventory and supplies", "estimated_minutes": 10},
    {"title": "Count cash register and prepare deposit", "estimated_minutes": 15},
    {"title": "Lock doors and activate alarm", "estimated_minutes": 5}
  ]'::jsonb
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM task_templates 
  WHERE organization_id = o.id 
  AND name = 'Closing Checklist'
);

INSERT INTO task_templates (organization_id, name, description, task_type, is_default, tasks)
SELECT 
  o.id,
  'Daily Cleaning Checklist',
  'Standard daily cleaning tasks',
  'cleaning_daily',
  true,
  '[
    {"title": "Sweep and mop all floors", "estimated_minutes": 30},
    {"title": "Clean and sanitize food prep surfaces", "estimated_minutes": 15},
    {"title": "Clean sinks and faucets", "estimated_minutes": 10},
    {"title": "Wipe down equipment exteriors", "estimated_minutes": 15},
    {"title": "Clean restrooms", "estimated_minutes": 20},
    {"title": "Take out trash and recycling", "estimated_minutes": 10},
    {"title": "Restock cleaning supplies", "estimated_minutes": 5}
  ]'::jsonb
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM task_templates 
  WHERE organization_id = o.id 
  AND name = 'Daily Cleaning Checklist'
);

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

COMMENT ON SCHEMA public IS 'Iteration 13: Integrated Modules - Routine Tasks, Feed, People';
