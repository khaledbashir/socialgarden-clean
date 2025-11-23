# 🧪 SOW Tagging System - Testing Guide

**Date:** October 23, 2025  
**Purpose:** Validate implementation before deployment

---

## Pre-Deployment Checklist

### ✅ Code Quality

- [x] TypeScript compilation passes (`pnpm typecheck`)
- [x] No syntax errors in new files
- [x] All imports resolve correctly
- [x] Database schema already has required columns
- [x] No breaking changes to existing APIs

### ✅ File Integrity

- [x] `frontend/app/api/admin/backfill-tags/route.ts` created (165 lines)
- [x] `frontend/components/tailwind/sow-tag-selector.tsx` created (260 lines)
- [x] `frontend/app/api/sow/list/route.ts` updated (includes vertical/service_line)
- [x] `frontend/lib/db.ts` updated (SOW interface extended)
- [x] `frontend/app/page.tsx` updated (data flow includes tags)
- [x] `frontend/components/tailwind/sidebar-nav.tsx` updated (renders tag selector)
- [x] `README.md` updated (feature documentation)
- [x] `SOW-TAGGING-SYSTEM.md` created (complete guide)
- [x] `IMPLEMENTATION-SUMMARY-SOW-TAGGING.md` created (this summary)

---

## Unit Tests

### Test 1: Backfill API Endpoint

**Objective:** Verify API can be called and returns expected response structure

**Steps:**

```bash
# Start dev server
./dev.sh

# In another terminal, call the backfill API
curl http://localhost:3333/api/admin/backfill-tags -v
```

**Expected Response (JSON):**

```json
{
  "success": true,
  "updated_sows": <number>,
  "failed_sows": <number>,
  "total_processed": <number>,
  "message": "Successfully backfilled tags for X SOWs...",
  "details": [
    {
      "sow_id": "string",
      "title": "string",
      "vertical": "property|education|finance|healthcare|retail|hospitality|professional-services|technology|other",
      "service_line": "crm-implementation|marketing-automation|revops-strategy|managed-services|consulting|training|other",
      "confidence": <0-1>,
      "success": true
    }
  ]
}
```

**Pass Criteria:**
- ✅ Returns HTTP 200
- ✅ Response is valid JSON
- ✅ `success` is `true`
- ✅ `updated_sows` >= 0
- ✅ Each entry has all required fields

---

### Test 2: SOW Tag Selector Component

**Objective:** Verify component renders and handles interaction

**Steps:**

1. Start dev server: `./dev.sh`
2. Open http://localhost:3333
3. Look at the left sidebar where SOWs are listed
4. For each SOW, you should see tag dropdowns or badges below the SOW name

**Untagged SOW (vertical IS NULL):**

```
📄 SOW Name [🔖] [🗑️]
   [+ Vertical] [+ Service Line]    ← Dropdowns visible
```

**Tagged SOW (vertical IS NOT NULL):**

```
📄 SOW Name [🔖] [🗑️]
   🏢 Technology    📱 Marketing Automation   ← Badges visible
```

**Pass Criteria:**
- ✅ Dropdowns appear for untagged SOWs
- ✅ Badges appear for tagged SOWs
- ✅ No console errors when rendering
- ✅ Dropdowns have proper styling

---

### Test 3: Tag Selection & Auto-Save

**Objective:** Verify selecting a tag saves to database

**Steps:**

1. Find an untagged SOW in sidebar
2. Click the `[+ Vertical]` dropdown
3. Select "Technology"
4. Dropdown should close
5. Click the `[+ Service Line]` dropdown
6. Select "Marketing Automation"
7. Dropdown should close
8. Wait 1 second for network request

**Expected Behavior:**

- ✅ After selecting vertical: UI shows temporary loading state
- ✅ Tag saves without page reload
- ✅ Toast notification appears: "Tags updated"
- ✅ After selecting both tags: Dropdowns transform to badges
- ✅ Badges display: "🏢 Technology" and "📱 Marketing Automation"

**Verify Persistence:**

```bash
# Refresh the page
# Tags should still be visible
# (This confirms database persistence)
```

---

### Test 4: Badge Click to Edit

**Objective:** Verify clicking a badge reopens the editor

**Steps:**

1. Find a tagged SOW (has badges)
2. Click the "Technology" badge
3. The `[+ Vertical]` dropdown should reappear
4. Select a different vertical (e.g., "Finance")
5. Verify it updates to "💰 Finance" badge

**Pass Criteria:**
- ✅ Badge click opens dropdown
- ✅ Selection updates immediately
- ✅ Toast notification on save
- ✅ Badge updates with new value

---

### Test 5: Error Handling

**Objective:** Verify graceful degradation on error

**Steps:**

1. Edit backfill API route temporarily to simulate an error
2. Call the backfill API
3. Verify it returns `success: false` with error details

**Or test via UI:**

1. Intercept the PUT request in browser DevTools
2. Block the request
3. Try to select a tag
4. Verify error toast appears
5. Verify UI reverts to previous tag value

**Pass Criteria:**
- ✅ Error responses have correct HTTP status
- ✅ Error messages are logged
- ✅ UI reverts gracefully
- ✅ User sees informative error toast

---

## Integration Tests

### Test 6: Data Flow End-to-End

**Objective:** Verify data flows from database → API → UI

**Setup:**

1. Stop dev server
2. Directly update a SOW in the database:
   ```sql
   UPDATE sows SET vertical = 'finance', service_line = 'consulting' 
   WHERE id = 'sow-test-id';
   ```
3. Start dev server: `./dev.sh`
4. Open app at http://localhost:3333

**Verify:**
- ✅ SOW appears with "💰 Finance" and "Consulting" badges
- ✅ API response includes vertical/service_line fields
- ✅ Sidebar renders tags correctly

