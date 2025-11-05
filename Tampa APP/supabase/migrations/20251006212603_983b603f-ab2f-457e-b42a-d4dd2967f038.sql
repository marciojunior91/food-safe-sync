-- Fix critical food safety security issue: prevent staff from tampering with prepared_items records
-- Only managers and admins can update or delete food safety records

-- Add UPDATE policy: only managers and admins can modify prepared items
CREATE POLICY "Only managers and admins can update prepared items"
ON public.prepared_items
FOR UPDATE
USING (
  (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  )) AND
  public.has_any_role(auth.uid(), ARRAY['admin', 'manager']::app_role[])
);

-- Add DELETE policy: only managers and admins can delete prepared items
CREATE POLICY "Only managers and admins can delete prepared items"
ON public.prepared_items
FOR DELETE
USING (
  (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  )) AND
  public.has_any_role(auth.uid(), ARRAY['admin', 'manager']::app_role[])
);