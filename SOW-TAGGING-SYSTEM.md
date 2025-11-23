# SOW Tagging System - Backfill & UI Guide

**Date:** October 23, 2025  
**Purpose:** Enable BI Dashboard widgets with vertical and service_line classification data

---

## 🎯 Overview

The BI Dashboard's analytics widgets (Phase 1A) require `vertical` and `service_line` data on SOWs to function. This document explains:

1. **Immediate Fix:** One-time backfill API to analyze and tag all existing untagged SOWs
2. **Permanent Solution:** UI improvements to make tagging obvious and intuitive for future SOWs

---

## Part 1: Backfill API (One-Time Migration)

### What It Does

The backfill API analyzes all SOWs in the database where `vertical IS NULL`, uses AI to determine the most likely vertical and service_line based on the SOW's title and content, and updates the database with these classifications.

### How to Use

**Step 1: Trigger the Backfill**

Visit this URL in your browser (or curl it):

```bash
curl https://sow.qandu.me/api/admin/backfill-tags
# or simply open in browser:
# https://sow.qandu.me/api/admin/backfill-tags
```

**Step 2: Monitor Progress**

The API returns a summary JSON response:

```json
{
  "success": true,
  "updated_sows": 32,
  "failed_sows": 0,
  "total_processed": 32,
  "message": "Successfully backfilled tags for 32 SOWs. Dashboard widgets will now display data from historical SOWs.",
  "details": [
    {
      "sow_id": "sow-abc123",
      "title": "Acme Corp CRM Implementation",
      "vertical": "technology",
      "service_line": "crm-implementation",
      "confidence": 0.92,
      "success": true
    },
    ...
  ]
}
```

**Step 3: Verify Dashboard**

After the backfill completes, refresh the BI Dashboard at https://sow.qandu.me and the analytics widgets should display data.

### Technical Details

**Endpoint:** `GET /api/admin/backfill-tags`  
**Location:** `frontend/app/api/admin/backfill-tags/route.ts`  
**Model Used:** GPT-3.5-Turbo via OpenRouter (fast & cheap)  
**Cost:** ~$0.01-0.02 per 32 SOWs  
**Processing Time:** ~15-30 seconds for 32 SOWs (500ms delay between requests to avoid rate limiting)

**Fallback Behavior:**
- If AI analysis fails for a specific SOW: defaults to `vertical: 'other'`, `service_line: 'other'`
- If OpenRouter API is unavailable: uses safe defaults, returns `confidence: 0`
- If database update fails: marks that SOW as failed in the response

---

## Part 2: UI Improvements (Permanent Solution)

### Where It Shows Up

In the **main dashboard's left sidebar**, under each SOW in the SOW list:

```
📁 My Client Folder
  └─ 📄 Acme CRM Setup [⊕ Vertical] [⊕ Service Line]  ← Untagged
     (Tags show as dropdowns)

  └─ 📄 Beta Corp Marketing   🏢 Technology   📱 Marketing Automation  ← Tagged
     (Tags show as colored badges)
```

### Tagging Behavior

#### When SOW is Untagged (No vertical/service_line)

- Two dropdown buttons appear: `+ Vertical` and `+ Service Line`
- They occupy minimal space and are non-intrusive

#### When User Selects a Tag

- Click either dropdown to see all options
- Select an option
- **Auto-save triggers immediately** → PUT request to `/api/sow/[id]`
- Both fields must be filled to auto-save (partial tagging not allowed)

#### When Both Tags Are Set

- Dropdowns transform into colored badges
- Example: `🏢 Technology` (cyan badge) + `📱 Marketing Automation` (teal badge)
- Click a badge to re-edit that tag
- Save happens automatically on selection

### Available Options

#### Verticals (with emojis for visual scanning)

- 🏠 Property
- 🎓 Education
- 💰 Finance
- 🏥 Healthcare
- 🛍️ Retail
- 🏨 Hospitality
- 💼 Professional Services
- 💻 Technology
- ❓ Other (fallback)

#### Service Lines

- CRM Implementation
- Marketing Automation
- RevOps Strategy
- Managed Services
- Consulting
- Training
- Other (fallback)

### Component Details

**File:** `frontend/components/tailwind/sow-tag-selector.tsx`

**Key Features:**

1. **Smart Display Logic:**
   - Untagged → Show dropdowns
   - Tagged → Show badges
   - Badge click → Transform to dropdowns for editing

