# QUICK START GUIDE - PHASE 2 DEPLOYMENT

## 🚀 FAST TRACK DEPLOYMENT

### Step 1: Apply Database Migrations

**Option A: Using Supabase CLI (Recommended)**
```powershell
cd "C:\Users\Marci\OneDrive\Área de Trabalho\Tampa APP\Tampa APP"
npx supabase db push
```

**Option B: Manual SQL Execution (if CLI doesn't work)**
Go to Supabase Dashboard → SQL Editor and run in order:

1. **Print Queue Table**
```sql
-- Copy and paste from: supabase/migrations/20251203130000_create_print_queue.sql
```

2. **Template RLS Policies**
```sql
-- Copy and paste from: supabase/migrations/20251203140000_template_rls_roles.sql
```

3. **Label Drafts Table**
```sql
-- Copy and paste from: supabase/migrations/20251203150000_create_label_drafts.sql
```

---

### Step 2: Verify Database Setup

Run this in SQL Editor:
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('print_queue', 'label_drafts')
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('print_queue', 'label_drafts', 'label_templates');

-- Check policies exist
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('print_queue', 'label_drafts', 'label_templates')
ORDER BY tablename, policyname;
```

Expected output:
- ✅ 2 tables: label_drafts, print_queue
- ✅ RLS enabled on all 3 tables
- ✅ 12 policies total (4 per table)

---

### Step 3: Test Your User Role

```sql
-- Check your current role
SELECT * FROM user_roles WHERE user_id = auth.uid();

-- If no role, add yourself as manager
INSERT INTO user_roles (user_id, role)
VALUES (auth.uid(), 'manager')
ON CONFLICT DO NOTHING;
```

---

### Step 4: Quick Test

**Test 1: Print Queue**
```sql
-- Insert test item
INSERT INTO print_queue (
  prepared_by_name, 
  condition, 
  prep_date, 
  expiry_date
) VALUES (
  'Test User',
  'refrigerated',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '7 days'
);

-- Verify you can see it
SELECT * FROM print_queue WHERE user_id = auth.uid();
```

**Test 2: Label Drafts**
```sql
-- Insert test draft
INSERT INTO label_drafts (draft_name, form_data)
VALUES ('Test Draft', '{"productName": "Test Product"}'::jsonb);

-- Verify you can see it
SELECT * FROM label_drafts WHERE user_id = auth.uid();
```

**Test 3: Template Access**
```sql
-- View templates (should work for everyone)
SELECT id, name, is_default FROM label_templates;

-- Try to create template (should work for manager/leader_chef)
INSERT INTO label_templates (name, description)
VALUES ('Test Template', 'Testing role access');
```

---

## 🎯 INTEGRATION CHECKLIST

After database is ready, integrate components into your app:

### 1. Update Labeling.tsx

Add imports:
```typescript
import { PrintQueue } from "@/components/labels/PrintQueue";
import { QuickPrintMenu } from "@/components/labels/QuickPrintMenu";
import { DraftManager } from "@/components/labels/DraftManager";
```

Add state for managing views:
```typescript
const [currentView, setCurrentView] = useState<'new' | 'quick' | 'queue' | 'drafts' | 'templates'>('new');
```

Add tabs or buttons:
```tsx
<div className="flex gap-2 mb-4">
  <Button onClick={() => setCurrentView('new')}>New Label</Button>
  <Button onClick={() => setCurrentView('quick')}>Quick Print</Button>
  <Button onClick={() => setCurrentView('queue')}>Print Queue</Button>
  <Button onClick={() => setCurrentView('drafts')}>Drafts</Button>
  <Button onClick={() => setCurrentView('templates')}>Templates</Button>
</div>

{currentView === 'new' && <LabelForm ... />}
{currentView === 'quick' && <QuickPrintMenu />}
{currentView === 'queue' && <PrintQueue />}
{currentView === 'drafts' && <DraftManager onLoadDraft={handleLoadDraft} />}
{currentView === 'templates' && <TemplateManagement ... />}
```

### 2. Add Draft Loading to LabelForm

```typescript
// In LabelForm component props
interface LabelFormProps {
  initialData?: LabelData;  // Add this
  // ... existing props
}

// In component body
useEffect(() => {
  if (initialData) {
    setLabelData(initialData);
  }
}, [initialData]);
```

### 3. Handle Draft Load in Labeling.tsx

```typescript
const handleLoadDraft = (draftData: LabelData) => {
  setCurrentView('new');
  // Pass draftData to LabelForm as initialData
};
```

---

## 🧪 TESTING GUIDE

### Manual Testing Sequence

1. **Quick Print**
   - [ ] Search for existing product
   - [ ] Verify auto-fill from last print
   - [ ] Select template (see ⭐ on default)
   - [ ] Select condition (no default)
   - [ ] Select unit
   - [ ] Add to queue
   - [ ] Verify item appears in Print Queue

2. **Print Queue**
   - [ ] See items in queue
   - [ ] Drag and drop to reorder
   - [ ] Print single item
   - [ ] Print all items
   - [ ] Delete single item
   - [ ] Clear entire queue
   - [ ] Verify real-time updates

3. **Dynamic Category Creation**
   - [ ] Search for non-existent category
   - [ ] Click "Create [name]"
   - [ ] Confirm in dialog
   - [ ] Verify category created
   - [ ] Try duplicate (should error)

4. **Dynamic Product Creation**
   - [ ] Search for non-existent product
   - [ ] Click "Create [name]"
   - [ ] Select category
   - [ ] Confirm in dialog
   - [ ] Verify product created
   - [ ] Try duplicate (should error)

5. **QR Code Preview**
   - [ ] Fill label form
   - [ ] See live preview update
   - [ ] Verify QR code appears
   - [ ] Check condition color coding
   - [ ] Scan QR code with phone (optional)

6. **Draft System**
   - [ ] Start filling label form
   - [ ] Click "Save Draft"
   - [ ] Name the draft
   - [ ] Verify draft saved
   - [ ] Go to Drafts view
   - [ ] Load draft
   - [ ] Verify form filled
   - [ ] Delete draft

7. **Role-Based Access**
   - [ ] View templates (should work)
   - [ ] Try to create template (check role)
   - [ ] Try to edit template (check role)
   - [ ] Try to delete template (check role)
   - [ ] See permission alert if not manager

---

## 🐛 TROUBLESHOOTING

### Migration Errors

**Error: "relation already exists"**
```sql
-- Drop and recreate
DROP TABLE IF EXISTS print_queue CASCADE;
DROP TABLE IF EXISTS label_drafts CASCADE;
-- Then run migrations again
```

**Error: "policy already exists"**
```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own drafts" ON label_drafts;
-- Then run migrations again
```

### Runtime Errors

**Error: "Failed to load drafts"**
- Check RLS policies are applied
- Verify user is authenticated
- Check browser console for details

**Error: "Failed to create category/product"**
- Check organization_id is set correctly
- Verify UNIQUE constraints migration was applied
- Check for actual duplicates in database

**Error: "QR code not appearing"**
- Verify qrcode.react is installed
- Check product data is complete
- Check browser console for errors

---

## 📞 SUPPORT

If you encounter issues:

1. Check browser console for errors
2. Check Supabase logs in dashboard
3. Verify migrations with SQL queries above
4. Check user_roles table has your role
5. Test RLS policies in SQL Editor

---

## ✅ SUCCESS CRITERIA

Phase 2 is successfully deployed when:

- ✅ All 3 migrations applied without errors
- ✅ All RLS policies active
- ✅ Can create items in print queue
- ✅ Can save and load drafts
- ✅ Role-based access working
- ✅ QR codes generating
- ✅ Dynamic creation working

---

**Ready to go!** 🚀

Start with Step 1 above, then test each feature systematically.
