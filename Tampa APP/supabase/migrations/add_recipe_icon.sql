-- Add a per-recipe emoji/icon so recipes can have their own identity, matching
-- how label categories use CategoryEmojiPicker.
-- Apply via Supabase Dashboard → SQL Editor.

ALTER TABLE recipes ADD COLUMN IF NOT EXISTS icon text;
