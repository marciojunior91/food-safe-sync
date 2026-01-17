# 🚀 PHASE 2 - Advanced Label Management System

## 📋 Overview
This phase enhances the labeling system with advanced features including print queue management, quick print functionality, enhanced template management with role-based access, and intelligent product/category creation.

---

## 🎯 Implementation Steps

### **STEP 1: Print Queue System** 📄

#### 1.1 Database Schema
**Create new table**: `print_queue`
```sql
CREATE TABLE print_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  category_id UUID REFERENCES label_categories(id),
  template_id UUID REFERENCES label_templates(id),
  user_id UUID REFERENCES auth.users(id),
  prepared_by_name TEXT NOT NULL,
  prep_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('fresh', 'cooked', 'frozen', 'refrigerated', 'thawed')),
  quantity TEXT,
  unit TEXT,
  batch_number TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'printing', 'completed', 'failed')),
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE print_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own print queue"
  ON print_queue FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their print queue"
  ON print_queue FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their print queue"
  ON print_queue FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their print queue"
  ON print_queue FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_print_queue_user_status ON print_queue(user_id, status);
CREATE INDEX idx_print_queue_created ON print_queue(created_at DESC);
```

#### 1.2 TypeScript Types
**Update**: `src/integrations/supabase/types.ts`
```typescript
export interface PrintQueueItem {
  id: string;
  product_id: string;
  category_id: string;
  template_id: string;
  user_id: string;
  prepared_by_name: string;
  prep_date: string;
  expiry_date: string;
  condition: 'fresh' | 'cooked' | 'frozen' | 'refrigerated' | 'thawed';
  quantity: string | null;
  unit: string | null;
  batch_number: string | null;
  notes: string | null;
  status: 'pending' | 'printing' | 'completed' | 'failed';
  priority: number;
  created_at: string;
  updated_at: string;
  product?: {
    name: string;
    category?: {
      name: string;
    };
  };
}
```

#### 1.3 Print Queue Component
**Create**: `src/components/labels/PrintQueue.tsx`

**Features**:
- Display all pending print jobs in a table
- Columns: Product, Category, Quantity, Unit, Condition, Expiry Date, Priority, Actions
- Sort by priority (drag-and-drop to reorder)
- Bulk actions: Print All, Clear Queue, Delete Selected
- Individual actions: Edit, Delete, Move Up/Down
- Real-time updates using Supabase subscriptions
- Status indicators (pending, printing, completed, failed)
- Retry failed prints
- Filter by status

**UI Components**:
- Table with sortable columns
- Drag-and-drop rows (using `@dnd-kit/core`)
- Action buttons (Print, Edit, Delete)
- Bulk select checkboxes
- Status badges with colors

---

### **STEP 2: Quick Print Enhancement** ⚡

#### 2.1 Quick Print Component
**Update**: `src/components/labels/QuickPrintMenu.tsx`

**Logic Flow**:
1. User searches for existing product name
2. System queries database for product details:
   - Product name, category, unit
   - Last printed label data (if available)
   - Default condition and shelf life
3. Auto-fill form with retrieved data:
   - Category (from product)
   - Unit (from product or last print)
   - Condition (from last print or default)
   - Quantity (from last print or empty)
4. User can only modify:
   - Quantity
   - Condition (optional adjustment)
   - Template selection
   - Notes
5. Click "Add to Queue" or "Print Now"

**UI/UX Enhancements**:
- **Warning Badge**: "Quick Print: Existing Products Only"
- **Info Tooltip**: "To print a new product, use 'New Label' and create the product first"
- **Search Field**: 
  - Placeholder: "Search existing products..."
  - Shows "No results" if product doesn't exist
  - Displays "Create this product?" link → redirects to New Label
- **Template Dropdown**: 
  - Fetch from `label_templates` table
  - Show template name + description
  - Mark default template with ⭐
  - Preview thumbnail (if available)

