# Epic 3: Shopping Cart Print Queue - Implementation Plan

**Date**: December 17, 2024  
**Status**: 🚀 IN PROGRESS  
**Priority**: HIGH  
**Estimated Duration**: 4 days

---

## 🎯 Objective

Transform the single-label print workflow into an e-commerce-style shopping cart where users can:
- Add multiple labels to a queue
- Adjust quantities for each label
- Review all items before printing
- Batch print everything at once
- Save queue for later

---

## 📋 Current State Analysis

### **Labeling Page (src/pages/Labeling.tsx)**
- ✅ Supports immediate single-label printing
- ✅ LabelForm component with printer selection
- ✅ Quick Print mode for fast labeling
- ❌ No queue/cart management
- ❌ No batch printing
- ❌ No "add to queue" option

### **Existing Components**
- `src/components/labels/LabelForm.tsx` - Main form for label creation
- `src/components/labels/QuickPrintGrid.tsx` - Quick print interface
- `src/hooks/usePrinter.ts` - Printer abstraction layer (supports batch!)

### **Key Insight**
The `usePrinter` hook already has `printBatch()` support! We just need to build the UI/UX layer.

---

## 🏗️ Architecture Design

### **Component Hierarchy**

```
Labeling.tsx (Modified)
  ├── LabelForm.tsx (Modified - Add "Add to Queue" button)
  │   ├── [Print Now] button (existing)
  │   └── [➕ Add to Queue] button (NEW)
  │
  ├── QuickPrintGrid.tsx (Modified - Add "Add to Queue")
  │   └── Each product gets [➕ Add to Queue] button
  │
  └── PrintQueue.tsx (NEW - Sliding panel)
      ├── QueueHeader (item count, total labels)
      ├── QueueItemList
      │   └── QueueItem (product, quantity, actions)
      ├── QueueActions (clear, save, print all)
      └── PrintProgressModal (batch printing status)
```

### **State Management**

```typescript
// Custom hook: src/hooks/usePrintQueue.ts
interface PrintQueueItem {
  id: string;                    // Unique queue item ID
  labelData: LabelData;          // Complete label data
  quantity: number;              // Number of copies
  addedAt: string;               // ISO timestamp
  productName: string;           // For display
  categoryName?: string;         // For display
}

interface PrintQueueState {
  items: PrintQueueItem[];
  totalLabels: number;           // Sum of all quantities
  isOpen: boolean;               // Queue panel open/closed
  isPrinting: boolean;           // Batch print in progress
  printProgress?: PrintProgress; // Current print status
}

interface PrintProgress {
  current: number;               // Current item index
  total: number;                 // Total items
  currentItem: string;           // Current product name
  errors: PrintError[];          // Failed items
}
```

### **Data Flow**

```
User Action → usePrintQueue → localStorage → UI Update
                    ↓
            PrintQueue Component
                    ↓
        [Print All] clicked
                    ↓
            usePrinter.printBatch()
                    ↓
        Progress Modal (live updates)
                    ↓
        Success/Failure Summary
```

---

## 📅 Implementation Phases

### **Phase 1: Core Hook (Day 1 - Morning)**
**File**: `src/hooks/usePrintQueue.ts`

**Functions**:
- `addToQueue(labelData, quantity)` - Add item to queue
- `removeFromQueue(itemId)` - Remove specific item
- `updateQuantity(itemId, newQuantity)` - Change quantity
- `clearQueue()` - Remove all items
- `toggleQueue()` - Open/close panel
- `printAll()` - Batch print with progress tracking

**Features**:
- ✅ localStorage persistence (key: `tampa_print_queue`)
- ✅ Auto-calculate total labels
- ✅ Duplicate detection (update quantity if exists)
- ✅ Max queue size (50 items?)

**Example Usage**:
```typescript
const {
  items,
  totalLabels,
  isOpen,
  isPrinting,
  printProgress,
  addToQueue,
  removeFromQueue,
  updateQuantity,
  clearQueue,
  toggleQueue,
  printAll
} = usePrintQueue();

// Add to queue
const handleAddToQueue = (labelData: LabelData) => {
  addToQueue(labelData, 5); // 5 copies
  toast.success("Added 5 labels to queue!");
};

// Print all
const handlePrintAll = async () => {
  const result = await printAll();
  if (result.success) {
    toast.success(`Printed ${result.totalPrinted} labels!`);
  }
};
```

---

### **Phase 2: Queue UI Component (Day 1 - Afternoon)**
**File**: `src/components/shopping/PrintQueue.tsx`

**Features**:
- Sliding panel (right side of screen)
- Animated open/close
- Sticky header with close button
- Scrollable item list
- Footer with actions

