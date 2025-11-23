# 🧪 SYSTEM AUDIT - TEST EXECUTION CHECKLIST

**Purpose:** Verify current vulnerabilities and validate fixes  
**Audience:** QA Team, Developers  
**Estimated Time:** 4-6 hours for complete test suite

---

## PRE-TEST SETUP

### Environment Configuration
- [ ] Access to staging environment
- [ ] Admin credentials for Rate Card management
- [ ] Database access for verification queries
- [ ] Browser DevTools open (Console tab)
- [ ] Network throttling tool ready (for offline tests)

### Test Data Preparation
- [ ] Create test Rate Card with 10 roles minimum
- [ ] Prepare 3 test budgets: $10K, $50K, $100K
- [ ] Set up test client: "AUDIT_TEST_CLIENT"
- [ ] Clear localStorage before starting

---

## SECTION 1: MANDATORY ROLES ENFORCEMENT

### Test 1.1: AI Returns Empty Roles Array
**Vulnerability:** #1 - No programmatic injection  
**Expected Failure:** YES (currently broken)

**Steps:**
1. Create new SOW
2. In browser console, monitor AI response
3. Simulate or force AI to return: `{ role_allocation: [] }`
4. Observe pricing table

**Current Expected Result:** ❌ Empty pricing table OR single default row  
**After Fix Result:** ✅ 3 mandatory roles present:
   - Tech - Head Of - Senior Project Management
   - Tech - Delivery - Project Coordination
   - Account Management - Senior Account Manager

**How to Force This:**
- Intercept API call to `/api/anythingllm/stream-chat`
- Mock response with empty role_allocation
- OR: Modify AI prompt to intentionally break it

**Verification Queries:**
```sql
-- Check if SOW was created with mandatory roles
SELECT * FROM sow_pricing_rows WHERE sow_id = '[test-sow-id]';
-- Should return at least 3 rows with mandatory role names
```

---

### Test 1.2: AI Returns Partial Roles (Missing One Mandatory)
**Vulnerability:** #1 - No programmatic injection  
**Expected Failure:** YES

**Steps:**
1. Create SOW with prompt: "Simple website project, minimal team"
2. Monitor AI response for role_allocation
3. Check if all 3 mandatory roles are present

**Current Expected Result:** ❌ AI might skip "Tech - Delivery - Project Coordination" for small projects  
**After Fix Result:** ✅ All 3 mandatory roles present, even if AI didn't suggest them

**Test Variations:**
- Very small budget ($5K) - AI might try to exclude roles
- Single-phase project - AI might think coordinator not needed
- Maintenance project - AI might skip project management

---

### Test 1.3: AI Uses Abbreviated Role Names
**Vulnerability:** #1 & #2 - Name normalization  
**Expected Failure:** PARTIAL (might work via fuzzy matching)

**Mock AI Response:**
```json
{
  "role_allocation": [
    { "role": "PM", "hours": 8 },
    { "role": "Project Coord", "hours": 6 },
    { "role": "Account Mgr", "hours": 8 }
  ]
}
```

**Current Expected Result:** ❌ Invalid role names in pricing table  
**After Fix Result:** ✅ Normalized to canonical names from Rate Card

---

### Test 1.4: Mandatory Roles Appear First (Ordering)
**Vulnerability:** #1 - No ordering enforcement  
**Expected Failure:** YES

**Steps:**
1. Create SOW with many roles (10+)
2. Check order of roles in pricing table
3. Verify mandatory roles at positions 1, 2, 3

**Current Expected Result:** ❌ Order depends on AI output  
**After Fix Result:** ✅ Mandatory roles always rows 1-3, other roles follow

---

## SECTION 2: RATE CARD VALIDATION

### Test 2.1: AI Suggests Incorrect Rate
**Vulnerability:** #5 - No override protection  
**Expected Failure:** UNKNOWN (needs verification)

**Setup:**
1. Check official rate for "Senior Developer" in Rate Card
2. Note the correct rate (e.g., $200/hour)

