# Admin Dashboard Reset - Usage Guide

## ✅ Implementation Complete

You now have **two reset options** for dashboard data:
1. **Delete Test SOWs Only** - removes SOWs with "Test" in client name
2. **Reset All Data** - nuclear option, wipes everything

---

## Setup Required

### 1. Set Admin Key Environment Variable

In your EasyPanel/Docker environment, add this environment variable:

```bash
ADMIN_API_KEY=your-strong-secret-key-here-change-this
```

**Example strong key:**
```
ADMIN_API_KEY=the11-admin-2024-d8f7g9h2j3k4l5m6n7p8q9r0
```

### 2. Restart Frontend Service

After adding the env var, restart the Next.js frontend so it picks up the key.

---

## Usage: Via Admin UI (Easiest)

### Step 1: Open Admin Panel
Navigate to: `https://your-domain.com/admin`

### Step 2: Scroll to "Danger Zone"
You'll see a red-bordered section with two buttons:
- 🟡 **Delete Test SOWs** (yellow button)
- 🔴 **Reset All Data** (red button)

### Step 3: Enter Admin Key
Type the `ADMIN_API_KEY` value into the password field.

### Step 4: Click Appropriate Button

**For Testing/Development:**
- Click **"Delete Test SOWs"** - only removes SOWs where `client_name LIKE '%Test%'`
- Example deleted: "Test Client", "ABC Test Corp", "XYZ Testing Ltd"
- Real clients preserved: "Australian Gold Growers", "ABC Corporation"

**For Full Reset:**
- Click **"Reset All Data"** - deletes everything in dashboard
- All SOWs, activities, comments, acceptances, rejections, snapshots cleared
- Dashboard will show: 0 Total SOWs, $0 value, no recent activity

### Step 5: Refresh Dashboard
After successful reset, refresh your dashboard panel to see updated counts.

---

## Usage: Via API (Advanced)

### Delete Test SOWs Only

```bash
curl -X POST \
  https://your-domain.com/api/admin/reset-dashboard?filter=test \
  -H "x-admin-key: your-strong-secret-key-here-change-this"
```

**Response:**
```json
{
  "success": true,
  "filter": "test",
  "test_sows_deleted": 3,
  "sows_before": 7,
  "sows_after": 4,
  "sow_activities_before": 12,
  "sow_activities_after": 8,
  ...
}
```

### Reset All Data

```bash
curl -X POST \
  https://your-domain.com/api/admin/reset-dashboard \
  -H "x-admin-key: your-strong-secret-key-here-change-this"
```

**Response:**
```json
{
  "success": true,
  "filter": "all",
  "sows_before": 7,
  "sows_after": 0,
  "sow_activities_before": 15,
  "sow_activities_after": 0,
  ...
}
```

---

## What Gets Deleted?

### Test SOWs Mode (`?filter=test`)
Deletes records in these tables **only for test clients**:
1. `sow_activities` (WHERE sow_id IN test SOWs)
2. `sow_comments` (WHERE sow_id IN test SOWs)
3. `sow_acceptances` (WHERE sow_id IN test SOWs)
4. `sow_rejections` (WHERE sow_id IN test SOWs)
5. `ai_conversations` (WHERE sow_id IN test SOWs)
6. `sow_snapshots` (WHERE sow_id IN test SOWs)
7. `sows` (WHERE client_name LIKE '%Test%')

**Test client detection:** Any client_name containing "Test" (case-insensitive via LIKE)
- ✅ Deleted: "Test Client", "ABC Test Corp", "Test-123", "My Testing Co"
- ❌ Preserved: "Australian Gold Growers", "Tech Startup Inc", "Contest Winners LLC"

### Full Reset Mode (no filter)
Deletes **ALL records** in these tables:
1. `sow_activities`
2. `sow_comments`
3. `sow_acceptances`
4. `sow_rejections`
5. `ai_conversations`
6. `sow_snapshots`
7. `sows`

**Result:** Dashboard shows zero for all metrics.

---

## Security

### Protection Mechanism
- Endpoint requires `X-Admin-Key` header
- Must match `process.env.ADMIN_API_KEY` exactly
- Returns 403 Forbidden if key missing or incorrect
- No authentication bypass possible

### Best Practices
1. **Use strong admin key** - minimum 32 characters, mix of letters/numbers/symbols
2. **Keep key secret** - don't commit to git, store in env vars only
3. **Rotate periodically** - change key every 90 days
4. **Limit access** - only give to trusted admins
5. **Audit usage** - check server logs for reset operations

### Example Strong Keys
```
ADMIN_API_KEY=the11-prod-admin-k8s-2024-d9f7g3h1j5k2l8
ADMIN_API_KEY=sow-dashboard-reset-key-x9m4n7p2q5r8t3
ADMIN_API_KEY=the-eleven-admin-reset-2024-secure-key
```

---

## Testing Workflow

### Recommended Testing Pattern