**Visual Design**:
```
┌─────────────────────────────────────┐
│ 🛒 Print Queue (3)    [Minimize] [✕]│ ← Header
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🍗 Chicken Breast         [🗑️]  │ │
│ │ Meat & Poultry                  │ │
│ │ Qty: [➖] 10 [➕]                │ │
│ │ Added: 2 minutes ago            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🍅 Tomato Sauce           [🗑️]  │ │
│ │ Sauces & Condiments             │ │
│ │ Qty: [➖] 25 [➕]                │ │
│ │ Added: 5 minutes ago            │ │
│ └─────────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│ Total: 35 labels                    │ ← Footer
│ Est. time: ~1.5 minutes             │
│                                     │
│ [Clear All]  [🖨️ Print All (35)]   │
└─────────────────────────────────────┘
```

**Styling**:
- Shadow overlay when open
- Smooth slide-in animation (300ms)
- Fixed width (400px)
- Max height (90vh)
- Responsive for mobile (full width)

---

### **Phase 3: Integration with LabelForm (Day 2 - Morning)**
**File**: `src/components/labels/LabelForm.tsx`

**Changes**:
1. Import `usePrintQueue`
2. Add "Add to Queue" button next to "Print" button
3. Update button layout (two buttons side by side)

**New Button**:
```tsx
<div className="flex gap-3">
  <Button
    variant="outline"
    onClick={handleAddToQueue}
    disabled={!isFormValid}
  >
    <Plus className="w-4 h-4 mr-2" />
    Add to Queue ({quantity})
  </Button>
  
  <Button
    variant="hero"
    onClick={handlePrint}
    disabled={!isFormValid || isPrinting}
  >
    <Printer className="w-4 h-4 mr-2" />
    Print Now
  </Button>
</div>
```

**Functionality**:
- Add current form data to queue
- Show success toast
- Clear form (optional - user preference?)
- Flash queue badge

---

### **Phase 4: Integration with Quick Print (Day 2 - Afternoon)**
**File**: `src/components/labels/QuickPrintGrid.tsx`

**Changes**:
1. Add "Add to Queue" button to each product card
2. Quick add modal (enter quantity, add to queue)

**Product Card Update**:
```tsx
<Card>
  {/* Existing product info */}
  
  <div className="flex gap-2 mt-4">
    <Button
      variant="outline"
      size="sm"
      onClick={() => handleQuickAdd(product)}
    >
      <Plus className="w-3 h-3 mr-1" />
      Add
    </Button>
    
    <Button
      variant="default"
      size="sm"
      onClick={() => handlePrint(product)}
    >
      <Printer className="w-3 h-3 mr-1" />
      Print
    </Button>
  </div>
</Card>
```

**Quick Add Modal**:
```tsx
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Add to Print Queue</DialogTitle>
    </DialogHeader>
    
    <div>
      <Label>Product: {product.name}</Label>
      <Label>Quantity</Label>
      <Input
        type="number"
        min={1}
        max={100}
        defaultValue={1}
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
      />
    </div>
    
    <DialogFooter>
      <Button onClick={handleCancel}>Cancel</Button>
      <Button variant="hero" onClick={handleAdd}>
        Add {quantity} labels
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### **Phase 5: Batch Printing (Day 3)**
**File**: `src/components/shopping/PrintProgressModal.tsx`

**Features**:
- Modal overlay (can't close during print)
- Real-time progress bar
- Current item display
- Success/failure tracking
- Summary at completion

**Visual Design**:
```
┌─────────────────────────────────────────┐
│  Printing Labels...                     │
│                                         │
│  Progress: 15 / 35 labels               │
│  ██████████░░░░░░░░░░  43%             │
│                                         │
│  Current Item:                          │
│  🍗 Chicken Breast (10 copies)          │
│                                         │
│  ✅ Completed: 10 labels                │
│  ❌ Failed: 2 labels                    │
│                                         │
│  [Cancel Printing]                      │
└─────────────────────────────────────────┘
```

**Error Handling**:
- Continue on individual failures
- Track failed items
- Show retry option at end
- Don't clear queue if failures

**Success Modal**:
```
┌─────────────────────────────────────────┐
│  ✅ Printing Complete!                   │
│                                         │
│  Successfully printed: 33 labels        │
│  Failed: 2 labels                       │
│                                         │
│  Failed Items:                          │
│  • Tomato Sauce (Printer offline)      │
│  • Olive Oil (Paper jam)                │
│                                         │
│  [Retry Failed]  [Close]                │
└─────────────────────────────────────────┘
```

---

### **Phase 6: Queue Badge & Toggle (Day 3)**
**File**: `src/pages/Labeling.tsx`

**Floating Badge**:
```tsx
{/* Fixed position badge - bottom right */}
<Button
  className="fixed bottom-6 right-6 rounded-full w-16 h-16 shadow-lg"
  variant="hero"
  onClick={toggleQueue}
