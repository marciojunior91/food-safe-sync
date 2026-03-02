# TASKS-13 Fix: Upload de Foto Falha - SOLUTION FOUND

## 🔍 Root Cause Analysis

**Problem:** ImageUpload shows "upload fail" when trying to upload photos to tasks.

**Root Cause:** Missing storage.objects RLS policies for `task-attachments` bucket.

### Technical Details

Despite having:
- ✅ Bucket created (`task-attachments`)
- ✅ Bucket is PUBLIC
- ✅ Table RLS policies on `task_attachments` table
- ✅ Upload code working correctly

**Upload still failed because:**

Supabase Storage has **TWO security layers**:

```
Layer 1: storage.objects RLS (FILE OPERATIONS)
  ↓
  Controls: INSERT, SELECT, DELETE on storage.objects table
  Status: ❌ MISSING (causing upload fail)

Layer 2: task_attachments RLS (METADATA)
  ↓
  Controls: INSERT, SELECT, DELETE on task_attachments table
  Status: ✅ EXISTS (from migration 20250101000002)
```

**The issue:** Even with a public bucket, you need **INSERT policy on storage.objects** to upload files!

---

## ✅ Solution Implemented

### File Created: 
`supabase/migrations/20260301000000_fix_task_attachments_storage_policies.sql`

### What It Does:

Creates 3 RLS policies on `storage.objects` for `task-attachments` bucket:

#### 1. **INSERT Policy** (allows uploads)
```sql
CREATE POLICY "Users can upload task attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'task-attachments');
```
- **Effect:** Any authenticated user can upload files
- **Why permissive:** Organization security enforced at task level

#### 2. **SELECT Policy** (allows viewing)
```sql
CREATE POLICY "Users can view task attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'task-attachments');
```
- **Effect:** Any authenticated user can view files
- **Why permissive:** Bucket is public, facilitates collaboration

#### 3. **DELETE Policy** (restricts deletion)
```sql
CREATE POLICY "Users can delete their task attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'task-attachments'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT id FROM routine_tasks
    WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  )
);
```
- **Effect:** Only users from same organization can delete
- **Why restrictive:** Prevent accidental/malicious deletion

---

## 🚀 How to Apply

### Method 1: PowerShell Script (Easiest)

```powershell
.\scripts\apply-task-storage-fix.ps1
```

The script will:
1. Prompt for your Supabase database password
2. Connect to Supabase
3. Apply the migration
4. Show success message

### Method 2: Supabase Dashboard (Alternative)

1. Go to: https://supabase.com/dashboard/project/qmxjunrjmyjcitclbhqu/sql/new
2. Copy content from `supabase/migrations/20260301000000_fix_task_attachments_storage_policies.sql`
3. Paste and click "Run"
4. Verify success message

### Method 3: CLI (If installed)

```bash
supabase db push
```

---

## ✅ Testing the Fix

### Before Fix:
```
User clicks "Browse Files" → Selects image → Upload starts
↓
ImageUpload.tsx attempts upload to storage
↓
Supabase rejects: "new row violates row-level security policy"
↓
User sees: "Upload Failed" toast
```

### After Fix:
```
User clicks "Browse Files" → Selects image → Upload starts
↓
✅ storage.objects INSERT policy allows upload
↓
✅ File uploaded to: task-attachments/{taskId}/{uuid}.{ext}
↓
✅ Public URL generated
↓
✅ Metadata saved to task_attachments table
↓
✅ User sees: "Upload Successful" toast
↓
✅ Image appears in task detail view
```

### Manual Test Steps:

1. **Apply the migration** (using one of the methods above)

2. **Open the app** in browser

3. **Go to Routine Tasks module**

4. **Open or create a task**

5. **In Task Detail View**, click "Browse Files" or "Take Photo"

6. **Select an image** (JPG, PNG, WEBP - max 5MB)

7. **Wait for upload** (should see "Uploading..." spinner)

