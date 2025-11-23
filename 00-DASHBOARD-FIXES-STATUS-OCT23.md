# Dashboard Failures - Fix Status & Action Plan
**Date:** October 23, 2025  
**Investigation Completed:** ✅  
**Priority 1 Fixes Applied:** ✅  

---

## Status Dashboard

| Priority | Issue | Status | Impact |
|----------|-------|--------|--------|
| 🔴 P1 | BI Query Filter (`WHERE status != 'draft'`) | ✅ **FIXED** | Vertical/Service widgets will now load |
| 🔴 P2 | Backfill Tags (0 of 38 SOWs tagged) | ⏳ **MANUAL TRIGGER NEEDED** | Tags not yet populated |
| 🔴 P3 | Financial Data ($0.00 all SOWs) | ⏳ **NEEDS SCRIPT** | Prices not extracted from content |

---

## ✅ Priority 1: COMPLETE

### What Was Fixed
**Files Modified:**
- `frontend/app/api/analytics/by-vertical/route.ts`
- `frontend/app/api/analytics/by-service/route.ts`

**Change:**
```sql
-- BEFORE (WRONG - filters out all draft SOWs)
FROM sows WHERE status != 'draft'

-- AFTER (CORRECT - includes all SOWs)
FROM sows
```

**Why This Matters:**
- **All 38 SOWs are in 'draft' status** (verified from database)
- Old query returned ZERO rows → widgets showed "No data yet"
- New query will return all 38 SOWs
- Once tags are populated, dashboard will aggregate by vertical/service properly

### Expected Result After P1
```
GET /api/analytics/by-vertical returns:
{
  "success": true,
  "verticals": [
    {
      "vertical": "other",
      "sow_count": 38,
      "total_value": 0,
      "avg_deal_size": 0,
      "win_rate": 0
    }
  ]
}
✅ Now shows 38 SOWs grouped as 'other' (since none are tagged yet)
```

**Commit:** `ea82a35` - Pushed to enterprise-grade-ux branch ✅

---

## ⏳ Priority 2: Manual Action Required

### Trigger Backfill API to Tag SOWs

**Current State:**
- ❌ All 38 SOWs have `vertical = NULL, service_line = NULL`
- ❌ Backfill endpoint created Oct 22, but never invoked

**How to Fix:**

**Option A: cURL (From your local machine)**
```bash
curl -X GET http://sow.qandu.me/api/admin/backfill-tags
# Or if accessing from localhost:
curl -X GET http://localhost:3001/api/admin/backfill-tags
```

**Option B: Browser Console (From dashboard)**
```javascript
fetch('/api/admin/backfill-tags')
  .then(r => r.json())
  .then(data => console.log('Backfill result:', data))
```

**Expected Response (Success):**
```json
{
  "success": true,
  "updated_sows": 38,
  "failed_sows": 0,
  "total_processed": 38,
  "message": "Successfully backfilled tags for 38 SOWs",
  "details": [
    {
      "sow_id": "sow-xyz...",
      "title": "SOW Title",
      "vertical": "property",
      "service_line": "crm-implementation",
      "confidence": 0.85,
      "success": true
    },
    ...
  ]
}
```

**What Happens Inside:**
1. Script fetches all untagged SOWs
2. For each SOW, creates temporary thread in `sow-master-dashboard` workspace
3. Sends analysis prompt to AnythingLLM
4. Parses JSON response to extract vertical + service_line
5. Updates database: `UPDATE sows SET vertical = ?, service_line = ? WHERE id = ?`
6. Returns summary with success count

**Time to Complete:** 2-5 minutes (depends on AnythingLLM response time per SOW)

**After This Step Completes:**
```bash
# Verify in database
mysql> SELECT vertical, COUNT(*) FROM sows GROUP BY vertical;

# Expected: Distribution across verticals
| vertical                | COUNT(*) |
| property                | 8-10     |
| education               | 4-6      |
| finance                 | 3-5      |
| healthcare              | 2-4      |
| professional-services   | 2-4      |
| technology              | 2-4      |
| retail                  | 1-3      |
| hospitality             | 1-3      |
| other                   | 5-10     |
```

---

## ⏳ Priority 3: Financial Data Migration Script (30-45 minutes)

### Current State
- ❌ All 38 SOWs have `total_investment = 0.00`
- ✅ Pricing data exists in SOW `content` field (TipTap JSON with pricing tables)
- ❌ But data was never extracted/saved to `total_investment` column

