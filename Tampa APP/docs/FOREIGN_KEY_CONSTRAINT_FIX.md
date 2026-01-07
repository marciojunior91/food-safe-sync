# Foreign Key Constraint Fix - prepared_by Field

**Date:** January 4, 2026  
**Bug:** 409 Conflict / 23503 Foreign Key Violation when saving printed labels  
**Error:** "insert or update on table 'printed_labels' violates foreign key constraint 'printed_labels_prepared_by_fkey'"

---

## Problem

When printing labels (both quick print and form-based), the application was receiving a 409 Conflict error with PostgreSQL error code 23503:

```
Error: insert or update on table "printed_labels" violates foreign key constraint "printed_labels_prepared_by_fkey"
Details: Key is not present in table "users".
```

### Root Cause

The `printed_labels` table has a foreign key constraint:
```sql
prepared_by UUID REFERENCES auth.users(id)
```

However, the code was passing `team_member.id` (from the `team_members` table) instead of the `user_id` (from `auth.users` table) to the `preparedBy` field.

### Architecture Context

The application uses a **1:MANY authentication model**:
- One shared user account (e.g., `cook@company.com`) in `auth.users`
- Multiple team members linked to that account via `team_members.auth_role_id`
- Team members are identified by PINs for operations
- The `auth_role_id` field in `team_members` stores the actual `user_id` from `auth.users`

---

## Solution

### Database Schema

**Team Members Table:**
```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY,
  display_name TEXT NOT NULL,
  auth_role_id UUID REFERENCES profiles(user_id), -- Links to auth.users
  pin_hash TEXT,
  -- ... other fields
);
```

**Printed Labels Table:**
```sql
CREATE TABLE printed_labels (
  id UUID PRIMARY KEY,
  prepared_by UUID REFERENCES auth.users(id), -- Must be user_id, not team_member_id
  prepared_by_name TEXT,
  -- ... other fields
);
```

### Code Changes

We needed to use `team_member.auth_role_id` instead of `team_member.id` when saving to `printed_labels`.

---

## Files Modified

### 1. `src/pages/Labeling.tsx`

#### Change 1: executeQuickPrint - Added validation

```typescript
const executeQuickPrint = async (product: any, selectedUserData: TeamMember) => {
  if (!organizationId) {
    toast({
      title: "Organization Required",
      description: "Could not determine your organization. Please refresh the page.",
      variant: "destructive"
    });
    return;
  }

  // ✅ Added validation
  if (!selectedUserData.auth_role_id) {
    toast({
      title: "Invalid Team Member",
      description: "This team member is not linked to a user account. Please contact an administrator.",
      variant: "destructive"
    });
    return;
  }
  
  // ... rest of function
```

#### Change 2: executeQuickPrint - Fixed preparedBy field

```typescript
const labelData = {
  productId: product.id,
  productName: product.name,
  categoryId: product.label_categories?.id || null,
  categoryName: product.label_categories?.name || "Quick Print",
  preparedBy: selectedUserData.auth_role_id, // ✅ Changed from selectedUserData.id
  preparedByName: selectedUserData.display_name || "Unknown",
  prepDate: prepDate,
  expiryDate: expiryDate,
  condition: "refrigerated",
  quantity: "1",
  unit: product.measuring_units?.abbreviation || "",
  batchNumber: "",
  allergens: productAllergens,
  organizationId: organizationId,
};
```

### 2. `src/components/labels/LabelForm.tsx`

#### Change 1: Initial labelData state

```typescript
const [labelData, setLabelData] = useState({
  categoryId: "",
  categoryName: "",
  subcategoryId: "",
  subcategoryName: "",
  productId: "",
  productName: "",
  condition: "",
  preparedBy: selectedUser?.auth_role_id || "", // ✅ Changed from selectedUser?.id
  preparedByName: selectedUser?.display_name || "",
  prepDate: today,
  expiryDate: "",
  quantity: "",
  unit: "",
  batchNumber: ""
});
```

#### Change 2: useEffect to update preparedBy

```typescript
useEffect(() => {
  if (selectedUser) {
    setLabelData(prev => ({
      ...prev,
      preparedBy: selectedUser.auth_role_id || "", // ✅ Changed from selectedUser.id
      preparedByName: selectedUser.display_name || ""
    }));
  }
}, [selectedUser]);
```

#### Change 3: Added organizationId to saveLabelToDatabase

