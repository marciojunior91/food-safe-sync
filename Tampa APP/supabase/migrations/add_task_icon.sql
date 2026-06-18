-- Add a per-task emoji/icon so routine tasks (incl. recurring) can have their
-- own identity, matching how labels/recipes use CategoryEmojiPicker.
-- Apply via Supabase Dashboard → SQL Editor.

ALTER TABLE routine_tasks ADD COLUMN IF NOT EXISTS icon text;

-- task_series / task_occurrences belong to the newer recurring system; add the
-- column too so the icon flows through if/when series are created that way.
ALTER TABLE task_series ADD COLUMN IF NOT EXISTS icon text;
ALTER TABLE task_occurrences ADD COLUMN IF NOT EXISTS icon text;
