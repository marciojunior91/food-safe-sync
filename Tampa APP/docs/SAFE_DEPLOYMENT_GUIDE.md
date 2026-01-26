# 🛡️ Safe Deployment Guide

> **Created after production incident on January 26, 2026**  
> Never let a blank screen happen again!

---

## 📋 Pre-Deployment Checklist

### Every Single Time Before Pushing to Main:

```powershell
# Run the automated safety check
.\scripts\pre-push-check.ps1
```

**Manual Checklist:**
- [ ] TypeScript compiles without errors
- [ ] Production build succeeds (`npm run build`)
- [ ] Test the production preview (`npm run preview`)
- [ ] Check browser console for errors
- [ ] Test critical user flows:
  - [ ] Login/Authentication
  - [ ] Dashboard loads
  - [ ] Labeling workflow works
  - [ ] No console errors
- [ ] Review git diff one more time
- [ ] All changes are committed

---

## 🚦 Deployment Workflow

### Option 1: Feature Branch (Recommended for Risky Changes)

```powershell
# 1. Create feature branch
git checkout -b feature/my-new-feature

# 2. Make your changes
# ... code, code, code ...

# 3. Test locally
npm run build
npm run preview
# Test thoroughly!

# 4. Commit changes
git add .
git commit -m "feat: Description of changes"

# 5. Push to feature branch
git push origin feature/my-new-feature

# 6. Test in Vercel preview deployment
# Go to Vercel dashboard, find preview deployment
# Test in production-like environment

# 7. If all good, merge to main
git checkout main
git merge feature/my-new-feature
git push origin main

# 8. Monitor production deployment
# Watch Vercel, check for errors
```

### Option 2: Direct to Main (Only for Safe Changes)

```powershell
# 1. Run safety check
.\scripts\pre-push-check.ps1

# 2. If passed, push
git push origin main

# 3. Monitor immediately
# - Watch Vercel deployment
# - Check production URL
# - Monitor for 5-10 minutes
```

---

## 🎯 What's a "Safe" vs "Risky" Change?

### ✅ Safe Changes (Can push directly to main)
- Documentation updates
- CSS-only styling changes
- Adding comments
- Fixing typos
- Minor text changes
- Adding console.logs for debugging

### ⚠️ Risky Changes (Use feature branch + preview)
- **Changing component structure** (like the Jan 26 incident)
- Modifying build configuration
- Updating dependencies
- Refactoring with file renames
- Database schema changes
- Authentication changes
- Any change to core routing
- **Anything that changes JSX structure significantly**

---

## 🔧 Testing Commands

### Local Testing
```powershell
# Type check
npm run type-check

# Build production bundle
npm run build

# Preview production build locally
npm run preview
# Open http://localhost:4173 and test

# Lint check
npm run lint

# All checks at once
.\scripts\pre-push-check.ps1
```

### Build Analysis
```powershell
# Analyze bundle size and composition
npm run build

# Check dist folder size
Get-ChildItem -Path dist -Recurse | Measure-Object -Property Length -Sum

# Look for suspiciously large files
Get-ChildItem -Path dist/assets -Recurse | Sort-Object Length -Descending | Select-Object -First 10
```

---

## 🚨 If You Break Production

### Immediate Response (0-5 min)

1. **Stay Calm** - You have a rollback plan!

2. **Identify the bad commit:**
   ```powershell
   git log --oneline -5
   ```

3. **Revert immediately:**
   ```powershell
   git revert <bad-commit-hash> --no-edit
   git push origin main
   ```

4. **Verify fix:**
   - Check Vercel deployment completes
   - Test production URL
   - Check browser console

### Investigation (5-15 min)

5. **What went wrong?**
   ```powershell
   # See what changed
   git show <bad-commit-hash>
   
   # Test locally
   git checkout <bad-commit-hash>
   npm run build
   # Check for errors
   ```

6. **Document the incident:**
   - Create a HOTFIX_*.md file in docs/
   - Include error messages
   - Document what you learned
   - Update this guide if needed

---

## 📊 Monitoring After Deploy

### First 5 Minutes (Critical)
- [ ] Vercel deployment shows "Ready"
- [ ] Production URL loads (no blank screen!)
- [ ] Browser console shows no errors
- [ ] Quick test of main features

