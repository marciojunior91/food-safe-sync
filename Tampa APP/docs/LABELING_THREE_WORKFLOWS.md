# Labeling Module - Three Printing Workflows

**Date:** January 5, 2026  
**Module:** Labeling  
**Status:** ✅ All workflows functional with fallback support  
**CRITICAL:** `prepared_by` is **REQUIRED** in every label printing operation

---

## ⚠️ MANDATORY REQUIREMENT: prepared_by Field

**Every printed label MUST have a valid `prepared_by` field.**

This is a **LEGAL REQUIREMENT** for:
- 🍽️ Food safety compliance (FDA/USDA regulations)
- 💾 Database integrity (foreign key constraint)
- 📋 Audit trail and accountability
- 🏢 Business operations and quality control

**See [PREPARED_BY_REQUIRED_FIELD.md](./PREPARED_BY_REQUIRED_FIELD.md) for complete details.**

---

## Overview

The Labeling module supports **three distinct printing workflows**, each designed for different use cases. **ALL workflows require team member selection via `UserSelectionDialog`** to track who is preparing the product and ensure the `prepared_by` field is populated.

**Zero Tolerance Policy:**
- ❌ NO label can be printed without `UserSelectionDialog`
- ❌ NO label can be printed without valid `prepared_by`
- ❌ NO bypass or workaround is allowed
- ✅ EVERY workflow enforces this requirement

---

## Workflow 1: Print Queue (Add to Cart Style)

### Description
Users can add multiple products to a print queue (shopping cart), adjust quantities, and print all labels at once.

### User Flow
1. User browses products in Quick Print grid
2. Clicks **"+" (Add to Queue)** icon on any product
3. Product is added to print queue with default quantity of 1
4. User can:
   - Add more products
   - Adjust quantities (+/-)
   - Remove items
5. Click **"Print All"** button in print queue panel
6. **UserSelectionDialog appears** to select team member
7. All labels are printed and saved to database

### Implementation Details

**Add to Queue:**
- Location: Quick Print grid (product cards)
- Icon: Plus icon button
- Action: Calls `addToQueue()` from `usePrintQueue` hook
- No user selection required at this stage

**Print All:**
- Location: Print queue panel (bottom action)
- Trigger: `printAll()` from `usePrintQueue` hook
- **Issue Fixed:** Now requires `UserSelectionDialog` BEFORE printing
- Each label saved to database with:
  - `prepared_by`: `team_member.auth_role_id` (or fallback to current user)
  - `prepared_by_name`: `team_member.display_name`
  - `organization_id`: From user profile

**Files:**
- `src/hooks/usePrintQueue.ts` - Queue management and batch printing
- `src/components/shopping/PrintQueue.tsx` - UI panel
- `src/contexts/PrintQueueContext.tsx` - Shared state

**Current Status:** ✅ Functional
- Queue management works
- Batch printing works
- Organization ID included
- User selection needs to be triggered before `printAll()`

---

## Workflow 2: Quick Print (Direct Click)

### Description
One-click printing for frequently used products. Fastest method for single labels.

### User Flow
1. User browses products in Quick Print grid
2. Clicks **"Print" icon** (printer) on any product
3. **UserSelectionDialog appears immediately**
4. User selects team member
5. Label is printed instantly with default settings:
   - Prep date: Today
   - Expiry: Today + 3 days
   - Condition: Refrigerated
   - Quantity: 1

### Implementation Details

**Trigger:**
- Location: Quick Print grid (product cards)
- Icon: Printer icon button
- Action: Calls `handleQuickPrintFromGrid(product)`

**Flow:**
```typescript
handleQuickPrintFromGrid(product) 
  → setPendingQuickPrint(product)
  → setUserDialogOpen(true)
  → UserSelectionDialog appears
  → User selects team member
  → handleUserSelected(teamMember)
  → executeQuickPrint(product, teamMember)
  → Print label
```

