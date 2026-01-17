-- Create storage bucket for task attachments
-- Note: This creates a PUBLIC bucket for easy image access
-- RLS policies should be configured via Supabase Dashboard UI for storage.objects table

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-attachments',
  'task-attachments',
  true, -- public bucket for easy access
  5242880, -- 5MB limit (5MB)
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;
