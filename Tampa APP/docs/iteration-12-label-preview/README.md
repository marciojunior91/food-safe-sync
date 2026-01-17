# Epic 4: Real-Time Label Preview

**Status**: 🚧 IN PROGRESS  
**Started**: December 22, 2025  
**Estimated Duration**: 4-5 days

## 📋 Overview

Implement a live label preview canvas that updates in real-time as users type in the LabelForm. Support multiple output formats (Generic visual, PDF, Zebra thermal) with zoom controls and format switching.

## 🎯 Objectives

1. **Live Preview Canvas**: Show label preview as user types
2. **Multiple Formats**: Generic (visual), PDF (A4), Zebra (thermal ZPL)
3. **Format Switching**: Dropdown to change between formats
4. **Zoom Controls**: Scale preview (50%, 75%, 100%, 125%, 150%)
5. **Toggle Visibility**: Show/hide preview panel
6. **Responsive Design**: Adapt to different screen sizes
7. **Print from Preview**: Direct print button in preview panel

## 🏗️ Architecture

### Components

```
src/components/labels/
├── LabelPreview.tsx          # Main preview component with canvas
├── LabelPreviewPanel.tsx     # Panel wrapper with controls
└── LabelForm.tsx             # Updated to include preview panel
```

### Utilities

```
src/utils/labelRenderers/
├── index.ts                  # Exports all renderers
├── genericRenderer.ts        # Visual/aesthetic label renderer
├── pdfRenderer.ts            # A4 paper layout renderer
└── zebraRenderer.ts          # Thermal printer format (ZPL visualization)
```

### Types

```typescript
// Label format types
type LabelFormat = 'generic' | 'pdf' | 'zebra';

// Preview scale options
type PreviewScale = 0.5 | 0.75 | 1 | 1.25 | 1.5;

// Renderer function signature
type LabelRenderer = (
  ctx: CanvasRenderingContext2D,
  data: LabelData,
  scale: number
) => void;
```

## 📐 Technical Design

### 1. LabelPreview Component

**Purpose**: Render label on HTML5 Canvas based on format and data

**Props**:
```typescript
interface LabelPreviewProps {
  labelData: LabelData;
  format: LabelFormat;
  scale: PreviewScale;
  className?: string;
}
```

**Features**:
- Canvas-based rendering
- Auto-updates on data change (debounced)
- Different renderers for each format
- Proper scaling and dimensions

### 2. Format Renderers

#### Generic Renderer
- **Purpose**: Beautiful visual representation
- **Dimensions**: 600x400px base (thermal label size simulation)
- **Features**: 
  - Gradient backgrounds
  - Clear typography
  - Allergen badges with colors
  - QR code placeholder
  - Professional layout

#### PDF Renderer
- **Purpose**: A4 paper layout preview
- **Dimensions**: 210x297mm (A4) scaled to canvas
- **Features**:
  - Multiple labels per page (grid layout)
  - Print margins
  - Page break indicators
  - Standard font sizes for printing

#### Zebra Renderer
- **Purpose**: Thermal printer format visualization
- **Dimensions**: Based on printer settings (e.g., 4x6 inches)
- **Features**:
  - Monochrome (black & white)
  - ZPL code visualization
  - Actual thermal printer layout
  - Barcode/QR code simulation
  - Text rendering matching ZPL output

### 3. LabelForm Integration

**Layout Options**:

**Option A: Side-by-side** (Desktop)
```
┌────────────────────────────────────┐
│ Form Fields (60%)  │ Preview (40%) │
│                    │               │
│ [Product Name]     │ ┌───────────┐ │
│ [Prep Date]        │ │  Label    │ │
│ [Expiry Date]      │ │  Preview  │ │
│ [Category]         │ │           │ │
│ [Condition]        │ │           │ │
│                    │ └───────────┘ │
│ [Buttons]          │ [Controls]    │
└────────────────────────────────────┘
```