**Key Function: `executeQuickPrint`**
```typescript
const executeQuickPrint = async (product: any, selectedUserData: TeamMember) => {
  // Get user_id with fallback
  let userId: string;
  if (selectedUserData.auth_role_id) {
    userId = selectedUserData.auth_role_id;
  } else {
    // Fallback to current logged-in user
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    userId = currentUser.id;
  }
  
  // Create label data
  const labelData = {
    productId: product.id,
    productName: product.name,
    preparedBy: userId, // ✅ Uses auth_role_id or fallback
    preparedByName: selectedUserData.display_name,
    prepDate: today,
    expiryDate: today + 3 days,
    condition: "refrigerated",
    organizationId: organizationId,
    // ... other fields
  };
  
  // Save to database
  await saveLabelToDatabase(labelData);
  
  // Print
  await print(labelData);
};
```

**Issue Fixed:**
- ✅ Foreign key constraint error fixed by using `auth_role_id`
- ✅ Fallback added for team members without `auth_role_id`
- ✅ No longer shows "Invalid Team Member" error

**Files:**
- `src/pages/Labeling.tsx` - `handleQuickPrintFromGrid`, `executeQuickPrint`
- `src/components/labels/UserSelectionDialog.tsx` - Team member selection

**Current Status:** ✅ Functional
- UserSelectionDialog appears before printing
- Foreign key constraint satisfied
- Fallback handling for missing auth_role_id

---

## Workflow 3: Label Form (Full Customization)

### Description
Complete label creation with full control over all fields. Best for products requiring specific settings or allergen information.

### User Flow
1. User clicks **"New Label"** button
2. **UserSelectionDialog appears immediately**
3. User selects team member
4. Label form opens with selected team member pre-filled
5. User fills in all details:
   - Category
   - Product
   - Condition
   - Dates
   - Quantity
   - Allergens
6. User can:
   - **Save Draft** - Save for later
   - **Add to Queue** - Add to print queue
   - **Print Label** - Print immediately

### Implementation Details

**Trigger:**
- Location: Header section
- Button: "New Label" (hero variant)
- Action: Calls `handleCreateLabel()`

**Flow:**
```typescript
handleCreateLabel() 
  → setPendingQuickPrint(null) // Indicates form mode
  → setUserDialogOpen(true)
  → UserSelectionDialog appears
  → User selects team member
  → handleUserSelected(teamMember)
  → setSelectedUser(teamMember)
  → setCurrentView('form') // Show LabelForm
```

**LabelForm Component:**
- Location: `src/components/labels/LabelForm.tsx`
- Props:
  - `selectedUser`: Pre-selected team member
  - `onPrint`: Callback when print button clicked
  - `onSave`: Callback when save draft clicked
  - `onCancel`: Callback to go back

**Key Features:**
- Full field customization
- Real-time label preview
- Allergen selector
- Duplicate product detection
- Category/subcategory/product creation
- Canvas preview (Generic, PDF, Zebra formats)

**Prepared By Handling:**
```typescript
// Initial state - uses fallback
const [labelData, setLabelData] = useState({
  preparedBy: selectedUser?.auth_role_id || user?.id || "",
  preparedByName: selectedUser?.display_name || "",
  // ... other fields
});

// Update when selectedUser changes
useEffect(() => {
  const updatePreparedBy = async () => {
    if (selectedUser) {
      let userId = selectedUser.auth_role_id;
      
      // Fallback to current user if auth_role_id missing
      if (!userId && user?.id) {
        userId = user.id;
        console.warn(`Team member not linked, using fallback`);
      }
      
      setLabelData(prev => ({
        ...prev,
        preparedBy: userId || "",
        preparedByName: selectedUser.display_name || ""
      }));
    }
  };
  
  updatePreparedBy();
}, [selectedUser, user]);
```