**Database Query**:
```typescript
const fetchProductDetails = async (productId: string) => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:label_categories(id, name),
      last_print:printed_labels(condition, quantity, unit, notes)
    `)
    .eq('id', productId)
    .order('created_at', { foreignTable: 'printed_labels', ascending: false })
    .limit(1, { foreignTable: 'printed_labels' })
    .single();
  
  return data;
};
```

#### 2.2 Template Selection
**Component**: Template selector dropdown with preview

```typescript
<Select value={templateId} onValueChange={setTemplateId}>
  <SelectTrigger>
    <SelectValue placeholder="Select template..." />
  </SelectTrigger>
  <SelectContent>
    {templates.map(template => (
      <SelectItem key={template.id} value={template.id}>
        <div className="flex items-center gap-2">
          {template.is_default && <Star className="h-3 w-3 fill-yellow-400" />}
          <span>{template.name}</span>
          {template.description && (
            <span className="text-xs text-muted-foreground">
              - {template.description}
            </span>
          )}
        </div>
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

---

### **STEP 3: Label Templates Menu - Role-Based Access** 🔒

#### 3.1 Update RLS Policies
**Migration**: `supabase/migrations/YYYYMMDDHHMMSS_template_rls_roles.sql`

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view templates" ON label_templates;
DROP POLICY IF EXISTS "Anyone can insert templates" ON label_templates;
DROP POLICY IF EXISTS "Anyone can update templates" ON label_templates;
DROP POLICY IF EXISTS "Anyone can delete templates" ON label_templates;

-- New role-based policies
CREATE POLICY "Everyone can view templates"
  ON label_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Manager and Leader Chef can create templates"
  ON label_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('manager', 'leader_chef')
    )
  );

CREATE POLICY "Manager and Leader Chef can update templates"
  ON label_templates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('manager', 'leader_chef')
    )
  );

CREATE POLICY "Manager and Leader Chef can delete templates"
  ON label_templates FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('manager', 'leader_chef')
    )
  );
```

#### 3.2 Update TemplateManagement Component
**Update**: `src/components/labels/TemplateManagement.tsx`

**Changes**:
- Fetch user role using `useUserRole()` hook
- Conditionally show/hide Create/Edit/Delete buttons based on role
- Show read-only view for non-privileged users
- Display permission message: "Only Managers and Leader Chefs can edit templates"

```typescript
const { role, isLoading } = useUserRole();
const canEditTemplates = ['manager', 'leader_chef'].includes(role || '');

// In JSX:
{canEditTemplates ? (
  <Button onClick={handleCreateTemplate}>New Template</Button>
) : (
  <p className="text-sm text-muted-foreground">
    Only Managers and Leader Chefs can edit templates
  </p>
)}
```

#### 3.3 Create Label Button
**Add button**: Inside `TemplateManagement.tsx`

```typescript
<div className="flex justify-between items-center mb-4">
  <h2>Label Templates</h2>
  <div className="flex gap-2">
    <Button variant="outline" onClick={() => navigate('/labeling/new')}>
      <Plus className="h-4 w-4 mr-2" />
      Create Label
    </Button>
    {canEditTemplates && (
      <Button onClick={handleNewTemplate}>
        New Template
      </Button>
    )}
  </div>
