# 🚀 Quick Start - Testing Image Attachments

## Before Testing - Storage Bucket Setup

### ⚠️ IMPORTANT: Create Storage Bucket First

The `task-attachments` storage bucket needs to exist before images can upload. 

**Two Options:**

### Option A: Via Supabase Dashboard (Recommended)
1. Go to https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn/storage/buckets
2. Click "New Bucket"
3. Enter these settings:
   - **Name:** `task-attachments`
   - **Public:** ✅ Yes (checked)
   - **File size limit:** `5242880` (5MB)
   - **Allowed MIME types:** `image/jpeg, image/jpg, image/png, image/gif, image/webp`
4. Click "Create Bucket"

### Option B: Via SQL Editor
1. Go to https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn/sql
2. Run this SQL:
   ```sql
   INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
   VALUES (
     'task-attachments',
     'task-attachments',
     true,
     5242880,
     ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
   )
   ON CONFLICT (id) DO NOTHING;
   ```

---

## Testing Steps

### Test 1: Upload Image
1. Refresh your Tampa APP (Ctrl+Shift+R / Cmd+Shift+R)
2. Open any routine task
3. Scroll to "Photo Attachments" section
4. Click "Browse Files" or "Take Photo"
5. Select an image (max 5MB, JPEG/PNG/GIF/WebP)
6. ✅ **Expected:**
   - Loading spinner appears
   - Image uploads to storage
   - Record saved to database
   - Image appears in grid immediately
   - Toast: "1 image(s) uploaded successfully"

### Test 2: Verify Persistence
1. Close the task detail dialog
2. Reopen the same task
3. ✅ **Expected:**
   - Previously uploaded image still visible
   - Image loads from database

### Test 3: Multiple Images
1. Upload 3 different images to the same task
2. Close and reopen task
3. ✅ **Expected:**
   - All 3 images display in chronological order
   - Grid shows thumbnails with hover actions

### Test 4: Multiple Tasks
1. Upload image to Task A
2. Upload different image to Task B
3. Open Task A
4. ✅ **Expected:** Only Task A's image shown
5. Open Task B
6. ✅ **Expected:** Only Task B's image shown

### Test 5: Notes Display
1. Open any task
2. Add a note in "Notes & Comments" section
3. Click "Save Note"
4. ✅ **Expected:**
   - Note appears immediately below input
   - Formatted with proper spacing
5. Close and reopen task
6. ✅ **Expected:** Note still visible

---

## Troubleshooting

### ❌ Error: "Failed to upload"
**Cause:** Storage bucket doesn't exist
**Fix:** Follow "Storage Bucket Setup" above

### ❌ Images upload but don't appear
**Cause:** Database insert failed
**Fix:** 
1. Open browser console (F12)
2. Check for errors in console
3. Verify `task_attachments` table exists:
   ```sql
   SELECT * FROM task_attachments LIMIT 5;
   ```

### ❌ Images disappear after closing dialog
**Cause:** This should be fixed now! If still happening:
1. Check browser console for errors
2. Verify `loadAttachments()` is being called:
   - Add `console.log` in useEffect
3. Check database has records:
   ```sql
   SELECT task_id, file_url FROM task_attachments WHERE task_id = 'YOUR_TASK_ID';
   ```

### ❌ Notes not showing
**Cause:** Should be fixed! If still happening:
1. Check if notes saved to database:
   ```sql
   SELECT id, title, notes FROM routine_tasks WHERE notes IS NOT NULL LIMIT 5;
   ```
2. Verify `task.notes` has content in browser console:
   ```js
   console.log('Task notes:', task.notes);
   ```

---

## Success Criteria ✅

All features working:
- ✅ Images upload successfully
- ✅ Images persist across dialog close/reopen
- ✅ Multiple images per task
- ✅ Images isolated per task (not shared)
- ✅ Notes display immediately
- ✅ Notes persist in database
- ✅ Duplicate upload buttons removed
- ✅ Clean, professional UI

---

## What's Next?

### Optional Enhancements (Not Blocking):
1. **Delete Images** - Remove from storage + database
2. **Image Metadata** - Add timestamp, geolocation
3. **Image Compression** - Reduce file sizes
4. **Loading States** - Skeleton loaders for attachments
5. **Error Recovery** - Retry failed uploads

### Current Priority:
**TEST AND VERIFY** the three main fixes:
1. ✅ Notes display
2. ✅ Image upload persistence
3. ✅ Clean UI (no duplicates)

---

## Support

If issues persist:
1. Check browser console (F12) for errors
2. Check Supabase logs in dashboard
3. Verify storage bucket exists
4. Verify RLS policies allow authenticated users
5. Share specific error messages for debugging

**Everything should work now!** 🎉
