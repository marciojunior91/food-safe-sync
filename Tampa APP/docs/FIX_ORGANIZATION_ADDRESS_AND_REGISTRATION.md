# Fix Organization Address and Food Safety Registration

**Date:** January 6, 2026  
**Issue:** Address and food_safety_registration not showing on printed labels  
**Status:** ✅ Fixed in code, requires database migration

---

## Problems Found

### 1. **Missing Column in Database** ❌
The `food_safety_registration` column doesn't exist in the `organizations` table yet. A migration file exists but hasn't been applied.

### 2. **Missing Field in SELECT Query** ❌
All three printer classes were NOT selecting `food_safety_registration` from the database:
- `PDFPrinter.ts` 
- `ZebraPrinter.ts`
- `GenericPrinter.ts`

### 3. **Double JSON.stringify on Address** ❌
The address field was being stringified twice:
```typescript
// ❌ WRONG - Double stringification
address: orgData.address ? JSON.stringify(orgData.address) : undefined

// ✅ CORRECT - Address is already a string in DB
address: orgData.address || undefined
```

---

## Fixes Applied

### ✅ **Updated All Three Printer Files**

**Files Modified:**
- `src/lib/printers/PDFPrinter.ts`
- `src/lib/printers/ZebraPrinter.ts`
- `src/lib/printers/GenericPrinter.ts`

**Changes:**
```typescript
// ✅ BEFORE
const { data: orgData } = await supabase
  .from('organizations')
  .select('name, address, phone, email')  // Missing food_safety_registration
  .eq('id', organizationId)
  .single();

if (orgData) {
  organizationDetails = {
    name: orgData.name,
    address: orgData.address ? JSON.stringify(orgData.address) : undefined, // Double stringify!
    phone: orgData.phone || undefined,
    email: orgData.email || undefined,
    foodSafetyRegistration: undefined, // TODO: Add after running migration
  };
}

// ✅ AFTER
const { data: orgData } = await supabase
  .from('organizations')
  .select('name, address, phone, email, food_safety_registration')  // ✅ Added
  .eq('id', organizationId)
  .single();

if (orgData) {
  organizationDetails = {
    name: orgData.name,
    address: orgData.address || undefined, // ✅ No double stringify
    phone: orgData.phone || undefined,
    email: orgData.email || undefined,
    foodSafetyRegistration: orgData.food_safety_registration || undefined, // ✅ Using DB field
  };
}
```

---

## Required Actions

### **Step 1: Apply Database Migration** ⚠️

The migration file already exists but needs to be applied to your Supabase database:

**Migration File:** `supabase/migrations/20260105000000_add_food_safety_registration.sql`

#### **Option A: Apply via Supabase CLI (Recommended)**

```bash
# Navigate to project directory
cd "C:\Users\Marci\OneDrive\Área de Trabalho\Tampa APP\Tampa APP"

# Apply pending migrations
npx supabase db push
```

#### **Option B: Apply Manually via Supabase Dashboard**

1. Go to Supabase Dashboard → SQL Editor
2. Run this SQL:

```sql
-- Add food safety registration number to organizations table
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS food_safety_registration VARCHAR(50);

COMMENT ON COLUMN organizations.food_safety_registration IS 'Food safety registration number (e.g., SIF in Brazil, Food Business Registration in Australia)';
```

### **Step 2: Update Your Organization Data**

After the migration is applied, update your organization's data:

#### **For Address (JSON Format):**
```sql
UPDATE organizations 
SET address = '{"street": "Rua Augusta", "number": "123", "city": "São Paulo", "state": "SP", "postalCode": "01234-567"}'
WHERE id = 'your-organization-id';
```

#### **For Food Safety Registration:**
```sql
UPDATE organizations 
SET food_safety_registration = 'SIF 12345'  -- Your SIF number
WHERE id = 'your-organization-id';
```

#### **Combined Update:**
```sql
UPDATE organizations 
SET 
  address = '{"street": "Rua Augusta", "number": "123", "city": "São Paulo", "state": "SP", "postalCode": "01234-567"}',
  food_safety_registration = 'SIF 12345',
  phone = '+55 11 98765-4321'
WHERE id = 'your-organization-id';
```

---

## Address JSON Format

The address field expects a JSON string with the following structure:

```json
{
  "street": "Street Name",
  "number": "Building Number",
  "city": "City Name",
  "state": "State Code (e.g., SP, RJ)",
  "postalCode": "CEP Code (e.g., 01234-567)"
}
```

### **How It Displays on Labels:**

**Line 1:** `{street}, {number}`  
Example: `Rua Augusta, 123`

**Line 2:** `{city} - {state}, {postalCode}`  
Example: `São Paulo - SP, 01234-567`

---

## Verification Steps

### **1. Check if Column Exists:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'organizations' 
  AND column_name = 'food_safety_registration';
```

Expected result: One row showing `food_safety_registration | character varying`

### **2. Check Current Organization Data:**
```sql
SELECT 
  id,
  name,
  address,
  phone,
  email,
  food_safety_registration
FROM organizations
WHERE id = 'your-organization-id';
```

### **3. Test Print Label:**
After updating the data:
1. Go to Labeling page
2. Create a new label or use Quick Print
3. Preview the label (it should now show address and SIF)
4. Print and verify all fields appear

---

## Expected Label Footer (After Fix)

```
TAMPA RESTAURANT              [or your organization name]
Tel: +55 11 98765-4321
Rua Augusta, 123
São Paulo - SP, 01234-567
Food Safety Reg: SIF 12345

#408C14B5                     [QR Code]
```

---

## Technical Details

### **Database Schema Change:**
- **Table:** `organizations`
- **New Column:** `food_safety_registration VARCHAR(50)`
- **Purpose:** Store food safety registration number (SIF, Food Business Reg, etc.)

### **Data Flow:**
1. **Database** → `organizations` table stores address (JSON string) and food_safety_registration
2. **Printer Classes** → Query organization data including both fields
3. **Renderers** → Parse address JSON and display formatted lines + registration number
4. **Label Output** → Shows complete footer with company info

### **Files Modified:**
- ✅ `src/lib/printers/PDFPrinter.ts` - Fixed SELECT query and address handling
- ✅ `src/lib/printers/ZebraPrinter.ts` - Fixed SELECT query and address handling  
- ✅ `src/lib/printers/GenericPrinter.ts` - Fixed SELECT query and address handling

---

## Troubleshooting

### **If Address Still Doesn't Show:**
1. Check address format in database (should be valid JSON string)
2. Verify address parsing in browser console (check for JSON parse errors)
3. Ensure address has minimum data (at least street + city)

### **If Food Safety Registration Doesn't Show:**
1. Verify migration was applied successfully
2. Check if column has data: `SELECT food_safety_registration FROM organizations`
3. Verify field is not NULL or empty string

### **If Labels Show "undefined" or "null":**
1. Make sure organization data is not empty
2. Check browser console for fetch errors
3. Verify organizationId is being passed correctly to print functions

---

## Summary

✅ **Code Fixed** - All three printer classes now:
- Select `food_safety_registration` from database
- Handle address without double-stringifying
- Pass correct data to renderers

⏳ **Database Migration Required** - Apply the migration to add the column

📝 **Data Update Required** - Update your organization's address and registration number

🎯 **Result** - Labels will display complete company footer with address and food safety registration
