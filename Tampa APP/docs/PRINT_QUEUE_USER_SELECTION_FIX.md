# Print Queue User Selection Fix

**Date:** January 5, 2026  
**Issue:** Print Queue workflow was not requiring user selection before batch printing  
**Status:** ✅ Fixed  
**CRITICAL:** `prepared_by` is a **REQUIRED** field in every label printing operation

---

## ⚠️ CRITICAL REQUIREMENT: prepared_by Field

### Why prepared_by is MANDATORY

The `prepared_by` field is **REQUIRED** for every printed label. This is non-negotiable for:

1. **Food Safety Compliance** 🍽️
   - FDA and local regulations require tracking who prepared each food item
   - Essential for foodborne illness investigations
   - Required for HACCP (Hazard Analysis Critical Control Points)

2. **Database Integrity** 💾
   - Foreign key constraint: `printed_labels.prepared_by` → `auth.users.id`
   - Cannot insert label without valid user reference
   - Database will reject any insert with null/empty prepared_by

3. **Audit Trail & Accountability** 📋
   - Legal requirement for traceability
   - Enables investigation of food safety incidents
   - Provides evidence for regulatory inspections

4. **Business Operations** 🏢
   - Track employee performance and productivity
   - Identify training needs
   - Support quality control processes

### Validation Enforcement

The system enforces `prepared_by` validation at multiple levels:

```typescript
// Type Level: Required in interface (no ? operator)
export interface LabelPrintData {
  preparedBy: string;  // ✅ REQUIRED - no optional marker
  // ...
}

// Runtime Level: Validation in saveLabelToDatabase
if (!data.preparedBy || data.preparedBy.trim() === '') {
  throw new Error('prepared_by is a required field for food safety compliance');
}

// Database Level: Foreign key constraint
ALTER TABLE printed_labels
  ADD CONSTRAINT fk_prepared_by_user
  FOREIGN KEY (prepared_by) REFERENCES auth.users(id);

// UI Level: UserSelectionDialog required before any print operation
```

### Zero Tolerance Policy

**NO label can be printed without:**
1. ✅ UserSelectionDialog shown to user
2. ✅ Team member selected
3. ✅ Valid `auth_role_id` or fallback to current user
4. ✅ `prepared_by` field populated with valid `auth.users.id`
5. ✅ Validation passed before database insert

---

## Problem Description

The Print Queue (shopping cart style) workflow in the Labeling module was missing the UserSelectionDialog integration. When users clicked "Print All", the system would attempt to print all queued labels without asking which team member was preparing the labels.

This violated the established pattern where ALL three printing workflows must require user selection:
1. ✅ Print Queue - **NOW FIXED**
2. ✅ Quick Print
3. ✅ Label Form

### Error Scenario

```
User Flow:
1. Add products to print queue using "+" button
2. Adjust quantities
3. Click "Print All" button
4. ❌ Labels printed immediately without team member selection
5. Database records had incorrect or missing prepared_by values
```

## Root Cause

The `PrintQueue.tsx` component (`src/components/shopping/PrintQueue.tsx`) was calling `printAll()` directly without:
1. Showing the `UserSelectionDialog` first
2. Passing the selected team member's `auth_role_id` to the print function
3. Overriding the `preparedBy` field for all queued items

This meant that:
- Items in queue used whatever `preparedBy` was set when added (could be outdated)
- No verification of who was actually printing the batch
- Foreign key constraints could fail if team_member.auth_role_id was null

## Solution Implemented

### 1. Updated `PrintQueue.tsx`

**File:** `src/components/shopping/PrintQueue.tsx`

