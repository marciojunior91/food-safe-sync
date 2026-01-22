# 🏷️ DIA 2 - LABELING & PRINTING

**Data:** 22 Jan 2026  
**Status:** 🔄 EM ANDAMENTO  
**Meta:** Validar core feature de labeling + printing  
**Progress Target:** 35% → 45%

---

## 📋 AGENDA DO DIA

### MANHÃ (4h): Labeling Core Testing
- [ ] 1.1 Labeling Page Load
- [ ] 1.2 Products CRUD
- [ ] 1.3 Quick Print Grid
- [ ] 1.4 Allergen Badges
- [ ] 1.5 Duplicate Warning

### TARDE (4h): Printing & Integration
- [ ] 2.1 PDF Generation
- [ ] 2.2 Label Layout
- [ ] 2.3 Zebra Printer Flow
- [ ] 2.4 Print History

### NOITE (2h): Performance & Polish
- [ ] 3.1 Lighthouse Audit
- [ ] 3.2 Bundle Analysis
- [ ] 3.3 Bug Fixes

---

## 🧪 1. LABELING CORE TESTING

### 1.1 Labeling Page Load ⏸️

**Test URL:** https://tampaapp.vercel.app/labeling

**Checklist:**
- [ ] Page loads without errors
- [ ] Products list appears
- [ ] Categories visible
- [ ] Search bar working
- [ ] Create button visible
- [ ] No console errors

**Expected Result:**
- ✅ Page loads in <2s
- ✅ Products organized by category
- ✅ UI responsive on iPhone/iPad/Desktop

**Test Steps:**
1. Open Chrome DevTools (F12)
2. Navigate to /labeling
3. Check Console for errors
4. Check Network tab for failed requests
5. Verify UI renders correctly

**Status:** ⏸️ Not Started

**Results:**
```
Load Time: ___ seconds
Console Errors: ___
Network Errors: ___
UI Issues: ___
```

---

### 1.2 Products CRUD ⏸️

**Feature:** Create, Read, Update, Delete products

**Test: CREATE Product**
- [ ] Click "Create Product" button
- [ ] Fill form (name, category, subcategory)
- [ ] Select allergens
- [ ] Set production date
- [ ] Set expiry date
- [ ] Save product
- [ ] Verify appears in list

**Test: EDIT Product**
- [ ] Click existing product
- [ ] Modify fields
- [ ] Save changes
- [ ] Verify updates reflected

**Test: DELETE Product**
- [ ] Click delete on product
- [ ] Confirm deletion
- [ ] Verify removed from list

**Status:** ⏸️ Not Started

**Results:**
```
CREATE: ___ (✅ / ❌)
EDIT: ___ (✅ / ❌)
DELETE: ___ (✅ / ❌)
Issues: ___
```

---

### 1.3 Quick Print Grid ⏸️

**Feature:** 2x3 grid com 6 categorias principais

**Test:**
- [ ] Grid renders with 6 categories
- [ ] Categories show product count
- [ ] Click category → shows products
- [ ] Products have thumbnail
- [ ] Click product → opens print dialog
- [ ] Grid responsive on mobile

**Categories Expected:**
1. Bakery & Pastry 🥐
2. Deli & Cheese 🧀
3. Prepared Foods 🍱
4. Sauces & Condiments 🍯
5. Beverages ☕
6. Desserts & Sweet Treats 🍰

**Status:** ⏸️ Not Started

**Results:**
```
Grid Layout: ___ (✅ / ❌)
Categories: ___ / 6
Product Click: ___ (✅ / ❌)
Mobile: ___ (✅ / ❌)
Issues: ___
```

---

### 1.4 Allergen Badges ⏸️

**Feature:** Visual allergen indicators

**Test:**
- [ ] Create product with allergens
- [ ] Verify allergen badges appear
- [ ] Check emoji rendering
- [ ] Verify colors correct
- [ ] Test all 14 allergens
- [ ] Check print preview

**Allergens to Test:**
- 🥜 Peanuts
- 🌰 Tree Nuts
- 🥛 Dairy
- 🥚 Eggs
- 🐟 Fish
- 🦐 Shellfish
- 🌾 Gluten
- 🌿 Sesame
- 🫘 Soy
- 🥕 Celery
- 🌶️ Mustard
- 🫘 Lupin

**Status:** ⏸️ Not Started

**Results:**
```
Badges Display: ___ (✅ / ❌)
Emoji Rendering: ___ (✅ / ❌)
Colors: ___ (✅ / ❌)
Print Preview: ___ (✅ / ❌)
Issues: ___
```

---

### 1.5 Duplicate Warning ⏸️

**Feature:** Detect similar product names

**Test:**
- [ ] Create product "Chocolate Cake"
- [ ] Try create "Chocolate Cake" again
- [ ] Verify warning appears
- [ ] Check similarity threshold
- [ ] Test with variations ("Choc Cake")
- [ ] Verify can override

**Status:** ⏸️ Not Started

**Results:**
```
Warning Triggered: ___ (✅ / ❌)
Similarity Detection: ___ (✅ / ❌)
Override Works: ___ (✅ / ❌)
Issues: ___
```

---

## 🖨️ 2. PRINTING & INTEGRATION

### 2.1 PDF Generation ⏸️

**Feature:** Generate PDF labels with jsPDF + html2canvas

**Test:**
- [ ] Click "Print" on product
- [ ] Verify PDF dialog opens
- [ ] Check label dimensions (101x152mm)
- [ ] Verify QR code generated
- [ ] Check text rendering
- [ ] Test batch printing (5 products)
- [ ] Download PDF