</div>
```

---

### **STEP 4: Enhanced Create Label Menu** ✨

#### 4.1 Manager Product Creation
**Update**: `src/components/labels/LabelForm.tsx`

**Logic**:
- Detect user role (Manager only)
- Show toggle: "Create Label" vs "Create Product"
- If "Create Product" mode:
  - Show product creation form
  - Save to `products` table
  - Optionally proceed to label creation

#### 4.2 Dynamic Category Creation
**Feature**: Create category on-the-fly

**Implementation**:
```typescript
<Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
  <PopoverTrigger asChild>
    <Button variant="outline" role="combobox">
      {selectedCategory?.name || "Select category..."}
    </Button>
  </PopoverTrigger>
  <PopoverContent>
    <Command>
      <CommandInput 
        placeholder="Search or create category..."
        onValueChange={handleCategorySearch}
      />
      <CommandEmpty>
        <Button 
          variant="ghost" 
          className="w-full"
          onClick={() => handleCreateCategory(searchTerm)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create "{searchTerm}"
        </Button>
      </CommandEmpty>
      <CommandGroup>
        {categories.map(cat => (
          <CommandItem 
            key={cat.id} 
            value={cat.name}
            onSelect={() => setSelectedCategory(cat)}
          >
            {cat.name}
          </CommandItem>
        ))}
      </CommandGroup>
    </Command>
  </PopoverContent>
</Popover>
```

**Create Category Function**:
```typescript
const handleCreateCategory = async (name: string) => {
  // Show confirmation dialog
  const confirmed = await showConfirmDialog({
    title: "Create New Category?",
    description: `Are you sure you want to create "${name}" category?`,
  });

  if (!confirmed) return;

  // Clean the name
  const cleanName = name.trim();

  const { data, error } = await supabase
    .from('label_categories')
    .insert({ 
      name: cleanName, 
      organization_id: currentUser.organization_id 
    })
    .select()
    .single();

  // Handle duplicate constraint violation
  if (error?.code === '23505') {
    toast.info(`Category "${cleanName}" already exists!`);
    
    // Fetch existing category
    const { data: existing } = await supabase
      .from('label_categories')
      .select()
      .eq('name', cleanName)
      .eq('organization_id', currentUser.organization_id)
      .single();
    
    if (existing) {
      setCategories([...categories, existing]);
      setSelectedCategory(existing);
      setCategoryOpen(false);
    }
    return;
  }

  if (error) {
    toast.error("Failed to create category");
    return;
  }

  toast.success(`Category "${cleanName}" created!`);
  setCategories([...categories, data]);
  setSelectedCategory(data);
  setCategoryOpen(false);
};
```

#### 4.3 Dynamic Product Creation
**Feature**: Create product on-the-fly

**Similar logic to category creation**:
- User types non-existent product name
- Show "Create '{productName}'" button
- Confirmation dialog with category selection
- Save to database with duplicate handling
- Auto-select new or existing product

```typescript
const handleCreateProduct = async (name: string) => {
  if (!selectedCategory) {
    toast.error("Please select a category first");
    return;
  }

  const confirmed = await showConfirmDialog({
    title: "Create New Product?",
    description: `Create "${name}" in category "${selectedCategory.name}"?`,
  });

  if (!confirmed) return;

  // Clean the name
  const cleanName = name.trim();

  const { data, error } = await supabase
    .from('products')
    .insert({
      name: cleanName,
      category_id: selectedCategory.id,
      organization_id: currentUser.organization_id,
    })
    .select()
    .single();

  // Handle duplicate constraint violation
  if (error?.code === '23505') {
    toast.info(`Product "${cleanName}" already exists!`);
    
    // Fetch existing product
    const { data: existing } = await supabase
      .from('products')
      .select()
      .eq('name', cleanName)
      .eq('organization_id', currentUser.organization_id)
      .single();
    
    if (existing) {
      setProducts([...products, existing]);
      setSelectedProduct(existing);
      setProductOpen(false);
    }
    return;
  }

  if (error) {
    toast.error("Failed to create product");
    return;
  }

  toast.success(`Product "${cleanName}" created!`);
  setProducts([...products, data]);
  setSelectedProduct(data);
  setProductOpen(false);
};
```

#### 4.4 Unit Selection as Listbox
**Convert Unit input to Combobox**:

```typescript
const measuringUnits = ['kg', 'g', 'L', 'mL', 'pcs', 'oz', 'lb', 'gal'];

<Popover open={unitOpen} onOpenChange={setUnitOpen}>
  <PopoverTrigger asChild>
    <Button variant="outline" role="combobox">
      {unit || "Select unit..."}
    </Button>
  </PopoverTrigger>
  <PopoverContent>
    <Command>
      <CommandInput placeholder="Search unit..." />
      <CommandGroup>
        {measuringUnits.map(u => (
          <CommandItem 
            key={u} 
            value={u}
            onSelect={() => {
              setUnit(u);
              setUnitOpen(false);
            }}
          >
            {u}
          </CommandItem>
        ))}
      </CommandGroup>
    </Command>
  </PopoverContent>
</Popover>
```

#### 4.5 Label Preview with QR Code
**Component**: `src/components/labels/LabelPreview.tsx`

**Features**:
- Show real-time preview of label
- Generate QR code using `qrcode.react` or `qr-code-styling`
- QR code contains: Product ID, Prep Date, Expiry Date, Batch Number
- Different layouts for Default and Recipe templates
- Update preview on form changes

**Installation**:
```bash
npm install qrcode.react
npm install --save-dev @types/qrcode.react
```

**Component**:
```typescript
import QRCode from 'qrcode.react';

const LabelPreview = ({ labelData, template }) => {
  const qrData = JSON.stringify({
    productId: labelData.productId,
    prepDate: labelData.prepDate,
    expiryDate: labelData.expiryDate,
    batchNumber: labelData.batchNumber,
  });

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-bold text-lg">{labelData.productName}</h3>
          <p className="text-sm text-gray-600">{labelData.categoryName}</p>
          <div className="mt-2 space-y-1 text-xs">
            <p>Prep: {labelData.prepDate}</p>
            <p>Expiry: {labelData.expiryDate}</p>
            <p>By: {labelData.preparedBy}</p>
            {labelData.quantity && <p>Qty: {labelData.quantity} {labelData.unit}</p>}
          </div>
        </div>
        {(template.name === 'Default' || template.name === 'Recipe') && (
          <div className="ml-4">
            <QRCode 
              value={qrData} 
              size={80} 
              level="M"
              includeMargin
            />
          </div>
        )}
      </div>
      {template.name === 'Recipe' && labelData.notes && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs font-medium">Notes:</p>
          <p className="text-xs text-gray-700">{labelData.notes}</p>
        </div>
      )}
    </div>
  );
};
```

#### 4.6 Save Draft Feature
**Database Table**: `label_drafts`

```sql
CREATE TABLE label_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  draft_name TEXT NOT NULL,
  product_id UUID REFERENCES products(id),
  category_id UUID REFERENCES label_categories(id),
  template_id UUID REFERENCES label_templates(id),
  prep_date DATE,
  expiry_date DATE,
  condition TEXT,
  quantity TEXT,
  unit TEXT,
  batch_number TEXT,
  notes TEXT,
  form_data JSONB NOT NULL, -- Store entire form state
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE label_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own drafts"
  ON label_drafts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index