### Root Cause
When SOWs are created:
1. User builds pricing tables in TipTap editor
2. Content saved as JSON to `content` field
3. `total_investment` remains at default `0`
4. **Pricing is never parsed from JSON**

### Solution: Create Migration Script

**Approach:**
1. Create Node.js script to read all SOWs
2. Parse TipTap JSON content
3. Extract pricing rows (find table with pricing data)
4. Sum the pricing total
5. Update `total_investment` in database

**Script Pseudocode:**
```typescript
// scripts/migrate-financial-data.ts
import { query } from '@/lib/db';

async function migrateFinancialData() {
  const sows = await query('SELECT id, title, content FROM sows WHERE total_investment = 0');
  
  for (const sow of sows) {
    const content = JSON.parse(sow.content); // TipTap JSON
    const totalValue = extractPricingTotal(content);
    
    await query(
      'UPDATE sows SET total_investment = ? WHERE id = ?',
      [totalValue, sow.id]
    );
  }
}

function extractPricingTotal(tipTapJson: any): number {
  // Find pricing table in content
  // Sum all pricing rows
  // Return total
}
```

**When to Run:**
- 🟢 **Recommended:** After tagging is complete (Priority 2)
- Can run anytime to populate existing SOWs

**Expected Result After Migration:**
```bash
mysql> SELECT SUM(total_investment), COUNT(*) FROM sows;
| SUM(total_investment) | COUNT(*) |
| $412,500.00           | 38       |  ← Was $0.00
```

**Impact on Dashboard:**
- Total Value KPI card: `$412,500.00` (instead of $0.00)
- Recent Activity: Shows actual values instead of $0
- Top Clients: Shows accurate totals per client

---

## Testing the Fixes

### After Priority 1 Fix (Already Applied)
```bash
# Should return data (with all 'other' until tags are populated)
curl http://sow.qandu.me/api/analytics/by-vertical

# Should show BI widgets in dashboard (showing "other" category)
# Dashboard > Pipeline by Vertical widget should no longer show "No data yet"
```

### After Priority 2 Complete (Backfill)
```bash
# Should show distribution across verticals
curl http://sow.qandu.me/api/analytics/by-vertical
# Response: verticals with actual sow_count > 0

# Dashboard > Pipeline by Vertical shows bars for each vertical
# Dashboard > Pipeline by Service Line shows bars for each service
```

### After Priority 3 Complete (Financial Migration)
```bash
# Should show total value
curl http://sow.qandu.me/api/dashboard/stats

# Response includes: "totalValue": 412500.00 (instead of 0)
# Dashboard > Total Value KPI shows $412,500.00
# Dashboard > Recent Activity shows values for each SOW
```

---

## Deployment Checklist

- [x] Priority 1 fixes applied and pushed to GitHub
- [ ] Frontend redeployed (Next.js must reload endpoints)
- [ ] Verify BI widgets load in dashboard
- [ ] Trigger backfill API manually
- [ ] Monitor backfill progress (check server logs)
- [ ] Verify tags populated in database
- [ ] Create and run financial migration script
- [ ] Verify dashboard metrics updated
- [ ] Final regression test

---

## Next Steps

**Immediate (Now):**
1. ✅ Priority 1 fixes applied + pushed

**Very Soon (Next 5 minutes):**
2. ⏳ Trigger Priority 2 (Backfill API) - manual action required
3. ⏳ Monitor backfill results

**Next 30-45 minutes:**
4. ⏳ Create Priority 3 script (financial data migration)
5. ⏳ Run migration script
6. ⏳ Verify all dashboard metrics updated

**Long-term (Future improvements):**
- Auto-extract financial data on SOW creation (prevent recurrence)
- Auto-run backfill on deployment (prevent manual trigger needed)
- Add error handling/retry logic for AnythingLLM failures
- Monitor dashboard health metrics

---

## Investigation Documentation

**Complete analysis available in:**
- `INVESTIGATION-REPORT-OCT23-DASHBOARD-FAILURES.md` - Root cause analysis with SQL queries
- This file - Fix status and action plan

**Database queries executed (verified via EasyPanel MySQL container):**
- ✅ Total SOWs: 38
- ✅ Tagged SOWs: 0
- ✅ Financial data: $0.00 (all zeros)
- ✅ SOW statuses: All 38 in 'draft'

**Commits:**
- `90b4da6` - SOW tagging system + backfill API (Oct 22)
- `ea82a35` - Fix BI query filters (Oct 23)

---

**Status:** 🟢 Priority 1 Complete | 🟡 Priority 2 Awaiting Manual Trigger | 🟡 Priority 3 In Planning
