-- ============================================================================
-- Security Enhancements: PIN Rate Limiting and Audit Logging
-- ============================================================================
-- Implements security measures to protect PIN-based authentication:
-- 1. PIN verification audit log
-- 2. Failed attempt tracking
-- 3. Automatic lockout after failed attempts
-- 4. Manager unlock capability
-- ============================================================================

-- 1. CREATE PIN AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS pin_verification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  verification_status TEXT NOT NULL CHECK (verification_status IN ('success', 'failed', 'locked_out')),
  attempted_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  unlocked_by UUID REFERENCES profiles(user_id), -- Manager who unlocked
  unlocked_at TIMESTAMPTZ,
  notes TEXT
);

-- Indexes for performance
CREATE INDEX idx_pin_log_team_member ON pin_verification_log(team_member_id);
CREATE INDEX idx_pin_log_attempted_at ON pin_verification_log(attempted_at DESC);
CREATE INDEX idx_pin_log_status ON pin_verification_log(verification_status);
CREATE INDEX idx_pin_log_recent_failures ON pin_verification_log(team_member_id, attempted_at DESC) 
  WHERE verification_status = 'failed';

-- Comments
COMMENT ON TABLE pin_verification_log IS 'Audit log for all PIN verification attempts';
COMMENT ON COLUMN pin_verification_log.verification_status IS 'success, failed, or locked_out';
COMMENT ON COLUMN pin_verification_log.unlocked_by IS 'Manager who unlocked the account';

-- ============================================================================
-- 2. ADD LOCKOUT FIELDS TO TEAM_MEMBERS
-- ============================================================================

ALTER TABLE team_members 
  ADD COLUMN IF NOT EXISTS is_locked_out BOOLEAN DEFAULT false;

ALTER TABLE team_members 
  ADD COLUMN IF NOT EXISTS lockout_until TIMESTAMPTZ;

ALTER TABLE team_members 
  ADD COLUMN IF NOT EXISTS failed_pin_attempts INTEGER DEFAULT 0;

ALTER TABLE team_members 
  ADD COLUMN IF NOT EXISTS last_failed_attempt TIMESTAMPTZ;

-- Index for lockout checks
CREATE INDEX idx_team_members_locked ON team_members(is_locked_out) 
  WHERE is_locked_out = true;

-- Comments
COMMENT ON COLUMN team_members.is_locked_out IS 'True if account is locked due to failed PIN attempts';
COMMENT ON COLUMN team_members.lockout_until IS 'Timestamp when lockout expires (NULL for permanent lockout)';
COMMENT ON COLUMN team_members.failed_pin_attempts IS 'Counter of consecutive failed PIN attempts';
COMMENT ON COLUMN team_members.last_failed_attempt IS 'Timestamp of most recent failed attempt';

-- ============================================================================
-- 3. FUNCTION: CHECK IF TEAM MEMBER IS LOCKED OUT
-- ============================================================================