```typescript
await saveLabelToDatabase({
  productId: labelData.productId,
  productName: labelData.productName,
  categoryId: labelData.categoryId === "all" ? null : labelData.categoryId,
  categoryName: labelData.categoryName,
  preparedBy: labelData.preparedBy,
  preparedByName: labelData.preparedByName,
  prepDate: labelData.prepDate,
  expiryDate: labelData.expiryDate,
  condition: labelData.condition,
  quantity: labelData.quantity,
  unit: labelData.unit,
  batchNumber: labelData.batchNumber,
  organizationId: organizationId || "", // ✅ Added - Required for RLS
});
```

---

## Type Safety

The `TeamMember` interface already includes the `auth_role_id` field:

```typescript
export interface TeamMember {
  id: string; // team_member.id
  display_name: string;
  // ... other fields
  
  // Authentication
  auth_role_id?: string; // Links to auth.users(id) via profiles.user_id
  pin_hash?: string;
  
  // ... other fields
}
```

---

## Testing

### Before Fix
- ❌ Quick print fails with 409 Conflict
- ❌ Form-based print fails with foreign key error
- ❌ Console shows: "Key is not present in table 'users'"

### After Fix
- ✅ Quick print succeeds
- ✅ Form-based print succeeds
- ✅ Foreign key constraint satisfied
- ✅ Labels saved with correct user_id

### Test Scenarios

1. **Quick Print from Product Grid:**
   - Click quick print icon on any product
   - UserSelectionDialog appears
   - Select team member
   - Verify label prints successfully
   - Check database: `prepared_by` should be `auth.users.id`

2. **Form-Based Label Creation:**
   - Click "Create Label" button
   - UserSelectionDialog appears
   - Select team member
   - Fill in label details
   - Click "Print Label"
   - Verify success

3. **Multiple Team Members:**
   - Test with different team members linked to same account
   - All should have same `auth_role_id`
   - All labels should reference same `prepared_by` (user_id)
   - `prepared_by_name` should differ per team member

4. **Print Queue:**
   - Add multiple labels to queue
   - Export to PDF
   - Verify all saved with correct `prepared_by`

---

## Data Flow

```
User selects team member in UserSelectionDialog
↓
TeamMember object passed to print function
↓
Extract team_member.auth_role_id (not team_member.id)
↓
Pass as preparedBy to saveLabelToDatabase
↓
Database inserts with foreign key to auth.users(id)
↓
Success!
```

---

## Related Issues Fixed

This fix addresses **three related issues**:

1. **✅ Foreign Key Violation** - Fixed by using `auth_role_id` instead of `team_member.id`
2. **✅ PDF Export RLS Error** - Fixed by adding `organizationId` to print queue (previous fix)
3. **✅ Missing organizationId in LabelForm** - Fixed by adding `organizationId` parameter

All three were part of the same printing workflow and have now been resolved.

---

## Architecture Notes

### Why This Design?

The 1:MANY authentication model was chosen for:
- **Cost Efficiency**: One Supabase user instead of many
- **Operational Simplicity**: Shared credentials (e.g., `cook@company.com`)
- **Individual Accountability**: PINs for sensitive operations
- **Audit Trail**: `prepared_by_name` tracks which team member

### Key Relationships

```
auth.users (1) ←── profiles (1) ←── user_roles (MANY)
                        ↑
                        │
              team_members (MANY) ─→ auth_role_id
                        │
                        ↓
              printed_labels (MANY) ─→ prepared_by (auth.users.id)
                                      ─→ prepared_by_name (team_member.display_name)
```

### Future Considerations

If migrating to 1:1 authentication:
- Create individual `auth.users` accounts per team member
- Update `team_members.auth_role_id` to point to individual accounts
- No changes needed to `printed_labels` schema
- All existing labels remain valid

---

## Prevention

To prevent similar issues:

1. **Always use `auth_role_id`** when a `user_id` is required
2. **Use `team_member.id`** only for team-member-specific operations
3. **Validate `auth_role_id` exists** before database operations
4. **Test foreign key constraints** during development
5. **Document authentication architecture** clearly

---

**Status:** ✅ Fixed and Tested  
**Files Modified:** 2 (`Labeling.tsx`, `LabelForm.tsx`)  
**TypeScript Errors:** 0  
**Database Constraints:** Satisfied  
**Ready for Production:** Yes
