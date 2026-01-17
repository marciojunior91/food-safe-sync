# 🖨️ Tampa APP - Complete Printing Workflows Documentation

**Version:** 3.0  
**Date:** January 8, 2026  
**Status:** ✅ Production Ready (3 workflows) | 🚧 4th workflow pending

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Workflow 1: Quick Print (Direct from Grid)](#workflow-1-quick-print-direct-from-grid)
3. [Workflow 2: Add to Print Queue](#workflow-2-add-to-print-queue)
4. [Workflow 3: Full Label Form](#workflow-3-full-label-form)
5. [Common Components](#common-components)
6. [Data Flow Architecture](#data-flow-architecture)
7. [Issues & Recommendations](#issues--recommendations)
8. [Testing Checklist](#testing-checklist)

---

## 📖 Overview

The Tampa APP Label Printing system provides **3 distinct workflows** for creating and printing food safety labels, each optimized for different use cases:

| Workflow | Speed | Customization | Use Case |
|----------|-------|---------------|----------|
| **1. Quick Print** | ⚡ Fastest | ⚙️ Minimal | Quick labels with default settings |
| **2. Add to Queue** | ⚡⚡ Fast | ⚙️⚙️ Moderate | Batch printing for multiple items |
| **3. Full Form** | ⚡⚡⚡ Slower | ⚙️⚙️⚙️ Maximum | Complex labels with allergens |

### Core Requirements (All Workflows)

✅ **Team Member Selection** - Required for food safety compliance  
✅ **Date Tracking** - Prep date and expiry date  
✅ **Database Persistence** - All labels saved to `printed_labels` table  
✅ **Multi-Format Support** - Generic PDF, Zebra ZPL, Thermal printers  

---

## 🎯 Workflow 1: Quick Print (Direct from Grid)

### Description
**Fastest printing method** - Click a product and print immediately with sensible defaults. Ideal for high-volume kitchens where speed is critical.

### User Journey

```
┌─────────────────────┐
│ 1. User clicks      │
│    product in grid  │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ 2. Details dialog   │
│    opens (optional) │
│    • Quantity       │
│    • Unit           │
│    • Condition      │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ 3. User Selection   │
│    Dialog appears   │
│    • Pick team      │
│      member         │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ 4. Label prints     │
│    immediately      │
│    • Saved to DB    │
│    • Sent to        │
│      printer        │
└─────────────────────┘
```

### Step-by-Step Flow

#### Step 1: Product Selection
**Trigger:** User clicks product card in Quick Print Grid  
**Location:** `src/pages/Labeling.tsx` → `QuickPrintGrid` component  
**Handler:** `handleQuickPrintFromGrid(product)`

```typescript
const handleQuickPrintFromGrid = async (product: any) => {
  setPendingQuickPrint(product);
  setQuickPrintDetailsOpen(true); // Shows quantity/unit/condition dialog
};
```

#### Step 2: Details Dialog (Optional - Can Be Skipped)
**Component:** `QuickPrintDetailsDialog`  
**Fields:**
- **Quantity** (default: "1")
- **Unit** (default: from product.measuring_units)
- **Condition** (default: "REFRIGERATED")

**Actions:**
- ✅ **Confirm** → Opens User Selection Dialog
- ❌ **Skip** → Uses defaults, opens User Selection Dialog

#### Step 3: Team Member Selection
**Component:** `UserSelectionDialog`  
**Location:** `src/components/labels/UserSelectionDialog.tsx`

**Data Fetched:**
```sql
SELECT * FROM team_members 
WHERE organization_id = :org_id 
  AND status = 'active'
ORDER BY display_name
```

**User Sees:**
- Team member name (e.g., "LUCIANA RODRIGUES")
- Role type (e.g., "Head Chef")
- Photo (if available)

**Selection Logic:**
```typescript
const handleUserSelected = (selectedUserData: TeamMember) => {
  setSelectedUser(selectedUserData);
  setUserDialogOpen(false);
  
  if (pendingQuickPrint) {
    executeQuickPrint(pendingQuickPrint, selectedUserData, details);
  }
};
```

#### Step 4: Execute Quick Print
**Function:** `executeQuickPrint(product, selectedUserData, details)`  
**Location:** `src/pages/Labeling.tsx` (line ~255)

**Process:**

1. **Resolve User ID** (with fallback)
```typescript
let userId: string;
if (selectedUserData.auth_role_id) {
  userId = selectedUserData.auth_role_id;
} else {
  // Fallback to logged-in user
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  userId = currentUser.id;
  console.warn(`Team member not linked, using fallback`);
}
```

2. **Calculate Dates**
```typescript
const now = new Date();
const prepDate = now.toISOString().split('T')[0]; // Today
const expiryDateObj = new Date(now);
expiryDateObj.setDate(now.getDate() + 3); // +3 days
const expiryDate = expiryDateObj.toISOString().split('T')[0];
```

3. **Fetch Product Allergens**
```typescript
const { data: allergenData } = await supabase
  .from("product_allergens")
  .select(`allergen_id, allergens(id, name, icon, severity)`)
  .eq("product_id", product.id);

const productAllergens = (allergenData || [])
  .map((pa: any) => pa.allergens)
  .filter(Boolean);
```

4. **Create Label Data Object**
```typescript
const labelData = {
  productId: product.id,
  productName: product.name,
  categoryId: product.label_categories?.id || null,
  categoryName: product.label_categories?.name || "Quick Print",
  preparedBy: userId, // auth_role_id or fallback
  preparedByName: selectedUserData.display_name,
  prepDate: prepDate,
  expiryDate: expiryDate,
  condition: details?.condition || "REFRIGERATED",
  quantity: details?.quantity || "1",
  unit: details?.unit || product.measuring_units?.abbreviation || "Unit",
  batchNumber: "",
  allergens: productAllergens,
  organizationId: organizationId, // Required for RLS
};
```

5. **Save to Database**
```typescript
await saveLabelToDatabase(labelData);
```

6. **Print Label**
```typescript
const success = await print({
  productName: product.name,
  categoryName: product.label_categories?.name || "Quick Print",
  preparedDate: prepDate,
  useByDate: expiryDate,
  preparedByName: selectedUserData.display_name,
  allergens: productAllergens.map((a: any) => a.name),
  storageInstructions: details?.condition || "REFRIGERATED",
  quantity: details?.quantity || "1",
  unit: details?.unit || product.measuring_units?.abbreviation || "Unit",
  condition: details?.condition || "REFRIGERATED",
});
```

7. **Show Success Toast**
```typescript
toast({
  title: "Label Sent to Printer",
  description: `Printing label for ${product.name} prepared by ${selectedUserData.display_name}`,
});
```

### Files Involved

| File | Role | Lines |
|------|------|-------|
| `src/pages/Labeling.tsx` | Main orchestration | ~200-400 |
| `src/components/labels/QuickPrintGrid.tsx` | Product grid display | Full file |
| `src/components/labels/QuickPrintDetailsDialog.tsx` | Optional details | Full file |
| `src/components/labels/UserSelectionDialog.tsx` | Team member picker | Full file |
| `src/hooks/usePrinter.ts` | Unified print function | Full file |
| `src/lib/printers/PrinterFactory.ts` | Printer selection logic | Full file |

### Default Values

```json
{
  "quantity": "1",
  "unit": "<from product.measuring_units.abbreviation>",
  "condition": "REFRIGERATED",
  "prepDate": "<today>",
  "expiryDate": "<today + 3 days>",
  "batchNumber": ""
}
```

### Pros & Cons

✅ **Advantages:**
- ⚡ Fastest workflow (2-3 clicks)
- 🎯 Perfect for repetitive tasks
- 📊 Default values cover 80% of use cases
- 🔄 Can customize via details dialog

❌ **Limitations:**
- ⚠️ Cannot set allergens (uses product defaults)
- ⚠️ Limited condition options
- ⚠️ Cannot edit dates directly
- ⚠️ No batch number support

---

## 🗂️ Workflow 2: Add to Print Queue

### Description
**Batch printing workflow** - Add multiple items to a queue, then print all at once. Ideal for prep sessions where many labels are needed.

### User Journey

```
┌─────────────────────┐
│ 1. User clicks      │
│    "Add to Queue"   │
│    button           │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ 2. Quick Add Dialog │
│    • Team member    │
│    • Quantity       │
│    • Defaults shown │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ 3. Item added to    │
│    queue (repeat    │
│    for more items)  │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ 4. Navigate to      │
│    Print Queue page │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ 5. Review queue     │
│    • Edit items     │
│    • Reorder        │
│    • Delete         │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ 6. Click "Print     │
│    All" button      │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ 7. ALL items print  │
│    sequentially     │
└─────────────────────┘
```

### Step-by-Step Flow

#### Step 1: Trigger Add to Queue
**Location:** Product card in any product list/grid  
**Button:** "Add to Queue" icon button  
**Handler:** `handleAddToQueue(product)`

```typescript
const handleAddToQueue = (product: any) => {
  setSelectedProductForQueue(product);
  setShowQuickAddDialog(true);
};
```

#### Step 2: Quick Add Dialog
**Component:** `QuickAddToQueueDialog`  
**Location:** `src/components/labels/QuickAddToQueueDialog.tsx`

**Fields:**

1. **Product Info** (Read-only)
   - Product name
   - Category

2. **Team Member Selection** (Required) 🚨
   ```typescript
   const [selectedUserId, setSelectedUserId] = useState<string>("");
   const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
   
   // Fetch team members on dialog open
   useEffect(() => {
     if (open) {
       fetchTeamMembers();
     }
   }, [open]);
   
   const fetchTeamMembers = async () => {
     const { data } = await supabase
       .from('team_members')
       .select('*')
       .order('display_name');
     setTeamMembers(data || []);
   };
   ```

3. **Quantity Selector**
   - Min: 1
   - Max: 100
   - Default: 1
   - Controls: `-` button, input field, `+` button

4. **Default Values Display** (Info box)
   - Prep Date: Today
   - Expiry Date: Tomorrow
   - Condition: Fresh
   - ⚠️ Warning: "Edit dates in queue before printing if needed"

**Add Action:**
```typescript
const handleAdd = () => {
  const selectedMember = teamMembers.find(m => m.id === selectedUserId);
  const preparedBy = selectedMember?.auth_role_id || user?.id || "";
  const preparedByName = selectedMember?.display_name || user?.email || "Unknown";

  const labelData: LabelData = {
    categoryId: product.category_id || product.label_categories?.id || "",
    categoryName: product.label_categories?.name || "Uncategorized",
    productId: product.id,
    productName: product.name,
    condition: "Fresh",
    preparedBy,
    preparedByName,
    prepDate: today,
    expiryDate: tomorrow,
    quantity: quantity.toString(),
    unit: product.measuring_units?.abbreviation || "units",
    batchNumber: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };

  addToQueue(labelData, quantity);
  onOpenChange(false);
};
```

#### Step 3: Add to Queue (Backend)
**Hook:** `usePrintQueue`  
**Location:** `src/hooks/usePrintQueue.ts`  
**Function:** `addToQueue(labelData, count)`

```typescript
const addToQueue = useCallback(async (labelData: LabelData, count: number = 1) => {
  for (let i = 0; i < count; i++) {
    const queueItem: Omit<PrintQueueItem, 'id' | 'created_at' | 'updated_at'> = {
      product_id: labelData.productId,
      category_id: labelData.categoryId,
      template_id: null,
      user_id: user?.id || '',
      prepared_by_name: labelData.preparedByName,
      prep_date: labelData.prepDate,
      expiry_date: labelData.expiryDate,
      condition: labelData.condition,
      quantity: labelData.quantity,
      unit: labelData.unit,
      batch_number: labelData.batchNumber || '',
      notes: '',
      status: 'pending',
      priority: 0,
    };

    const { error } = await supabase
      .from('print_queue')
      .insert(queueItem);

    if (error) throw error;
  }

  toast({ title: "Added to Queue", description: `${count} label(s) added` });
  fetchQueue(); // Refresh queue display
}, [user]);
```

#### Step 4: Navigate to Print Queue Page
**Route:** `/labeling/print-queue` (or via Shopping module)  
**Component:** `PrintQueue`  
**Location:** `src/components/labels/PrintQueue.tsx`

#### Step 5: Review & Edit Queue
**Component:** `PrintQueue` (main view)

**Features:**

1. **View All Items**
   ```typescript
   const fetchQueue = async () => {
     const { data: { user } } = await supabase.auth.getUser();
     const { data } = await supabase
       .from("print_queue")
       .select(`*, product:products(name, category:label_categories(name))`)
       .eq("user_id", user.id)
       .order("priority", { ascending: false })
       .order("created_at", { ascending: true });
     setQueueItems(data || []);
   };
   ```

2. **Edit Individual Item**
   - Update priority
   - Change dates
   - Modify quantity/unit
   - Update condition
   - Add notes

3. **Reorder Items** (Drag & Drop)
   ```typescript
   const handleReorder = async (startIndex: number, endIndex: number) => {
     const newItems = Array.from(queueItems);
     const [removed] = newItems.splice(startIndex, 1);
     newItems.splice(endIndex, 0, removed);
     
     // Update priorities in database
     const updates = newItems.map((item, index) => ({
       id: item.id,
       priority: newItems.length - index
     }));
     
     setQueueItems(newItems);
     await updatePrioritiesInDatabase(updates);
   };
   ```

4. **Delete Items**
   ```typescript
   const handleDelete = async (id: string) => {
     await supabase.from("print_queue").delete().eq("id", id);
     toast({ title: "Item Removed" });
   };
   ```

#### Step 6: Print All
**Button:** "Print All" in PrintQueue header  
**Handler:** `handlePrintAll()`

```typescript
const handlePrintAll = async () => {
  const pendingItems = queueItems.filter(item => item.status === "pending");
  
  for (const item of pendingItems) {
    await handlePrintSingle(item.id);
    await new Promise(resolve => setTimeout(resolve, 500)); // Delay between prints
  }
};
```

**Per-Item Print:**
```typescript
const handlePrintSingle = async (id: string) => {
  const item = queueItems.find(i => i.id === id);
  
  // 1. Update status to "printing"
  await supabase.from("print_queue")
    .update({ status: "printing" })
    .eq("id", id);

  // 2. Print label
  const success = await print({
    productId: item.product_id,
    productName: item.product?.name,
    categoryId: item.category_id,
    categoryName: item.product?.category?.name,
    preparedDate: item.prep_date,
    useByDate: item.expiry_date,
    preparedBy: item.user_id,
    condition: item.condition,
    quantity: item.quantity,
    unit: item.unit,
    batchNumber: item.batch_number,
  });

  // 3. Update status to "completed" or "failed"
  await supabase.from("print_queue")
    .update({ status: success ? "completed" : "failed" })
    .eq("id", id);

  // 4. Auto-remove completed items after 2 seconds
  if (success) {
    setTimeout(() => handleDelete(id), 2000);
  }
};
```

### Files Involved

| File | Role | Lines |
|------|------|-------|
| `src/components/labels/QuickAddToQueueDialog.tsx` | Add to queue dialog | 1-255 |
| `src/components/labels/PrintQueue.tsx` | Queue management UI | Full file |
| `src/hooks/usePrintQueue.ts` | Queue operations hook | Full file |
| `src/hooks/usePrinter.ts` | Print execution | Full file |

### Default Values

```json
{
  "quantity": "1",
  "unit": "<from product>",
  "condition": "Fresh",
  "prepDate": "<today>",
  "expiryDate": "<tomorrow>",
  "batchNumber": "<auto-generated>",
  "status": "pending",
  "priority": 0
}
```

### Pros & Cons

✅ **Advantages:**
- 📦 Perfect for batch operations
- ✏️ Can edit before printing
- 🔄 Reorderable queue
- 🎯 Review all items before committing
- ⏸️ Can save queue for later

❌ **Limitations:**
- ⚠️ **DUPLICATE TEAM MEMBER SELECTION** 🚨 (See Issues section)
- ⚠️ Cannot set allergens
- ⚠️ Requires navigation to Print Queue page
- ⚠️ More clicks than Quick Print

---

## 📝 Workflow 3: Full Label Form

### Description
**Maximum customization** - Complete control over all label fields including allergens, categories, and advanced options. Best for complex products requiring detailed labels.

### User Journey

```
┌─────────────────────┐
│ 1. User clicks      │
│    "New Label"      │
│    button           │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ 2. User Selection   │
│    Dialog appears   │
│    IMMEDIATELY      │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ 3. Select team      │
│    member           │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ 4. Full form opens  │
│    with team member │
│    PRE-FILLED       │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ 5. User fills ALL   │
│    fields:          │
│    • Category       │
│    • Product        │
│    • Dates          │
│    • Condition      │
│    • Quantity       │
│    • Allergens      │
│    • Notes          │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ 6. User chooses:    │
│    • Save Draft     │
│    • Add to Queue   │
│    • Print Label    │
└─────────────────────┘
```

### Step-by-Step Flow

#### Step 1: Trigger Label Form
**Location:** Labeling page header  
**Button:** "New Label" (large hero button)  
**Handler:** `handleCreateLabel()`

```typescript
const handleCreateLabel = () => {
  setPendingQuickPrint(null); // Indicates form mode (not quick print)
  setUserDialogOpen(true); // Open team member selection
};
```

#### Step 2: Team Member Selection (Pre-Form)
**Component:** `UserSelectionDialog`  
**Timing:** **BEFORE** form opens (important!)  
**Purpose:** Pre-populate `preparedBy` field

```typescript
const handleUserSelected = (selectedUserData: TeamMember) => {
  setSelectedUser(selectedUserData);
  setUserDialogOpen(false);
  
  if (pendingQuickPrint) {
    // Quick Print flow
    executeQuickPrint(pendingQuickPrint, selectedUserData, details);
  } else {
    // Form flow
    setCurrentView('form'); // Open LabelForm with selectedUser
  }
};
```

#### Step 3: Label Form Opens
**Component:** `LabelForm`  
**Location:** `src/components/labels/LabelForm.tsx`  
**Props:**
```typescript
<LabelForm
  onSave={handleSaveLabel}
  onPrint={handlePrintLabel}
  onCancel={handleCancelForm}
  selectedUser={selectedUser || undefined}
/>
```

**Initial State (with pre-filled preparedBy):**
```typescript
const [labelData, setLabelData] = useState({
  categoryId: "",
  categoryName: "",
  subcategoryId: "",
  subcategoryName: "",
  productId: "",
  productName: "",
  condition: "",
  preparedBy: selectedUser?.auth_role_id || "",
  preparedByName: selectedUser?.display_name || "",
  prepDate: today,
  expiryDate: "",
  quantity: "",
  unit: "",
  batchNumber: ""
});
```

**Update when selectedUser changes:**
```typescript
useEffect(() => {
  const updatePreparedBy = async () => {
    if (selectedUser) {
      let userId = selectedUser.auth_role_id;
      
      // Fallback if auth_role_id missing
      if (!userId && user?.id) {
        userId = user.id;
        console.warn(`Team member not linked, using fallback`);
      }
      
      setLabelData(prev => ({
        ...prev,
        preparedBy: userId || "",
        preparedByName: selectedUser.display_name || ""
      }));
    }
  };
  updatePreparedBy();
}, [selectedUser, user]);
```

#### Step 4: Fill Form Fields

**1. Category Selection**
```typescript
<CategorySelector
  value={labelData.categoryId}
  onChange={(categoryId, categoryName) => {
    setLabelData(prev => ({
      ...prev,
      categoryId,
      categoryName
    }));
  }}
/>
```

**2. Product Selection**
```typescript
<ProductSelector
  categoryId={labelData.categoryId}
  value={labelData.productId}
  onChange={(productId, productName, productData) => {
    setLabelData(prev => ({
      ...prev,
      productId,
      productName,
      unit: productData.measuring_units?.abbreviation || prev.unit
    }));
  }}
/>
```

**3. Dates**
```typescript
<DatePicker
  label="Prep Date"
  value={labelData.prepDate}
  onChange={(date) => setLabelData(prev => ({ ...prev, prepDate: date }))}
/>

<DatePicker
  label="Expiry Date"
  value={labelData.expiryDate}
  onChange={(date) => setLabelData(prev => ({ ...prev, expiryDate: date }))}
/>
```

**4. Condition**
```typescript
<Select
  value={labelData.condition}
  onChange={(condition) => setLabelData(prev => ({ ...prev, condition }))}
>
  <SelectItem value="Fresh">Fresh</SelectItem>
  <SelectItem value="Cooked">Cooked</SelectItem>
  <SelectItem value="Frozen">Frozen</SelectItem>
  <SelectItem value="Refrigerated">Refrigerated</SelectItem>
  <SelectItem value="Thawed">Thawed</SelectItem>
</Select>
```

**5. Quantity & Unit**
```typescript
<Input
  type="number"
  value={labelData.quantity}
  onChange={(e) => setLabelData(prev => ({ ...prev, quantity: e.target.value }))}
/>

<Input
  value={labelData.unit}
  onChange={(e) => setLabelData(prev => ({ ...prev, unit: e.target.value }))}
/>
```

**6. Allergens** (Advanced)
```typescript
<AllergenSelectorEnhanced
  selectedAllergenIds={selectedAllergenIds}
  onChange={setSelectedAllergenIds}
  productId={labelData.productId}
/>
```

**7. Batch Number** (Optional)
```typescript
<Input
  value={labelData.batchNumber}
  onChange={(e) => setLabelData(prev => ({ ...prev, batchNumber: e.target.value }))}
  placeholder="Optional batch/lot number"
/>
```

#### Step 5: Preview (Optional)
**Feature:** Real-time canvas preview  
**Formats:** Generic, PDF, Zebra ZPL  
**Toggle:** Show/Hide button  
**Zoom:** 50%, 75%, 100%, 125%, 150%

```typescript
<LabelPreview
  labelData={labelData}
  format={previewFormat}
  zoom={previewZoom}
  visible={showPreview}
/>
```

#### Step 6: Actions

**Option A: Save Draft**
```typescript
const handleSaveLabel = (data: LabelData) => {
  toast({
    title: "Label Saved",
    description: "Your label has been saved as a draft.",
  });
  setCurrentView('overview');
};
```

**Option B: Add to Queue**
```typescript
const handleAddToQueue = async (data: LabelData) => {
  await addToQueue(data, 1);
  toast({ title: "Added to Queue" });
  setCurrentView('overview');
};
```

**Option C: Print Label**
```typescript
const handlePrintLabel = async (data: LabelData) => {
  // 1. Fetch allergens
  const { data: allergenData } = await supabase
    .from("product_allergens")
    .select(`allergen_id, allergens(id, name, icon, severity)`)
    .eq("product_id", data.productId);
  
  const productAllergens = (allergenData || [])
    .map((pa: any) => pa.allergens)
    .filter(Boolean);
  
  // 2. Save to database
  await saveLabelToDatabase({
    productId: data.productId,
    productName: data.productName,
    categoryId: data.categoryId,
    categoryName: data.categoryName,
    preparedBy: data.preparedBy,
    preparedByName: data.preparedByName,
    prepDate: data.prepDate,
    expiryDate: data.expiryDate,
    condition: data.condition,
    quantity: data.quantity,
    unit: data.unit,
    batchNumber: data.batchNumber,
    allergens: productAllergens,
    organizationId: organizationId,
  });

  // 3. Print
  const success = await print({
    productName: data.productName,
    categoryName: data.categoryName,
    subcategoryName: data.subcategoryName,
    preparedDate: data.prepDate,
    useByDate: data.expiryDate,
    preparedByName: data.preparedByName,
    allergens: productAllergens.map(a => a.name),
    storageInstructions: `Condition: ${data.condition}`,
    barcode: data.batchNumber,
    quantity: data.quantity,
    unit: data.unit,
    condition: data.condition,
  });

  if (success) {
    toast({
      title: "Label Printed Successfully",
      description: `Label for ${data.productName} sent to printer and saved to history.`,
    });
    setCurrentView('overview');
  }
};
```

### Files Involved

| File | Role | Lines |
|------|------|-------|
| `src/components/labels/LabelForm.tsx` | Main form component | Full file (~800 lines) |
| `src/components/labels/UserSelectionDialog.tsx` | Pre-form team member selection | Full file |
| `src/components/labels/CategorySelector.tsx` | Category dropdown | Full file |
| `src/components/labels/ProductSelector.tsx` | Product dropdown | Full file |
| `src/components/labels/AllergenSelectorEnhanced.tsx` | Allergen multi-select | Full file |
| `src/pages/Labeling.tsx` | Orchestration | ~400-500 |
| `src/hooks/usePrinter.ts` | Print execution | Full file |

### Default Values

```json
{
  "prepDate": "<today>",
  "preparedBy": "<from selectedUser.auth_role_id>",
  "preparedByName": "<from selectedUser.display_name>",
  "condition": "",
  "quantity": "",
  "unit": "<from product when selected>",
  "expiryDate": "",
  "batchNumber": ""
}
```

### Pros & Cons

✅ **Advantages:**
- 🎯 **Complete control** over all fields
- 🥜 **Allergen management** included
- 📝 **Draft system** - save and continue later
- 🔍 **Real-time preview** with multiple formats
- ✏️ **Batch number** support
- 📅 **Custom dates** with calendar picker
- 🎨 **Multiple condition options**

❌ **Limitations:**
- ⏱️ **Slower** than Quick Print (5-10 clicks)
- 🧠 **More complex** - requires training
- 📱 **Less mobile-friendly** - many fields

---

## 🔧 Common Components

### UserSelectionDialog

**Location:** `src/components/labels/UserSelectionDialog.tsx`  
**Used By:** All 3 workflows  
**Purpose:** Select which team member prepared the food

**Features:**
- Search/filter by name, role, email
- Displays team member photo
- Shows role type (Head Chef, Line Cook, etc.)
- Real-time filtering
- Touch-friendly for tablet use

**Data Source:**
```sql
SELECT * FROM team_members
WHERE organization_id = :org_id
  AND status = 'active'
ORDER BY display_name
```

**Returns:**
```typescript
interface TeamMember {
  id: string;                    // team_member_id (UUID)
  auth_role_id: string | null;   // Links to auth.users(id) - for DB foreign key
  display_name: string;           // "LUCIANA RODRIGUES"
  role_type: string;              // "Head Chef", "Line Cook", etc.
  email: string | null;
  photo_url: string | null;
  organization_id: string;
  status: 'active' | 'inactive';
}
```

**Critical Logic - User ID Resolution:**
```typescript
// Priority 1: Use auth_role_id (preferred)
if (selectedUserData.auth_role_id) {
  userId = selectedUserData.auth_role_id;
}
// Priority 2: Fallback to logged-in user
else {
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  userId = currentUser.id;
  console.warn(`Team member not linked, using fallback`);
}
```

**Why Two IDs?**
- `team_member.id` - Internal ID for team member record
- `team_member.auth_role_id` - Links to `auth.users(id)` for database foreign keys
- `printed_labels.prepared_by` **MUST** reference `auth.users(id)` (foreign key constraint)

---

### Unified Print System

**Hook:** `usePrinter()`  
**Location:** `src/hooks/usePrinter.ts`

**Architecture:**
```
usePrinter() 
  ↓
PrinterFactory.getPrinter(selectedPrinter)
  ↓
┌─────────────┬──────────────┬──────────────┐
│ GenericPDF  │ ZebraPrinter │ ThermalPrint │
│ Printer     │              │              │
└─────────────┴──────────────┴──────────────┘
```

**Usage:**
```typescript
const { print, selectedPrinter, availablePrinters } = usePrinter();

await print({
  productName: "Grilled Chicken",
  categoryName: "Proteins",
  preparedDate: "2026-01-08",
  useByDate: "2026-01-11",
  preparedByName: "LUCIANA RODRIGUES",
  allergens: ["Soy", "Gluten"],
  condition: "Refrigerated",
  quantity: "2",
  unit: "kg"
});
```

**Printer Selection:**
- Stored in localStorage: `selectedPrinter`
- Options: "generic", "pdf", "zebra"
- Changeable in settings

---

## 📊 Data Flow Architecture

### Database Schema

**`printed_labels` table** (Primary storage)
```sql
CREATE TABLE printed_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Product info
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  category_id UUID REFERENCES label_categories(id),
  category_name TEXT,
  
  -- User info (CRITICAL)
  prepared_by UUID REFERENCES auth.users(id) NOT NULL,  -- Foreign key to auth.users
  prepared_by_name TEXT NOT NULL,                        -- Display name for label
  
  -- Dates
  prep_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  
  -- Label details
  condition TEXT NOT NULL,
  quantity TEXT,
  unit TEXT,
  batch_number TEXT,
  
  -- Allergens
  allergens TEXT[],  -- Array of allergen names
  
  -- Organization (RLS)
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**`print_queue` table** (Temporary queue)
```sql
CREATE TABLE print_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Product references
  product_id UUID REFERENCES products(id),
  category_id UUID REFERENCES label_categories(id),
  template_id UUID REFERENCES label_templates(id),
  
  -- User info
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  prepared_by_name TEXT NOT NULL,
  
  -- Label details
  prep_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  condition TEXT NOT NULL,
  quantity TEXT,
  unit TEXT,
  batch_number TEXT,
  notes TEXT,
  allergens TEXT[],
  
  -- Queue management
  status TEXT DEFAULT 'pending',  -- pending, printing, completed, failed
  priority INTEGER DEFAULT 0,
  
  -- Organization (RLS)
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Data Flow Diagram

```
┌──────────────────────────────────────────────┐
│           USER INTERACTION LAYER             │
│  (QuickPrint | AddToQueue | LabelForm)       │
└────────────────┬─────────────────────────────┘
                 ↓
┌──────────────────────────────────────────────┐
│      UserSelectionDialog Component           │
│  • Fetches active team_members               │
│  • Returns selected TeamMember object        │
└────────────────┬─────────────────────────────┘
                 ↓
┌──────────────────────────────────────────────┐
│        USER ID RESOLUTION LOGIC              │
│  IF team_member.auth_role_id EXISTS:         │
│    userId = auth_role_id ✅                   │
│  ELSE:                                       │
│    userId = current_logged_in_user.id ⚠️      │
└────────────────┬─────────────────────────────┘
                 ↓
┌──────────────────────────────────────────────┐
│         LABEL DATA CONSTRUCTION              │
│  labelData = {                               │
│    preparedBy: userId (UUID),                │
│    preparedByName: team_member.display_name, │
│    ... other fields                          │
│  }                                           │
└────────────────┬─────────────────────────────┘
                 ↓
         ┌───────┴────────┐
         ↓                ↓
┌─────────────────┐  ┌──────────────────┐
│   print_queue   │  │ printed_labels   │
│   (temporary)   │  │   (permanent)    │
└─────────────────┘  └──────────────────┘
         ↓
┌──────────────────────────────────────────────┐
│           usePrinter() Hook                  │
│  • Calls PrinterFactory                      │
│  • Selects printer type                      │
│  • Formats label data                        │
└────────────────┬─────────────────────────────┘
                 ↓
┌──────────────────────────────────────────────┐
│          PrinterFactory                      │
│  • getPrinter(type)                          │
│  • Returns printer instance                  │
└────────────────┬─────────────────────────────┘
                 ↓
      ┌──────────┴──────────┬───────────┐
      ↓                     ↓           ↓
┌─────────────┐  ┌──────────────┐  ┌──────────┐
│ GenericPDF  │  │ ZebraPrinter │  │ Thermal  │
│  Printer    │  │              │  │  Printer │
└─────────────┘  └──────────────┘  └──────────┘
      ↓                     ↓           ↓
┌──────────────────────────────────────────────┐
│            PHYSICAL PRINTER                  │
│  • Network printer                           │
│  • USB printer                               │
│  • PDF generator                             │
└──────────────────────────────────────────────┘
```

---

## ⚠️ Issues & Recommendations

### 🚨 Critical Issue: Duplicate Team Member Selection in Workflow 2

**Problem:** In "Add to Print Queue" workflow, team member is selected **TWICE**:

1. **First Selection:** In `QuickAddToQueueDialog` (lines 56-89)
   - Dialog has its own team member selector
   - User selects team member
   - Team member stored in queue item

2. **Second Selection:** When printing from `PrintQueue` page
   - Currently not implemented, but should be added
   - **Risk:** User might forget who they selected initially

**Current Code (QuickAddToQueueDialog.tsx):**
```typescript
// Line 56-89: Team member selection in Add to Queue dialog
const [selectedUserId, setSelectedUserId] = useState<string>("");
const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

useEffect(() => {
  if (open) {
    fetchTeamMembers(); // Fetches team members every time dialog opens
  }
}, [open]);
```

**Recommendation:**

**Option A: Keep Single Selection (Preferred)** ✅
- Remove team member selector from `QuickAddToQueueDialog`
- Add team member selection when printing from queue
- Pros: Consistent with Quick Print workflow, clearer UX
- Cons: Requires refactoring

**Option B: Pre-fill from Queue** ⚙️
- Keep team member in `QuickAddToQueueDialog`
- Use `prepared_by_name` from queue item when printing
- Pros: No refactoring needed
- Cons: User can't change team member later

**Proposed Fix (Option A):**

1. **Remove from QuickAddToQueueDialog:**
```typescript
// Remove these sections:
- Team member state
- fetchTeamMembers()
- Team member selector UI
```

2. **Add to PrintQueue:**
```typescript
const handlePrintAll = async () => {
  setUserDialogOpen(true); // Show user selection dialog FIRST
};

const handleUserSelected = async (selectedUserData: TeamMember) => {
  setUserDialogOpen(false);
  await printAllWithUser(selectedUserData); // Pass to print function
};
```

---

### ⚠️ Issue: Inconsistent Default Expiry Dates

**Problem:** Different workflows use different expiry date defaults:

| Workflow | Default Expiry |
|----------|----------------|
| Quick Print | Today + 3 days |
| Add to Queue | Tomorrow (Today + 1 day) |
| Label Form | User must set manually |

**Recommendation:**
Standardize to **Today + 3 days** (food safety best practice) or make configurable per organization.

**Proposed Fix:**
```typescript
// src/utils/dateHelpers.ts
export const getDefaultExpiryDate = (prepDate: string, productType?: string): string => {
  const prep = new Date(prepDate);
  
  // Organization-configurable default (stored in settings)
  const defaultDays = getOrganizationSetting('default_expiry_days') || 3;
  
  // Product-specific override (if needed)
  const daysToAdd = productType === 'dairy' ? 2 : defaultDays;
  
  prep.setDate(prep.getDate() + daysToAdd);
  return prep.toISOString().split('T')[0];
};
```

---

### ⚠️ Issue: Missing Allergen Support in Quick Print

**Problem:** Quick Print uses product's default allergens but doesn't allow adding temporary allergens (e.g., "Prepared in facility with peanuts").

**Recommendation:**
Add optional "Quick Allergen Warning" checkbox in `QuickPrintDetailsDialog`.

**Proposed Fix:**
```typescript
// Add to QuickPrintDetailsDialog
<div className="space-y-2">
  <Label>Additional Allergen Warnings (Optional)</Label>
  <div className="space-y-1">
    <Checkbox
      checked={additionalAllergens.includes('Contains nuts')}
      onCheckedChange={(checked) => {
        if (checked) addAllergen('Contains nuts');
        else removeAllergen('Contains nuts');
      }}
    />
    <span className="text-sm ml-2">Contains nuts</span>
  </div>
  {/* Add more common allergen warnings */}
</div>
```

---

### 💡 Enhancement Opportunity: Batch Number Auto-Generation

**Current State:** Batch numbers are either:
- Empty (most Quick Prints)
- Auto-generated timestamp (Add to Queue)
- User-entered (Label Form)

**Recommendation:**
Implement smart batch number generation based on organization rules.

**Proposed Implementation:**
```typescript
// src/utils/batchNumberGenerator.ts
export const generateBatchNumber = (
  product: Product,
  prepDate: string,
  organizationId: string
): string => {
  const org = getOrganizationSettings(organizationId);
  
  switch (org.batch_number_format) {
    case 'date-product':
      // Format: 20260108-CHICKEN-001
      return `${prepDate.replace(/-/g, '')}-${product.name.substring(0, 10).toUpperCase()}-${getSequentialNumber()}`;
    
    case 'simple-sequential':
      // Format: BATCH-00123
      return `BATCH-${getSequentialNumber().padStart(5, '0')}`;
    
    case 'timestamp':
      // Format: 1704729600-a3b4c5
      return `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    
    default:
      return '';
  }
};
```

---

## ✅ Testing Checklist

### Workflow 1: Quick Print

- [ ] Click product in Quick Print Grid
- [ ] Confirm Details Dialog opens with correct defaults
- [ ] Test quantity increase/decrease buttons
- [ ] Test condition dropdown (all 5 options)
- [ ] Click "Print" button
- [ ] Verify UserSelectionDialog appears
- [ ] Select team member
- [ ] Verify label prints with correct team member name
- [ ] Check `printed_labels` table for saved record
- [ ] Verify `prepared_by` UUID matches `auth.users(id)`
- [ ] Test with team member WITH `auth_role_id`
- [ ] Test with team member WITHOUT `auth_role_id` (fallback)
- [ ] Verify console warning appears for fallback case

### Workflow 2: Add to Print Queue

- [ ] Click "Add to Queue" button on product
- [ ] Verify QuickAddToQueueDialog opens
- [ ] Check team member dropdown is populated
- [ ] Select team member
- [ ] Change quantity to 5
- [ ] Click "Add to Queue"
- [ ] Verify toast "Added to Queue: 5 labels"
- [ ] Navigate to Print Queue page
- [ ] Verify 5 items appear in queue
- [ ] Test edit functionality on one item
- [ ] Test drag-and-drop reordering
- [ ] Test delete single item
- [ ] Click "Print All"
- [ ] **VERIFY**: Does it ask for team member again? (BUG if yes)
- [ ] Verify all items print sequentially
- [ ] Check items auto-remove after completion
- [ ] Verify `printed_labels` table has all records
- [ ] Test "Clear Queue" functionality

### Workflow 3: Full Label Form

- [ ] Click "New Label" button
- [ ] Verify UserSelectionDialog appears BEFORE form
- [ ] Select team member
- [ ] Verify form opens with team member PRE-FILLED
- [ ] Check "Prepared By" field shows team member name
- [ ] Select category from dropdown
- [ ] Select product from filtered list
- [ ] Verify unit auto-fills from product
- [ ] Set prep date to today
- [ ] Set expiry date to tomorrow
- [ ] Select condition: "Refrigerated"
- [ ] Enter quantity: "2"
- [ ] Test allergen selector:
  - [ ] Add 3 allergens
  - [ ] Remove 1 allergen
  - [ ] Verify product allergens load
- [ ] Enter batch number: "TEST-001"
- [ ] Toggle label preview on
- [ ] Test preview zoom: 50%, 100%, 150%
- [ ] Test preview format: Generic, PDF, Zebra
- [ ] Test "Save Draft" button
- [ ] Reload page and load draft
- [ ] Test "Add to Queue" button
- [ ] Test "Print Label" button
- [ ] Verify label prints correctly
- [ ] Check all fields appear on printed label
- [ ] Verify `printed_labels` record saved with all fields
- [ ] Test "Cancel" button returns to overview

### Cross-Workflow Tests

- [ ] Print same product with all 3 workflows
- [ ] Verify all 3 labels are identical (when using same inputs)
- [ ] Test with different printers (Generic, PDF, Zebra)
- [ ] Verify printer setting persists across workflows
- [ ] Test with different team members in same session
- [ ] Verify organization_id saved correctly in all records
- [ ] Test RLS: User A cannot see User B's queue items
- [ ] Test RLS: User A can see own printed labels only
- [ ] Test with no team members (edge case)
- [ ] Test with 50+ team members (performance)

### Error Scenarios

- [ ] Try to print without selecting team member
- [ ] Try to print without organization context
- [ ] Try to print product with no category
- [ ] Try to add to queue with quantity = 0
- [ ] Try to print with expiry date before prep date
- [ ] Simulate printer offline
- [ ] Simulate database connection lost
- [ ] Test with invalid UUID for prepared_by
- [ ] Test with team member that has no auth_role_id

---

## 📚 Next Steps for 4th Workflow

Before adding a 4th printing workflow, ensure:

1. ✅ **Fix duplicate team member selection** in Add to Queue workflow
2. ✅ **Standardize expiry date defaults** across all workflows
3. ✅ **Document any new requirements** for 4th workflow:
   - What makes it different from existing 3?
   - What problem does it solve?
   - What user pain point does it address?
4. ✅ **Ensure database migrations applied**:
   - `print_queue` table exists
   - `team_member_id` column in `routine_tasks`
5. ✅ **Update type definitions** if needed

### Recommended Questions Before Adding 4th Workflow:

- **Use Case:** What scenario does this workflow serve?
- **User Type:** Who will use this workflow? (Chef, Manager, Line Cook?)
- **Speed vs Control:** Where does it fall on the spectrum?
- **Unique Fields:** Does it need fields not in existing workflows?
- **Integration:** Does it integrate with other modules (Shopping, Recipes)?

---

## 📄 Appendix

### File Structure

```
src/
├── pages/
│   └── Labeling.tsx                 # Main orchestration (739 lines)
├── components/
│   └── labels/
│       ├── LabelForm.tsx            # Full form workflow (~800 lines)
│       ├── QuickPrintGrid.tsx       # Product grid for quick print
│       ├── QuickPrintDetailsDialog.tsx  # Optional details dialog
│       ├── QuickAddToQueueDialog.tsx    # Add to queue dialog (255 lines)
│       ├── PrintQueue.tsx           # Queue management UI (537 lines)
│       ├── UserSelectionDialog.tsx  # Team member selector
│       ├── CategorySelector.tsx     # Category dropdown
│       ├── ProductSelector.tsx      # Product dropdown
│       └── AllergenSelectorEnhanced.tsx  # Allergen multi-select
├── hooks/
│   ├── usePrinter.ts                # Unified print hook
│   └── usePrintQueue.ts             # Queue operations
└── lib/
    └── printers/
        ├── PrinterFactory.ts        # Printer selection
        ├── GenericPrinter.ts        # Generic PDF printer
        ├── ZebraPrinter.ts          # Zebra ZPL printer
        └── PDFPrinter.ts            # PDF export printer
```

### Key Dependencies

- **Supabase Client** - Database operations
- **React Hook Form** - Form state management (Label Form)
- **Radix UI** - Dialog, Select, Checkbox components
- **QRCode** - QR code generation
- **jsPDF** - PDF generation
- **html2canvas** - Label preview capture

---

**Document Version:** 3.0  
**Last Updated:** January 8, 2026  
**Status:** 🟢 Complete - Ready for 4th workflow planning  
**Maintainer:** GitHub Copilot + Development Team
