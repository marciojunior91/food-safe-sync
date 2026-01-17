# Monitoring & Metrics - Iteration 10

**Feature**: Duplicate Product Detection System  
**Monitoring Period**: First 30 days post-deployment  
**Last Updated**: December 16, 2025

---

## 📊 Key Performance Indicators (KPIs)

### 1. System Health Metrics

#### A. Error Rate
**Target**: <1% error rate

**How to Monitor**:
```sql
-- Check for failed RPC calls (last 24 hours)
SELECT 
  COUNT(*) as total_calls,
  COUNT(CASE WHEN error IS NOT NULL THEN 1 END) as failed_calls,
  (COUNT(CASE WHEN error IS NOT NULL THEN 1 END)::FLOAT / COUNT(*)::FLOAT * 100) as error_rate
FROM audit_logs 
WHERE 
  action = 'find_similar_products'
  AND created_at > NOW() - INTERVAL '24 hours';
```

**Browser Console Monitoring**:
```javascript
// Look for these errors:
// ❌ "400 Bad Request" - RPC type mismatch (should be GONE)
// ❌ "403 Forbidden" - RLS violation (should be GONE)
// ✅ No errors = healthy system
```

#### B. Response Time
**Target**: <500ms for duplicate detection

**How to Measure**:
```javascript
// In browser console, check Network tab
// Filter for: "find_similar_products"
// Look at "Time" column
// ✅ Green (<300ms) = Excellent
// ⚠️ Yellow (300-500ms) = Acceptable
// ❌ Red (>500ms) = Needs optimization
```

**Database Query**:
```sql
-- Check slow queries
SELECT 
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
WHERE query LIKE '%find_similar_products%'
ORDER BY mean_exec_time DESC;
```

---

### 2. Usage Metrics

#### A. Duplicate Detection Usage
**Target**: 80%+ of product creation attempts use duplicate check

**How to Track**:
```sql
-- Count products created with/without duplicate check
SELECT 
  COUNT(*) FILTER (WHERE checked_for_duplicates = true) as with_check,
  COUNT(*) FILTER (WHERE checked_for_duplicates = false) as without_check,
  COUNT(*) as total,
  (COUNT(*) FILTER (WHERE checked_for_duplicates = true)::FLOAT / COUNT(*)::FLOAT * 100) as usage_rate
FROM products
WHERE created_at > NOW() - INTERVAL '7 days';
```

**Note**: You may need to add a `checked_for_duplicates` column to track this, or infer from audit logs.

#### B. Duplicate Warning Frequency
**Target**: 20-30% of product creation attempts trigger warnings

**How to Track**:
```sql
-- Approximate based on similar product matches
WITH recent_products AS (
  SELECT id, name, created_at
  FROM products
  WHERE created_at > NOW() - INTERVAL '7 days'
)
SELECT 
  rp.id,
  rp.name,
  COUNT(sp.product_id) as similar_products_found
FROM recent_products rp
CROSS JOIN LATERAL (
  SELECT * FROM find_similar_products(rp.name, rp.organization_id, 0.3)
) sp
GROUP BY rp.id, rp.name
HAVING COUNT(sp.product_id) > 0;
```

#### C. Blocking Events
**Target**: 5-10% of creation attempts blocked (85%+ similarity)

**Manual Tracking**:
- Monitor user reports of "Cannot create product" scenarios
- Check console logs for "Very likely duplicate" warnings
- Review support tickets related to blocked creation

---

### 3. Data Quality Metrics

#### A. Duplicate Product Reduction
**Target**: -70% duplicate products within 30 days

**Baseline Measurement (Day 0)**:
```sql
-- Take snapshot BEFORE deployment
SELECT COUNT(*) as duplicate_pairs
FROM (
  SELECT 
    p1.id as id1,
    p2.id as id2,
    p1.name,
    SIMILARITY(LOWER(p1.name), LOWER(p2.name)) as similarity
  FROM products p1
  JOIN products p2 ON p1.organization_id = p2.organization_id
  WHERE 
    p1.id < p2.id
    AND SIMILARITY(LOWER(p1.name), LOWER(p2.name)) >= 0.85
) duplicates;
```

