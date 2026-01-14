# Team Member Document Upload - Setup Complete! 🎉

## What Was Implemented

### 1. **Backend Hook** (`useTeamMemberDocuments.ts`)
- ✅ Handles file uploads to Supabase Storage
- ✅ Saves document metadata to `team_member_certificates` table
- ✅ Fetches existing documents
- ✅ Deletes documents (removes from storage + database)
- ✅ Updates document metadata

### 2. **UI Component Updated** (`DocumentUpload.tsx`)
- ✅ Now actually uploads files to Supabase (not just memory)
- ✅ Shows upload progress with spinner
- ✅ Fetches and displays existing documents
- ✅ Allows viewing and downloading documents
- ✅ Deletes documents from storage
- ✅ Displays helpful message when team member not saved yet

### 3. **Storage Bucket**
- ✅ Bucket already exists: `team-member-documents`
- ⏳ **NEEDS SETUP**: Storage policies (security rules)

## 🚨 Required Action: Setup Storage Policies

The bucket exists but needs security policies to control who can upload/view/delete files.

### Steps:

1. **Open Supabase Dashboard**
   - Go to your project: https://app.supabase.com

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar

3. **Run the Setup Script**
   - Open the file: `setup-storage-policies-team-documents.sql`
   - Copy ALL the SQL code
   - Paste it into a new query in Supabase SQL Editor
   - Click "Run" or press `Ctrl+Enter`

4. **Verify Success**
   - You should see a success message
   - The query should show 4 policies created

### What the Policies Do:

- **SELECT Policy**: Users can view documents for team members in their organization
- **INSERT Policy**: Users can upload documents for team members in their organization
- **UPDATE Policy**: Users can update document metadata
- **DELETE Policy**: Users can delete documents (admins only)

All policies respect **organization isolation** - users can only access documents for team members in their own organization!

## How It Works Now

### Adding Documents (TeamMemberEditDialog):

1. User opens "Edit Team Member" dialog
2. Clicks "Documents" tab
3. Clicks "Attach Documents" button
4. Selects files (PDF, JPG, PNG, WEBP)
5. Files are immediately uploaded to:
   - **Storage**: `team-member-documents/{teamMemberId}/{filename}`
   - **Database**: `team_member_certificates` table
6. Success toast appears
7. Document appears in the list with preview

### Viewing Documents:

- Image files show thumbnail preview
- PDF files show PDF icon
- Click "View" to open in new tab
- Click "Download" to save locally
- Click X to delete (removes from storage + database)

### Security:

- Files are organized by team member ID in folders
- RLS policies ensure organization isolation
- Only users in the same organization can access documents
- Admins/Managers have full access to their org's documents

## File Structure:

```
team-member-documents/
├── {team-member-id-1}/
│   ├── 1234567890-abc123.pdf
│   ├── 1234567891-def456.jpg
│   └── ...
├── {team-member-id-2}/
│   ├── 1234567892-ghi789.pdf
│   └── ...
```

## Database Records:

Each uploaded file creates a record in `team_member_certificates`:

```sql
{
  id: uuid,
  team_member_id: uuid,
  certificate_name: "Food Safety Certificate.pdf",
  certificate_type: "certificate",
  file_url: "https://[project].supabase.co/storage/v1/object/public/team-member-documents/...",
  file_type: "application/pdf",
  file_size: 245678,
  status: "active",
  verification_status: "pending",
  created_at: timestamp,
  created_by: uuid
}
```

## Testing:

1. **Run the SQL script first!** (setup-storage-policies-team-documents.sql)
2. Open the app and go to People module
3. Click "Edit" on any team member
4. Go to "Documents" tab
5. Click "Attach Documents"
6. Select a PDF or image file
7. Wait for upload (you'll see a spinner)
8. File should appear in the list
9. Try viewing, downloading, and deleting

## Troubleshooting:

### "Failed to upload document"
- ✅ Run the SQL script to create storage policies
- Check browser console for errors
- Verify the bucket is public (it should be)

### "No authenticated user"
- Make sure you're logged in
- Check if auth.uid() is available

### "Permission denied"
- Run the storage policies SQL script
- Verify user has a role in user_roles table
- Check organization_id matches between user and team member

## Next Steps:

1. ✅ Run `setup-storage-policies-team-documents.sql`
2. ✅ Test document upload
3. ✅ Test document viewing/downloading
4. ✅ Test document deletion
5. Consider adding more document types (certificates, licenses, etc.)
6. Consider adding certificate expiration warnings
7. Consider adding admin verification workflow

---

**Status**: ✅ Code Complete | ⏳ Needs Storage Policy Setup | Ready to Test After SQL Script
