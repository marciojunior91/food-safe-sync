# 🔍 Image Attachment Diagnostics

## Problem
Images exist in storage bucket but don't display in task detail view.

## Possible Causes

### 1. Images in Storage but NOT in Database
**Most Likely Issue**: The 3 images were uploaded to the storage bucket, but no records were created in the `task_attachments` table.

**Why this happens:**
- Images were uploaded before the database insert code was added
- Upload succeeded but database insert failed silently
- Images were uploaded manually via Supabase Dashboard

**Check this in Supabase SQL Editor:**
```sql
-- Check if task_attachments table has any records
SELECT COUNT(*) as total_attachments FROM task_attachments;

-- Check attachments for a specific task
SELECT * FROM task_attachments WHERE task_id = 'YOUR_TASK_ID';

-- List all attachments
SELECT 
  ta.id,
  ta.task_id,
  ta.file_name,
  ta.file_url,
  ta.uploaded_at,
  rt.title as task_title
FROM task_attachments ta
LEFT JOIN routine_tasks rt ON ta.task_id = rt.id
ORDER BY ta.uploaded_at DESC
LIMIT 20;
```

### 2. Wrong Task ID
Images are linked to a different task than the one you're viewing.

**Check this:**
```sql
-- Find which task(s) have attachments
SELECT 
  rt.id,
  rt.title,
  COUNT(ta.id) as attachment_count
FROM routine_tasks rt
LEFT JOIN task_attachments ta ON rt.task_id = ta.task_id
GROUP BY rt.id, rt.title
HAVING COUNT(ta.id) > 0;
```

### 3. RLS Policies Blocking Access
Row Level Security might be preventing the query from returning data.

**Check this:**
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'task_attachments';

-- List RLS policies
SELECT * FROM pg_policies WHERE tablename = 'task_attachments';

-- Try querying as service role (bypasses RLS)
-- Run this in Supabase SQL Editor which uses service_role
SELECT * FROM task_attachments LIMIT 5;
```

### 4. Images Not Linked to Any Task
Images exist in storage but were never associated with a task in the database.

**Check storage bucket contents:**
Go to: Supabase Dashboard → Storage → task-attachments bucket
- Note the file paths
- Note the task IDs in the folder names

---

## Debugging Steps

### Step 1: Open Browser Console
1. Open your Tampa APP
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Open a task detail dialog
5. Look for these log messages:
   ```
   🔍 Loading attachments for task: [UUID]
   ✅ Loaded attachments from database: [array]
   📷 Attachment URLs: [array]
   🖼️ ImageUpload rendered with: {existingImagesCount, existingImages}
   ```

### Step 2: Check What Console Shows

**If you see:**
```
🔍 Loading attachments for task: abc-123
✅ Loaded attachments from database: []
📷 Attachment URLs: []
🖼️ ImageUpload rendered with: {existingImagesCount: 0, existingImages: []}
```
**→ Problem:** No records in database for this task

**If you see:**
```
🔍 Loading attachments for task: abc-123
✅ Loaded attachments from database: [{file_url: "https://..."}, ...]
📷 Attachment URLs: ["https://...", "https://...", "https://..."]
🖼️ ImageUpload rendered with: {existingImagesCount: 3, existingImages: [...]}
```
**→ Problem:** Images are loaded but not rendering (check for image load errors)

**If you see an error:**
```
❌ Error loading attachments: {code: "PGRST..."}
```
**→ Problem:** RLS policy blocking access or table doesn't exist

---

## Solutions

### Solution 1: Link Existing Images to Task (Manual Fix)

If images exist in storage but not in database:

```sql
-- Insert records for existing images
-- Replace these values with your actual data
INSERT INTO task_attachments (task_id, file_url, file_name, file_type, file_size)
VALUES 
  (
    'YOUR_TASK_ID_HERE',  -- UUID of the task
    'https://imnecvcvhypnlvujajpn.supabase.co/storage/v1/object/public/task-attachments/...',
    'image1.jpg',
    'image/jpeg',
    1024000  -- size in bytes
  ),
  (
    'YOUR_TASK_ID_HERE',
    'https://imnecvcvhypnlvujajpn.supabase.co/storage/v1/object/public/task-attachments/...',
    'image2.jpg',
    'image/jpeg',
    1024000
  ),
  (
    'YOUR_TASK_ID_HERE',
    'https://imnecvcvhypnlvujajpn.supabase.co/storage/v1/object/public/task-attachments/...',
    'image3.jpg',
    'image/jpeg',
    1024000
  );
```

### Solution 2: Fix RLS Policies

If RLS is blocking access:

```sql
-- Grant access to authenticated users
GRANT SELECT ON task_attachments TO authenticated;

-- Ensure policies allow viewing
DROP POLICY IF EXISTS "Users can view attachments for their org tasks" ON task_attachments;

CREATE POLICY "Users can view attachments for their org tasks"
ON task_attachments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM routine_tasks rt
    WHERE rt.id = task_attachments.task_id
    AND rt.organization_id = (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  )
);
```

### Solution 3: Re-upload Images

If easier than manual linking, just delete the storage files and re-upload through the UI (which now saves to database correctly).

---

## Quick Test

To verify everything is working, try this:

1. **Create a NEW task** (to avoid old data issues)
2. **Upload a NEW image** through the UI
3. **Close and reopen the task**
4. **Check if image persists**

If the new image works but old images don't, it confirms the old images were uploaded before the database integration was added.

---

## Next Steps

Please check:
1. ✅ Run the browser console test (Step 1 above)
2. ✅ Share the console log output
3. ✅ Run this SQL query and share results:
   ```sql
   SELECT COUNT(*) FROM task_attachments;
   ```

This will tell us exactly what's happening! 🔍
