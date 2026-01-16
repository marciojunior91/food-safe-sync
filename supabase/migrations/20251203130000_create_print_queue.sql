-- Create Print Queue table for Phase 2 - Label Management
-- This table stores labels waiting to be printed, allowing batch printing and queue management

CREATE TABLE IF NOT EXISTS public.print_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Product and category references
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.label_categories(id) ON DELETE SET NULL,
  template_id uuid REFERENCES public.label_templates(id) ON DELETE SET NULL,
  
  -- User information
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prepared_by_name text NOT NULL,
  
  -- Label details
  prep_date date NOT NULL DEFAULT CURRENT_DATE,
  expiry_date date NOT NULL,
  condition text NOT NULL CHECK (condition IN ('fresh', 'cooked', 'frozen', 'refrigerated', 'thawed')),
  quantity text,
  unit text,
  batch_number text,
  notes text,
  
  -- Queue management
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'printing', 'completed', 'failed')),
  priority integer DEFAULT 0,
  
  -- Timestamps
  created_at timestamptz DEFAULT NOW() NOT NULL,
  updated_at timestamptz DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.print_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only manage their own print queue
CREATE POLICY "Users can view their own print queue"
  ON public.print_queue
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their print queue"
  ON public.print_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their print queue"
  ON public.print_queue
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from their print queue"
  ON public.print_queue
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_print_queue_user_status ON public.print_queue(user_id, status);
CREATE INDEX idx_print_queue_created ON public.print_queue(created_at DESC);
CREATE INDEX idx_print_queue_priority ON public.print_queue(priority DESC, created_at ASC);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_print_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_print_queue_updated_at
  BEFORE UPDATE ON public.print_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_print_queue_updated_at();

-- Comments for documentation
COMMENT ON TABLE public.print_queue IS 'Queue of labels waiting to be printed, allowing batch printing and queue management';
COMMENT ON COLUMN public.print_queue.status IS 'Current status: pending (waiting), printing (in progress), completed (printed), failed (error occurred)';
COMMENT ON COLUMN public.print_queue.priority IS 'Higher number = higher priority. Used for manual reordering via drag-and-drop';
COMMENT ON COLUMN public.print_queue.condition IS 'Storage condition: fresh (1 day), cooked (3 days), frozen (30 days), refrigerated (7 days), thawed (24 hours)';
