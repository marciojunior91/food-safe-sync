# 🧪 Expiring Soon Module - Testing Summary

## Current Status: ✅ Module Working, Needs Test Data

The "No Items Expiring Soon" message is **correct** - it means:
- ✅ The module is loading successfully
- ✅ It's querying the database properly
- ℹ️ There are just no items with expiry dates in the next 7 days

---

## Quick Start: 3 Simple Steps

### Step 1: Open Supabase Dashboard
1. Go to your Supabase project
2. Click **SQL Editor** in left sidebar
3. Click **New Query**

### Step 2: Run This Query
Copy and paste this into the SQL editor:

```sql
-- Get your organization_id
SELECT id, name FROM organizations;
```

**Copy the `id` (UUID) for your organization.**

### Step 3: Insert Test Data
Replace `YOUR_ORG_ID` with the UUID you copied:

```sql
-- Quick test: Add 4 products with different urgency levels
INSERT INTO products (
  organization_id, name, category_id, storage_location, 
  quantity, unit, expiry_date
)
SELECT 
  'YOUR_ORG_ID',
  'Test: ' || item_name,
  (SELECT id FROM label_categories WHERE organization_id = 'YOUR_ORG_ID' LIMIT 1),
  location,
  qty,
  unit_type,
  expiry
FROM (VALUES
  ('Salmon (Critical)', 'Fridge', 2, 'kg', NOW()::date),
  ('Milk (Urgent)', 'Fridge', 5, 'L', (NOW() + INTERVAL '1 day')::date),
  ('Cheese (Warning)', 'Fridge', 1, 'kg', (NOW() + INTERVAL '2 days')::date),
  ('Eggs (Normal)', 'Fridge', 24, 'units', (NOW() + INTERVAL '5 days')::date)
) AS test_data(item_name, location, qty, unit_type, expiry);
```

Click **Run** ▶️

### Step 4: Refresh Expiring Soon Page
Go back to your app → **Expiring Soon** page → Press F5

**You should now see:**
- 🔴 1 Critical item (expires today)
- 🟠 1 Urgent item (expires tomorrow)
- 🟡 1 Warning item (2 days)
- 🟢 1 Normal item (5 days)

---

## What to Test

### ✅ Visual Elements
- [ ] Stats cards show correct counts
- [ ] Color coding matches urgency (red/orange/yellow/green)
- [ ] Items are sorted (critical items first)
- [ ] Item cards show all info (name, location, dates)

### ✅ Filters
- [ ] Search by item name works
- [ ] Type filter (Products/Labels) works
- [ ] Urgency filter works
- [ ] Location filter works

### ✅ Actions
- [ ] Click "Consumed" → Dialog opens
- [ ] Click "Extend" → Dialog opens with date picker
- [ ] Click "Discard" → Dialog opens
- [ ] Submit actions show success toast

### ✅ Mobile
- [ ] Resize browser → Layout adapts
- [ ] Action buttons remain usable
- [ ] Stats cards stack properly

---

## Clean Up Test Data

After testing, remove test items:

```sql
DELETE FROM products 
WHERE organization_id = 'YOUR_ORG_ID' 
  AND name LIKE 'Test:%';
```

---

## Alternative: Use Existing Data

If you already have products in the system:

### Option A: Update Existing Products
```sql
-- Set expiry dates on existing products
UPDATE products 
SET expiry_date = (NOW() + INTERVAL '2 days')::date
WHERE organization_id = 'YOUR_ORG_ID'
  AND expiry_date IS NULL
LIMIT 5;
```

### Option B: Print Labels via UI
1. Go to **Labeling** page
2. Click any product in **Quick Print** grid
3. Set "**Use By Date**" to tomorrow or next week
4. Print the label
5. Check **Expiring Soon** page

---

## Files Created for You

📄 **QUICK_EXPIRING_SOON_SETUP.sql**
- Step-by-step SQL script
- Copy-paste ready
- Includes cleanup commands

📄 **EXPIRING_SOON_TESTING_GUIDE.md**
- Comprehensive testing guide
- Troubleshooting section
- Verification queries

📄 **EXPIRING_SOON_TEST_DATA.sql**
- Full test dataset
- 10 products + 6 labels
- Various urgency levels

---

## Need Help?

**Can't find organization_id?**
```sql
SELECT * FROM organizations;
```

**Can't find category_id?**
```sql
SELECT id, name FROM label_categories LIMIT 5;
```

**Still showing empty after adding data?**
1. Check browser console (F12) for errors
2. Verify expiry dates are within 7 days
3. Refresh page (F5)
4. Check Network tab for failed requests

---

## Next Steps

Once Expiring Soon is tested:
1. ✅ Verify all features work
2. 📸 Take screenshots (optional)
3. 🚀 Continue to **Day 8: Training Center**
4. 📝 Or adjust any UI/behavior you'd like

**Let me know when you're ready to continue!** 🎯