**Progress Tracking (Weekly)**:
```sql
-- Run same query weekly to track reduction
-- Week 1: Target -20% reduction
-- Week 2: Target -40% reduction
-- Week 3: Target -55% reduction
-- Week 4: Target -70% reduction
```

#### B. Merge Activity
**Target**: 10-20 merges per week (varies by organization size)

**How to Track**:
```sql
-- Track merge operations
SELECT 
  DATE_TRUNC('week', created_at) as week,
  COUNT(*) as merge_operations,
  COUNT(DISTINCT user_id) as unique_users
FROM audit_logs
WHERE action = 'merge_products'
GROUP BY week
ORDER BY week DESC;
```

---

### 4. User Behavior Metrics

#### A. False Positive Rate
**Target**: <10% of warnings are false positives

**How to Measure**:
- Survey users: "How often are duplicate warnings inaccurate?"
- Track "Create Anyway" clicks vs. "Select Existing" clicks
- Monitor support tickets about "incorrect warnings"

**Suggested Survey**:
```
On a scale of 1-5:
1 = Warnings are almost never accurate
3 = Warnings are accurate about half the time
5 = Warnings are almost always accurate

Collect responses after 2 weeks of use
Target: Average rating ≥ 4.0
```

#### B. User Adoption Rate
**Target**: 100% of active users use duplicate detection within 2 weeks

**How to Track**:
```sql
-- Users who have created products with duplicate checks
SELECT 
  COUNT(DISTINCT user_id) as users_using_feature,
  (SELECT COUNT(*) FROM profiles WHERE is_active = true) as total_active_users,
  (COUNT(DISTINCT user_id)::FLOAT / (SELECT COUNT(*) FROM profiles WHERE is_active = true)::FLOAT * 100) as adoption_rate
FROM audit_logs
WHERE 
  action = 'check_duplicates'
  AND created_at > NOW() - INTERVAL '14 days';
```

#### C. Admin Engagement
**Target**: 80% of admins/managers access merge UI within 1 week

**How to Track**:
```sql
-- Admins who have accessed merge UI
SELECT 
  COUNT(DISTINCT al.user_id) as admins_using_merge,
  (SELECT COUNT(*) FROM user_roles WHERE role IN ('admin', 'manager')) as total_admins,
  (COUNT(DISTINCT al.user_id)::FLOAT / (SELECT COUNT(*) FROM user_roles WHERE role IN ('admin', 'manager'))::FLOAT * 100) as engagement_rate
FROM audit_logs al
JOIN user_roles ur ON al.user_id = ur.user_id
WHERE 
  al.action = 'view_merge_admin'
  AND ur.role IN ('admin', 'manager')
  AND al.created_at > NOW() - INTERVAL '7 days';
```

---

## 🔍 Monitoring Checklist

### Daily (First Week)
- [ ] Check browser console for errors (5 min)
- [ ] Review Supabase logs for API errors (5 min)
- [ ] Monitor user feedback/support tickets (10 min)
- [ ] Check response times in Network tab (5 min)

### Weekly (First Month)
- [ ] Run duplicate reduction query (5 min)
- [ ] Calculate merge operations count (5 min)
- [ ] Review false positive feedback (10 min)
- [ ] Analyze user adoption rate (5 min)
- [ ] Check admin engagement (5 min)

### Monthly (Ongoing)
- [ ] Generate comprehensive metrics report (30 min)
- [ ] Compare baseline vs current state (15 min)
- [ ] Identify optimization opportunities (30 min)
- [ ] Plan Iteration 11 enhancements (1 hour)

---

## 📈 Metrics Dashboard (Optional)

### Create Custom Dashboard

**Option 1: Supabase + Metabase**
```sql
-- Create views for easy dashboard integration
CREATE OR REPLACE VIEW duplicate_detection_metrics AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as duplicate_checks,
  COUNT(*) FILTER (WHERE similarity_score >= 0.85) as blocking_events,
  COUNT(*) FILTER (WHERE similarity_score >= 0.30 AND similarity_score < 0.85) as warning_events,
  AVG(response_time_ms) as avg_response_time
FROM audit_logs
WHERE action = 'check_duplicates'
GROUP BY date
ORDER BY date DESC;
```

