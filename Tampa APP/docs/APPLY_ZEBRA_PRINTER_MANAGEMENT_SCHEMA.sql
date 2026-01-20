-- Zebra Printer Management System - Database Schema
-- Based on: Documento Técnico — Integração iPad (iOS) + Zebra ZD411
-- Version: 1.0

-- Table: zebra_printers
-- Stores all registered Zebra printers in the organization
CREATE TABLE IF NOT EXISTS zebra_printers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'ZD411',
  serial_number TEXT,
  
  -- Connection
  connection_type TEXT NOT NULL CHECK (connection_type IN ('bluetooth', 'wifi', 'usb')),
  bluetooth_address TEXT,
  bluetooth_name TEXT,
  ip_address INET,
  port INTEGER,
  
  -- Location
  location TEXT,
  station TEXT,
  
  -- Settings
  paper_width INTEGER NOT NULL DEFAULT 102, -- mm
  paper_height INTEGER NOT NULL DEFAULT 152, -- mm
  dpi INTEGER NOT NULL DEFAULT 203,
  darkness INTEGER NOT NULL DEFAULT 20 CHECK (darkness BETWEEN 0 AND 30),
  speed INTEGER NOT NULL DEFAULT 4 CHECK (speed BETWEEN 2 AND 12),
  
  -- State
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('ready', 'busy', 'offline', 'error', 'paused')),
  last_seen TIMESTAMPTZ,
  is_default BOOLEAN NOT NULL DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Constraints
  UNIQUE(serial_number, organization_id)
);

-- Index for fast lookups
CREATE INDEX idx_zebra_printers_org ON zebra_printers(organization_id);
CREATE INDEX idx_zebra_printers_station ON zebra_printers(station) WHERE station IS NOT NULL;
CREATE INDEX idx_zebra_printers_default ON zebra_printers(is_default) WHERE is_default = true;

-- Partial unique index: only one default printer per station per organization
CREATE UNIQUE INDEX idx_zebra_printers_default_station 
  ON zebra_printers(station, organization_id) 
  WHERE is_default = true;

-- Table: zebra_print_jobs
-- Audit log of all print jobs for compliance and monitoring
CREATE TABLE IF NOT EXISTS zebra_print_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL UNIQUE,
  label_id UUID REFERENCES printed_labels(id) ON DELETE SET NULL,
  printer_id UUID NOT NULL REFERENCES zebra_printers(id) ON DELETE CASCADE,
  printer_name TEXT NOT NULL,
  
  -- Result
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
  printed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  printed_by UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Diagnostics
  error TEXT,
  latency_ms INTEGER,
  retry_count INTEGER DEFAULT 0,
  
  -- Metadata
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
);

-- Index for analytics and audit
CREATE INDEX idx_zebra_print_jobs_org ON zebra_print_jobs(organization_id);
CREATE INDEX idx_zebra_print_jobs_printer ON zebra_print_jobs(printer_id);
CREATE INDEX idx_zebra_print_jobs_user ON zebra_print_jobs(printed_by);
CREATE INDEX idx_zebra_print_jobs_date ON zebra_print_jobs(printed_at DESC);
CREATE INDEX idx_zebra_print_jobs_status ON zebra_print_jobs(status);

-- Row Level Security (RLS)

-- Enable RLS
ALTER TABLE zebra_printers ENABLE ROW LEVEL SECURITY;
ALTER TABLE zebra_print_jobs ENABLE ROW LEVEL SECURITY;

-- Policies for zebra_printers

-- Users can view printers in their organization
CREATE POLICY "Users can view organization printers"
  ON zebra_printers FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Admins can insert printers
CREATE POLICY "Admins can add printers"
  ON zebra_printers FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT p.organization_id 
      FROM profiles p
      INNER JOIN user_roles ur ON ur.user_id = p.user_id
      WHERE p.user_id = auth.uid() 
      AND ur.role IN ('admin', 'owner')
    )
  );

