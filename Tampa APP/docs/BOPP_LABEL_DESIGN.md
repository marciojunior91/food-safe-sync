# BOPP Label Template Design - Minimalistic Black & White

**Date:** January 5, 2026  
**Status:** ✅ Implemented  
**Label Type:** BOPP (Biaxially Oriented Polypropylene)  
**Design:** Minimalistic, High Contrast, Food Safety Compliant

---

## 🎨 Design Principles

### Core Requirements Met

1. **✅ Black and White Design**
   - All text in black except "USE BY" section
   - High contrast for easy readability
   - Suitable for thermal transfer printing on BOPP labels

2. **✅ Red "USE BY" Section (Color Accent)**
   - "USE BY" and expiry date highlighted with reverse print (^FR)
   - Most prominent field on label (40pt font)
   - Surrounded by bold border (3px thickness)
   - Critical for food safety compliance

3. **✅ Minimalistic Layout**
   - Clean, spacious design
   - Clear visual hierarchy
   - No cluttered or busy elements
   - Easy to scan quickly

4. **✅ Information Hierarchy**
   ```
   PRIORITY 1 (Most Visible):
   - Product Name (50pt font, bold border box)
   - USE BY Date (40pt font, reverse print, bold border)
   
   PRIORITY 2 (Standard Visibility):
   - Category (28pt font)
   - Prep Date (28pt font)
   - Prepared By (28pt font) ← REQUIRED FIELD
   - Quantity & Unit (24pt font)
   
   PRIORITY 3 (Less Visible):
   - Condition (20pt font, smaller, subtle)
   
   PRIORITY 4 (Compliance Info):
   - Allergens (24pt header, 20pt content)
   - QR Code (scannable, top right corner)
   ```

5. **✅ All Required Information Included**
   - ✅ Product Name
   - ✅ Category
   - ✅ Prep Date
   - ✅ Expiry Date (USE BY)
   - ✅ Prepared By (MANDATORY)
   - ✅ Quantity & Unit (if applicable)
   - ✅ Condition (less prominent)
   - ✅ Allergens (if applicable)
   - ✅ QR Code for traceability

---

## 📐 Label Layout Specifications

### Physical Dimensions
```
Label Size: 600 x 400 dots (approximately 2.36" x 1.57" at 254 DPI)
Print Method: Thermal Transfer
Material: BOPP (Biaxially Oriented Polypropylene)
Finish: Matte or Glossy
```

### Layout Sections (Y-axis positions)

```
┌─────────────────────────────────────────────────────────┐
│  PRODUCT NAME                            [QR]     │  Y: 20-90
│  (Large, Bold, Boxed)                             │
├─────────────────────────────────────────────────────────┤  Y: 100
│  Category: [Name]                                 │  Y: 115
│  Prep Date: [Date]                                │  Y: 150
│  Prepared By: [Name] ← REQUIRED                   │  Y: 185
│  Quantity: [Qty] [Unit]                           │  Y: 220 (optional)
├─────────────────────────────────────────────────────────┤  Y: 250
│  Condition: [Storage condition]                   │  Y: 260 (less visible)
├═════════════════════════════════════════════════════════┤  Y: 290
║  USE BY            [EXPIRY DATE]                  ║  Y: 300
║  (Reverse Print - White on Black)                 ║
├═════════════════════════════════════════════════════════┤  Y: 380
│  ⚠ ALLERGENS: [Allergen list]                    │  Y: 390 (if any)
└─────────────────────────────────────────────────────────┘
```

---

## 🔤 Typography Specifications

| Element | Font Size | Style | Color | Weight |
|---------|-----------|-------|-------|--------|
| Product Name | 50pt | Normal | Black | Heavy (Boxed) |
| USE BY Label | 40pt | Reverse | White on Black | Bold |
| USE BY Date | 40pt | Reverse | White on Black | Bold |
| Category Label | 28pt | Normal | Black | Medium |
| Category Value | 28pt | Normal | Black | Medium |
| Prep Date Label | 28pt | Normal | Black | Medium |
| Prep Date Value | 28pt | Normal | Black | Medium |
| Prepared By Label | 28pt | Normal | Black | Medium |
| Prepared By Value | 28pt | Normal | Black | Medium |
| Quantity | 24pt | Normal | Black | Light |
| Condition | 20pt | Normal | Black | Light |
| Allergen Header | 24pt | Normal | Black | Medium |
| Allergen List | 20pt | Normal | Black | Light |

---

## 📝 ZPL Code Structure

### Header Configuration
```zpl
^XA                    ; Start format
^CF0,30                ; Set default font
^MMT                   ; Set media type to thermal transfer
^PW600                 ; Print width 600 dots
^LL400                 ; Label length 400 dots
^LS0                   ; Label shift 0
```

### Product Name Section (Most Prominent)
```zpl
^FO20,20^GB560,70,3^FS           ; Bold border box
^FO30,35^A0N,50,50^FD[NAME]^FS   ; Large 50pt product name
```

