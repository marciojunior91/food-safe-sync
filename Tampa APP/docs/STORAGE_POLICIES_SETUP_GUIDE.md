# How to Setup Storage Policies via Supabase Dashboard

## Why You Need This

The SQL Editor can't create policies on `storage.objects` because it's owned by `supabase_storage_admin`. 

You have **2 options**:

---

## ✅ OPTION 1: Make Bucket Public (EASIEST - Recommended for Development)

### Quick Setup (30 seconds):

1. **Open Supabase Dashboard**
   - Go to: https://app.supabase.com
   - Select your project

2. **Navigate to Storage**
   - Click "Storage" in the left sidebar
   - Click on "team-member-documents" bucket

3. **Make it Public**
   - Click the gear icon (⚙️) or "Edit bucket" button
   - Toggle "Public bucket" to **ON**
   - Click "Save"

4. **Done!** 
   - Files can now be uploaded and accessed
   - Security is still maintained through the `team_member_certificates` table RLS policies

### OR Run This SQL:

```sql
UPDATE storage.buckets 
SET public = true 
WHERE id = 'team-member-documents';
```

---

## 🔒 OPTION 2: Create Storage Policies (More Secure - Recommended for Production)

### Step-by-Step Setup (5 minutes):

1. **Open Supabase Dashboard**
   - Go to: https://app.supabase.com
   - Select your project

2. **Navigate to Storage**
   - Click "Storage" in the left sidebar
   - Click on "team-member-documents" bucket

3. **Go to Policies Tab**
   - Click the "Policies" tab at the top
   - You'll see the storage policies interface

4. **Create Policy #1: SELECT (View)**
   - Click "New Policy"
   - Click "Create policy from scratch"
   - Fill in:
     ```
     Policy name: Users can view team member documents
     Allowed operation: SELECT ✓
     Target roles: authenticated
     Policy definition (USING): 
     bucket_id = 'team-member-documents'
     ```
   - Click "Review" then "Save policy"

5. **Create Policy #2: INSERT (Upload)**
   - Click "New Policy" again
   - Click "Create policy from scratch"
   - Fill in:
     ```
     Policy name: Users can upload team member documents
     Allowed operation: INSERT ✓
     Target roles: authenticated
     Policy definition (WITH CHECK): 
     bucket_id = 'team-member-documents'
     ```
   - Click "Review" then "Save policy"

6. **Create Policy #3: UPDATE**
   - Click "New Policy" again
   - Click "Create policy from scratch"
   - Fill in:
     ```
     Policy name: Users can update team member documents
     Allowed operation: UPDATE ✓
     Target roles: authenticated
     Policy definition (USING): 
     bucket_id = 'team-member-documents'
     ```
   - Click "Review" then "Save policy"

7. **Create Policy #4: DELETE**
   - Click "New Policy" again
   - Click "Create policy from scratch"
   - Fill in:
     ```
     Policy name: Users can delete team member documents
     Allowed operation: DELETE ✓
     Target roles: authenticated
     Policy definition (USING): 
     bucket_id = 'team-member-documents'
     ```
   - Click "Review" then "Save policy"

8. **Verify**
   - You should see 4 policies listed
   - All should be enabled (green toggle)

---

## 🎯 Which Option Should I Choose?

### Use OPTION 1 (Public Bucket) if:
- ✅ You're in development/testing
- ✅ You want quick setup
- ✅ You trust your app's RLS on `team_member_certificates` table
- ✅ Files aren't super sensitive

### Use OPTION 2 (Storage Policies) if:
- ✅ You're in production
- ✅ You want extra security layers
- ✅ You want fine-grained control
- ✅ You have time for proper setup

---

## 🧪 Testing After Setup

1. Open your app
2. Go to People module
3. Edit a team member
4. Click "Documents" tab
5. Click "Attach Documents"
6. Select a file (PDF or image)
7. File should upload successfully!
8. You should see it in the list
9. Try viewing, downloading, deleting

---

## ❌ Troubleshooting

### "Failed to upload" error:
- Check if bucket is public OR policies are created
- Check browser console for detailed error
- Verify you're logged in

### "Permission denied" error:
- Make sure bucket is public OR policies exist
- Check user has an entry in `user_roles` table
- Verify `team_member_certificates` RLS policies are working

### Files upload but can't view:
- Make bucket public
- OR create SELECT policy
- Check file URLs are correct

---

## 📝 Summary

**Fastest way**: Just make the bucket public (toggle in Dashboard or run UPDATE query)

**Most secure way**: Create all 4 storage policies through Dashboard UI

Either way works! The `team_member_certificates` table has RLS policies that provide organization isolation, so even with a public bucket, users can only see records for team members in their organization.

🎉 **After setup, document uploads will work perfectly!**
