# Search Icon Fix - Remaining Files

## ✅ Fixed Files
1. `src/pages/ExpiringSoon.tsx` - Changed `pl-10` to `pl-11` ✅

## ⏳ Files Needing Fix

### Fix Pattern:
Change padding from `pl-10` to `pl-11` (or `pl-12` for more space)
Add `pointer-events-none` to icon to prevent click interference

**Before:**
```tsx
<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
<Input ... className="pl-10" />
```

**After:**
```tsx
<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
<Input ... className="pl-11" />
```

---

## 📋 Files List

### 1. `src/components/labels/QuickPrintGrid.tsx` (Line 626)
```tsx
// Current:
<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
<Input className="pl-10" ... />

// Fix needed: pl-10 → pl-11, add pointer-events-none
```

### 2. `src/components/people/PeopleFilters.tsx` (Line 76)
```tsx
// Current:
<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
<Input className="pl-10" ... />

// Fix needed: pl-10 → pl-11, add pointer-events-none
```

### 3. `src/components/people/TeamMemberSelector.tsx` (Line 151)
```tsx
// Current:
<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
<Input className="pl-10" ... />

// Fix needed: pl-10 → pl-11, add pointer-events-none
```

### 4. `src/components/feed/FeedFilters.tsx` (Line 80)
```tsx
// Current:
<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
<Input className="pl-10" ... />

// Fix needed: pl-10 → pl-11, add pointer-events-none
```

### 5. `src/pages/KnowledgeBase.tsx` (Line 220)
```tsx
// Current:
<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
<Input className="pl-10" ... />

// Fix needed: pl-10 → pl-11, add pointer-events-none
```

### 6. `src/components/labels/UserSelectionDialog.tsx` (Line 177)
```tsx
// Current:
<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
<Input className="pl-10" ... />

// Fix needed: pl-10 → pl-11, add pointer-events-none
```

### 7. `src/components/labels/TemplateManagement.tsx` (Line 311)
```tsx
// Current:
<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
<Input className="pl-10" ... />

// Fix needed: pl-10 → pl-11, add pointer-events-none
```

### 8. `src/pages/PeopleModule.tsx` (Line 283)
```tsx
// Current:
<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
<Input className="pl-10" ... />

// Fix needed: pl-10 → pl-11, add pointer-events-none
```

### 9. `src/pages/Recipes.tsx` (Line 337)
```tsx
// Current:
<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
<Input className="pl-10" ... />

// Fix needed: pl-10 → pl-11, add pointer-events-none
```

### 10. `src/pages/TasksOverview.tsx` (Line 728)
```tsx
// Current:
<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
<Input className="pl-10" ... />

// Fix needed: pl-10 → pl-11, add pointer-events-none
```

---

## 🚀 Quick Fix Script

You can use the following PowerShell command to find all occurrences:

```powershell
Get-ChildItem -Path "src\" -Recurse -Include *.tsx | 
  Select-String -Pattern 'className="pl-10"' | 
  Select-Object Path, LineNumber, Line
```

---

## ✨ Alternative: Use SearchInput Component

Instead of manually fixing each file, consider using the new `SearchInput` component:

```tsx
// Import
import { SearchInput } from "@/components/ui/search-input";

// Replace old pattern:
<div className="relative">
  <Search className="absolute left-3..." />
  <Input placeholder="Search..." value={...} onChange={...} className="pl-10" />
</div>

// With new component:
<SearchInput 
  placeholder="Search..." 
  value={...} 
  onChange={...} 
/>
```

**Files where SearchInput component is recommended:**
- All 10 files listed above
- Any future search inputs

---

## 📊 Progress

- **Total Files:** 11
- **Fixed:** 1 (ExpiringSoon.tsx)
- **Remaining:** 10
- **Completion:** 9%

---

**Note:** This fix improves UX by:
1. Preventing icon/placeholder overlap
2. Adding `pointer-events-none` prevents accidental icon clicks
3. Consistent spacing across all search inputs