### Next 30 Minutes
- [ ] Check Vercel analytics (if available)
- [ ] Monitor for error reports
- [ ] Test on different browsers/devices
- [ ] Check database for any unexpected data

### Next 24 Hours
- [ ] Keep notifications on
- [ ] Monitor for user reports
- [ ] Check error tracking (if configured)
- [ ] Be ready to rollback if issues appear

---

## 🎓 Lessons from January 26, 2026 Incident

### What Happened
- Mobile responsiveness changes to BulkActions.tsx
- Complex JSX restructuring caused circular dependency
- Production build created module initialization error
- Blank screen for all users
- 15 minutes downtime

### Root Cause
- Didn't test production build before pushing
- Complex structural changes without proper testing
- Production bundler (Rollup) behaved differently than dev (esbuild)
- Variable accessed before initialization in minified code

### What We Learned
1. **Always test production builds** - `npm run build && npm run preview`
2. **Use feature branches for risky changes**
3. **Small, incremental changes are safer**
4. **Production can break even if dev works**
5. **Have a fast rollback plan** - `git revert` is your friend

---

## 🔄 Git Best Practices

### Commit Messages
```powershell
# Good commit messages
git commit -m "feat: Add user profile editing"
git commit -m "fix: Resolve blank screen in BulkActions"
git commit -m "docs: Update deployment guide"
git commit -m "refactor: Simplify authentication flow"

# Bad commit messages
git commit -m "fix stuff"
git commit -m "updates"
git commit -m "wip"
```

### Branch Naming
```powershell
# Feature branches
feature/mobile-responsiveness
feature/qr-scanner
feature/bulk-actions-ui

# Fix branches
fix/blank-screen-issue
fix/auth-redirect-loop
hotfix/production-error

# Refactor branches
refactor/component-structure
refactor/database-queries
```

---

## 🛠️ Setup Prevention Tools

### 1. Install Pre-commit Hook (Optional)
```powershell
# Create .git/hooks/pre-commit
# (Advanced users only)
```

### 2. Configure Package.json Scripts
```json
{
  "scripts": {
    "pre-push": "powershell -ExecutionPolicy Bypass -File ./scripts/pre-push-check.ps1",
    "type-check": "tsc --noEmit",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  }
}
```

### 3. GitHub Actions (Already Configured)
- Build check on every push
- TypeScript validation
- Bundle size monitoring

---

## 📝 Deployment Log Template

After each deployment, log it:

```markdown
## Deployment - [Date]

**Branch:** main  
**Commit:** [hash]  
**Changes:** [brief description]  

**Pre-Deploy:**
- [x] Ran pre-push check
- [x] Tested production build
- [x] Reviewed changes

**Post-Deploy:**
- [x] Verified deployment successful
- [x] No console errors
- [x] Tested critical flows

**Status:** ✅ Success / ⚠️ Issues / ❌ Rolled back
**Notes:** [any observations]
```

---

## 🎯 Quick Reference Commands

```powershell
# The one command to rule them all
.\scripts\pre-push-check.ps1

# Manual testing
npm run build              # Build for production
npm run preview            # Test production build
npm run type-check         # Check TypeScript

# Emergency rollback
git revert HEAD --no-edit  # Revert last commit
git push origin main       # Deploy rollback

# Check what's different
git diff HEAD~1            # Compare with previous commit
git log --oneline -5       # Recent commits

# Branch workflow
git checkout -b feature/my-feature  # Create feature branch
git push origin feature/my-feature  # Push to remote
git checkout main                   # Back to main
git merge feature/my-feature        # Merge when ready
```

---

## ✅ Success Criteria

You're doing it right if:
- ✅ No production incidents in the last 30 days
- ✅ Every push goes through the safety check
- ✅ Risky changes use feature branches
- ✅ You test production builds before pushing
- ✅ Rollback plan is clear and fast
- ✅ All deployments are documented

---

## 📚 Additional Resources

- [Vercel Deployment Docs](https://vercel.com/docs)
- [Git Revert Guide](https://git-scm.com/docs/git-revert)
- [Vite Build Docs](https://vitejs.dev/guide/build.html)
- [React Production Best Practices](https://react.dev/learn/production)

---

**Remember:** It's better to take 10 extra minutes testing than to spend 15 minutes in panic mode with production down! 🚀

**Last Updated:** January 26, 2026  
**Next Review:** After any production incident
