# 🚀 Quick Deploy Reference Card

**NEVER PUSH WITHOUT THIS CHECKLIST!**

---

## Before Every Push to Main:

```powershell
# Run this ONE command:
npm run pre-push
```

If it passes, then:
```powershell
git push origin main
```

Then **IMMEDIATELY** monitor Vercel deployment for 5 minutes!

---

## For Risky Changes:

```powershell
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes, then test
npm run build
npm run preview

# 3. Push to preview
git push origin feature/my-feature

# 4. Test in Vercel preview environment

# 5. If good, merge to main
git checkout main
git merge feature/my-feature
git push origin main
```

---

## Emergency Rollback:

```powershell
# Undo last commit
git revert HEAD --no-edit
git push origin main

# Or undo specific commit
git revert <commit-hash> --no-edit
git push origin main
```

---

## Test Production Build:

```powershell
npm run safe-deploy
# This runs: type-check → build → preview
# Test at http://localhost:4173
```

---

## Remember:

✅ **Safe:** Docs, CSS, small text changes  
⚠️ **Risky:** JSX structure, dependencies, build config  

❌ **Never push if:**
- Build fails
- TypeScript errors
- Haven't tested production preview
- It's 2 AM and you're tired 😴

✅ **Always:**
- Test production build first
- Monitor after deployment
- Document incidents
- Learn from mistakes

---

**Created after the January 26, 2026 incident**  
**Never forget: 15 minutes of testing beats 15 minutes of panic!**
