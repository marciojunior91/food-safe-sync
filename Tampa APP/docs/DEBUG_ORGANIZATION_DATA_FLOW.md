# Debug Organization Data Flow

**Date:** January 6, 2026  
**Issue:** Address and food_safety_registration not showing on PDF even though field exists and is filled  
**Status:** 🔍 Debugging with console logs

---

## Changes Made for Debugging

### ✅ **Added TypeScript Type Definition**

**File:** `src/integrations/supabase/types.ts`

Added `food_safety_registration: string | null` to the organizations table Row, Insert, and Update types.

### ✅ **Added Debug Console Logs**

#### **1. PDFPrinter.ts** (Line ~224)
```typescript
console.log('🔍 PDFPrinter - Raw org data from DB:', orgData);
console.log('🔍 PDFPrinter - Formatted organizationDetails:', organizationDetails);
```

This will show:
- What data is fetched from the database
- How it's formatted before being passed to the renderer

#### **2. pdfRenderer.ts** (Line ~11)
```typescript
console.log('🔍 PDF Renderer - Organization Details:', data.organizationDetails);
console.log('🔍 PDF Renderer - Full Label Data:', data);
```

This will show:
- What data the PDF renderer receives
- If organizationDetails is undefined or missing fields

---

## How to Debug

### **Step 1: Open Browser Console**

1. Open your Tampa APP in the browser
2. Press `F12` or `Ctrl+Shift+I` to open Developer Tools
3. Go to the "Console" tab

### **Step 2: Print a Label**

1. Navigate to the Labeling page
2. Create a new label or use Quick Print
3. Preview or print the label (PDF format)

### **Step 3: Check Console Output**

Look for log messages starting with 🔍:

#### **Expected Output:**

```
🔍 PDFPrinter - Raw org data from DB: {
  name: "TAMPA RESTAURANT",
  address: "{\"street\":\"Rua Augusta\",\"number\":\"123\",\"city\":\"São Paulo\",\"state\":\"SP\",\"postalCode\":\"01234-567\"}",
  phone: "+55 11 98765-4321",
  email: "contato@tampa.com.br",
  food_safety_registration: "SIF 12345"
}

🔍 PDFPrinter - Formatted organizationDetails: {
  name: "TAMPA RESTAURANT",
  address: "{\"street\":\"Rua Augusta\",\"number\":\"123\",\"city\":\"São Paulo\",\"state\":\"SP\",\"postalCode\":\"01234-567\"}",
  phone: "+55 11 98765-4321",
  email: "contato@tampa.com.br",
  foodSafetyRegistration: "SIF 12345"
}

🔍 PDF Renderer - Organization Details: {
  name: "TAMPA RESTAURANT",
  address: "{\"street\":\"Rua Augusta\",\"number\":\"123\",\"city\":\"São Paulo\",\"state\":\"SP\",\"postalCode\":\"01234-567\"}",
  phone: "+55 11 98765-4321",
  email: "contato@tampa.com.br",
  foodSafetyRegistration: "SIF 12345"
}
```

---

## Possible Issues to Check

### **Issue 1: Data Not Being Fetched**

**Symptoms:**
```
🔍 PDFPrinter - Raw org data from DB: null
```

**Solution:**
- Check if organization_id is correct
- Verify the organization exists in the database
- Check RLS policies on organizations table

### **Issue 2: food_safety_registration is NULL**

**Symptoms:**
```
🔍 PDFPrinter - Raw org data from DB: {
  name: "TAMPA RESTAURANT",
  food_safety_registration: null  // ← NULL!
}
```

**Solution:**
```sql
-- Check current value
SELECT id, name, food_safety_registration 
FROM organizations;

-- Update if empty
UPDATE organizations 
SET food_safety_registration = 'SIF 12345'
WHERE id = 'your-org-id';
```

### **Issue 3: address is NULL or Empty**

**Symptoms:**
```
🔍 PDFPrinter - Raw org data from DB: {
  address: null  // ← NULL!
}
```

**Solution:**
```sql
-- Update address
UPDATE organizations 
SET address = '{"street": "Rua Augusta", "number": "123", "city": "São Paulo", "state": "SP", "postalCode": "01234-567"}'
WHERE id = 'your-org-id';
```

### **Issue 4: Data Fetched but Not Passed to Renderer**

**Symptoms:**
```
🔍 PDFPrinter - Formatted organizationDetails: { ... }  // ← Has data
🔍 PDF Renderer - Organization Details: undefined       // ← Missing!
```

**Solution:**
- Check if `organizationDetails` is being passed in `printData` object
- Verify LabelPrintData interface includes organizationDetails

### **Issue 5: Data Passed but Not Rendering**

**Symptoms:**
```
🔍 PDF Renderer - Organization Details: { ... }  // ← Has data
// But still not showing on PDF
```

**Solution:**
- Check if `data.organizationDetails.address` parsing is failing
- Check if font rendering is failing (Century Gothic not available)
- Verify yPos calculations aren't pushing content off canvas

---

## Quick Verification Queries

### **Check Organization Data:**
```sql
SELECT 
  id,
  name,
  address,
  phone,
  email,
  food_safety_registration
FROM organizations
LIMIT 5;
```

### **Check if Column Exists:**
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'organizations'
  AND column_name IN ('address', 'food_safety_registration');
```

### **Update Organization (Example):**
```sql
UPDATE organizations
SET 
  address = '{"street": "Rua Augusta", "number": "123", "city": "São Paulo", "state": "SP", "postalCode": "01234-567"}',
  food_safety_registration = 'SIF 12345',
  phone = '+55 11 98765-4321'
WHERE name = 'TAMPA RESTAURANT';  -- Or use id = 'uuid-here'
```

---

## Next Steps

1. **Run the app and print a label**
2. **Check browser console for debug logs**
3. **Share the console output** (copy/paste the 🔍 lines)
4. **We'll identify which step is failing**

The debug logs will tell us exactly where in the data flow the information is getting lost!
