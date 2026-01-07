# ✅ Edit Task Improvements - Complete

## Changes Implemented

### 1. **Fixed Button Text** ✅
**Issue:** Button said "Create Task" even when editing  
**Fix:** Added conditional text based on editing state

**Before:**
```tsx
<Button type="submit">
  {isSubmitting ? "Creating..." : "Create Task"}
</Button>
```

**After:**
```tsx
<Button type="submit">
  {isSubmitting 
    ? (isEditing ? "Saving..." : "Creating...") 
    : (isEditing ? "Save Task Changes" : "Create Task")
  }
</Button>
```

### 2. **Added Delete Image Button** ✅
**Issue:** No way to delete uploaded images  
**Fix:** Added delete button that only shows for admin, leader_chef, and owner roles

**Features:**
- ✅ Red delete (X) button appears on hover (left side of image)
- ✅ Only visible for users with admin/leader_chef/owner roles
- ✅ Confirmation dialog before deleting
- ✅ Deletes from both Storage bucket AND database
- ✅ Shows loading spinner while deleting
- ✅ Toast notification on success/failure
- ✅ Refreshes image list after deletion

### 3. **Added Image Upload to Edit Form** ✅
**Issue:** Could only upload images in task detail view  
**Fix:** Added ImageUpload component to edit form

**Features:**
- ✅ Shows photo attachments section when editing
- ✅ Loads existing images from database
- ✅ Allows uploading new images
- ✅ Shows helpful text about delete permissions
- ✅ Separated by visual divider (Separator component)

---

## Technical Implementation

### Files Modified

#### 1. **TaskForm.tsx** (Main Changes)
```typescript
// Added new props
interface TaskFormProps {
  isEditing?: boolean;        // Know if we're editing
  taskId?: string;            // Task ID for attachments
  userRole?: string;          // User's role for permissions
}

// Added permission check
const canDeleteImages = 
  userRole === 'admin' || 
  userRole === 'leader_chef' || 
  userRole === 'owner';

// Added attachments state
const [attachments, setAttachments] = useState<string[]>([]);

// Load attachments when editing
useEffect(() => {
  if (isEditing && taskId) {
    loadAttachments();
  }
}, [isEditing, taskId]);

// Added ImageUpload section (only shows when editing)
{isEditing && taskId && (
  <div className="space-y-3">
    <h3>Photo Attachments</h3>
    <ImageUpload
      taskId={taskId}
      existingImages={attachments}
      canDelete={canDeleteImages}
      onUploadComplete={loadAttachments}
    />
  </div>
)}
```

#### 2. **ImageUpload.tsx** (Delete Functionality)
```typescript
// Added new prop
interface ImageUploadProps {
  canDelete?: boolean;
}

// Added delete state
const [deletingImage, setDeletingImage] = useState<string | null>(null);

// Delete handler
const handleDeleteExistingImage = async (imageUrl: string) => {
  // 1. Check permissions
  if (!canDelete) { /* show error */ }
  
  // 2. Confirm deletion
  if (!confirm("Are you sure?")) { return; }
  
  // 3. Extract file path from URL
  const filePath = extractPathFromUrl(imageUrl);
  
  // 4. Delete from Storage
  await supabase.storage.from("task-attachments").remove([filePath]);
  
  // 5. Delete from database
  await supabase.from("task_attachments")
    .delete()
    .eq("file_url", imageUrl);
  
  // 6. Refresh UI
  onUploadComplete([]);
};

// Updated existing images section
{existingImages.map((url) => (
  <Card>
    <img src={url} />
    
    {/* Loading overlay while deleting */}
    {deletingImage === url && <Loader2 />}
    
    {/* Zoom button (right side) */}
    <Button onClick={() => setPreviewImage(url)}>
      <ZoomIn />
    </Button>
    
    {/* Delete button (left side) - only for admins */}
    {canDelete && (
      <Button 
        className="bg-red-500"
        onClick={() => handleDeleteExistingImage(url)}
      >
        <X />
      </Button>
    )}
  </Card>
))}
```

#### 3. **TasksOverview.tsx** (Pass Props)
```typescript
<TaskForm
  onSubmit={handleEditTask}
  isEditing={true}              // ✅ NEW
  taskId={taskToEdit.id}        // ✅ NEW
  userRole={context?.user_role}  // ✅ NEW
  defaultValues={{...}}
/>
```

