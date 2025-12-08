-- Update RLS Policies for Label Templates - Role-Based Access Control
-- Only Managers and Leader Chefs can create, update, and delete templates
-- All authenticated users can view templates

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view templates" ON public.label_templates;
DROP POLICY IF EXISTS "Anyone can insert templates" ON public.label_templates;
DROP POLICY IF EXISTS "Anyone can update templates" ON public.label_templates;
DROP POLICY IF EXISTS "Anyone can delete templates" ON public.label_templates;

-- Everyone can view templates (needed for label printing)
CREATE POLICY "Everyone can view templates"
  ON public.label_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Only Manager and Leader Chef can create templates
CREATE POLICY "Manager and Leader Chef can create templates"
  ON public.label_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('manager', 'leader_chef')
    )
  );

-- Only Manager and Leader Chef can update templates
CREATE POLICY "Manager and Leader Chef can update templates"
  ON public.label_templates
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('manager', 'leader_chef')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('manager', 'leader_chef')
    )
  );

-- Only Manager and Leader Chef can delete templates
CREATE POLICY "Manager and Leader Chef can delete templates"
  ON public.label_templates
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('manager', 'leader_chef')
    )
  );

-- Add comments for documentation
COMMENT ON POLICY "Everyone can view templates" ON public.label_templates IS 
'All authenticated users can view label templates for printing';

COMMENT ON POLICY "Manager and Leader Chef can create templates" ON public.label_templates IS 
'Only users with manager or leader_chef role can create new templates';

COMMENT ON POLICY "Manager and Leader Chef can update templates" ON public.label_templates IS 
'Only users with manager or leader_chef role can modify existing templates';

COMMENT ON POLICY "Manager and Leader Chef can delete templates" ON public.label_templates IS 
'Only users with manager or leader_chef role can delete templates';