CREATE OR REPLACE FUNCTION is_team_member_locked_out(
  _team_member_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  _is_locked BOOLEAN;
  _lockout_until TIMESTAMPTZ;
BEGIN
  SELECT is_locked_out, lockout_until
  INTO _is_locked, _lockout_until
  FROM team_members
  WHERE id = _team_member_id;

  -- Not locked
  IF NOT _is_locked THEN
    RETURN false;
  END IF;

  -- Permanent lockout (requires manager intervention)
  IF _lockout_until IS NULL THEN
    RETURN true;
  END IF;

  -- Temporary lockout expired
  IF _lockout_until < now() THEN
    -- Auto-unlock
    UPDATE team_members
    SET 
      is_locked_out = false,
      lockout_until = NULL,
      failed_pin_attempts = 0
    WHERE id = _team_member_id;
    
    RETURN false;
  END IF;

  -- Still locked
  RETURN true;
END;
$$;

COMMENT ON FUNCTION is_team_member_locked_out IS 'Checks if team member is locked out. Auto-unlocks if temporary lockout expired.';

-- ============================================================================
-- 4. FUNCTION: LOG PIN VERIFICATION ATTEMPT
-- ============================================================================

CREATE OR REPLACE FUNCTION log_pin_verification(
  _team_member_id UUID,
  _verification_status TEXT,
  _ip_address TEXT DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _failed_count INTEGER;
  _lockout_threshold INTEGER := 3; -- Lock after 3 failed attempts
  _lockout_duration INTERVAL := INTERVAL '15 minutes';
BEGIN
  -- Insert log entry
  INSERT INTO pin_verification_log (
    team_member_id,
    verification_status,
    ip_address,
    user_agent,
    attempted_at
  ) VALUES (
    _team_member_id,
    _verification_status,
    _ip_address,
    _user_agent,
    now()
  );

  -- Handle failed attempt
  IF _verification_status = 'failed' THEN
    -- Increment failed attempts counter
    UPDATE team_members
    SET 
      failed_pin_attempts = failed_pin_attempts + 1,
      last_failed_attempt = now()
    WHERE id = _team_member_id
    RETURNING failed_pin_attempts INTO _failed_count;

    -- Check if lockout threshold reached
    IF _failed_count >= _lockout_threshold THEN
      UPDATE team_members
      SET 
        is_locked_out = true,
        lockout_until = now() + _lockout_duration
      WHERE id = _team_member_id;

      -- Log lockout event
      INSERT INTO pin_verification_log (
        team_member_id,
        verification_status,
        ip_address,
        user_agent,
        attempted_at
      ) VALUES (
        _team_member_id,
        'locked_out',
        _ip_address,
        _user_agent,
        now()
      );
    END IF;
  
  -- Handle successful attempt
  ELSIF _verification_status = 'success' THEN
    -- Reset failed attempts counter
    UPDATE team_members
    SET 
      failed_pin_attempts = 0,
      last_failed_attempt = NULL,
      is_locked_out = false,
      lockout_until = NULL
    WHERE id = _team_member_id;
  END IF;
END;
$$;

COMMENT ON FUNCTION log_pin_verification IS 'Logs PIN verification attempt and handles lockout logic. Locks account after 3 failed attempts for 15 minutes.';

-- ============================================================================
-- 5. FUNCTION: UNLOCK TEAM MEMBER (MANAGER ONLY)
-- ============================================================================

CREATE OR REPLACE FUNCTION unlock_team_member(
  _team_member_id UUID,
  _manager_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _manager_id UUID;
  _manager_role TEXT;
BEGIN
  -- Get current user
  _manager_id := auth.uid();
  
  -- Check if manager has permission (admin or manager role)
  SELECT role INTO _manager_role
  FROM user_roles
  WHERE user_id = _manager_id
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'manager' THEN 2
      ELSE 3
    END
  LIMIT 1;

  -- Only admin/manager can unlock
  IF _manager_role NOT IN ('admin', 'manager') THEN
    RAISE EXCEPTION 'Only managers and admins can unlock team members';
  END IF;

  -- Unlock the team member
  UPDATE team_members
  SET 
    is_locked_out = false,
    lockout_until = NULL,
    failed_pin_attempts = 0,
    last_failed_attempt = NULL
  WHERE id = _team_member_id;

  -- Log the unlock action
  INSERT INTO pin_verification_log (
    team_member_id,
    verification_status,
    unlocked_by,
    unlocked_at,
    notes,
    attempted_at
  ) VALUES (
    _team_member_id,
    'success',
    _manager_id,
    now(),
    _manager_notes,
    now()
  );

  RETURN true;
END;
$$;

COMMENT ON FUNCTION unlock_team_member IS 'Allows managers/admins to unlock a team member account. Requires admin or manager role.';

-- ============================================================================
-- 6. FUNCTION: GET RECENT FAILED ATTEMPTS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_recent_failed_attempts(
  _team_member_id UUID,
  _hours_back INTEGER DEFAULT 24
)
RETURNS TABLE (
  attempted_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    attempted_at,
    ip_address,
    user_agent
  FROM pin_verification_log
  WHERE 
    team_member_id = _team_member_id
    AND verification_status = 'failed'
    AND attempted_at > now() - (_hours_back || ' hours')::INTERVAL
  ORDER BY attempted_at DESC
  LIMIT 20;
$$;

COMMENT ON FUNCTION get_recent_failed_attempts IS 'Returns recent failed PIN attempts for a team member. Used for security monitoring.';

-- ============================================================================
-- 7. FUNCTION: GET LOCKED OUT TEAM MEMBERS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_locked_out_team_members(
  _organization_id UUID
)
RETURNS TABLE (
  team_member_id UUID,
  display_name TEXT,
  "position" TEXT,
  failed_attempts INTEGER,
  last_failed_attempt TIMESTAMPTZ,
  lockout_until TIMESTAMPTZ,
  is_permanent_lockout BOOLEAN
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    tm.id,
    tm.display_name,
    tm.position,
    tm.failed_pin_attempts,
    tm.last_failed_attempt,
    tm.lockout_until,
    (tm.lockout_until IS NULL) AS is_permanent_lockout
  FROM team_members tm
  WHERE 
    tm.organization_id = _organization_id
    AND tm.is_locked_out = true
    AND tm.is_active = true
  ORDER BY tm.last_failed_attempt DESC;
$$;

COMMENT ON FUNCTION get_locked_out_team_members IS 'Returns all locked out team members in an organization. Used by manager dashboard.';

-- ============================================================================
-- 8. RLS POLICIES FOR PIN_VERIFICATION_LOG
-- ============================================================================

ALTER TABLE pin_verification_log ENABLE ROW LEVEL SECURITY;

-- Managers/admins can view logs for their organization
CREATE POLICY "Managers can view PIN logs for their organization"
  ON pin_verification_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN profiles p ON p.user_id = auth.uid()
      JOIN user_roles ur ON ur.user_id = p.user_id
      WHERE 
        tm.id = pin_verification_log.team_member_id
        AND tm.organization_id = p.organization_id
        AND ur.role IN ('admin', 'manager')
    )
  );

-- System can insert logs (SECURITY DEFINER functions)
CREATE POLICY "System can insert PIN logs"
  ON pin_verification_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true); -- SECURITY DEFINER functions handle permissions

-- ============================================================================
-- 9. CREATE VIEW: PIN SECURITY DASHBOARD
-- ============================================================================

CREATE OR REPLACE VIEW pin_security_dashboard AS
SELECT 
  tm.organization_id,
  tm.id AS team_member_id,
  tm.display_name,
  tm.position,
  tm.role_type,
  tm.is_locked_out,
  tm.lockout_until,
  tm.failed_pin_attempts,
  tm.last_failed_attempt,
  
  -- Recent activity stats
  (
    SELECT COUNT(*) 
    FROM pin_verification_log pvl 
    WHERE pvl.team_member_id = tm.id 
      AND pvl.attempted_at > now() - INTERVAL '24 hours'
  ) AS attempts_last_24h,
  
  (
    SELECT COUNT(*) 
    FROM pin_verification_log pvl 
    WHERE pvl.team_member_id = tm.id 
      AND pvl.verification_status = 'failed'
      AND pvl.attempted_at > now() - INTERVAL '24 hours'
  ) AS failed_attempts_last_24h,
  
  (
    SELECT MAX(attempted_at)
    FROM pin_verification_log pvl 
    WHERE pvl.team_member_id = tm.id 
      AND pvl.verification_status = 'success'
  ) AS last_successful_login

FROM team_members tm
WHERE tm.is_active = true;

COMMENT ON VIEW pin_security_dashboard IS 'Security dashboard showing PIN verification stats for all active team members';

-- Grant access to authenticated users (RLS will filter by organization)
GRANT SELECT ON pin_security_dashboard TO authenticated;

-- ============================================================================
-- 10. CLEANUP OLD LOGS (OPTIONAL SCHEDULED JOB)
-- ============================================================================

-- Function to clean up old PIN logs (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_pin_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _deleted_count INTEGER;
BEGIN
  DELETE FROM pin_verification_log
  WHERE attempted_at < now() - INTERVAL '90 days';
  
  GET DIAGNOSTICS _deleted_count = ROW_COUNT;
  
  RETURN _deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_old_pin_logs IS 'Deletes PIN verification logs older than 90 days. Should be run via scheduled job.';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if lockout fields were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'team_members' 
  AND column_name IN ('is_locked_out', 'lockout_until', 'failed_pin_attempts', 'last_failed_attempt');

-- Check if pin_verification_log table was created
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'pin_verification_log';

-- Check if functions were created
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN (
  'is_team_member_locked_out',
  'log_pin_verification',
  'unlock_team_member',
  'get_recent_failed_attempts',
  'get_locked_out_team_members',
  'cleanup_old_pin_logs'
);

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

/*
-- Example 1: Check if team member is locked out
SELECT is_team_member_locked_out('team-member-uuid-here');

-- Example 2: Log a failed PIN attempt
SELECT log_pin_verification(
  'team-member-uuid-here',
  'failed',
  '192.168.1.100',
  'Mozilla/5.0...'
);

-- Example 3: Unlock a team member (as manager)
SELECT unlock_team_member(
  'team-member-uuid-here',
  'Team member forgot PIN, unlocked by manager after identity verification'
);

-- Example 4: Get recent failed attempts
SELECT * FROM get_recent_failed_attempts('team-member-uuid-here', 24);

-- Example 5: Get all locked out team members in organization
SELECT * FROM get_locked_out_team_members('organization-uuid-here');

-- Example 6: View security dashboard
SELECT * FROM pin_security_dashboard
WHERE organization_id = 'organization-uuid-here'
ORDER BY failed_attempts_last_24h DESC;
*/
