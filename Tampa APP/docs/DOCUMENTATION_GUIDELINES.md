# Documentation Guidelines for Future Iterations

**Date:** December 16, 2025  
**Purpose:** Streamline documentation to be concise and action-focused

---

## 📋 New Approach: Light & Fast

### ❌ **OLD Way (Too Heavy):**
- Multiple long markdown files (4-5 files per iteration)
- Extensive explanations and rationale
- Detailed testing checklists
- Multiple summary documents
- Result: Takes too long, too much reading

### ✅ **NEW Way (Light & Fast):**
- **1 README.md** per iteration (concise)
- **1 script file** (well-commented)
- **Optional:** 1 quick reference if needed
- Result: Fast to read, easy to execute

---

## 📝 Documentation Structure Per Iteration

```
docs/iteration-{N}-{name}/
├── README.md (150-300 lines max) ← ONLY ESSENTIAL INFO
└── {script}.mjs or {script}.sql ← WELL COMMENTED CODE
```

### README.md Template (Concise)

```markdown
# Iteration {N}: {Title}

**Goal:** {One sentence}  
**Status:** {Emoji + status}

## Problem
{2-3 sentences max}

## Solution
{Bullet points, no paragraphs}

## Files
- `{script}` - {What it does}

## Usage
```bash
{Single command to run}
```

## Impact
- Before: {X}
- After: {Y}

## Verification
{3-4 step checklist}

---
**Done!** ✅
```

---

## 🚀 Script Documentation

### In-Code Comments (Prefer This Over Separate Docs)

```javascript
/**
 * {Script Title}
 * 
 * What: {One sentence}
 * Why: {One sentence}
 * Impact: {One sentence}
 * 
 * Usage: node {script}.mjs
 */

// Step 1: {What}
// Step 2: {What}
// Step 3: {What}

// Good comments explain WHY, not WHAT
// Code shows WHAT, comments show WHY
```

---

## 📊 What to SKIP

### ❌ Don't Create These Anymore:
1. **Multiple summary files** (SUMMARY.md, COMPLETE.md, etc.)
2. **Extensive testing guides** (just 3-5 bullet points)
3. **Detailed rationale documents** (put in README if needed)
4. **Separate "how to apply" docs** (put in README)
5. **Long problem descriptions** (2-3 sentences max)

### ❌ Don't Repeat:
- Main `docs/README.md` already has iteration list
- Don't duplicate info across files
- Don't explain basic concepts repeatedly

---

## ✅ What to KEEP

### Essential Elements:
1. **Problem statement** (2-3 sentences)
2. **Solution approach** (bullet points)
3. **Executable script** (well-commented)
4. **Single command to run**
5. **Before/After comparison** (numbers only)

---

## 🎯 Example: Light Documentation

### Good Example (Iteration 7 - Improved)

```
docs/iteration-7-remove-duplicate-subcategories/
├── README.md (200 lines) ← Problem, solution, usage, impact
└── delete-duplicates.mjs (250 lines) ← Commented script
```

**README.md (Concise):**
```markdown
# Iteration 7: Remove Duplicate Subcategories

**Goal:** Fix TypeScript errors from duplicate keys  
**Status:** ✅ Complete

## Problem
TypeScript won't compile - 3 subcategories appear in multiple categories.

## Solution
- Keep originals in Bakery & Raw Ingredients
- Delete duplicates from Desserts & Vegetables
- Run script to apply changes

## Usage
```bash
node docs/iteration-7-remove-duplicate-subcategories/delete-duplicates.mjs
```

## Impact
- Subcategories: 74 → 71
- TypeScript errors: 3 → 0

## Verify
1. Run script
2. Check terminal output shows 71 total
3. Test app (Ctrl+Shift+R)

**Done!** ✅
```

---

## 📐 Size Guidelines

| File Type | Max Length | Focus |
|---|---|---|
| README.md | 150-300 lines | Problem → Solution → Usage |
| Script (.mjs) | 200-400 lines | Well-commented, single responsibility |
| SQL (.sql) | 100-200 lines | Comments explain intent |
| Summary (optional) | 50-100 lines | Only if complex iteration |

---

## 🎨 Writing Style

### ✅ DO:
- **Be direct:** "Delete 3 duplicates" not "We need to carefully remove..."
- **Use bullets:** Not paragraphs
- **Show commands:** Not "you should run..."
- **Use tables:** For before/after comparisons
- **Use emojis:** Quick visual scanning

### ❌ DON'T:
- Repeat yourself
- Explain obvious things
- Write long paragraphs
- Create multiple files saying same thing
- Add "additional context" sections

---

## 🔄 Update Process

### Main docs/README.md
**Only update:**
1. Add iteration to list (3-4 lines)
2. Update current state numbers
3. That's it!

**Don't:**
- Rewrite entire file
- Add extensive explanations
- Duplicate iteration content

---

## 📦 Real Examples

### Too Heavy (OLD):
```
iteration-6-sauces-subcategory/
├── README.md (400 lines) ❌ Too long
├── SAUCES_SUBCATEGORY_ADDITION.md (300 lines) ❌ Duplicate
├── DUPLICATE_REMOVAL_SUMMARY.md (200 lines) ❌ Unnecessary
├── ITERATION_6_COMPLETE.md (250 lines) ❌ More duplication
├── add-sauces-subcategory.mjs
└── reassign-tomato-sauce.mjs
Total: 1150+ lines of docs ❌
```

### Just Right (NEW):
```
iteration-8-{feature}/
├── README.md (200 lines) ✅ Concise
└── {feature-script}.mjs (300 lines) ✅ Well-commented
Total: 500 lines ✅
```

---

## 🎯 Quick Checklist Before Creating Iteration

Before creating documentation, ask:

- [ ] Can I explain problem in 2-3 sentences?
- [ ] Can solution be bullet points?
- [ ] Is script self-documenting with comments?
- [ ] Can user run in 1 command?
- [ ] Am I creating only essential files?
- [ ] Am I avoiding duplication?

If all YES → Good to go! ✅  
If any NO → Simplify more!

---

## 💡 Benefits

### Light Documentation:
- ✅ Faster to write (save time)
- ✅ Faster to read (save user time)
- ✅ Easier to maintain
- ✅ Less clutter
- ✅ Focus on action, not explanation

### Heavy Documentation:
- ❌ Takes longer to create
- ❌ Takes longer to read
- ❌ Often redundant
- ❌ Harder to maintain
- ❌ User has to hunt for info

---

## 🚀 Template for Next Iteration

```bash
# Create new iteration
mkdir docs/iteration-8-{name}

# Create README (use template)
# - Problem: 2-3 sentences
# - Solution: Bullets
# - Usage: Single command
# - Impact: Numbers only

# Create script (well-commented)
# - Header comment explains what/why/impact
# - Inline comments explain complex logic only

# Update main docs/README.md
# - Add 3-4 lines to iteration list
# - Update current state numbers

# Done! No more files needed!
```

---

## ✅ Summary

**Philosophy:** Code > Comments > Docs

1. **Good code** is self-documenting
2. **Good comments** explain intent
3. **Good docs** are brief and actionable

**Remember:** We're building software, not writing novels! 📝→🚀

---

**Future iterations will be:**
- 🎯 Focused
- ⚡ Fast
- 📋 Actionable
- 🚀 Efficient

**Goodbye to:**
- 📚 Lengthy explanations
- 🔁 Repetitive documentation
- 📑 Multiple summary files
- ⏰ Time-consuming docs

---

**This guideline saved to:** `docs/DOCUMENTATION_GUIDELINES.md`  
**Apply starting:** Iteration 8+