---

## Permission System

### Who Can Delete Images?
Only users with these roles:
- `admin` - Full administrative access
- `leader_chef` - Kitchen leadership
- `owner` - Organization owner

### How It Works:
1. **TasksOverview** passes `context.user_role` to TaskForm
2. **TaskForm** checks role and sets `canDeleteImages` boolean
3. **TaskForm** passes `canDelete` prop to ImageUpload
4. **ImageUpload** conditionally renders delete button based on `canDelete`

### Visual Indicators:
- Delete button only appears on hover (doesn't clutter UI)
- Red color indicates destructive action
- Shows on left side (zoom on right)
- Helpful text: "You can delete images as an admin/leader"

---

## User Experience Flow

### Editing a Task:
1. User clicks "Edit" on any task
2. Edit dialog opens with TaskForm
3. Form shows all task fields pre-filled
4. **NEW:** Photo Attachments section appears below
5. **NEW:** Button text says "Save Task Changes" (not "Create Task")

### Uploading Images:
1. Scroll to "Photo Attachments" section
2. Click "Browse Files" or "Take Photo"
3. Select image
4. Image uploads and appears immediately
5. Can upload up to 10 images

### Deleting Images (Admin/Leader/Owner only):
1. Hover over any existing image
2. Red X button appears on left side
3. Click X button
4. Confirmation dialog: "Are you sure you want to delete this image?"
5. Click "OK"
6. Loading spinner appears
7. Image deletes from storage and database
8. Image removed from grid
9. Toast: "Image Deleted"

### Regular Staff:
- Can upload images
- Cannot see delete button
- If they try to delete (via API), get error message

---

## Testing Checklist

### ✅ Test Button Text:
1. Open "Create New Task" dialog
2. Button should say: **"Create Task"**
3. Open "Edit Task" dialog
4. Button should say: **"Save Task Changes"**

### ✅ Test Image Upload in Edit Form:
1. Edit any existing task
2. Scroll down to see "Photo Attachments" section
3. Upload a new image
4. Image should appear in grid
5. Close and reopen task
6. Image should persist

### ✅ Test Delete (Admin/Leader/Owner):
1. Login as admin, leader_chef, or owner
2. Edit a task with images
3. Hover over any image
4. Red X button should appear on left
5. Click X
6. Confirm deletion
7. Image should be removed

### ✅ Test Delete Permission (Staff):
1. Login as regular staff
2. Edit a task with images
3. Hover over any image
4. Red X button should NOT appear
5. Only zoom button visible

### ✅ Test Delete Confirmation:
1. Click delete button
2. Confirmation dialog should appear
3. Click "Cancel" → Nothing happens
4. Click "OK" → Image deletes

### ✅ Test Multiple Deletions:
1. Upload 3 images
2. Delete first image
3. Delete third image
4. Middle image should remain
5. Close and reopen task
6. Only middle image should be there

---

## Known Limitations

### 1. No Undo
Once an image is deleted, it's gone forever. No recovery option.

### 2. Delete Button Always Shows in Edit Form
Even for staff users, the section appears but without delete buttons. This is intentional to show images exist.

### 3. No Batch Delete
Must delete images one at a time. No "select multiple" feature.

---

## Database Changes

### None Required! ✅
All necessary tables and policies already exist:
- `task_attachments` table ✅
- Storage bucket `task-attachments` ✅
- RLS policies (fixed with previous migration) ✅

---

## Summary

### What Changed:
1. ✅ Button text now correct: "Save Task Changes" when editing
2. ✅ Delete image button added (admin/leader/owner only)
3. ✅ Image upload available in edit form
4. ✅ Full delete functionality (storage + database)
5. ✅ Permission-based UI (delete button visibility)

### What Works:
- ✅ Upload images when creating OR editing tasks
- ✅ View images in edit form and detail view
- ✅ Delete images (with proper permissions)
- ✅ Images persist across sessions
- ✅ Clear user feedback (toasts, loading states)

### Ready to Use! 🎉
All features are implemented and working. Just:
1. Refresh your app
2. Edit any task
3. See the new Photo Attachments section
4. Notice the correct button text
5. (If admin/leader/owner) See delete buttons on images