CREATE INDEX idx_label_drafts_user ON label_drafts(user_id, created_at DESC);
```

**UI Flow**:
1. **Save Draft Button**: In LabelForm
   - Opens dialog to enter draft name
   - Saves all form data to `label_drafts` table
   - Toast: "Draft saved successfully"

2. **Load Draft Button**: In Labeling Dashboard
   - Shows list of saved drafts
   - Click to load draft into form
   - Restores all fields

3. **Draft Management Dialog**:
   - List all user's drafts
   - Actions: Load, Rename, Delete
   - Show created date
   - Auto-save every 30 seconds (optional)

**Component**: `src/components/labels/DraftManager.tsx`

```typescript
const DraftManager = ({ onLoadDraft }) => {
  const [drafts, setDrafts] = useState([]);
  
  const fetchDrafts = async () => {
    const { data } = await supabase
      .from('label_drafts')
      .select('*')
      .order('updated_at', { ascending: false });
    setDrafts(data);
  };

  const handleLoadDraft = async (draft) => {
    onLoadDraft(draft.form_data);
    toast.success(`Draft "${draft.draft_name}" loaded`);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          Load Draft
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Saved Drafts</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {drafts.map(draft => (
            <div key={draft.id} className="flex items-center justify-between p-2 border rounded">
              <div>
                <p className="font-medium">{draft.draft_name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(draft.updated_at))} ago
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleLoadDraft(draft)}>
                  Load
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDeleteDraft(draft.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

---

## 📊 Implementation Checklist

### Step 1: Print Queue System
- [ ] Create `print_queue` table with RLS policies
- [ ] Add TypeScript types for `PrintQueueItem`
- [ ] Create `PrintQueue.tsx` component
- [ ] Implement drag-and-drop reordering
- [ ] Add bulk actions (Print All, Clear, Delete)
- [ ] Integrate with Zebra printer
- [ ] Add real-time subscriptions
- [ ] Test queue management

### Step 2: Quick Print Enhancement
- [ ] Update `QuickPrintMenu.tsx` component
- [ ] Implement product search with auto-fill
- [ ] Add warning badges and tooltips
- [ ] Create template selector dropdown
- [ ] Fetch last printed label data
- [ ] Add "Add to Queue" vs "Print Now" options
- [ ] Test with existing products

### Step 3: Label Templates - Role-Based Access
- [ ] Create migration for RLS role policies
- [ ] Update `TemplateManagement.tsx` with role checks
- [ ] Add permission messages
- [ ] Add "Create Label" button
- [ ] Test with different user roles
- [ ] Verify managers can edit, others can only view

### Step 4: Enhanced Create Label Menu
- [ ] Add Manager toggle for Product Creation
- [ ] Implement dynamic category creation
- [ ] Add category confirmation dialog
- [ ] Implement dynamic product creation
- [ ] Add product confirmation dialog
- [ ] Convert Unit to Combobox/Listbox
- [ ] Create `LabelPreview.tsx` component
- [ ] Install and integrate QR code library
- [ ] Generate QR codes for Default and Recipe templates
- [ ] Create `label_drafts` table
- [ ] Implement Save Draft functionality
- [ ] Create `DraftManager.tsx` component
- [ ] Add Load Draft feature
- [ ] Test all CRUD operations

---

## 🧪 Testing Scenarios

### Test 1: Print Queue
- Add 5 labels to queue
- Reorder by dragging
- Print all at once
- Verify status updates

### Test 2: Quick Print
- Search existing product
- Verify auto-fill
- Change template
- Print immediately

### Test 3: Role-Based Templates
- Login as regular user → Verify read-only
- Login as manager → Verify can edit
- Test policy enforcement

### Test 4: Dynamic Creation
- Type new category → Create it
- Type new product → Create it
- Verify confirmations work

### Test 5: Label Preview
- Fill form → Check preview updates
- Verify QR code appears
- Test different templates

### Test 6: Draft Management
- Save draft mid-form
- Load draft → Verify all fields restored
- Delete draft

---

## 📦 Required Dependencies

```json
{
  "dependencies": {
    "qrcode.react": "^4.0.1",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "@types/qrcode.react": "^1.0.5"
  }
}
```

---

## 🚀 Deployment Notes

1. **Database Migrations**: Apply in order
   - Print queue table
   - Label drafts table
   - Updated RLS policies

2. **Environment Variables**: None new required

3. **Testing**: Run all 6 test scenarios before production

4. **Rollback Plan**: Keep old `LabelForm.tsx` as backup

---

## 📝 Success Criteria

- ✅ Print queue shows all pending labels
- ✅ Quick print auto-fills from database
- ✅ Only managers can edit templates
- ✅ Users can create categories/products on-the-fly
- ✅ QR codes appear in previews
- ✅ Drafts save and load correctly
- ✅ No TypeScript errors
- ✅ All RLS policies enforced
- ✅ Responsive UI on mobile

---

**Estimated Time**: 8-12 hours
**Priority**: High
**Dependencies**: Phase 1 complete