**Mock AI Response:**
```json
{
  "role_allocation": [
    { "role": "Senior Developer", "hours": 100, "rate": 999 }
  ]
}
```

**Test Method:**
- Intercept and modify AI response before it reaches component
- OR: Temporarily hack the AI service to return wrong rate

**Current Expected Result:** ❓ CRITICAL TEST - Does app accept 999 or override to 200?  
**After Fix Result:** ✅ Rate forced to $200 from Rate Card, 999 rejected

**Verification:**
```javascript
// In browser console after SOW loads
const pricingTable = document.querySelector('[data-type="pricing-table"]');
const rows = JSON.parse(pricingTable.dataset.rows);
console.log('Rates:', rows.map(r => ({ role: r.role, rate: r.rate })));

// Compare against Rate Card API
fetch('/api/rate-card')
  .then(r => r.json())
  .then(rateCard => {
    rows.forEach(row => {
      const official = rateCard.data.find(rc => rc.roleName === row.role);
      if (official && official.hourlyRate !== row.rate) {
        console.error('❌ RATE MISMATCH:', row.role, 'has', row.rate, 'should be', official.hourlyRate);
      }
    });
  });
```

---

### Test 2.2: Role Not in Rate Card
**Vulnerability:** #5 - Unknown role handling  
**Expected Failure:** UNKNOWN

**Mock AI Response:**
```json
{
  "role_allocation": [
    { "role": "Blockchain Ninja", "hours": 50, "rate": 300 }
  ]
}
```

**Current Expected Result:** ❓ Might accept it OR show error  
**After Fix Result:** ✅ Rejected with clear error: "Role 'Blockchain Ninja' not in Rate Card. Please select from dropdown."

---

### Test 2.3: Rate Card Update Reflects Immediately
**Vulnerability:** None (testing correct behavior)  
**Expected Failure:** NO

**Steps:**
1. Note current rate for "QA Engineer"
2. Update rate in Admin UI (/admin/rate-card)
3. Create new SOW with "QA Engineer" role
4. Verify new rate is used

**Current Expected Result:** ✅ Should work (Rate Card is dynamic)  
**After Fix Result:** ✅ Still works

---

## SECTION 3: BUDGET TOLERANCE

### Test 3.1: Total Exceeds Budget by 10%
**Vulnerability:** #6 - No enforcement  
**Expected Failure:** YES

**Steps:**
1. Set target budget: $50,000
2. Create SOW with roles totaling ~$55,000 (10% over)
3. Attempt to save/export

**Current Expected Result:** ❌ SOW saves successfully, no warning  
**After Fix Result:** ✅ Blocked with message: "Total $55,000 exceeds budget by 10%. Max allowed: 2%."

---

### Test 3.2: Total Within 2% Tolerance
**Vulnerability:** #6 - Tolerance threshold  
**Expected Failure:** NO (should pass)

**Steps:**
1. Set target budget: $50,000
2. Create SOW with roles totaling $50,900 (1.8% over)
3. Verify acceptance

**Current Expected Result:** ❓ No validation exists  
**After Fix Result:** ✅ Accepted (within tolerance)

---