-- Admins can update printers
CREATE POLICY "Admins can update printers"
  ON zebra_printers FOR UPDATE
  USING (
    organization_id IN (
      SELECT p.organization_id 
      FROM profiles p
      INNER JOIN user_roles ur ON ur.user_id = p.user_id
      WHERE p.user_id = auth.uid() 
      AND ur.role IN ('admin', 'owner')
    )
  );

-- Admins can delete printers
CREATE POLICY "Admins can delete printers"
  ON zebra_printers FOR DELETE
  USING (
    organization_id IN (
      SELECT p.organization_id 
      FROM profiles p
      INNER JOIN user_roles ur ON ur.user_id = p.user_id
      WHERE p.user_id = auth.uid() 
      AND ur.role IN ('admin', 'owner')
    )
  );

-- Policies for zebra_print_jobs

-- Users can view print jobs in their organization
CREATE POLICY "Users can view organization print jobs"
  ON zebra_print_jobs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Users can insert their own print jobs
CREATE POLICY "Users can log print jobs"
  ON zebra_print_jobs FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
    AND printed_by = auth.uid()
  );

-- Function to auto-populate organization_id on insert
CREATE OR REPLACE FUNCTION set_printer_organization_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM profiles
    WHERE user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_printer_org_id
  BEFORE INSERT ON zebra_printers
  FOR EACH ROW
  EXECUTE FUNCTION set_printer_organization_id();

CREATE TRIGGER set_print_job_org_id
  BEFORE INSERT ON zebra_print_jobs
  FOR EACH ROW
  EXECUTE FUNCTION set_printer_organization_id();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_printer_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_printer_timestamp
  BEFORE UPDATE ON zebra_printers
  FOR EACH ROW
  EXECUTE FUNCTION update_printer_timestamp();

-- View: printer_statistics
-- Aggregated statistics per printer
CREATE OR REPLACE VIEW printer_statistics AS
SELECT 
  p.id as printer_id,
  p.name as printer_name,
  p.model,
  p.location,
  p.status,
  COUNT(j.id) as total_jobs,
  COUNT(j.id) FILTER (WHERE j.status = 'success') as successful_jobs,
  COUNT(j.id) FILTER (WHERE j.status = 'failed') as failed_jobs,
  AVG(j.latency_ms) as avg_latency_ms,
  MAX(j.printed_at) as last_job_at,
  CASE 
    WHEN COUNT(j.id) > 0 
    THEN (COUNT(j.id) FILTER (WHERE j.status = 'success')::float / COUNT(j.id) * 100)
    ELSE 0
  END as uptime_percentage,
  p.organization_id
FROM zebra_printers p
LEFT JOIN zebra_print_jobs j ON p.id = j.printer_id
GROUP BY p.id, p.name, p.model, p.location, p.status, p.organization_id;

-- Grant access to view
GRANT SELECT ON printer_statistics TO authenticated;

-- Comments for documentation
COMMENT ON TABLE zebra_printers IS 'Registry of all Zebra thermal printers in the organization';
COMMENT ON TABLE zebra_print_jobs IS 'Audit log of all print jobs for compliance tracking';
COMMENT ON VIEW printer_statistics IS 'Aggregated statistics and health metrics for each printer';

COMMENT ON COLUMN zebra_printers.connection_type IS 'How the printer connects: bluetooth, wifi, or usb';
COMMENT ON COLUMN zebra_printers.is_default IS 'Whether this is the default printer for its station';
COMMENT ON COLUMN zebra_printers.darkness IS 'Print darkness setting (0-30, higher = darker)';
COMMENT ON COLUMN zebra_printers.speed IS 'Print speed setting (2-12, higher = faster)';

COMMENT ON COLUMN zebra_print_jobs.latency_ms IS 'Time taken to complete print job in milliseconds';
COMMENT ON COLUMN zebra_print_jobs.retry_count IS 'Number of retry attempts before success/failure';
