# Testing the Expiring Soon Module - Quick Guide

## Current Status
✅ Module is working correctly - showing empty state because no items have expiry dates in the next 7 days.

---

## Option 1: Add Test Data via UI (Easiest)

### Add Products with Expiry Dates:
1. Go to **Labeling** page
2. Click "**+ Create Product**" (if available) or use existing products
3. For each product, add an **expiry date** in the next 1-7 days:
   - **Today** → Will show as 🔴 CRITICAL
   - **Tomorrow** → Will show as 🟠 URGENT  
   - **2-3 days** → Will show as 🟡 WARNING
   - **4-7 days** → Will show as 🟢 NORMAL

### Print Labels with Expiry Dates:
1. Go to **Labeling** page
2. Use **Quick Print** grid or **Custom Label** form
3. Set "**Use By Date**" to dates within next 7 days
4. Print labels
5. Those labels will appear in Expiring Soon

---

## Option 2: Add Test Data via Supabase SQL (Faster)

### Step 1: Get Your Organization ID
1. Open **Supabase Dashboard** → SQL Editor
2. Run this query:
```sql
SELECT id, name FROM organizations;
```
3. Copy your organization's `id` (UUID)

### Step 2: Get a Category ID (for products)
```sql
SELECT id, name FROM label_categories 
WHERE organization_id = 'YOUR_ORG_ID_HERE'
LIMIT 1;
```
4. Copy a category `id`

### Step 3: Insert Test Products
Replace `YOUR_ORG_ID` and `YOUR_CATEGORY_ID` with the values from above:

```sql
-- Test products with various expiry dates
INSERT INTO products (
  organization_id,
  name,
  category_id,
  storage_location,
  quantity,
  unit,
  expiry_date
) VALUES
  -- Critical: Expires today
  ('YOUR_ORG_ID', 'Fresh Salmon', 'YOUR_CATEGORY_ID', 'Walk-in Fridge', 2, 'kg', NOW()::date),
  
  -- Urgent: Expires tomorrow
  ('YOUR_ORG_ID', 'Milk (Whole)', 'YOUR_CATEGORY_ID', 'Walk-in Fridge', 5, 'liters', (NOW() + INTERVAL '1 day')::date),
  
  -- Warning: Expires in 2 days
  ('YOUR_ORG_ID', 'Ground Beef', 'YOUR_CATEGORY_ID', 'Walk-in Fridge', 3, 'kg', (NOW() + INTERVAL '2 days')::date),
  
  -- Normal: Expires in 5 days
  ('YOUR_ORG_ID', 'Eggs (Large)', 'YOUR_CATEGORY_ID', 'Walk-in Fridge', 24, 'units', (NOW() + INTERVAL '5 days')::date);
```

### Step 4: Insert Test Labels
```sql
-- Test printed labels with various expiry dates
INSERT INTO printed_labels (
  organization_id,
  product_name,
  use_by_date,
  prepared_date,
  storage_location,
  prepared_by
) VALUES
  ('YOUR_ORG_ID', 'Chicken Soup (Batch #1)', NOW()::date, NOW()::date, 'Walk-in Fridge', 'Test User'),
  ('YOUR_ORG_ID', 'Caesar Dressing', (NOW() + INTERVAL '1 day')::date, NOW()::date, 'Prep Fridge', 'Test User'),
  ('YOUR_ORG_ID', 'Marinara Sauce', (NOW() + INTERVAL '3 days')::date, NOW()::date, 'Walk-in Fridge', 'Test User');
```

### Step 5: Refresh Expiring Soon Page
1. Go back to **Expiring Soon** page
2. Refresh (F5)
3. You should now see items grouped by urgency! 🎉

---

## Expected Results

### Stats Cards Should Show:
- 🔴 **Critical**: 1-2 items (expired or expires today)
- 🟠 **Urgent**: 1-2 items (expires tomorrow)
- 🟡 **Warning**: 1-2 items (2-3 days)
- 🟢 **Normal**: 1-2 items (4-7 days)

### Each Item Card Shows:
- Item name with icon (📦 Product or 📄 Label)
- Storage location
- Urgency indicator (colored dot + text)
- Expiry date
- Three action buttons: Consumed / Extend / Discard

### Test the Filters:
- **Search**: Type item name
- **Type**: Select "Products" or "Labels"
- **Urgency**: Select specific urgency level
- **Location**: Select storage location

### Test the Actions:
1. Click **"Consumed"** → Opens dialog → Shows success toast
2. Click **"Extend"** → Opens dialog with date picker → Requires reason
3. Click **"Discard"** → Opens dialog → Requires reason → Red button

---

## Verification Queries

### Check what will appear in Expiring Soon:
```sql
-- Products expiring in next 7 days
SELECT 
  name,
  expiry_date,
  storage_location,
  EXTRACT(DAY FROM (expiry_date - NOW()::date)) as days_until_expiry
FROM products
WHERE organization_id = 'YOUR_ORG_ID'
  AND expiry_date IS NOT NULL
  AND expiry_date <= (NOW() + INTERVAL '7 days')::date
ORDER BY expiry_date;

-- Labels expiring in next 7 days
SELECT 
  product_name,
  use_by_date,
  storage_location,
  EXTRACT(DAY FROM (use_by_date - NOW()::date)) as days_until_expiry
FROM printed_labels
WHERE organization_id = 'YOUR_ORG_ID'
  AND use_by_date IS NOT NULL
  AND use_by_date <= (NOW() + INTERVAL '7 days')::date
ORDER BY use_by_date;
```

---

## Clean Up Test Data (Optional)

After testing, you can remove test items:

```sql
-- Remove test products
DELETE FROM products 
WHERE organization_id = 'YOUR_ORG_ID' 
  AND name LIKE '%Test%';

-- Remove test labels
DELETE FROM printed_labels 
WHERE organization_id = 'YOUR_ORG_ID' 
  AND product_name LIKE '%Batch #%';
```

---

## Troubleshooting

### "No Items Expiring Soon" Still Shows?

**Check 1: Do items have expiry dates?**
```sql
-- Count products with expiry dates
SELECT COUNT(*) FROM products 
WHERE organization_id = 'YOUR_ORG_ID' 
  AND expiry_date IS NOT NULL;
```

**Check 2: Are expiry dates within 7 days?**
```sql
-- See all product expiry dates
SELECT name, expiry_date, 
  EXTRACT(DAY FROM (expiry_date - NOW()::date)) as days_away
FROM products 
WHERE organization_id = 'YOUR_ORG_ID' 
  AND expiry_date IS NOT NULL
ORDER BY expiry_date;
```

**Check 3: Browser console errors?**
- Open DevTools (F12) → Console tab
- Refresh Expiring Soon page
- Look for red error messages

**Check 4: Network requests succeeding?**
- DevTools → Network tab
- Refresh page
- Look for requests to `/rest/v1/products` and `/rest/v1/printed_labels`
- Check if they return 200 status

---

## Next Steps After Testing

Once you verify the module works:

1. ✅ Test all filters (search, type, urgency, location)
2. ✅ Test action dialogs (consume, extend, discard)
3. ✅ Test mobile responsive layout (resize browser)
4. ✅ Test dark mode toggle
5. 🚀 Move to Day 8: Training Center module

---

**Need help with any of these steps? Let me know!** 🎯