### Test 3.3: Real-Time Budget Warning in UI
**Vulnerability:** #6 - UX improvement  
**Expected Failure:** YES (feature doesn't exist)

**Steps:**
1. Set budget: $50,000
2. Add roles one by one
3. Watch for budget indicator/warning

**Current Expected Result:** ❌ No real-time feedback  
**After Fix Result:** ✅ Shows: "Current: $53,000 (6% over budget) ⚠️"

---

## SECTION 4: GST FORMATTING

### Test 4.1: All Prices Display +GST Suffix
**Vulnerability:** #3 - Inconsistent formatting  
**Expected Failure:** PARTIAL

**Steps:**
1. Generate complete SOW
2. Export to HTML/PDF
3. Search document for all dollar amounts

**Verification Script:**
```javascript
// In browser console
const html = document.body.innerHTML;
const prices = html.match(/\$[\d,]+\.?\d*/g) || [];
console.log('Total price mentions:', prices.length);

const withGST = html.match(/\$[\d,]+\.?\d*\s*\+GST/g) || [];
console.log('With +GST suffix:', withGST.length);

if (prices.length !== withGST.length) {
  console.error('❌ INCONSISTENT GST FORMATTING');
  console.log('Missing +GST:', prices.length - withGST.length, 'instances');
}
```

**Current Expected Result:** ❌ Some prices missing +GST  
**After Fix Result:** ✅ 100% coverage

---

### Test 4.2: GST in Exported Excel
**Vulnerability:** #3 - Export consistency  
**Expected Failure:** UNKNOWN

**Steps:**
1. Generate SOW
2. Export to Excel
3. Open in Excel, check pricing table cells

**Current Expected Result:** ❓ Might be missing +GST  
**After Fix Result:** ✅ All cells show "$X,XXX.XX +GST"

---

## SECTION 5: COMMERCIAL ROUNDING

### Test 5.1: Total Rounds to Nearest $100
**Vulnerability:** #4 - Edge cases  
**Expected Failure:** PARTIAL

**Test Cases:**
| Raw Total | Expected Rounded | Test Method |
|-----------|------------------|-------------|
| $12,345.67 | $12,300 | Create SOW with manual role hours to hit this total |
| $12,350.00 | $12,400 | Midpoint - should round up |
| $12,399.99 | $12,400 | Just under next hundred |
| $99.00 | $100 | Small budget |
| $0.00 | $0 | Empty SOW |

**Verification:**
```javascript
// Check calculateTotal() function output
const pricingTable = document.querySelector('[data-pricing-total]');
const displayedTotal = parseFloat(pricingTable.textContent.replace(/[^0-9.]/g, ''));
const rawTotal = 12345.67; // Calculate from roles
const roundedTotal = Math.round(rawTotal / 100) * 100;
console.assert(displayedTotal === roundedTotal, 'Rounding incorrect');
```

---

### Test 5.2: Rounding Consistent Across Displays
**Vulnerability:** #4 - Multiple calculation points  
**Expected Failure:** POSSIBLE

**Steps:**
1. Generate SOW with total $12,345.67 (raw)
2. Check total in:
   - Pricing table component
   - Export preview
   - Exported Excel
   - Exported PDF
3. Verify all show $12,300

**Current Expected Result:** ❓ Might differ  
**After Fix Result:** ✅ All identical

---

## SECTION 6: DOCUMENT STRUCTURE

### Test 6.1: Section Order (Deliverables Before Phases)
**Vulnerability:** #7 - Prompt-based ordering  
**Expected Failure:** UNKNOWN (AI usually correct)

**Steps:**
1. Generate 10 SOWs with different project types
2. For each, verify section order:
   - Project Overview
   - Project Objectives
   - **Deliverables** ← Must be here
   - Project Phases ← Must be after Deliverables
   - Investment Breakdown

**Verification Script:**
```javascript
const doc = document.querySelector('.editor-content');
const headings = Array.from(doc.querySelectorAll('h2')).map(h => h.textContent);
const delivIndex = headings.findIndex(h => h.includes('Deliverable'));
const phaseIndex = headings.findIndex(h => h.includes('Phase'));

if (delivIndex > phaseIndex) {
  console.error('❌ WRONG ORDER: Phases before Deliverables');
} else {
  console.log('✅ Correct order');
}
```

**Current Expected Result:** ❌ Might be wrong 5-10% of the time  
**After Fix Result:** ✅ Always correct (structurally enforced)

---

### Test 6.2: Concluding Marker Always Present
**Vulnerability:** #8 - Redundant enforcement  
**Expected Failure:** NO (should work)

**Steps:**
1. Generate SOW
2. Scroll to bottom
3. Verify: "*** This concludes the Scope of Work document. ***"

**Verification:**
```javascript
const content = document.body.textContent;
const hasMarker = content.includes('*** This concludes the Scope of Work document. ***');
console.assert(hasMarker, 'Missing concluding marker');
```

**Current Expected Result:** ✅ Present (added programmatically)  
**After Fix Result:** ✅ Still present (cleaner implementation)

---

## SECTION 7: DATA INTEGRITY & AUTO-SAVE

### Test 7.1: Auto-Save to Database Works
**Vulnerability:** None (testing correct behavior)  
**Expected Failure:** NO

**Steps:**
1. Create new SOW
2. Type content in editor
3. Wait 3 seconds (debounce time)
4. Check browser Network tab for PATCH request
5. Verify response 200 OK

**Current Expected Result:** ✅ Should work  
**After Fix Result:** ✅ Still works

---

### Test 7.2: Network Failure Handling
**Vulnerability:** #9 - No offline fallback  
**Expected Failure:** YES

**Steps:**
1. Create SOW and start editing
2. Open DevTools → Network tab → Enable "Offline" mode
3. Continue editing for 30 seconds
4. Check localStorage for backup

**Current Expected Result:** ❌ No localStorage backup, data at risk  
**After Fix Result:** ✅ Changes saved to localStorage with timestamp

**Verification:**
```javascript
// Check localStorage
Object.keys(localStorage).filter(k => k.startsWith('sow-draft-')).forEach(key => {
  console.log(key, JSON.parse(localStorage.getItem(key)));
});
```

---

### Test 7.3: localStorage Recovery on Reconnect
**Vulnerability:** #9 - No sync mechanism  
**Expected Failure:** YES (feature doesn't exist)

**Steps:**
1. Go offline (Test 7.2)
2. Make significant edits
3. Go back online
4. Observe user notification

**Current Expected Result:** ❌ Silent failure, no sync  
**After Fix Result:** ✅ Toast: "Syncing offline changes..." → "All changes saved"

---

### Test 7.4: Concurrent Edit Conflict
**Vulnerability:** #9 - Race conditions  
**Expected Failure:** UNKNOWN

**Steps:**
1. Open same SOW in two browser tabs
2. Edit in Tab 1, wait for auto-save
3. Edit in Tab 2, wait for auto-save
4. Refresh Tab 1

**Current Expected Result:** ❓ Last write wins (data loss possible)  
**After Fix Result:** ⚠️ Known limitation OR ✅ Conflict detection UI

---

## SECTION 8: ERROR HANDLING

### Test 8.1: AI Timeout (30s+)
**Vulnerability:** #10 - User-facing errors  
**Expected Failure:** PARTIAL

**Steps:**
1. Create SOW with extremely complex prompt (5000+ words)
2. Wait for AI response
3. Observe timeout handling

**Current Expected Result:** ❌ Generic "Error occurred"  
**After Fix Result:** ✅ "The AI is taking longer than usual. This happens with complex projects. Retry?"

---

### Test 8.2: Malformed AI JSON Response
**Vulnerability:** #10 & #11 - Input validation  
**Expected Failure:** UNKNOWN

**Mock Response:**
```json
{
  "role_allocation": "not-an-array",
  "invalid": true
}
```

**Current Expected Result:** ❓ App crash OR silent failure  
**After Fix Result:** ✅ Graceful fallback, user sees: "AI returned invalid data. Regenerating..."

---

### Test 8.3: Rate Card API Unavailable
**Vulnerability:** #10 - Dependency failure  
**Expected Failure:** YES

**Steps:**
1. Block `/api/rate-card` in DevTools Network tab
2. Try to create SOW or edit pricing table
3. Observe error handling

**Current Expected Result:** ❌ Console error, broken dropdowns  
**After Fix Result:** ✅ "Unable to load pricing data. Please refresh the page."

---

## SECTION 9: COMPONENT RESILIENCE

### Test 9.1: Invalid Data Types in Pricing Rows
**Vulnerability:** #11 - Type coercion  
**Expected Failure:** PARTIAL

**Mock Data:**
```javascript
// Inject via browser console
const badRow = {
  role: "Developer",
  hours: "not-a-number",
  rate: null,
  description: undefined
};
```

**Current Expected Result:** ❌ NaN in calculations, broken UI  
**After Fix Result:** ✅ Sanitized to: hours=0, rate=0, description=""

---

### Test 9.2: Missing Required Fields
**Vulnerability:** #11 - Defensive programming  
**Expected Failure:** PARTIAL

**Mock Data:**
```javascript
const incompleteRow = {
  role: "Developer"
  // Missing: hours, rate, description
};
```

**Current Expected Result:** ❌ Errors or broken display  
**After Fix Result:** ✅ Defaults applied, component renders safely

---

## SECTION 10: REGRESSION TESTS (After Fixes)

### Test 10.1: All Previous Tests Pass
Run entire test suite above and verify:
- [ ] All ✅ results remain ✅
- [ ] All ❌ results now ✅
- [ ] No new bugs introduced

---

### Test 10.2: Performance Hasn't Degraded
**Benchmarks:**
- SOW creation: <5 seconds
- Auto-save delay: ~2 seconds
- Export to Excel: <10 seconds
- Page load: <3 seconds

**Test with:**
- [ ] Small SOW (3 roles, 1 scope)
- [ ] Medium SOW (10 roles, 3 scopes)
- [ ] Large SOW (25 roles, 5 scopes)

---

### Test 10.3: Existing SOWs Still Open Correctly
**Steps:**
1. Open 5 different pre-existing SOWs from database
2. Verify all render correctly
3. Edit and save
4. Re-open and verify changes persisted

---

## APPENDIX: TOOLS & SCRIPTS

### Quick Verification Script
```javascript
// Paste in browser console for instant audit

(async function quickAudit() {
  console.log('🔍 Starting Quick Audit...\n');
  
  // Test 1: Rate Card accessible
  try {
    const rc = await fetch('/api/rate-card').then(r => r.json());
    console.log('✅ Rate Card:', rc.count, 'roles loaded');
  } catch (e) {
    console.error('❌ Rate Card failed:', e);
  }
  
  // Test 2: Mandatory roles constant defined
  const hasMandatory = window.MANDATORY_ROLES || false;
  console.log(hasMandatory ? '✅ Mandatory roles defined' : '❌ Mandatory roles missing');
  
  // Test 3: GST formatting check
  const prices = document.body.innerHTML.match(/\$[\d,]+/g) || [];
  const withGST = document.body.innerHTML.match(/\$[\d,]+.*?\+GST/g) || [];
  const gstCoverage = prices.length ? (withGST.length / prices.length * 100).toFixed(1) : 0;
  console.log(`${gstCoverage > 95 ? '✅' : '❌'} GST Coverage: ${gstCoverage}%`);
  
  // Test 4: localStorage backup exists
  const drafts = Object.keys(localStorage).filter(k => k.startsWith('sow-draft-'));
  console.log(drafts.length ? '✅' : '⚠️', 'localStorage backups:', drafts.length);
  
  console.log('\n🏁 Quick Audit Complete');
})();
```

---

## TEST RESULTS TRACKING

### Pre-Fix Baseline (Expected)
- **Mandatory Roles:** 3/4 tests FAIL ❌
- **Rate Card:** 2/3 tests UNKNOWN ❓
- **Budget Tolerance:** 3/3 tests FAIL ❌
- **GST Formatting:** 1/2 tests FAIL ❌
- **Auto-Save:** 3/4 tests FAIL ❌
- **Error Handling:** 2/3 tests FAIL ❌

**Total:** ~50% failure rate (expected for unaudited system)

---

### Post-Fix Target
- **Mandatory Roles:** 4/4 tests PASS ✅
- **Rate Card:** 3/3 tests PASS ✅
- **Budget Tolerance:** 3/3 tests PASS ✅
- **GST Formatting:** 2/2 tests PASS ✅
- **Auto-Save:** 4/4 tests PASS ✅
- **Error Handling:** 3/3 tests PASS ✅

**Total:** 100% pass rate (production-ready)

---

## SIGN-OFF

**Tested By:** _____________________  
**Date:** _____________________  
**Build Version:** _____________________  
**Environment:** [ ] Staging [ ] Production  

**Result:** [ ] PASS (Ready for deployment) [ ] FAIL (Issues found)

**Issues Found:** _____________________

---

*Execute this checklist before every major release to ensure system integrity.*