>
  <ShoppingCart className="w-6 h-6" />
  {totalLabels > 0 && (
    <Badge className="absolute -top-2 -right-2 bg-red-500">
      {totalLabels}
    </Badge>
  )}
</Button>
```

**States**:
- Hidden when queue is empty
- Shows count badge when items exist
- Pulses animation when new item added
- Opens queue panel on click

---

### **Phase 7: Persistence & Polish (Day 4)**

**localStorage Schema**:
```typescript
interface StoredQueue {
  version: '1.0';
  lastUpdated: string;
  items: PrintQueueItem[];
}

// Key: 'tampa_print_queue'
```

**Features**:
1. **Auto-save**: Save to localStorage on every change
2. **Auto-restore**: Load from localStorage on mount
3. **Cleanup**: Clear old items (>7 days)
4. **Migration**: Handle schema changes

**Enhancements**:
- Keyboard shortcuts (Ctrl+Q to toggle queue)
- Queue item drag-to-reorder
- "Save Queue" feature (named queues)
- "Load Queue" from saved
- Export queue as JSON
- Import queue from JSON

**Animations**:
- Slide-in/out panel (300ms ease)
- Item add/remove animation (fade + slide)
- Count badge pulse
- Progress bar smooth transition

---

## 🧪 Testing Checklist

### **Functional Tests**
- [ ] Add item to queue from LabelForm
- [ ] Add item to queue from Quick Print
- [ ] Update quantity (increase/decrease)
- [ ] Remove single item
- [ ] Clear all items
- [ ] Print all items (success case)
- [ ] Print all items (with failures)
- [ ] Cancel printing mid-batch
- [ ] Queue persists after page refresh
- [ ] Queue persists after browser close/reopen
- [ ] Maximum queue size enforced
- [ ] Duplicate items update quantity

### **UI/UX Tests**
- [ ] Panel slides in/out smoothly
- [ ] Badge shows correct count
- [ ] Badge animates on item add
- [ ] Progress modal updates in real-time
- [ ] Toast notifications work
- [ ] Mobile responsive layout
- [ ] Keyboard shortcuts work
- [ ] Accessibility (screen reader)

### **Edge Cases**
- [ ] Empty queue behavior
- [ ] Queue with 1 item
- [ ] Queue with 50+ items (scrolling)
- [ ] Very long product names
- [ ] Offline printing attempts
- [ ] localStorage full error
- [ ] Corrupted localStorage data
- [ ] Printer disconnected mid-batch

---

## 📊 Success Metrics

**Quantitative**:
- ✅ Users can queue 5+ items before printing
- ✅ Batch print completes in <3 seconds per label
- ✅ Queue persists 100% of the time
- ✅ Error rate < 5% for batch prints
- ✅ UI response time < 200ms

**Qualitative**:
- ✅ Users find it "easier than before"
- ✅ Reduces clicks by 60% for multi-label tasks
- ✅ "Shopping cart" metaphor is intuitive
- ✅ Error messages are clear and actionable

---

## 🚀 Deployment Strategy

### **Phase 1: Internal Testing**
- Deploy to dev environment
- Test with 3 internal users
- Collect feedback
- Fix critical bugs

### **Phase 2: Beta Release**
- Feature flag: `ENABLE_PRINT_QUEUE`
- Opt-in for power users
- Monitor error logs
- Gather usage metrics

### **Phase 3: Full Release**
- Enable for all users
- Add onboarding tooltip
- Monitor performance
- Iterate based on feedback

---

## 🔗 Related Documentation

- [Iteration 11 Planning](../ITERATION_11_PLANNING.md)
- [Multi-Printer Support](./EPIC_2_COMPLETE_SUMMARY.md)
- [Category & Subcategory Emojis](./EPIC_1_COMPLETE_SUMMARY.md)

---

## 📝 Technical Notes

### **Performance Considerations**
1. **localStorage size**: Max ~5MB in most browsers
   - 50 items × ~2KB per item = ~100KB (safe)
2. **Batch printing**: Sequential, not parallel
   - Prevents printer overload
   - Better error tracking
3. **UI updates**: Debounce quantity changes
   - Prevent excessive re-renders
   - Smooth user experience

### **Security Considerations**
1. **localStorage**: Not sensitive data (just label info)
2. **XSS**: Sanitize product names before render
3. **CSRF**: Not applicable (client-side only)

### **Browser Compatibility**
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

---

**Status**: 🚀 Ready to implement!  
**Next Step**: Create `usePrintQueue` hook  
**Blocked By**: None  
**Dependencies**: usePrinter (already exists ✅)