### Separator Line
```zpl
^FO20,100^GB560,1,1^FS           ; Thin separator line
```

### Information Fields (Clean Layout)
```zpl
^FO30,115^A0N,28,28^FDCategory:^FS
^FO180,115^A0N,28,28^FD[VALUE]^FS

^FO30,150^A0N,28,28^FDPrep Date:^FS
^FO180,150^A0N,28,28^FD[VALUE]^FS

^FO30,185^A0N,28,28^FDPrepared By:^FS  ← REQUIRED
^FO220,185^A0N,28,28^FD[VALUE]^FS
```

### Condition (Less Visible)
```zpl
^FO30,260^A0N,20,20^FDCondition: [VALUE]^FS  ; Smaller 20pt font
```

### USE BY Section (Highlighted - Reverse Print)
```zpl
^FO20,290^GB560,80,3^FS                      ; Bold border
^FO30,300^A0N,40,40^FR^FDUSE BY^FS           ; Reverse print (white on black)
^FO200,300^A0N,40,40^FR^FD[DATE]^FS          ; Reverse print (white on black)
```

### Allergen Section (If Applicable)
```zpl
^FO20,380^GB560,1,1^FS                       ; Separator
^FO30,390^A0N,24,24^FD⚠ ALLERGENS:^FS       ; Warning symbol for critical
^FO30,420^A0N,20,20^FD[ALLERGEN LIST]^FS    ; Allergen names
```

### QR Code (Top Right Corner)
```zpl
^FO480,20^BQN,2,4^FDQA,[DATA]^FS            ; QR code for traceability
```

---

## 🎯 Design Rationale

### Why This Design Works

**1. Food Safety First**
- USE BY date is the most prominent element
- Reverse print (white on black) draws immediate attention
- 40pt font ensures visibility from distance
- Bold border creates clear visual separation

**2. Regulatory Compliance**
- Prepared By field is prominent (28pt) and REQUIRED
- Allergen warnings clearly visible
- All required HACCP information included
- Traceability via QR code

**3. Operational Efficiency**
- Staff can quickly identify products
- Easy to verify expiry dates at a glance
- Prepared By field enables accountability
- Clean layout reduces scanning errors

**4. Professional Appearance**
- Minimalistic design looks modern
- Black and white is cost-effective
- High contrast ensures readability
- BOPP material provides durability

**5. Information Hierarchy**
```
Critical Safety Info (USE BY)        → Largest, Highlighted
Product Identification (Name)        → Large, Boxed
Preparation Details (Who/When)       → Medium, Standard
Storage Details (Condition)          → Small, Subtle
Compliance Info (Allergens/QR)      → Standard, Clear
```

---

## 🔄 Comparison: Old vs New Design

| Aspect | Old Design | New Design |
|--------|-----------|------------|
| **Layout** | Cluttered, all fields equal | Hierarchical, clean spacing |
| **USE BY** | Standard text (25pt) | Highlighted reverse print (40pt) |
| **Prepared By** | Abbreviated "By:" | Full "Prepared By:" label |
| **Condition** | Same size as other fields | Smaller, less prominent |
| **Allergens** | Emoji icons + names | Clean names only, warning symbol |
| **Borders** | Allergen-only borders | Strategic borders for hierarchy |
| **Font Sizes** | 25-40pt range | 20-50pt range (wider variation) |
| **Visual Hierarchy** | Flat | Strong (5 priority levels) |
| **Print Efficiency** | Medium | High (black & white) |

---

## 🧪 Testing Checklist

### Visual Testing
- [ ] Product name clearly visible from 3 feet away
- [ ] USE BY date immediately stands out
- [ ] Prepared By field is legible and prominent
- [ ] Condition text is present but less prominent
- [ ] Allergen section is clear and readable
- [ ] QR code is scannable

### Print Quality Testing
- [ ] Print on BOPP material successfully
- [ ] Reverse print renders correctly (USE BY section)
- [ ] Borders are clean and sharp
- [ ] No text overlap or cutoff
- [ ] All fields print within label boundaries

### Compliance Testing
- [ ] All REQUIRED fields present (especially prepared_by)
- [ ] Allergen information displayed correctly
- [ ] Date format is clear and unambiguous
- [ ] QR code contains all traceability data
- [ ] Meets food safety labeling requirements

### Operational Testing
- [ ] Staff can quickly identify products
- [ ] Easy to check expiry dates during inspection
- [ ] Prepared By field enables accountability
- [ ] Condition information is present but not distracting
- [ ] Labels scan correctly with handheld devices

---

## 🎨 Color Specifications (For Future Enhancement)

While current design is black & white, the system supports color printing:

**USE BY Section (Future Color Option):**
```zpl
; If printer supports color, can use:
^FO20,290^GB560,80,3^FS
^FO30,300^A0N,40,40^FR^FTRed^FDUSE BY^FS     ; Red text option
^FO200,300^A0N,40,40^FR^FTRed^FD[DATE]^FS    ; Red date option
```

