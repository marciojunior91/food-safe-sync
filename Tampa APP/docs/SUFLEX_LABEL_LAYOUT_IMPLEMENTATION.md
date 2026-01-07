# Suflex Label Layout Implementation

**Date:** January 6, 2026  
**Status:** ✅ Nearly Complete - PDF Spacing Fixed, Team Member Selection Pending  
**Priority:** � MEDIUM

## Overview

Updated all three printer formats (Zebra ZPL, PDF, Generic) to follow the Suflex restaurant label layout pattern with company details footer and English labels.

## Recent Updates (January 6, 2026)

### PDF Renderer Spacing Improvements ✅
- Increased vertical spacing between all fields from 30px to 40px
- Added more space after separator lines (15px → 20-25px)
- Increased label height from 520px to 620px to accommodate spacing
- Improved readability with better visual breathing room
- Company footer lines now have 20-26px spacing
- Allergen section spacing increased to 22-35px

### Remaining Issue: Team Member Selection
**Problem:** Quick Print components (QuickPrintGrid, QuickAddToQueueDialog) currently use `user?.email` as preparedByName, which shows the logged-in user's profile (e.g., "MARCIN") instead of allowing selection of a team member.

**Solution Needed:** Add team member selector to Quick Print workflow, similar to LabelForm.

**Files Affected:**
- `src/components/labels/QuickPrintGrid.tsx` - Uses `user?.id` and `user?.email`
- `src/components/labels/QuickAddToQueueDialog.tsx` - Receives preparedBy props
- `src/components/labels/QuickPrintCategoryView.tsx` - Similar issue

## Suflex Label Pattern Analysis

### Layout Structure
```
┌──────────────────────────────────────┐
│ PRODUCT NAME                    1kg  │  ← Header with weight
├──────────────────────────────────────┤
│ RESFRIADO / DESCONGELANDO            │  ← Condition
├──────────────────────────────────────┤
│ MANIP.:     DD/MM/YYYY               │  ← Manufacturing date
│ VALIDADE:   DD/MM/YYYY               │  ← Expiry date
│ MARCA/FORN: SWIFT                    │  ← Brand/Supplier
│ SIF:        458                      │  ← Food safety registration
├──────────────────────────────────────┤
│ ALERGÊNICOS: ...                     │  ← Allergens (if any)
├──────────────────────────────────────┤
│ RESP.: LUCIANA                       │  ← Prepared by
├──────────────────────────────────────┤
│ RESTAURANTE SUFLEX               [QR]│  ← Company footer + QR
│ CNPJ: 12.345.678/0001-12             │
│ CEP: 05435-030                       │
│ RUA PURPURINA, 400                   │
│ SÃO PAULO - SP                       │
│ #TI54B3                              │  ← Tracking code
└──────────────────────────────────────┘
```

### Key Differences from Current Design

| Element | Current | Suflex Style |
|---------|---------|--------------|
| Product Name | Simple text | Bold header with weight on same line |
| Date Labels | "Prep Date", "Use By" | "MANIP.", "VALIDADE" (Portuguese) |
| Footer | Minimal | Full company details (name, phone, address) |
| Registration | None | SIF/Food Safety Registration Number |
| Condition | Separate line | Combined with weight |
| QR Code | Top right | Bottom right with company info |

## Implementation Plan

### 1. Database Changes ✅ DONE

**File:** `supabase/migrations/20260105000000_add_food_safety_registration.sql`

```sql
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS food_safety_registration VARCHAR(50);
```

**Purpose:** Store food safety registration number (SIF in Brazil, Food Business Registration in Australia)

### 2. TypeScript Interface Updates ✅ DONE

**File:** `src/utils/zebraPrinter.ts`

Added:
```typescript
export interface OrganizationDetails {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  foodSafetyRegistration?: string;
}

export interface LabelPrintData {
  // ... existing fields
  organizationDetails?: OrganizationDetails;
}
```

### 3. ZPL Generator (Zebra Printer) ✅ DONE

**File:** `src/utils/zebraPrinter.ts`

**Changes:**
- Updated `generateZPL()` function to follow Suflex layout
- Product name and weight/quantity on first line
- Condition displayed prominently
- Manufacturing date (MANIP.) instead of "Prep Date"
- Expiry date (VALIDADE) instead of "Use By"
- Optional food safety registration number
- Company footer with name, phone, address
- QR code positioned bottom right
- Allergen section if applicable

**Key ZPL Sections:**
```zpl
^FO30,100^A0N,24,24^FD${condition.toUpperCase()}${quantity ? ` / ${quantity} ${unit}` : ''}^FS
^FO30,140^A0N,20,20^FDMANIP.:^FS
^FO150,140^A0N,20,20^FD${prepDate}^FS
^FO30,165^A0N,20,20^FDVALIDADE:^FS
^FO150,165^A0N,20,20^FD${expiryDate}^FS
```

### 4. PDF Printer ✅ IN PROGRESS

**File:** `src/lib/printers/PDFPrinter.ts`

**Changes:**
- Updated `convertToLabelPrintData()` to fetch organization details
- Added query to organizations table:
  ```typescript
  const { data: orgData } = await supabase
    .from('organizations')
    .select('name, address, phone, email, food_safety_registration')
    .eq('id', organizationId)
    .single();
  ```
