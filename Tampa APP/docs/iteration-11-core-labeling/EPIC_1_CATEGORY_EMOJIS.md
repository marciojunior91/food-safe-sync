# Epic 1: Category & Subcategory Emojis 📱

**Priority**: High  
**Effort**: 2 days  
**Timeline**: Dec 17-18, 2025  
**Status**: 🟡 Not Started

---

## 🎯 Goal

Add emoji/icon support to categories and subcategories, matching the allergen icon pattern for visual consistency.

---

## 📋 Task Breakdown

### Task 1.1: Database Migration (1 hour)

**File**: `supabase/migrations/20251217000000_add_category_emojis.sql`

**SQL**:
```sql
-- Add emoji columns to categories and subcategories
-- Migration: 20251217000000_add_category_emojis.sql

-- Add icon column to label_categories
ALTER TABLE label_categories 
ADD COLUMN IF NOT EXISTS icon TEXT;

-- Add icon column to label_subcategories
ALTER TABLE label_subcategories 
ADD COLUMN IF NOT EXISTS icon TEXT;

-- Populate default emojis for existing categories
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

-- Populate default emojis for subcategories (examples)
-- Meat & Poultry subcategories
UPDATE label_subcategories SET icon = '🐔' WHERE name = 'Chicken';
UPDATE label_subcategories SET icon = '🐄' WHERE name = 'Beef';
UPDATE label_subcategories SET icon = '🐖' WHERE name = 'Pork';
UPDATE label_subcategories SET icon = '🦃' WHERE name = 'Turkey';
UPDATE label_subcategories SET icon = '🦆' WHERE name = 'Duck';

-- Fish & Seafood subcategories
UPDATE label_subcategories SET icon = '🐟' WHERE name = 'Fish';
UPDATE label_subcategories SET icon = '🦐' WHERE name = 'Shellfish';
UPDATE label_subcategories SET icon = '🦞' WHERE name = 'Crustaceans';
UPDATE label_subcategories SET icon = '🦑' WHERE name = 'Molluscs';
UPDATE label_subcategories SET icon = '🐙' WHERE name = 'Cephalopods';

-- Dairy & Eggs subcategories
UPDATE label_subcategories SET icon = '🥛' WHERE name = 'Milk';
UPDATE label_subcategories SET icon = '🧈' WHERE name = 'Butter';
UPDATE label_subcategories SET icon = '🧀' WHERE name = 'Cheese';
UPDATE label_subcategories SET icon = '🥚' WHERE name = 'Eggs';
UPDATE label_subcategories SET icon = '🍦' WHERE name = 'Ice Cream';

-- Add comments
COMMENT ON COLUMN label_categories.icon IS 'Emoji icon for visual category identification';
COMMENT ON COLUMN label_subcategories.icon IS 'Emoji icon for visual subcategory identification';

-- Verify migration
SELECT name, icon FROM label_categories ORDER BY name;
SELECT name, icon FROM label_subcategories ORDER BY name;
```

**Test**:
```bash
# Apply migration in Supabase SQL Editor
# Verify all categories have emojis
# Verify all subcategories have emojis
```

---

### Task 1.2: Update TypeScript Types (30 minutes)

**File**: `src/types/labels.ts`

**Changes**:
```typescript
// Add icon property to category and subcategory types

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

---

### Task 1.3: Add Emoji Picker to Admin Forms (2 hours)

**Install Dependency**:
```bash
npm install emoji-picker-react
```

**File**: `src/components/admin/CategoryForm.tsx`

**Add Emoji Picker**:
```tsx
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Smile } from "lucide-react";

// Inside your form component:
const [selectedEmoji, setSelectedEmoji] = useState<string>(category?.icon || '');
const [showEmojiPicker, setShowEmojiPicker] = useState(false);

const onEmojiClick = (emojiData: EmojiClickData) => {
  setSelectedEmoji(emojiData.emoji);
  setShowEmojiPicker(false);
};

// In your form JSX:
<div className="space-y-2">
  <Label htmlFor="icon">Category Icon (Emoji)</Label>
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
  <p className="text-xs text-muted-foreground">
    Select an emoji to represent this category
  </p>
</div>

// Update form submission to include icon:
const formData = {
  name: categoryName,
  icon: selectedEmoji || null,
  organization_id: organizationId
};
```

**File**: `src/components/admin/SubcategoryForm.tsx`

**Add Same Emoji Picker** (copy pattern from CategoryForm)

---

### Task 1.4: Display Emojis in Selectors (2 hours)

**File**: `src/components/labels/LabelForm.tsx`

**Update Category Selector**:
```tsx
// Find the category Select component and update SelectItem:

<Select
  value={labelData.categoryId}
  onValueChange={handleCategoryChange}
