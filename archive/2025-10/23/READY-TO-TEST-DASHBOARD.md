# 🎯 READY TO TEST: Social Garden BI Dashboard

**Production URL:** https://sow.qandu.me  
**Build:** 36 (Phase 1A, 1B, 1C complete)  
**Status:** ✅ All deployed, awaiting user verification

---

## Quick Test Guide (5 minutes)

### Test 1: Tag a SOW with Business Category
1. Go to https://sow.qandu.me
2. Open any existing SOW (or create new one)
3. Look at top status bar (next to document title)
4. See two dropdowns: **"🏢 Select Vertical"** | **"🔧 Select Service"**
5. Select **"Property"** from vertical dropdown
6. Select **"CRM Implementation"** from service dropdown
7. Wait 2 seconds (auto-save)
8. ✅ **PASS:** No errors, dropdowns show selected values

---

### Test 2: View BI Analytics
1. Click **"Dashboard"** in left sidebar
2. Scroll down to **"Social Garden Business Intelligence Widgets"** section
3. See two charts:
   - **Pipeline by Vertical** (left) - green bars with emojis 🏢 🎓 💰
   - **Pipeline by Service Line** (right) - blue bars with emojis 🔧 ⚙️ 📊
4. Each bar shows:
   - Name (e.g., "🏢 Property")
   - Total value (e.g., "$45,000")
   - Percentage of pipeline (e.g., "35% of pipeline")
   - SOW count + win rate (e.g., "3 SOWs • 67% win rate")
5. ✅ **PASS:** Charts render with data from tagged SOWs

---

### Test 3: Click-to-Filter (The Cool Part!)
1. Still on Dashboard view
2. **Hover** over any vertical bar (e.g., "Property")
3. See cursor change to **pointer** (clickable)
4. See tooltip: **"Click to filter SOWs by Property"**
5. **Click the bar**
6. Toast notification: **"📊 Filtered to property SOWs"**
7. Look at left sidebar:
   - Only **Property SOWs** visible in workspace list
   - Dashboard button shows **"Filtered"** badge (green pill)
   - New button appears: **"Clear Vertical Filter: property"** (orange border)
8. Click **"Clear Vertical Filter: property"** button
9. Toast notification: **"🔄 Filter cleared"**
10. Sidebar shows **all SOWs** again
11. ✅ **PASS:** Filtering works, clear button resets view

---

## Expected Results Summary

| Feature | Expected Behavior | Current Status |
|---------|------------------|----------------|
| **Dropdowns in Editor** | Two selects in status bar (vertical + service) | ✅ Deployed |
| **Auto-Save Tags** | 2s debounce, persists to database | ✅ Deployed |
| **BI Widgets Render** | Two charts with green/blue bars | ✅ Deployed |
| **Data Displays** | Shows $, count, %, win rate | ✅ Deployed |
| **Bars Clickable** | Hover = pointer cursor + tooltip | ✅ Deployed |
| **Filter Activates** | Click bar → sidebar filters | ✅ Deployed |
| **Filter Badge** | "Filtered" badge on Dashboard button | ✅ Deployed |
| **Clear Filter** | Orange button with filter value | ✅ Deployed |
| **Toast Notifications** | Success/info messages on actions | ✅ Deployed |

---

## What to Look For (Quality Checks)

### Visual Polish
- ✅ Social Garden green (#1CBF79) on vertical bars
- ✅ Blue bars on service line chart
- ✅ Emoji indicators (🏢 🎓 💰 🔧 ⚙️ 📊)
- ✅ Smooth hover transitions on clickable bars
- ✅ Responsive layout (charts side-by-side on desktop, stacked on mobile)

### User Experience
- ✅ Dropdowns have clear placeholders ("Select Vertical", "Select Service")
- ✅ Auto-save is silent (no intrusive notifications)
- ✅ Filter activates instantly (no loading spinner)
- ✅ Clear filter button is obvious when active
- ✅ Toast messages are friendly and informative

### Edge Cases
- ✅ Empty state message: "No vertical data yet. Tag your SOWs to see insights."
- ✅ Null values handled (SOWs without tags don't crash)
- ✅ Multiple filters work (can filter by vertical OR service, not both at once)
- ✅ Filtering doesn't break workspace navigation

---

## Known Limitations (By Design)

1. **Single Filter at a Time:** Can filter by vertical OR service, not both simultaneously
2. **Client-Side Filtering:** Filters documents array in memory (fast, but not paginated)
3. **No Time Range:** Analytics show all-time data (no date filters yet)
4. **No Export:** Can't export analytics to Excel/PDF (feature for later)

---

## If Something Doesn't Work

### Scenario 1: Dropdowns not showing
- **Check:** Are you in the SOW editor view? (Not dashboard)
- **Fix:** Click a SOW in sidebar to open editor

### Scenario 2: Charts show "No data yet"
- **Check:** Have you tagged any SOWs with vertical/service?
- **Fix:** Tag at least one SOW first (see Test 1)

### Scenario 3: Clicking bar does nothing
- **Check:** Browser console for JavaScript errors (F12)
- **Fix:** Hard refresh page (Ctrl+Shift+R / Cmd+Shift+R)

### Scenario 4: Filter doesn't clear
- **Check:** Is the "Clear Filter" button visible?
- **Fix:** Click Dashboard button first, then try clear button

---

## Next Phase Preview: HubSpot Partnership Widget

After you verify Phase 1 works, we'll build:

**HubSpot Partnership Health Widget** ⭐⭐⭐⭐⭐
- Shows your HubSpot partner tier (Gold → Elite)
- Progress bar: "87% to Elite Partner"
- Certifications count: "12/15 certifications"
- Deal registrations: "23 deals registered this quarter"
- Refreshes hourly via HubSpot API

**Estimated time:** 4-6 hours of development

---

## How to Give Feedback

**What worked:**
- "The click-to-filter is instant! Love it."
- "Dropdowns make tagging so easy."

**What to improve:**
- "Can we add a date filter to charts?"
- "Would be cool to filter by BOTH vertical AND service."
- "Export to Excel button would be helpful."

**Bugs to report:**
- Screenshot + browser console error (F12)
- Steps to reproduce
- Expected vs actual behavior

---

## Commits for Reference

| Phase | Commit | Message |
|-------|--------|---------|
| 1A | `5008cc7` | feat: Social Garden BI dashboard Phase 1A (database + API + widgets) |
| 1B | `52ecec1` | feat(dashboard): Phase 1B - Add vertical/service line dropdowns |
| 1C | `b8912b5` | feat(dashboard): Phase 1C - Click-to-filter dashboard charts |

**All on branch:** `enterprise-grade-ux`

---

## Summary

**3 phases deployed, 1 coherent feature:**
1. See analytics (charts with data)
2. Tag SOWs (dropdowns in editor)
3. Filter results (click charts to filter sidebar)

**Time to test:** 5 minutes  
**Expected outcome:** "Wow, this actually works!"  

**Ready when you are.** 🚀

---

**Built by:** GitHub Copilot  
**Date:** October 23, 2025  
**Doc:** READY-TO-TEST-DASHBOARD.md