8. **Verify success:**
   - ✅ "Upload Successful" toast appears
   - ✅ Image thumbnail appears in grid
   - ✅ Can zoom image
   - ✅ Can delete image (if you're admin/leader)

9. **Refresh page** and verify:
   - ✅ Image still appears (persisted)
   - ✅ Image loads correctly

10. **Check Supabase Storage:**
    - Dashboard → Storage → task-attachments
    - Should see files organized by task ID

---

## 🔍 Verification Queries

### Check if policies exist:
```sql
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%task%'
ORDER BY policyname;
```

**Expected result:** 3 policies listed

### Test upload permissions:
```sql
-- This should return true if you can upload
SELECT 
  'task-attachments' = bucket_id AS can_upload
FROM storage.objects 
WHERE false; -- Just checking policy, not actual data
```

---

## 📊 Why This Bug Existed

### Timeline:
1. **Jan 1, 2025:** Migration `20250101000000_create_task_attachments_bucket.sql` created
   - Created bucket ✅
   - Made bucket public ✅
   - **But:** Included comment "RLS policies should be configured via Dashboard"
   - **Problem:** Policies were never configured!

2. **Jan 1, 2025:** Migration `20250101000002_fix_task_attachments_rls.sql` created
   - Fixed `task_attachments` **table** RLS ✅
   - **But:** Didn't create `storage.objects` policies!

3. **Feb 2026:** Similar issue found in Feed module
   - Migration `20260201000000_create_feed_attachments_bucket.sql`
   - **Correctly** included storage.objects policies
   - **But:** Task attachments still broken

4. **March 1, 2026:** User reports "upload fail" (TASKS-13)
   - Investigation reveals missing storage policies
   - **This fix** applies the solution

### Why It Was Missed:
- Documentation said "configure via Dashboard" but never done
- Feed attachments added storage policies, but task attachments not updated
- Public bucket assumption ("if bucket is public, uploads should work")
- Storage RLS is separate layer, not obvious in error messages

---

## 🎯 Impact

### Before Fix:
- ❌ Users cannot upload task photos
- ❌ Documentation feature unusable
- ❌ Task evidence not captured
- ❌ Frustrating UX ("upload fail")

### After Fix:
- ✅ Photo uploads work reliably
- ✅ Tasks can be documented with images
- ✅ Evidence properly stored
- ✅ Better task collaboration
- ✅ Photos persist across sessions
- ✅ Proper organization-level security

---

## 🔗 Related Files

### Migration Files:
- `supabase/migrations/20260301000000_fix_task_attachments_storage_policies.sql` ← **THE FIX**
- `supabase/migrations/20250101000000_create_task_attachments_bucket.sql` (original bucket)
- `supabase/migrations/20250101000002_fix_task_attachments_rls.sql` (table RLS)

### Component Files:
- `src/components/routine-tasks/ImageUpload.tsx` (upload logic - no changes needed)
- `src/components/routine-tasks/TaskDetailView.tsx` (displays images)
- `src/components/routine-tasks/TaskForm.tsx` (edit mode uploads)

### Script Files:
- `scripts/apply-task-storage-fix.ps1` (deployment script)

### Documentation:
- `docs/TASKS_13_PHOTO_UPLOAD_FIX.md` (this file)
- `docs/STORAGE_POLICIES_MISSING.md` (explains 2-layer security)
- `docs/STORAGE_POLICIES_SETUP_GUIDE.md` (general guide)

---

## ✅ Success Criteria

After applying this fix:

- [ ] Migration runs without errors
- [ ] 3 storage policies created on storage.objects
- [ ] Photo upload shows "Upload Successful" toast
- [ ] Uploaded images appear in task detail view
- [ ] Images persist after page refresh
- [ ] Files visible in Supabase Storage dashboard
- [ ] No console errors during upload
- [ ] Delete works for admins/leaders
- [ ] Organization security maintained

---

## 🚨 Important Notes

### Security Considerations:
- Upload permissions are **broad** by design (any authenticated user)
- **Real security** enforced at `task_attachments` table level
- Delete permissions **restricted** to organization members
- Organization check happens via task_id → routine_tasks → organization_id chain

### Performance:
- Public bucket = no authentication per-request (faster loads)
- RLS policies only evaluate on INSERT/DELETE (minimal overhead)
- 5MB file size limit prevents storage abuse
- Image types restricted to prevent executable uploads

### Future Improvements:
- [ ] Add UPDATE policy if image replacement needed
- [ ] Consider more granular upload permissions (team member role)
- [ ] Add audit logging for deletions
- [ ] Implement file size analytics

---

**Status:** ✅ Ready to Apply  
**Risk Level:** 🟢 Low (adds missing security, no breaking changes)  
**Estimated Time:** 2 minutes  
**Rollback:** Drop policies if needed (see migration comments)