>
  <SelectTrigger>
    <SelectValue placeholder="Select a category">
      {labelData.categoryId && formCategories.find(c => c.id === labelData.categoryId) && (
        <span className="flex items-center gap-2">
          <span className="text-lg">
            {formCategories.find(c => c.id === labelData.categoryId)?.icon}
          </span>
          <span>
            {formCategories.find(c => c.id === labelData.categoryId)?.name}
          </span>
        </span>
      )}
    </SelectValue>
  </SelectTrigger>
  <SelectContent>
    {formCategories.map((category) => (
      <SelectItem key={category.id} value={category.id}>
        <span className="flex items-center gap-2">
          <span className="text-lg">{category.icon}</span>
          <span>{category.name}</span>
        </span>
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Update Subcategory Selector**:
```tsx
// Same pattern for subcategory selector:

<Select
  value={labelData.subcategoryId || "none"}
  onValueChange={handleSubcategoryChange}
>
  <SelectTrigger>
    <SelectValue placeholder="Select a subcategory">
      {labelData.subcategoryId && formSubcategories.find(s => s.id === labelData.subcategoryId) && (
        <span className="flex items-center gap-2">
          <span className="text-lg">
            {formSubcategories.find(s => s.id === labelData.subcategoryId)?.icon}
          </span>
          <span>
            {formSubcategories.find(s => s.id === labelData.subcategoryId)?.name}
          </span>
        </span>
      )}
    </SelectValue>
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="none">None</SelectItem>
    {formSubcategories.map((subcategory) => (
      <SelectItem key={subcategory.id} value={subcategory.id}>
        <span className="flex items-center gap-2">
          <span className="text-lg">{subcategory.icon}</span>
          <span>{subcategory.name}</span>
        </span>
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

---

### Task 1.5: Update Product Cards (1 hour)

**File**: `src/pages/ProductLabels.tsx` (or wherever products are displayed)

**Show Emojis on Product Cards**:
```tsx
// In product card display:
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <span className="text-xl">{product.category?.icon}</span>
      <span>{product.name}</span>
    </CardTitle>
    <CardDescription className="flex items-center gap-2">
      {product.subcategory?.icon && (
        <span className="text-sm">{product.subcategory.icon}</span>
      )}
      <span>{product.category?.name}</span>
      {product.subcategory && ` › ${product.subcategory.name}`}
    </CardDescription>
  </CardHeader>
</Card>
```

---

## ✅ Testing Checklist

### Database Testing
- [ ] Migration runs without errors
- [ ] All categories have emojis
- [ ] All subcategories have emojis
- [ ] Icon column is nullable (allows null)
- [ ] Can update icons via SQL

### UI Testing
- [ ] Emoji picker opens in CategoryForm
- [ ] Emoji picker opens in SubcategoryForm
- [ ] Selected emoji displays correctly
- [ ] Emoji saves to database
- [ ] Category selector shows emojis
- [ ] Subcategory selector shows emojis
- [ ] Product cards show category emojis
- [ ] Product cards show subcategory emojis

### Cross-Browser Testing
- [ ] Chrome: Emojis render correctly
- [ ] Firefox: Emojis render correctly
- [ ] Safari: Emojis render correctly
- [ ] Edge: Emojis render correctly
- [ ] Mobile Chrome: Emojis render correctly
- [ ] Mobile Safari: Emojis render correctly

### Edge Cases
- [ ] Category without emoji: Falls back to default (📦)
- [ ] Subcategory without emoji: Shows text only
- [ ] Very long category name + emoji: Truncates properly
- [ ] Rapid emoji selection: No duplicate saves

---

## 📸 Screenshots (To Capture)

1. **Admin Form**: Category with emoji picker
2. **Admin Form**: Subcategory with emoji picker
3. **Label Form**: Category selector with emojis
4. **Label Form**: Subcategory selector with emojis
5. **Product Card**: Product with category/subcategory emojis

---

## 🐛 Known Issues

### Issue 1: Emoji Rendering on Old Browsers
**Problem**: Some emojis may not render on older browsers/devices

**Solution**: 
- Use widely-supported emojis
- Provide text fallback
- Test on target devices

### Issue 2: Emoji Picker Performance
**Problem**: Emoji picker may be slow on low-end devices

**Solution**:
- Lazy load emoji picker
- Use compact emoji set
- Add loading indicator

---

## 📚 Documentation to Write

1. **User Guide**: How to add/edit category emojis
2. **Admin Guide**: Best practices for emoji selection
3. **Migration Guide**: How to apply emoji migration

---

## 🎯 Success Criteria

- ✅ All categories have emojis (100%)
- ✅ All subcategories have emojis (100%)
- ✅ Emojis display in all selectors
- ✅ Emoji picker works in admin forms
- ✅ Cross-browser compatibility (6 browsers)
- ✅ Mobile responsive
- ✅ No TypeScript errors
- ✅ User satisfaction: >4.5/5

---

## 🚀 Quick Start

**Day 1 Morning**:
1. Create migration file
2. Apply migration in Supabase
3. Verify emojis in database

**Day 1 Afternoon**:
1. Update TypeScript types
2. Install emoji-picker-react
3. Add emoji picker to CategoryForm

**Day 2 Morning**:
1. Add emoji picker to SubcategoryForm
2. Update category selector in LabelForm
3. Update subcategory selector

**Day 2 Afternoon**:
1. Update product cards
2. Test all scenarios
3. Write documentation

---

**Status**: 🟡 Ready to Start  
**First Task**: Create database migration  
**Next Epic**: Multi-Printer Support 🖨️