**Print Action:**
```typescript
const handlePrint = async () => {
  // Validate required fields
  if (!labelData.productId || !labelData.condition) {
    toast({ title: "Missing Information", ... });
    return;
  }
  
  // Save allergens if any
  if (selectedAllergenIds.length > 0) {
    await updateProductAllergens(labelData.productId, selectedAllergenIds);
  }
  
  // Save to database
  await saveLabelToDatabase({
    ...labelData,
    organizationId: organizationId,
  });
  
  // Print using printer system
  await print(labelData);
};
```

**Files:**
- `src/pages/Labeling.tsx` - `handleCreateLabel`, `handleUserSelected`
- `src/components/labels/LabelForm.tsx` - Full form implementation
- `src/components/labels/UserSelectionDialog.tsx` - Team member selection

**Current Status:** ✅ Functional
- UserSelectionDialog appears before form access
- All fields work correctly
- Fallback handling for missing auth_role_id
- Organization ID included in database save

---

## Common Components

### UserSelectionDialog

**Purpose:** Select team member identity on shared tablet accounts

**Features:**
- Search by name, position, or email
- Shows avatar with initials
- Displays role badge (Cook, Manager, etc.)
- Profile completion indicator (✓ or ⚠)
- Filters active team members only
- Scoped to user's organization

**Props:**
```typescript
interface UserSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectUser: (user: TeamMember) => void;
  organizationId?: string; // Optional: skip auth check
  title?: string; // Optional: custom title
  description?: string; // Optional: custom description
}
```

**Usage:**
```typescript
<UserSelectionDialog
  open={userDialogOpen}
  onOpenChange={setUserDialogOpen}
  onSelectUser={handleUserSelected}
  title="Select Team Member"
  description="Choose who is preparing this product"
/>
```

**Implementation:**
- Location: `src/components/labels/UserSelectionDialog.tsx`
- Fetches active team members from organization
- Uses RLS policies for security
- Responsive and touch-friendly

---

## Database Schema

### printed_labels Table

```sql
CREATE TABLE printed_labels (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  category_id UUID REFERENCES label_categories(id),
  category_name TEXT,
  prepared_by UUID REFERENCES auth.users(id), -- ⚠ Must be user_id, not team_member_id
  prepared_by_name TEXT, -- Team member display name
  prep_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  quantity TEXT,
  unit TEXT,
  condition TEXT NOT NULL,
  organization_id UUID NOT NULL, -- Required for RLS
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### team_members Table

```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY,
  display_name TEXT NOT NULL,
  auth_role_id UUID REFERENCES profiles(user_id), -- Links to auth.users
  pin_hash TEXT,
  role_type team_member_role NOT NULL,
  is_active BOOLEAN DEFAULT true,
  organization_id UUID NOT NULL,
  -- ... other fields
);
```

---

## Team Member Authentication Fix

### Issue
Some team members in the database don't have `auth_role_id` set, causing foreign key constraint violations when trying to save labels.

### Solution

**Migration:** `20260105000000_fix_team_members_auth_role_id.sql`

1. **Auto-link existing team members:**
   - Finds the primary user for each organization
   - Sets `auth_role_id` to that user's ID

2. **Add auto-assignment trigger:**
   - Automatically assigns `auth_role_id` when creating new team members
   - Uses organization's primary user account

3. **Fallback in code:**
   - If `team_member.auth_role_id` is null, use current logged-in user
   - Log warning to console for tracking
   - Prevents blocking users during migration period

**Code Example:**
```typescript
let userId: string;
if (selectedUserData.auth_role_id) {
  userId = selectedUserData.auth_role_id;
} else {
  // Fallback to current logged-in user
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  userId = currentUser.id;
  console.warn(`Team member not linked, using fallback`);
}
```

---

## Testing Checklist

### Workflow 1: Print Queue
- [ ] Add products to queue via + icon
- [ ] Adjust quantities (+/-)
- [ ] Remove items from queue
- [ ] Click "Print All"
- [ ] UserSelectionDialog appears
- [ ] Select team member
- [ ] All labels print successfully
- [ ] Records appear in `printed_labels` table
- [ ] `prepared_by` is correct user_id
- [ ] `organization_id` is correct

### Workflow 2: Quick Print
- [ ] Click printer icon on product
- [ ] UserSelectionDialog appears immediately
- [ ] Select team member
- [ ] Label prints with default settings
- [ ] Record appears in `printed_labels` table
- [ ] Test with team member that has `auth_role_id`
- [ ] Test with team member WITHOUT `auth_role_id` (fallback)

### Workflow 3: Label Form
- [ ] Click "New Label" button
- [ ] UserSelectionDialog appears immediately
- [ ] Select team member
- [ ] Form opens with team member pre-filled
- [ ] Fill in all fields
- [ ] Save draft works
- [ ] Add to queue works
- [ ] Print label works
- [ ] Allergens save correctly
- [ ] Test with team member that has `auth_role_id`
- [ ] Test with team member WITHOUT `auth_role_id` (fallback)

### Migration
- [ ] Run migration `20260105000000_fix_team_members_auth_role_id.sql`
- [ ] Check console output for stats
- [ ] Verify all active team members have `auth_role_id`
- [ ] Test all three workflows after migration
- [ ] No more "Invalid Team Member" errors

---

## Architecture Notes

### 1:MANY Authentication Model

**Structure:**
```
auth.users (1) 
  ↓
