-- Update RLS policy for label_categories to allow viewing global categories (organization_id IS NULL)

DROP POLICY IF EXISTS "Users can view categories in their organization" ON public.label_categories;

CREATE POLICY "Users can view categories in their organization or global"
ON public.label_categories
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  )
  OR organization_id IS NULL
);