**Option B: Collapsible Panel** (Mobile)
```
┌──────────────────┐
│ Form Fields      │
│ [Product Name]   │
│ [Prep Date]      │
│ ▼ Show Preview   │
├──────────────────┤
│ ┌──────────────┐ │
│ │ Label Preview│ │
│ └──────────────┘ │
│ [Controls]       │
└──────────────────┘
```

**Controls**:
- Format selector: `<Select>` with Generic/PDF/Zebra
- Zoom slider: `<Slider>` with 50-150% range
- Toggle button: Show/Hide preview
- Print button: Direct print from preview

## 🎨 UI/UX Design

### Color Scheme
- Canvas background: `#f8f9fa` (light gray)
- Label border: `#dee2e6` (medium gray)
- Text: `#212529` (dark)
- Accent: Primary brand color
- Allergen critical: `#dc3545` (red)
- Allergen warning: `#ffc107` (amber)

### Typography
- Product Name: Bold, 24px
- Category: Regular, 18px
- Dates: Regular, 16px
- Details: Regular, 14px
- Allergens: Bold, 14px

### Layout
- Padding: 20px
- Margins: 10px between sections
- Border radius: 8px
- Box shadow: subtle elevation

## 🔧 Implementation Plan

### Phase 1: Base Structure (Day 1) ✅ IN PROGRESS
- [x] Create planning document
- [ ] Create LabelPreview component with canvas
- [ ] Implement Generic renderer (basic)
- [ ] Add preview to LabelForm (right panel)
- [ ] Test live updates

### Phase 2: Format Support (Day 2)
- [ ] Implement PDF renderer
- [ ] Implement Zebra renderer
- [ ] Add format selector dropdown
- [ ] Test format switching

### Phase 3: Controls & Polish (Day 3)
- [ ] Add zoom slider
- [ ] Add toggle visibility button
- [ ] Implement debouncing for performance
- [ ] Add loading states

### Phase 4: Advanced Features (Day 4)
- [ ] Add QR code rendering
- [ ] Add barcode rendering
- [ ] Implement allergen badges with icons
- [ ] Add print from preview button

### Phase 5: Testing & Refinement (Day 5)
- [ ] Test all formats thoroughly
- [ ] Test responsive behavior
- [ ] Performance optimization
- [ ] User feedback integration
- [ ] Documentation

## 📊 Success Criteria

- ✅ Preview updates in real-time as user types
- ✅ All three formats render correctly
- ✅ Zoom controls work smoothly (50-150%)
- ✅ Toggle visibility works on all screen sizes
- ✅ No performance lag with rapid typing
- ✅ Allergens display with correct colors
- ✅ QR codes and barcodes render properly
- ✅ Print from preview works correctly
- ✅ Responsive design works on mobile/tablet
- ✅ No TypeScript errors

## 🚀 Future Enhancements

- Export preview as image (PNG/JPG)
- Save preview as template
- Multiple label layouts (different sizes)
- Custom fonts and colors
- Live printer connection test
- Batch preview (multiple labels)
- Label history preview

## 📝 Notes

- Use HTML5 Canvas API for maximum performance
- Debounce updates to 300ms to avoid lag
- Consider using `requestAnimationFrame` for smooth rendering
- Cache rendered elements when possible
- Use Web Workers for heavy rendering (if needed)
- Ensure accessibility (alt text, ARIA labels)

## 🔗 Related Epics

- Epic 1: Category & Subcategory Emojis ✅
- Epic 2: Multi-Printer Support ✅
- Epic 3: Shopping Cart Print Queue ✅
- **Epic 4: Real-Time Label Preview** 🚧 (Current)
- Epic 5: Label History & Audit Trail (Planned)
- Epic 6: Mobile App Integration (Planned)

---

**Last Updated**: December 22, 2025  
**Epic Owner**: AI Assistant  
**Status**: Phase 1 in progress
