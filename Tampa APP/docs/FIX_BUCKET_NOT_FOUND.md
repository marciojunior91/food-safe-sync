# 🚨 BUCKET NOT FOUND ERROR - Quick Fix Guide

## The Problem

The error `{"statusCode":"404","error":"Bucket not found","message":"Bucket not found"}` means the bucket name in the code doesn't match the actual bucket name in Supabase.

The URL shows: `team-member-documents` (with dashes)
But the bucket might actually be: `team_member_documents` (with underscores)

---

## 🔍 Step 1: Find Your Bucket Name

Run this SQL query to see all your buckets:

```sql
SELECT id, name, public FROM storage.buckets ORDER BY id;
```

Look for the bucket related to team member documents. It will be named either:
- `team-member-documents` (with dashes)
- `team_member_documents` (with underscores)
- Something else

**Write down the EXACT name!**

---

## ✅ Step 2: Update the Code

Once you know the bucket name, update this file:

**File:** `src/hooks/useTeamMemberDocuments.ts`

**Line 49:** Change this line to match your bucket name:

```typescript
const BUCKET_NAME = 'YOUR_ACTUAL_BUCKET_NAME_HERE';
```

Examples:
- If your bucket is `team-member-documents`: `const BUCKET_NAME = 'team-member-documents';`
- If your bucket is `team_member_documents`: `const BUCKET_NAME = 'team_member_documents';`

---

## 🔓 Step 3: Make Bucket Public

Run this SQL (replace with YOUR bucket name):

```sql
-- Option A: If bucket has underscores
UPDATE storage.buckets 
SET public = true 
WHERE id = 'team_member_documents';

-- Option B: If bucket has dashes
-- UPDATE storage.buckets 
-- SET public = true 
-- WHERE id = 'team-member-documents';
```

Verify it worked:
```sql
SELECT id, public FROM storage.buckets WHERE id = 'YOUR_BUCKET_NAME';
```

Should show `public: true`

---

## 🧪 Step 4: Test

1. Save the code changes
2. Refresh your app
3. Try uploading a document again
4. Should work now! 🎉

---

## 🆘 Still Not Working?

### Check These:

1. **Bucket exists?**
   ```sql
   SELECT * FROM storage.buckets;
   ```

2. **Bucket is public?**
   ```sql
   SELECT id, public FROM storage.buckets WHERE id = 'YOUR_BUCKET_NAME';
   ```
   Should show `public = true`

3. **Code has correct name?**
   Check line 49 in `src/hooks/useTeamMemberDocuments.ts`

4. **Browser cache?**
   - Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
   - Or clear cache and reload

---

## 📋 Quick Checklist

- [ ] Run `check-bucket-name.sql` to find exact bucket name
- [ ] Update `BUCKET_NAME` in `useTeamMemberDocuments.ts` (line 49)
- [ ] Run SQL to make bucket public
- [ ] Verify bucket is public
- [ ] Refresh app
- [ ] Test upload

---

## 🎯 Expected Result

After fixing:
- Upload should work
- File should appear in list
- No "Bucket not found" error
- File URL should be accessible

---

## 💡 Pro Tip

The bucket name is case-sensitive and must match EXACTLY. Even a single character difference will cause this error.

If you're still stuck, share the output of this query:
```sql
SELECT id, name, public FROM storage.buckets;
```

And I'll tell you exactly what to change! 🚀