**During Development:**
1. Create test SOWs with names: "Test Client 1", "Test Client 2", etc.
2. Test features, create activities, comments, etc.
3. When ready to clean up: Use **"Delete Test SOWs"** button
4. Result: Test data removed, production SOWs preserved

**Before Production Deployment:**
1. Use **"Reset All Data"** to start fresh
2. Create first real client SOW
3. Verify dashboard shows correct counts
4. Go live

**After Production Issues:**
1. If data corruption occurs, use **"Reset All Data"**
2. Re-import SOWs from backup (if available)
3. Or rebuild from scratch

---

## Troubleshooting

### Error: "ADMIN_API_KEY not set on server"
**Problem:** Environment variable missing  
**Solution:** Add `ADMIN_API_KEY=your-key` to Docker/EasyPanel env vars and restart

### Error: "Forbidden"
**Problem:** Wrong admin key entered  
**Solution:** Double-check key matches env var exactly (case-sensitive, no spaces)

### Button does nothing
**Problem:** Frontend can't reach API  
**Solution:** Check browser console for errors, verify frontend is running

### Dashboard still shows old data after reset
**Problem:** Frontend cache or race condition  
**Solution:** Hard refresh browser (Ctrl+Shift+R), wait 5 seconds, refresh dashboard panel

### Deleted wrong SOWs with test filter
**Problem:** Client name contained "Test" but wasn't actually a test client  
**Solution:** Use naming convention like "TEST-" prefix for test clients to avoid accidents

---

## Recovery

### If You Accidentally Reset All Data

**Bad news:** No built-in undo. Data is permanently deleted from MySQL.

**Recovery options:**
1. **Database backup** - restore from MySQL backup if you have one
2. **AnythingLLM workspaces** - SOW content may still exist in workspace embeddings (but not in dashboard)
3. **Re-create manually** - use workspace chat to retrieve SOW details, re-create in dashboard

**Prevention:**
- Always use **"Delete Test SOWs"** first (safer)
- Create MySQL backups before using **"Reset All Data"**
- Test with low-stakes data first

---

## Dashboard Impact

### What Dashboard Shows After Reset

**Full Reset:**
```
📊 Dashboard Metrics
├─ Total SOWs: 0
├─ Total Value: $0
├─ Recent Activity: (empty)
├─ Top Clients: (empty)
├─ Active SOWs: 0
└─ This Month: 0
```

**Test SOWs Deleted (example):**
```
📊 Dashboard Metrics
├─ Total SOWs: 4 (was 7, deleted 3 test SOWs)
├─ Total Value: $287,500 (test SOWs had $45,000)
├─ Recent Activity: (real SOWs only)
├─ Top Clients: (real clients only)
├─ Active SOWs: 4
└─ This Month: 2
```

### What Doesn't Change

**AnythingLLM workspaces are NOT affected:**
- Client-specific workspaces remain intact
- `sow-master-dashboard` workspace keeps embeddings
- `gen-the-architect` workspace unchanged
- `pop` workspace unchanged

**Rate cards are NOT affected:**
- 91 canonical roles still available
- Pricing data preserved
- Role definitions unchanged

**Frontend code is NOT affected:**
- SOW generator still works
- Chat functionality preserved
- All features operational

---

## Verification

### After Reset, Verify These

1. **Dashboard shows correct counts**
   - Navigate to dashboard panel
   - Check "Total SOWs" matches expected (0 for full reset, or reduced for test filter)

2. **API returns empty data**
   ```bash
   curl https://your-domain.com/api/dashboard/stats
   ```
   Should return `totalSOWs: 0` (for full reset)

3. **Database is actually empty**
   ```sql
   SELECT COUNT(*) FROM sows;
   -- Should return 0 for full reset
   ```

4. **Can create new SOWs**
   - Generate a new SOW to test
   - Verify it appears in dashboard
   - Confirm counts update correctly

---

## Production Checklist

Before using in production:

- [ ] `ADMIN_API_KEY` set in environment variables
- [ ] Admin key is strong (32+ characters)
- [ ] Admin key is secret (not in git)
- [ ] Frontend service restarted with new env var
- [ ] Tested reset on staging/dev first
- [ ] Database backup created (if resetting production)
- [ ] Team notified of maintenance window
- [ ] Verified dashboard shows zero after reset
- [ ] Tested creating new SOW after reset
- [ ] Documented who has admin key access

---

## Summary

✅ **Implemented:**
- Delete test SOWs filter (`?filter=test`)
- Full reset option (no filter)
- Admin UI with two buttons
- Admin key protection
- Before/after count reporting

✅ **Safe to use:**
- Test filter preserves production data
- Admin key prevents accidental resets
- Returns detailed results for verification

✅ **Ready for production:**
- Just set `ADMIN_API_KEY` and restart
- Use admin panel or API directly
- Test mode for safe cleanup

**Questions? Test it now:**
1. Set admin key
2. Create a "Test Client" SOW
3. Use "Delete Test SOWs" button
4. Verify test SOW removed, real SOWs preserved
