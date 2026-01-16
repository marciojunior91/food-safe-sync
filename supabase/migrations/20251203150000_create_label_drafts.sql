-- Create label_drafts table for saving incomplete labels
CREATE TABLE IF NOT EXISTS label_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  draft_name TEXT NOT NULL,
  form_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_label_drafts_user_id ON label_drafts(user_id);
CREATE INDEX idx_label_drafts_created_at ON label_drafts(created_at DESC);
CREATE INDEX idx_label_drafts_user_created ON label_drafts(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE label_drafts ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only manage their own drafts
CREATE POLICY "Users can view their own drafts"
  ON label_drafts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own drafts"
  ON label_drafts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drafts"
  ON label_drafts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drafts"
  ON label_drafts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_label_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_label_drafts_updated_at
  BEFORE UPDATE ON label_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_label_drafts_updated_at();

-- Add comment
COMMENT ON TABLE label_drafts IS 'Stores draft label data for users to save and resume later';
