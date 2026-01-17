# 🚀 Quick Start Guide - Iteration 11

**Date**: December 17, 2025 (Tomorrow!)  
**First Day**: Category Emojis Epic

---

## ☀️ Morning Checklist (9:00 AM - 12:00 PM)

### 1. Setup (30 minutes)

```bash
# Pull latest code
cd "C:\Users\Marci\OneDrive\Área de Trabalho\Tampa APP\Tampa APP"
git pull origin TAMPAAPP_10_11_RECIPES_FUNCIONALITY

# Create feature branch
git checkout -b iteration-11-core-labeling

# Verify dependencies
npm install

# Start dev server
npm run dev
```

### 2. Read Documentation (30 minutes)

- [ ] Read `docs/iteration-11-core-labeling/README.md`
- [ ] Review `docs/ITERATION_11_EPIC_ALIGNMENT.md`
- [ ] Open `docs/iteration-11-core-labeling/EPIC_1_CATEGORY_EMOJIS.md`

### 3. Database Migration (1 hour)

**Create File**: `supabase/migrations/20251217000000_add_category_emojis.sql`

**Copy-Paste This SQL**:
```sql
-- Add emoji columns to categories and subcategories
ALTER TABLE label_categories 
ADD COLUMN IF NOT EXISTS icon TEXT;

ALTER TABLE label_subcategories 
ADD COLUMN IF NOT EXISTS icon TEXT;

-- Default emojis for categories
UPDATE label_categories SET icon = '🍖' WHERE name = 'Meat & Poultry';
UPDATE label_categories SET icon = '🐟' WHERE name = 'Fish & Seafood';
UPDATE label_categories SET icon = '🧀' WHERE name = 'Dairy & Eggs';
UPDATE label_categories SET icon = '🥗' WHERE name = 'Vegetables & Fruits';
UPDATE label_categories SET icon = '🍞' WHERE name = 'Bakery & Grains';
UPDATE label_categories SET icon = '🫗' WHERE name = 'Oils & Fats';
UPDATE label_categories SET icon = '🍝' WHERE name = 'Pasta & Noodles';
UPDATE label_categories SET icon = '🍛' WHERE name = 'Sauces & Condiments';
UPDATE label_categories SET icon = '🍬' WHERE name = 'Sweets & Desserts';
UPDATE label_categories SET icon = '☕' WHERE name = 'Beverages';

-- Default emojis for subcategories (meat)
UPDATE label_subcategories SET icon = '🐔' WHERE name = 'Chicken';
UPDATE label_subcategories SET icon = '🐄' WHERE name = 'Beef';
UPDATE label_subcategories SET icon = '🐖' WHERE name = 'Pork';
UPDATE label_subcategories SET icon = '🦃' WHERE name = 'Turkey';

-- Add comments
COMMENT ON COLUMN label_categories.icon IS 'Emoji icon for category';
COMMENT ON COLUMN label_subcategories.icon IS 'Emoji icon for subcategory';
```

**Apply in Supabase**:
1. Go to Supabase Dashboard
2. SQL Editor → New Query
3. Paste SQL above
4. Run
5. ✅ Verify: `SELECT name, icon FROM label_categories;`

### 4. Install Emoji Picker (15 minutes)

```bash
# Install dependency
npm install emoji-picker-react

# Verify installation
npm list emoji-picker-react
```

---

## 🌅 Afternoon Checklist (1:00 PM - 5:00 PM)

### 5. Update TypeScript Types (30 minutes)

**File**: `src/types/labels.ts`

**Add** `icon?: string;` to both interfaces:
```typescript
export interface LabelCategory {
  id: string;
  name: string;
  icon?: string; // ADD THIS
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface LabelSubcategory {
  id: string;
  name: string;
  icon?: string; // ADD THIS
  category_id: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}
```

### 6. Add Emoji Picker to CategoryForm (2 hours)

**File**: `src/components/admin/CategoryForm.tsx`

**At top, add import**:
```typescript
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile } from "lucide-react";
```

**In component, add state**:
```typescript
const [selectedEmoji, setSelectedEmoji] = useState<string>(category?.icon || '');
const [showEmojiPicker, setShowEmojiPicker] = useState(false);
```

**Add handler**:
```typescript
const onEmojiClick = (emojiData: EmojiClickData) => {
  setSelectedEmoji(emojiData.emoji);
  setShowEmojiPicker(false);
};
```

**In JSX (after name input), add**:
```tsx
<div className="space-y-2">
  <Label htmlFor="icon">Category Icon</Label>
  <div className="flex items-center gap-2">
    <div className="flex items-center justify-center w-12 h-12 border rounded-md text-2xl">
      {selectedEmoji || '📦'}
    </div>
    <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Smile className="h-4 w-4 mr-2" />
          Choose Emoji
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <EmojiPicker onEmojiClick={onEmojiClick} />
      </PopoverContent>
    </Popover>
  </div>
</div>
```

**Update save function to include**:
```typescript
icon: selectedEmoji || null
```

### 7. Test Emoji Picker (30 minutes)

1. Go to admin section
2. Edit a category
3. Click "Choose Emoji"
4. Select an emoji
5. Save
6. ✅ Verify emoji saved in database

### 8. Commit Progress (15 minutes)

```bash
git add .
git commit -m "feat: add emoji support to categories - Day 1 progress

- Add icon column to label_categories and label_subcategories
- Install emoji-picker-react
- Update TypeScript types
- Add emoji picker to CategoryForm
- Populate default emojis"

git push origin iteration-11-core-labeling
```

---

## 📝 End of Day 1

### Accomplished ✅
- [x] Database migration created and applied
- [x] Emoji columns added
- [x] Emoji picker installed
- [x] TypeScript types updated
- [x] CategoryForm has emoji picker
- [x] Code committed

### Tomorrow (Day 2) 🌅
- [ ] Add emoji picker to SubcategoryForm
- [ ] Update category selector in LabelForm (show emojis)
- [ ] Update subcategory selector (show emojis)
- [ ] Test all scenarios
- [ ] Complete Epic 1! 🎉

---

## 🆘 If You Get Stuck

### Issue: Migration fails
**Solution**: Check if columns already exist
```sql
-- Check table schema
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'label_categories';
```

### Issue: Emoji picker doesn't show
**Solution**: Check imports and Popover component
```typescript
// Verify Popover is from shadcn/ui
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
```

### Issue: TypeScript errors
**Solution**: Run type check
```bash
npm run type-check
# or
npx tsc --noEmit
```

### Issue: Emoji doesn't save
**Solution**: Check form submission
```typescript
// Log before save
console.log('Saving category with icon:', selectedEmoji);
```

---

## 📞 Resources

- **Epic 1 Full Guide**: `docs/iteration-11-core-labeling/EPIC_1_CATEGORY_EMOJIS.md`
- **Emoji Picker Docs**: https://www.npmjs.com/package/emoji-picker-react
- **Supabase Dashboard**: https://supabase.com/dashboard

---

## 🎯 Success for Tomorrow

By end of Day 1, you should have:
- ✅ Database with emoji columns
- ✅ CategoryForm with working emoji picker
- ✅ Ability to add/edit category emojis
- ✅ Code committed to git

**Time Estimate**: 6-7 hours of focused work

**Next Epic Start**: Day 3 (Multi-Printer Support)

---

🚀 **Ready to start tomorrow? Let's build something amazing!**