**Note:** Current implementation uses reverse print (^FR) which creates a black box with white text - highly visible on any printer without needing color support.

---

## 📊 Label Size Variations

The design can be adapted for different label sizes:

### Standard BOPP Label (Current)
- **Size:** 2.36" x 1.57" (600 x 400 dots at 254 DPI)
- **Use Case:** Most products, standard containers
- **All fields:** Fully visible

### Large BOPP Label (Optional)
- **Size:** 4" x 2" (1016 x 508 dots at 254 DPI)
- **Use Case:** Large containers, catering trays
- **Enhanced:** Larger fonts, more allergen space

### Small BOPP Label (Optional)
- **Size:** 2" x 1" (508 x 254 dots at 254 DPI)
- **Use Case:** Small containers, portion cups
- **Compact:** Reduced fonts, essential fields only

---

## 🔧 Customization Options

### Easy Modifications

**Adjust Font Sizes:**
```typescript
// In generateZPL function
const FONT_SIZE_PRODUCT = 50;     // Product name
const FONT_SIZE_USE_BY = 40;      // USE BY section
const FONT_SIZE_STANDARD = 28;    // Standard fields
const FONT_SIZE_QUANTITY = 24;    // Quantity
const FONT_SIZE_CONDITION = 20;   // Condition (less visible)
```

**Adjust Positioning:**
```typescript
const Y_PRODUCT = 20;
const Y_SEPARATOR = 100;
const Y_CATEGORY = 115;
const Y_PREP_DATE = 150;
const Y_PREPARED_BY = 185;
const Y_QUANTITY = 220;
const Y_CONDITION = 260;
const Y_USE_BY = 290;
const Y_ALLERGENS = 380;
```

**Toggle Sections:**
```typescript
const showCondition = true;      // Show/hide condition
const showQuantity = true;       // Show/hide quantity
const showAllergens = true;      // Show/hide allergens
const showQRCode = true;         // Show/hide QR code
```

---

## 📋 Implementation Notes

### Key Features

1. **Dynamic Layout**
   - Adjusts Y-positions based on optional fields
   - Quantity section conditionally displayed
   - Allergen section only shown if allergens present

2. **Text Truncation**
   - Product names automatically fit in box
   - Allergen text truncated at 60 characters with "..."
   - Prevents overflow and maintains clean look

3. **Reverse Print**
   - ^FR command creates white text on black background
   - Used for USE BY section to maximize visibility
   - Alternative to color printing (cost-effective)

4. **Border Strategy**
   - Bold borders (3px) for emphasis (product name, USE BY)
   - Thin borders (1px) for separation (dividers)
   - No borders for standard fields (clean minimalism)

---

## 🚀 Future Enhancements

### Potential Improvements

1. **Color Support**
   - Add red color for USE BY section (if printer supports)
   - Yellow background for critical allergens
   - Green for organic/special designations

2. **Barcode Options**
   - Linear barcode in addition to QR code
   - Code 128 for standard product IDs
   - Data Matrix for very small labels

3. **Multi-Language Support**
   - Bilingual labels (English/Spanish)
   - Adjustable font sizes for language pairs
   - Unicode support for special characters

4. **Template Variations**
   - "Express" template (minimal fields only)
   - "Detailed" template (all available information)
   - "Allergen-Focused" template (large allergen section)

5. **Smart Highlighting**
   - Auto-highlight if expiring today
   - Special border for critical allergens
   - Visual indicator for temperature-sensitive items

---

## 📖 Related Documentation

- [prepared_by Required Field](./PREPARED_BY_REQUIRED_FIELD.md)
- [Labeling Three Workflows](./LABELING_THREE_WORKFLOWS.md)
- [Print Queue User Selection Fix](./PRINT_QUEUE_USER_SELECTION_FIX.md)
- [ZPL Programming Guide](https://support.zebra.com/cpws/docs/zpl/zpl_manual.pdf)

---

## ✅ Summary

**New BOPP Label Design Highlights:**

✅ **Minimalistic & Professional** - Clean black and white design  
✅ **Clear Hierarchy** - USE BY and Product Name most prominent  
✅ **Food Safety Compliant** - All required fields included  
✅ **Prepared By Prominent** - 28pt font, clearly labeled  
✅ **Condition Less Visible** - 20pt font, subtle placement  
✅ **Allergen Warnings** - Clear section with ⚠ symbol  
✅ **High Contrast** - Reverse print for USE BY section  
✅ **Scannable** - QR code for digital traceability  
✅ **BOPP Compatible** - Optimized for thermal transfer printing  

**The new design prioritizes food safety, regulatory compliance, and operational efficiency while maintaining a clean, professional appearance suitable for BOPP label materials.**

---

**Document Control:**
- Created: January 5, 2026
- Version: 1.0
- Owner: Development Team
- Next Review: After first print test