---

### Test 7: Backfill with Multiple SOWs

**Setup:**

1. Create 3-5 test SOWs with NULL vertical/service_line:
   ```sql
   INSERT INTO sows (id, title, content, vertical, service_line)
   VALUES 
   ('sow-test-1', 'Acme CRM Implementation', '<content>', NULL, NULL),
   ('sow-test-2', 'Beta Finance Consulting', '<content>', NULL, NULL),
   ('sow-test-3', 'Gamma Healthcare Training', '<content>', NULL, NULL);
   ```

2. Call backfill API:
   ```bash
   curl http://localhost:3333/api/admin/backfill-tags
   ```

3. Verify response shows all 3 SOWs updated

4. Check database:
   ```sql
   SELECT id, title, vertical, service_line FROM sows 
   WHERE id IN ('sow-test-1', 'sow-test-2', 'sow-test-3');
   ```

**Pass Criteria:**
- ✅ All SOWs updated with non-NULL vertical/service_line
- ✅ Vertical values are in valid enum list
- ✅ Service line values are in valid enum list
- ✅ Confidence scores are between 0 and 1

---

## Performance Tests

### Test 8: UI Responsiveness

**Objective:** Verify tag selector doesn't cause UI lag

**Steps:**

1. Open browser DevTools → Performance tab
2. Click a dropdown to measure rendering time
3. Record time to interactive

**Pass Criteria:**
- ✅ Dropdown opens in <100ms
- ✅ No jank or stuttering
- ✅ Smooth transitions

---

### Test 9: API Response Time

**Objective:** Verify backfill API completes in reasonable time

**Steps:**

```bash
# Time the backfill request
time curl http://localhost:3333/api/admin/backfill-tags > /tmp/response.json
```

**Pass Criteria:**
- ✅ Completes in <60 seconds (for ~32 SOWs)
- ✅ Response is valid JSON
- ✅ No timeout errors

---

## Browser Compatibility

### Test 10: Cross-Browser Testing

Test on:
- [x] Chrome/Chromium (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Check for:**
- ✅ Dropdowns display correctly
- ✅ Badges render with correct colors
- ✅ No layout shifts
- ✅ Hover states work
- ✅ Click handlers work

---

## Production Simulation

### Test 11: EasyPanel Pre-Deployment

**Before pushing to `enterprise-grade-ux`:**

1. Verify all files are properly formatted:
   ```bash
   git status
   ```

2. Verify no unintended changes:
   ```bash
   git diff --stat
   ```

3. Run type check one more time:
   ```bash
   pnpm typecheck
   ```

4. Check for console warnings:
   ```bash
   ./dev.sh 2>&1 | grep -i "warn\|error" | head -20
   ```

---

### Test 12: Post-Deployment Validation

**After deploying to production (https://sow.qandu.me):**

1. Verify backfill API works:
   ```bash
   curl https://sow.qandu.me/api/admin/backfill-tags
   ```

2. Check BI Dashboard shows data
   - Refresh dashboard
   - Widgets should no longer show "No data yet"
   - Should display counts/metrics from backfilled SOWs

3. Verify tag selector in sidebar
   - Open production URL
   - Check for tag dropdowns/badges
   - Try to select a tag
   - Verify auto-save works

4. Monitor for errors
   - Check browser console for errors
   - Check API logs for failed requests
   - Monitor network tab for 400/500 responses

---

## Rollback Plan

If issues are discovered:

1. **Revert commits:**
   ```bash
   git revert <commit-hash>
   git push
   # EasyPanel auto-deploys
   ```

2. **Quick rollback (if needed):**
   - Remove tag selector from sidebar-nav.tsx
   - Revert API changes
   - Database tables remain unchanged (safe)

---

## Test Results Template

```markdown
# Test Results - SOW Tagging System

| Test | Status | Notes |
|------|--------|-------|
| 1. Backfill API | ✅ PASS | Updated 32 SOWs in 20s |
| 2. Tag Selector Render | ✅ PASS | Dropdowns visible for untagged |
| 3. Tag Selection & Save | ✅ PASS | Auto-save works, toast notification shows |
| 4. Badge Click to Edit | ✅ PASS | Badges transform to dropdowns on click |
| 5. Error Handling | ✅ PASS | Network errors handled gracefully |
| 6. Data Flow E2E | ✅ PASS | DB → API → UI correctly |
| 7. Backfill Multiple | ✅ PASS | All 3 test SOWs updated |
| 8. UI Responsiveness | ✅ PASS | Dropdown opens in <100ms |
| 9. API Response Time | ✅ PASS | Backfill completes in 25s |
| 10. Browser Compat | ✅ PASS | Works on Chrome/Firefox/Safari |
| 11. Pre-Deployment | ✅ PASS | All files formatted, no errors |
| 12. Post-Deployment | ⏳ PENDING | Check after production deploy |

**Overall:** ✅ READY FOR DEPLOYMENT

**Tested By:** [Your Name]  
**Date:** [Date]
```

---

## Troubleshooting During Testing

### Issue: "Cannot find module" error

**Solution:**
```bash
cd frontend
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Issue: Database not responding

**Solution:**
```bash
# Check database connection
mysql -h 168.231.115.219 -u sg_sow_user -p socialgarden_sow

# Or for local:
docker ps | grep mysql
```

### Issue: OpenRouter API rate limit

**Solution:**
- Wait 60 seconds before retrying backfill
- Check API key is valid
- Verify network connectivity

### Issue: Tags not showing in sidebar

**Solution:**
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Check browser console for errors
- Verify API returns vertical/service_line fields

---

**Ready to test! 🚀**
