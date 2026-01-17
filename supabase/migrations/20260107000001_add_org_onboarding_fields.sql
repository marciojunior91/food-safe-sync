-- Add Onboarding Fields to Organizations Table
-- Iteration 13 - MVP Sprint
-- Adds Australian business-specific fields for onboarding

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
