# PDF Export RLS Fix - Bug Resolution

**Date:** January 4, 2026  
**Bug:** 403 Forbidden error when saving PDF labels to database  
**Error Code:** 42501 - "new row violates row-level security policy for table 'printed_labels'"

---

## Problem

When exporting labels to PDF via the print queue, the application was receiving a 403 Forbidden error when attempting to save the printed label record to the `printed_labels` table. The error was:

```
{
    "code": "42501",
    "details": null,
    "hint": null,
    "message": "new row violates row-level security policy for table \"printed_labels\""
}
```

**Request Payload (missing organizationId):**
```json
{
  "product_id": "0f985605-f8e5-43f7-b94c-f5ba191f0cc4",
  "product_name": "Cooked Rice",
  "category_id": "eb113e59-a2f4-4026-a664-b5b51c9e54ba",
  "category_name": "Raw Ingredients",
  "condition": "Fresh",
  "expiry_date": "2026-01-05",
  "prep_date": "2026-01-04",
  "prepared_by": "cd9af250-133d-409e-9e97-f570f767648d",
  "prepared_by_name": "marcio.b.a.b.junior@gmail.com",
  "quantity": "1",
  "unit": "units"
  // ❌ Missing: organization_id
}
```

---

## Root Cause

The `printed_labels` table has RLS (Row Level Security) policies that require the `organization_id` field to determine which organization the label belongs to. The print queue was calling `saveLabelToDatabase()` without including the `organizationId` parameter, causing the RLS policy to reject the insert.

This was the same issue we fixed for Zebra printing in Task 15, but the PDF export path through the print queue was not updated.

---

## Solution

### Files Modified

**1. `src/hooks/usePrintQueue.ts`**

#### Change 1: Import useOrganizationId hook
```typescript
// Added import
import { useOrganizationId } from './useUserContext';
```

#### Change 2: Get organizationId from hook
```typescript
export function usePrintQueue() {
  const { toast } = useToast();
  const { printBatch, isLoading: isPrinterBusy } = usePrinter();
  const { isOpen, items, setItems, openQueue, closeQueue, toggleQueue } = usePrintQueueContext();
  const { organizationId } = useOrganizationId(); // ✅ Added
  
  const [isPrinting, setIsPrinting] = useState(false);
  const [printProgress, setPrintProgress] = useState<PrintProgress | null>(null);
```

#### Change 3: Add organizationId validation in printAll
```typescript
const printAll = useCallback(async (): Promise<PrintResult> => {
  // ... existing validation ...
  
  // ✅ Added validation
  if (!organizationId) {
    toast({
      title: 'Organization Not Found',
      description: 'Unable to determine organization. Please refresh the page.',
      variant: 'destructive'
    });
    return { success: false, totalPrinted: 0, totalFailed: 0, errors: [] };
  }
```

#### Change 4: Pass organizationId to saveLabelToDatabase
```typescript
await saveLabelToDatabase({
  productId: item.labelData.productId || "",
  productName: item.labelData.productName,
  categoryId: (item.labelData.categoryId && item.labelData.categoryId !== "all" && item.labelData.categoryId !== "") 
    ? item.labelData.categoryId 
    : null,
  categoryName: item.labelData.categoryName,
  preparedBy: item.labelData.preparedBy || "",
  preparedByName: item.labelData.preparedByName,
  prepDate: item.labelData.prepDate,
  expiryDate: item.labelData.expiryDate,
  condition: item.labelData.condition,
  organizationId: organizationId, // ✅ Added - Required for RLS
  quantity: "1",
  unit: item.labelData.unit,
  batchNumber: item.labelData.batchNumber || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
});
```

#### Change 5: Update dependency array
```typescript
}, [items, totalLabels, isPrinterBusy, printBatch, toast, organizationId]); // ✅ Added organizationId
```

---

## Technical Details

### LabelPrintData Interface
The `LabelPrintData` interface in `src/utils/zebraPrinter.ts` requires:

```typescript
export interface LabelPrintData {
  productId: string;
  productName: string;
  categoryId: string | null;
  categoryName: string;
  preparedBy: string;
  preparedByName: string;
  prepDate: string;
  expiryDate: string;
  condition: string;
  organizationId: string; // ⚠️ Required for RLS
  quantity?: string;
  unit?: string;
  qrCodeData?: string;
  batchNumber: string;
  allergens?: Array<...>;
}
```

### RLS Policy
The `printed_labels` table uses RLS policies that check:
1. The `organization_id` field matches the user's organization
2. Users can only insert/select/update records within their organization

Without the `organizationId`, the RLS policy cannot verify the user has permission to create the record, resulting in a 42501 error.

---

## Testing

### Before Fix
- ❌ PDF export fails with 403 Forbidden
- ❌ Labels not saved to database
- ❌ Users see error toast

### After Fix
- ✅ PDF export succeeds
- ✅ Labels saved to database with correct organization_id
- ✅ RLS policies pass validation
- ✅ Users see success toast

### Test Scenarios
1. **PDF Export from Print Queue:**
   - Add labels to print queue
   - Select "PDF Export" printer
   - Click "Print All"
   - Verify PDF downloads
   - Verify records in `printed_labels` table

2. **Multiple Labels:**
   - Add multiple products with different quantities
   - Export to PDF
   - Verify each label creates a separate database record

3. **Organization Isolation:**
   - User A (Org 1) prints labels
   - User B (Org 2) should NOT see User A's labels
   - Verify RLS policy enforces isolation

---

## Related Issues

This fix is part of the broader RLS policy corrections from Iteration 11:

- **Task 15:** Fixed Zebra printer organizationId issue in `Labeling.tsx`
- **Task 10:** Fixed feed_reads RLS policies
- **This Fix:** Fixed PDF export organizationId issue in print queue

All three issues had the same root cause: missing `organizationId` field causing RLS policy violations.

---

## Impact

### Users
- ✅ Can now export labels to PDF without errors
- ✅ Reliable label tracking in database
- ✅ Improved workflow efficiency

### Database
- ✅ All printed_labels records have organization_id
- ✅ RLS policies functioning correctly
- ✅ Data isolation maintained

### Code Quality
- ✅ TypeScript type safety enforced
- ✅ Consistent pattern across all print paths
- ✅ No duplicate code

---

## Prevention

To prevent similar issues in the future:

1. **Always check LabelPrintData interface** when calling `saveLabelToDatabase()`
2. **Use useOrganizationId hook** for any database operations requiring organization context
3. **Test all print paths** (Zebra, PDF, Generic) when making RLS changes
4. **Add TypeScript validation** to ensure required fields are provided

---

**Status:** ✅ Fixed and Tested  
**Files Modified:** 1 (`src/hooks/usePrintQueue.ts`)  
**TypeScript Errors:** 0  
**Ready for Production:** Yes
