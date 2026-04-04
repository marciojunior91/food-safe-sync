-- Add venue/franchise support to organizations
-- Allows organizations to have a parent (franchise group) relationship

ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS parent_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS is_franchise_group BOOLEAN DEFAULT false;

ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS venue_label TEXT;

CREATE INDEX IF NOT EXISTS idx_organizations_parent ON public.organizations(parent_organization_id);
CREATE INDEX IF NOT EXISTS idx_organizations_franchise ON public.organizations(is_franchise_group);

-- RLS: Allow admins to see sibling venues in the same franchise group
DROP POLICY IF EXISTS "Admins can view sibling venues" ON public.organizations;
CREATE POLICY "Admins can view sibling venues"
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT o2.id FROM organizations o2
      WHERE o2.parent_organization_id = (
        SELECT COALESCE(o1.parent_organization_id, o1.id)
        FROM organizations o1
        WHERE o1.id IN (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
      )
      AND EXISTS (
        SELECT 1 FROM organizations o3
        WHERE o3.id IN (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
        AND (o3.is_franchise_group = true OR o3.parent_organization_id IS NOT NULL)
      )
    )
    OR
    id = (
      SELECT COALESCE(o1.parent_organization_id, o1.id)
      FROM organizations o1
      WHERE o1.id IN (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
      AND (o1.is_franchise_group = true OR o1.parent_organization_id IS NOT NULL)
    )
  );

-- Function to get venues for the current user's franchise group
CREATE OR REPLACE FUNCTION public.get_user_venues()
RETURNS TABLE(
  id UUID,
  name TEXT,
  venue_label TEXT,
  is_parent BOOLEAN
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  WITH user_org AS (
    SELECT o.id, o.parent_organization_id, o.is_franchise_group
    FROM organizations o
    JOIN profiles p ON p.organization_id = o.id
    WHERE p.user_id = auth.uid()
    LIMIT 1
  ),
  parent AS (
    SELECT COALESCE(uo.parent_organization_id, uo.id) AS parent_id
    FROM user_org uo
    WHERE uo.is_franchise_group = true OR uo.parent_organization_id IS NOT NULL
  )
  SELECT 
    o.id,
    o.name,
    o.venue_label,
    (o.id = p.parent_id) AS is_parent
  FROM organizations o, parent p
  WHERE o.id = p.parent_id OR o.parent_organization_id = p.parent_id
  ORDER BY (o.id = p.parent_id) DESC, o.name;
$$;