- Pass `organizationDetails` to `LabelPrintData`

**Next Steps:**
- Update PDF renderer (`src/utils/labelRenderers/pdfRenderer.ts`) to match Suflex layout

### 5. Generic Printer ⏳ TODO

**File:** `src/lib/printers/GenericPrinter.ts`

**Required Changes:**
- Add organization details fetching (same as PDFPrinter)
- Update `convertToLabelPrintData()` method
- Pass organization details to renderer

**File:** `src/utils/labelRenderers/genericRenderer.ts`

**Required Changes:**
- Update canvas rendering to match Suflex layout
- Add company footer section
- Reposition QR code to bottom right

### 6. Zebra Printer Driver ⏳ TODO

**File:** `src/lib/printers/ZebraPrinter.ts`

**Required Changes:**
- Add organization details fetching
- Update `convertToLabelPrintData()` method
- Ensure organization details passed to ZPL generator

## Food Safety Registration Numbers

### Australia vs Brazil

| Country | Name | Format | Regulatory Body |
|---------|------|--------|-----------------|
| **Brazil** | SIF (Serviço de Inspeção Federal) | Numeric (e.g., "458") | MAPA (Ministry of Agriculture) |
| **Australia (WA)** | Food Business Registration | Alphanumeric | Local Government Health Departments |

### Western Australia Regulations

For food businesses in Western Australia:

1. **Food Act 2008 (WA)** - Requires all food businesses to be registered
2. **Registration Number** - Issued by local government authority
3. **Format** - Varies by council (e.g., "FB-2024-1234")
4. **Renewal** - Annual registration required

**Recommendation:** Add a settings field in the organization profile where users can enter their food business registration number. The label field shows as "REG. SANITÁRIO:" (Sanitary Registration) to be neutral across jurisdictions.

## Testing Checklist

### Zebra ZPL
- [ ] Product name displays correctly with weight
- [ ] Condition shown prominently
- [ ] MANIP. and VALIDADE labels used
- [ ] Food safety registration shows (if provided)
- [ ] Company footer renders with all details
- [ ] QR code positioned bottom right
- [ ] Allergens display correctly
- [ ] Prepared by name shows

### PDF Export
- [ ] Layout matches ZPL version
- [ ] Company details render in footer
- [ ] Address formatting correct
- [ ] QR code scannable and positioned correctly
- [ ] Text sizing appropriate for A4 print
- [ ] Food safety registration displays

### Generic Printer
- [ ] Canvas rendering matches other formats
- [ ] Browser print dialog shows correct preview
- [ ] Company footer legible
- [ ] QR code renders clearly
- [ ] Layout scales properly

### Integration Tests
- [ ] Organization without food safety registration (field optional)
- [ ] Organization with partial address
- [ ] Long company names (truncation handling)
- [ ] Products with many allergens (text wrapping)
- [ ] Quick print (no product ID)
- [ ] Print queue batch printing

## Remaining Work

1. **Update PDF Renderer** (`pdfRenderer.ts`)
   - Implement Suflex layout on canvas
   - Add company footer section
   - Reposition QR code

2. **Update Generic Renderer** (`genericRenderer.ts`)
   - Same layout changes as PDF
   - Ensure browser print compatibility

3. **Update ZebraPrinter Driver** (`ZebraPrinter.ts`)
   - Add organization fetching logic
   - Pass details to generator

4. **Update GenericPrinter Driver** (`GenericPrinter.ts`)
   - Add organization fetching logic
   - Pass details to renderer

5. **Regenerate Supabase Types**
   - Run type generation after migration
   - Update imports if needed

6. **Create Organization Settings UI**
   - Add field for food safety registration
   - Address entry/editing
   - Preview label with current settings

7. **Documentation**
   - Update user guide with new label format
   - Document food safety registration field
   - Add screenshots of new layout

## File Summary

### Modified Files
- ✅ `supabase/migrations/20260105000000_add_food_safety_registration.sql`
- ✅ `src/utils/zebraPrinter.ts` (interface + ZPL generator)
- ✅ `src/lib/printers/PDFPrinter.ts` (organization fetching)

### Files To Modify
- ⏳ `src/lib/printers/ZebraPrinter.ts`
- ⏳ `src/lib/printers/GenericPrinter.ts`
- ⏳ `src/utils/labelRenderers/pdfRenderer.ts`
- ⏳ `src/utils/labelRenderers/genericRenderer.ts`

### New Documentation
- ✅ `docs/SUFLEX_LABEL_LAYOUT_IMPLEMENTATION.md` (this file)

## Notes

- **Bilingual Support:** Current implementation uses Portuguese labels (MANIP., VALIDADE) to match Suflex. Consider making this configurable for international use.
- **Address Format:** Address stored as JSON in database. Parser handles multiple formats.
- **Optional Fields:** Food safety registration and full address are optional - labels render correctly without them.
- **QR Code Data:** Unchanged - still includes labelId for lifecycle tracking.

## References

- Suflex label image provided by user
- Food Act 2008 (WA): https://www.legislation.wa.gov.au/legislation/statutes.nsf/main_mrtitle_286_homepage.html
- Current BOPP label documentation: `docs/BOPP_LABEL_DESIGN.md`