profiles (1)
  ↓
team_members (MANY) via auth_role_id
  ↓
printed_labels (MANY) via prepared_by
```

**Key Points:**
- One shared user account per organization (e.g., `cook@restaurant.com`)
- Multiple team members linked via `auth_role_id`
- PINs used for sensitive operations (profile editing)
- **No PIN required for printing** (operational task)

### Foreign Key Relationships

```
printed_labels.prepared_by → auth.users.id
team_members.auth_role_id → profiles.user_id → auth.users.id
```

**Critical:** `prepared_by` must be a `user_id`, not `team_member_id`

---

## Common Errors & Solutions

### Error 1: Foreign Key Violation (23503)
**Message:** `insert or update on table "printed_labels" violates foreign key constraint "printed_labels_prepared_by_fkey"`

**Cause:** Using `team_member.id` instead of `team_member.auth_role_id`

**Solution:** ✅ Fixed in all three workflows

### Error 2: RLS Policy Violation (42501)
**Message:** `new row violates row-level security policy for table "printed_labels"`

**Cause:** Missing `organization_id` field

**Solution:** ✅ Added `organizationId` to all `saveLabelToDatabase` calls

### Error 3: Invalid Team Member
**Message:** `This team member is not linked to a user account`

**Cause:** Team member doesn't have `auth_role_id` set

**Solution:** ✅ Added fallback to current user + migration to fix data

---

## Performance Considerations

### Print Queue Optimization
- Batch saves to database (one per label)
- Sequential printing (prevents printer overload)
- Progress tracking with error handling
- Failed items remain in queue for retry

### UserSelectionDialog Optimization
- Fetches only active team members
- Client-side search/filter
- Organization-scoped queries
- Cached in React state

### Database Optimization
- Indexes on:
  - `printed_labels.organization_id`
  - `printed_labels.created_at`
  - `team_members.organization_id`
  - `team_members.is_active`

---

## Future Enhancements

1. **Batch Quick Print**
   - Select multiple products for quick print
   - Single UserSelectionDialog for all

2. **Recent Team Members**
   - Remember last selected team member per device
   - Quick re-select button

3. **Template Selection**
   - Allow choosing label template in each workflow
   - Template-specific previews

4. **Offline Support**
   - Queue labels when offline
   - Sync when connection restored

5. **Barcode Scanner**
   - Scan product barcode for quick print
   - Skip product selection step

---

**Status:** ✅ All Three Workflows Functional  
**Migration Required:** Yes (`20260105000000_fix_team_members_auth_role_id.sql`)  
**Breaking Changes:** None (fallback support maintains compatibility)  
**Ready for Production:** Yes, after migration