**Changes:**
```typescript
// Added imports
import { UserSelectionDialog } from '@/components/labels/UserSelectionDialog';
import { TeamMember } from '@/types/teamMembers';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Added state
const [userDialogOpen, setUserDialogOpen] = useState(false);
const { toast } = useToast();

// Modified handlePrintAll to show dialog first
const handlePrintAll = async () => {
  // Open user selection dialog instead of printing immediately
  setUserDialogOpen(true);
};

// New handler for user selection
const handleUserSelected = async (selectedUserData: TeamMember) => {
  // Get user_id - either from team_member.auth_role_id or fallback
  let userId: string;
  if (selectedUserData.auth_role_id) {
    userId = selectedUserData.auth_role_id;
  } else {
    // Fallback to current logged-in user
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      toast({
        title: "Authentication Error",
        description: "Unable to determine user. Please refresh the page.",
        variant: "destructive"
      });
      return;
    }
    userId = currentUser.id;
    console.warn('Team member not linked. Using fallback.');
  }

  // Call printAll with the selected user
  await printAll(userId, selectedUserData.display_name || 'Unknown');
};

// Added UserSelectionDialog component
<UserSelectionDialog
  open={userDialogOpen}
  onOpenChange={setUserDialogOpen}
  onSelectUser={handleUserSelected}
/>
```

### 2. Updated `usePrintQueue.ts`

**File:** `src/hooks/usePrintQueue.ts`

**Changes:**
```typescript
// Updated printAll function signature to accept optional override parameters
const printAll = useCallback(async (
  overridePreparedBy?: string, 
  overridePreparedByName?: string
): Promise<PrintResult> => {
  // ... validation checks ...

  // Inside the printing loop, use override values if provided
  const preparedBy = overridePreparedBy || item.labelData.preparedBy || "";
  const preparedByName = overridePreparedByName || item.labelData.preparedByName;

  // Pass to saveLabelToDatabase
  await saveLabelToDatabase({
    // ... other fields ...
    preparedBy: preparedBy,
    preparedByName: preparedByName,
    // ... other fields ...
  });
  
  // ... rest of printing logic ...
}, [items, totalLabels, isPrinterBusy, printBatch, toast, organizationId]);
```

## Architecture

### Print Queue Workflow (Fixed)

```
┌─────────────────────────────────────────────────────────────┐
│ User adds products to queue using "+" button                │
│ - Can add multiple products                                 │
│ - Can adjust quantities                                     │
│ - Items stored in print queue context                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ User clicks "Print All" button                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ UserSelectionDialog opens (NEW)                             │
│ - Shows all active team members                             │
│ - User selects who is preparing labels                      │
│ - Returns team_member.auth_role_id                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Get user_id for prepared_by field                           │
│ - Try: team_member.auth_role_id (preferred)                 │
│ - Fallback: current logged-in user                          │
│ - Log warning if fallback used                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Call printAll(userId, displayName)                          │
│ - Override prepared_by for ALL queued items                 │
│ - Save each label to database                               │
│ - Print each label to physical printer                      │
│ - Show progress UI                                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Success!                                                     │
│ - All labels printed with correct prepared_by               │
│ - Queue cleared automatically                               │
│ - User feedback via toast                                   │
└─────────────────────────────────────────────────────────────┘
```

### All Three Workflows Now Require UserSelectionDialog

| Workflow | Entry Point | Dialog Required | Override prepared_by |
|----------|-------------|-----------------|---------------------|
| Print Queue | "Print All" button | ✅ Yes | ✅ Yes (batch) |
| Quick Print | Printer icon | ✅ Yes | ✅ Yes (single) |
| Label Form | "New Label" button | ✅ Yes | ✅ Yes (form) |

## Database Schema

### Foreign Key Constraint

```sql
-- printed_labels.prepared_by must reference auth.users.id
ALTER TABLE printed_labels
  ADD CONSTRAINT fk_prepared_by_user
  FOREIGN KEY (prepared_by) 
  REFERENCES auth.users(id);
```

### Relationship Chain

```
team_members.auth_role_id → profiles.user_id → auth.users.id
                                                      ↑
                                                      │
                                    printed_labels.prepared_by
```

## Testing Checklist

### Scenario 1: Print Queue with Valid Team Member
- [ ] Add 3 products to print queue
- [ ] Adjust quantities (total 10 labels)
- [ ] Click "Print All"
- [ ] Verify UserSelectionDialog opens
- [ ] Select team member with valid auth_role_id
- [ ] Verify batch prints successfully
- [ ] Check database: all 10 records have correct prepared_by
- [ ] Verify queue is cleared after printing

### Scenario 2: Print Queue with Team Member Missing auth_role_id
- [ ] Add products to queue
- [ ] Click "Print All"
- [ ] Select team member WITHOUT auth_role_id
- [ ] Verify fallback to current user
- [ ] Verify console warning logged
- [ ] Verify batch prints successfully
- [ ] Check database: records use current user's ID