**Option 2: Custom React Component**
```tsx
// Future enhancement: Add metrics dashboard to admin UI
// Location: src/components/admin/MetricsDashboard.tsx
// Features:
// - Real-time duplicate detection stats
// - Error rate chart
// - Merge activity timeline
// - User adoption funnel
```

---

## 🎯 Success Criteria

### Week 1 (Stabilization)
- ✅ Error rate: <1%
- ✅ No critical bugs reported
- ✅ Response time: <500ms
- ✅ User adoption: >50%

### Week 2 (Growth)
- ✅ Duplicate reduction: -20%
- ✅ User adoption: >80%
- ✅ Admin engagement: >70%
- ✅ False positive rate: <15%

### Week 4 (Maturity)
- ✅ Duplicate reduction: -70%
- ✅ User adoption: 100%
- ✅ Admin engagement: 100%
- ✅ False positive rate: <10%

---

## 🚨 Alert Thresholds

### Critical Alerts (Immediate Action)
- 🔴 Error rate >5%
- 🔴 Response time >2000ms
- 🔴 System downtime
- 🔴 Data loss or corruption

### Warning Alerts (Review within 24h)
- 🟡 Error rate 1-5%
- 🟡 Response time 500-2000ms
- 🟡 False positive rate >20%
- 🟡 User adoption <50% after week 2

### Info Alerts (Review weekly)
- 🟢 Merge operations trending down (may indicate low duplicate rate)
- 🟢 Duplicate warnings trending up (may need threshold adjustment)
- 🟢 User feedback trends

---

## 📝 Reporting Template

### Weekly Status Report

```markdown
## Duplicate Detection - Week X Report

**Date Range**: [Start Date] to [End Date]

### 🎯 Key Metrics
- Error Rate: X.XX% (Target: <1%)
- Response Time: XXXms (Target: <500ms)
- Duplicate Reduction: -XX% (Target: -70% by Week 4)
- User Adoption: XX% (Target: 100% by Week 4)
- Merge Operations: XX merges

### 📊 Highlights
- [Positive finding 1]
- [Positive finding 2]
- [Positive finding 3]

### ⚠️ Issues
- [Issue 1 and resolution]
- [Issue 2 and resolution]

### 📋 Next Week Focus
- [Action item 1]
- [Action item 2]
- [Action item 3]

### 💬 User Feedback
- [Quote 1]
- [Quote 2]
```

---

## 🛠️ Optimization Opportunities

### If Response Time >500ms
1. Add database index:
   ```sql
   CREATE INDEX idx_products_name_gin ON products USING GIN (LOWER(name) gin_trgm_ops);
   ```

2. Reduce LIMIT in find_similar_products (10 → 5)

3. Add caching layer (Redis)

### If False Positive Rate >15%
1. Adjust similarity thresholds:
   - Warning: 30% → 35%
   - Blocking: 85% → 90%

2. Add fuzzy matching improvements

3. Exclude common words (the, a, with, etc.)

### If User Adoption <80%
1. Add onboarding tour
2. Show success metrics (duplicates prevented)
3. Gamify (badges for using feature)
4. Send reminder notifications

---

## 📚 Resources

### Documentation
- `PRODUCTION_DEPLOYMENT_GUIDE.md` - Deployment steps
- `UAT_QUICK_START.md` - User testing guide
- `TESTING_MERGE_ADMIN_ACCESS.md` - Admin guide
- `ITERATION_10_COMPLETE.md` - Technical overview

### SQL Queries
- All monitoring queries available in this document
- Copy-paste ready for Supabase SQL Editor

### Support
- Check `docs/iteration-10-duplicate-detection/` for full documentation
- Review error logs in Supabase Dashboard → Logs
- Monitor browser console for client-side errors

---

**Monitoring Owner**: System Administrator  
**Review Frequency**: Daily (Week 1), Weekly (Month 1), Monthly (Ongoing)  
**Last Updated**: December 16, 2025

---

🎉 **Happy Monitoring! Track your success and optimize as needed!**