**Status:** ⏸️ Not Started

**Results:**
```
PDF Generation: ___ (✅ / ❌)
Label Dimensions: ___ (✅ / ❌)
QR Code: ___ (✅ / ❌)
Batch Print: ___ (✅ / ❌)
Issues: ___
```

---

### 2.2 Label Layout ⏸️

**Feature:** 101mm x 152mm label design

**Elements to Verify:**
- [ ] Product name (large, bold)
- [ ] Production date
- [ ] Expiry date
- [ ] Team member name
- [ ] Allergen badges
- [ ] QR code (bottom right)
- [ ] Organization logo (if exists)
- [ ] Instructions/notes

**Status:** ⏸️ Not Started

**Results:**
```
Layout Correct: ___ (✅ / ❌)
All Elements: ___ / 8
Alignment: ___ (✅ / ❌)
Readable: ___ (✅ / ❌)
Issues: ___
```

---

### 2.3 Zebra Printer Flow ⏸️

**Feature:** Register and use Zebra printer

**Test:**
- [ ] Navigate to Settings → Printers
- [ ] Verify printer DFJ253402166 exists
- [ ] Check status (should be "Offline" until tablet)
- [ ] Verify schema correct (default_darkness, etc)
- [ ] Test connection button (will fail without tablet)
- [ ] Document expected behavior

**Status:** ⏸️ Not Started

**Results:**
```
Printer Registered: ___ (✅ / ❌)
Schema Correct: ___ (✅ / ❌)
Status Display: ___ (✅ / ❌)
Notes: ___
```

**Note:** Android tablet não chegou ainda. Zebra printing testará quando tablet disponível.

---

### 2.4 Print History ⏸️

**Feature:** Track printed labels

**Test:**
- [ ] Print 3 different labels
- [ ] Navigate to Print History
- [ ] Verify 3 entries appear
- [ ] Check timestamp
- [ ] Check team member attribution
- [ ] Test search/filter
- [ ] Test export to CSV

**Status:** ⏸️ Not Started

**Results:**
```
History Records: ___ (✅ / ❌)
Timestamps: ___ (✅ / ❌)
Attribution: ___ (✅ / ❌)
Search: ___ (✅ / ❌)
Issues: ___
```

---

## ⚡ 3. PERFORMANCE & POLISH

### 3.1 Lighthouse Audit ⏸️

**Target:** Score > 70

**Run Lighthouse:**
```bash
# Chrome DevTools → Lighthouse → Generate Report
```

**Metrics:**
- [ ] Performance: ___ (target >70)
- [ ] Accessibility: ___ (target >90)
- [ ] Best Practices: ___ (target >90)
- [ ] SEO: ___ (target >80)

**Status:** ⏸️ Not Started

**Results:**
```
Performance: ___
Accessibility: ___
Best Practices: ___
SEO: ___
Issues to Fix: ___
```

---

### 3.2 Bundle Analysis ⏸️

**Check bundle sizes:**

**Current:**
- vendor: 1,210.99 kB (gzip: 373.04 kB)
- index: 566.16 kB (gzip: 132.73 kB)
- jspdf: 337.98 kB (gzip: 110.24 kB)
- html2canvas: 201.40 kB (gzip: 47.48 kB)

**Verify:**
- [ ] No unexpected large chunks
- [ ] Dynamic imports working
- [ ] Tree shaking effective
- [ ] No duplicate dependencies

**Status:** ⏸️ Not Started

**Results:**
```
Bundle Size OK: ___ (✅ / ❌)
Issues: ___
Optimizations: ___
```

---

### 3.3 Bug Fixes ⏸️

**Bugs encontrados durante testing:**

| ID | Severity | Description | Status |
|---|---|---|---|
| - | - | - | - |

**Status:** ⏸️ Not Started

---

## 📊 PROGRESS SUMMARY

### Features Tested:
```
□ 1.1 Labeling Page Load
□ 1.2 Products CRUD
□ 1.3 Quick Print Grid
□ 1.4 Allergen Badges
□ 1.5 Duplicate Warning
□ 2.1 PDF Generation
□ 2.2 Label Layout
□ 2.3 Zebra Printer Flow
□ 2.4 Print History
□ 3.1 Lighthouse Audit
□ 3.2 Bundle Analysis
□ 3.3 Bug Fixes

Total: 0/12 (0%)
```

### Time Tracking:
```
Manhã:  ___ hours
Tarde:  ___ hours
Noite:  ___ hours
Total:  ___ / 10 hours
```

### Bugs Found:
```
Blocker:  0
Critical: 0
Major:    0
Minor:    0
Total:    0
```

---

## 🎯 SUCCESS CRITERIA

### ✅ Must Pass:
- [ ] Labeling page loads without errors
- [ ] Products CRUD working
- [ ] Quick Print grid functional
- [ ] PDF generation working
- [ ] Labels print correctly

### 🎯 Should Pass:
- [ ] Lighthouse score >70
- [ ] All allergen badges display
- [ ] Print history tracking
- [ ] Duplicate warning working

### 🌟 Nice to Have:
- [ ] Lighthouse score >80
- [ ] Zero console errors
- [ ] Zebra printer schema validated

---

## 📝 NOTES

### Observações:
_Adicionar durante testing..._

### Issues Encontrados:
_Adicionar durante testing..._

### Next Steps:
_Definir no final do dia..._

---

**ÚLTIMA ATUALIZAÇÃO:** 22 Jan 2026, 09:00  
**PRÓXIMA ATUALIZAÇÃO:** 22 Jan 2026, 18:00  
**STATUS:** ⏸️ Ready to Start