2. **Auto-Save:**
   - On tag selection, immediately POSTs to `/api/sow/[id]`
   - Loading state prevents duplicate submissions
   - Success toast notification
   - Reverts to previous value on error

3. **Keyboard-Friendly:**
   - Dropdowns close when clicking outside
   - Click badges to re-edit
   - No keyboard trap

4. **Mobile-Friendly:**
   - Dropdowns render below buttons (not overlapping sidebar)
   - z-index: 50 to stay above other UI elements

---

## Integration Points

### Frontend Files Updated

1. **`frontend/app/api/sow/list/route.ts`**
   - Added `vertical` and `service_line` to SELECT query
   - SOWs now include tagging data when loaded

2. **`frontend/lib/db.ts`**
   - Updated SOW interface to include optional `vertical` and `service_line` fields
   - Type system reflects database schema

3. **`frontend/app/page.tsx`**
   - Updated SOW mapping to include `vertical` and `service_line` when fetching from DB
   - Data flows to sidebar components

4. **`frontend/components/tailwind/sidebar-nav.tsx`**
   - Updated SOW interface to include tagging fields
   - Imported `SOWTagSelector` component
   - Renders tag selector below each SOW item in the list

5. **`frontend/app/api/sow/[id]/route.ts`** (Already Updated)
   - PUT endpoint already supports `vertical` and `serviceLine` in request body
   - Updates database atomically

### Database

**Table:** `sows`  
**Columns (already exist):**
- `vertical` (ENUM: property, education, finance, healthcare, retail, hospitality, professional-services, technology, other)
- `service_line` (ENUM: crm-implementation, marketing-automation, revops-strategy, managed-services, consulting, training, other)

No migration needed—columns already exist in schema.

---

## Workflow: From Backfill to Daily Use

### Day 1: Backfill

```
1. Admin runs: curl https://sow.qandu.me/api/admin/backfill-tags
2. API analyzes all 32 untagged SOWs
3. Database updated: vertical and service_line populated
4. BI Dashboard now shows historical data
```

### Day 2+: Creating New SOWs

```
1. User creates new SOW via editor
2. SOW created with vertical: NULL, service_line: NULL
3. In sidebar, SOW shows: [+ Vertical] [+ Service Line]
4. User clicks dropdown, selects tags
5. Auto-save → Tags persist
6. Sidebar updates to show badges instead of dropdowns
7. BI Dashboard automatically includes new SOW's data on refresh
```

---

## Troubleshooting

### Backfill API Returns 500 Error

**Check:**
1. Is `OPENROUTER_API_KEY` set in environment variables?
2. Is OpenRouter API accessible from the deployment environment?
3. Check backend logs for detailed error

**Fallback:**
- Backfill still works but uses safe defaults (`other`, `other`) with 0 confidence
- Manual tagging via UI is always available

### Tags Not Saving When Selected

**Check:**
1. Network tab in browser dev tools—is PUT request being made to `/api/sow/[id]`?
2. Is the API responding with 200 status?
3. Browser console for error messages

**Common Issues:**
- SOW ID not matching database record
- Database connection pool exhausted
- Partial updates (only one tag selected)

### Sidebar Not Showing Tag Selector

**Check:**
1. Did you reload the page after deploying new code?
2. Is browser cache cleared? (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
3. Check console for component render errors

---

## Performance Notes

- **Backfill Time:** 15-30 seconds for ~32 SOWs (bottleneck: AI analysis + 500ms delays)
- **Auto-Save:** <500ms (PUT request to database)
- **UI Rendering:** Negligible (badges swap from dropdowns instantly)

**Optimization:**
- If you have >100 untagged SOWs, run backfill during off-hours
- Backfill processes sequentially to respect OpenRouter rate limits
- Consider running as background job if scaling to 1000+ SOWs

---

## Future Enhancements

1. **Bulk Tagging:** Admin UI to tag multiple SOWs at once
2. **Smart Defaults:** Pre-select most likely tags based on SOW folder/client
3. **Tag History:** Audit log showing when/who changed tags
4. **Custom Verticals/Service Lines:** Allow admin to add new classification types
5. **Webhook Integration:** Sync tags to external systems (Salesforce, HubSpot, etc.)

---

## Questions?

- **Admin:** Backfill API works but tags not showing in dashboard? Check that your BI Dashboard is querying the correct database columns
- **User:** Tags won't save? Check browser console for fetch errors or API response details
- **Dev:** Need to modify classifications? Update enum options in `schema.sql` + `sow-tag-selector.tsx` + backfill route

---

*Last Updated: October 23, 2025*