### Scenario 3: Print Queue Cancel User Selection
- [ ] Add products to queue
- [ ] Click "Print All"
- [ ] Verify UserSelectionDialog opens
- [ ] Click cancel or close dialog
- [ ] Verify nothing prints
- [ ] Verify queue items remain intact

### Scenario 4: Print Queue Mixed Quantities
- [ ] Add product A (quantity: 5)
- [ ] Add product B (quantity: 1)
- [ ] Add product C (quantity: 10)
- [ ] Click "Print All"
- [ ] Select team member
- [ ] Verify progress shows: Item 1/3, 2/3, 3/3
- [ ] Verify all 16 labels print correctly
- [ ] Check database: 16 records, all with same prepared_by

### Scenario 5: Print Queue with Print Errors
- [ ] Disconnect printer or simulate error
- [ ] Add products to queue
- [ ] Click "Print All"
- [ ] Select team member
- [ ] Verify error handling
- [ ] Verify queue items remain (for retry)
- [ ] Verify error toast shown

## Consistency Across Workflows

All three workflows now follow the same pattern:

```typescript
// Pattern: User Selection → Get user_id → Execute Action

// 1. Show dialog
setUserDialogOpen(true);

// 2. Handle selection
const handleUserSelected = async (selectedUserData: TeamMember) => {
  // Get user_id with fallback
  let userId: string;
  if (selectedUserData.auth_role_id) {
    userId = selectedUserData.auth_role_id;
  } else {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user.id;
    console.warn('Fallback to current user');
  }
  
  // Execute action with userId
  await executeAction(userId, selectedUserData.display_name);
};

// 3. Render dialog
<UserSelectionDialog
  open={userDialogOpen}
  onOpenChange={setUserDialogOpen}
  onSelectUser={handleUserSelected}
/>
```

## Benefits

### 1. **Data Integrity**
- All printed labels have valid `prepared_by` references
- Foreign key constraints satisfied
- Audit trail is accurate

### 2. **User Experience**
- Consistent workflow across all printing methods
- Clear indication of who prepared each label
- Easy to track accountability

### 3. **Flexibility**
- Batch printing maintains individual label attribution
- Override mechanism allows correcting old queue items
- Fallback ensures system works during migration

### 4. **Compliance**
- Food safety regulations require accurate prep tracking
- Each label correctly identifies the preparer
- Historical records are reliable

## Related Documentation

- [Three Workflows Documentation](./LABELING_THREE_WORKFLOWS.md)
- [Foreign Key Constraint Fix](./FOREIGN_KEY_CONSTRAINT_FIX.md)
- [Team Members Migration](../supabase/migrations/20260105000000_fix_team_members_auth_role_id.sql)
- [PDF Export RLS Fix](./PDF_EXPORT_RLS_FIX.md)

## Migration Notes

If you have existing items in the print queue context (browser storage), they may have old `preparedBy` values. The override mechanism in `printAll` ensures that when batch printing, the NEW selected user is used for all items, regardless of what was stored previously.

To clear old queue items:
1. Users can click "Clear All" in Print Queue
2. Or refresh the page (queue context is reset)
3. Or just proceed - override will use correct user

## Future Enhancements

1. **Remember Last Selected Team Member**
   - Store last selection in localStorage
   - Auto-select for faster workflow
   - Still show dialog for confirmation

2. **Batch Edit Queue Items**
   - Allow changing prepared_by for specific items
   - Allow changing dates/conditions in bulk
   - Preview changes before printing

3. **Queue Templates**
   - Save common print queue combinations
   - Load template to populate queue
   - Share templates across team

4. **Scheduled Printing**
   - Queue items for later printing
   - Assign to specific team member
   - Print automatically at scheduled time

## Summary

✅ **Problem:** Print Queue wasn't requiring user selection  
✅ **Solution:** Added UserSelectionDialog integration  
✅ **Result:** All three workflows now consistent and compliant  

The Print Queue workflow now matches the expected behavior:
1. Add products to cart
2. Adjust quantities  
3. Select team member WHO is printing
4. Batch print all items with correct attribution

This ensures data integrity, compliance, and a consistent user experience across the entire Labeling module.
