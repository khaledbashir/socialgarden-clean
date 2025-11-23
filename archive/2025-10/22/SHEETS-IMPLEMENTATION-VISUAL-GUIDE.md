# Google Sheets Integration - Visual Implementation Guide

---

## COMPARISON: Current PDF Export vs Proposed Sheets Export

### Current PDF Flow (REFERENCE MODEL)

```
┌─────────────────────────────────────────────────────────────────┐
│ Frontend (Next.js)                                              │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ SOW Portal View (/portal/sow/[id])                         │  │
│ │ - Display SOW content                                       │  │
│ │ - [Export PDF] button                                       │  │
│ └────────────────────────────────────────────────────────────┘  │
│        ↓ Click Export PDF                                       │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ /api/generate-pdf/route.ts (Next.js Server Action)        │  │
│ │ - Extract TipTap content                                    │  │
│ │ - Convert to HTML using generateHTML()                     │  │
│ │ - Call backend PDF service                                  │  │
│ │ - Wait for PDF (30s timeout via AbortController)           │  │
│ └────────────────────────────────────────────────────────────┘  │
└──────────────┬──────────────────────────────────────────────────┘
               │ HTTP POST to http://localhost:8000/generate-pdf
               ↓
┌──────────────────────────────────────────────────────────────────┐
│ Backend (FastAPI)                                                │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ /backend/main.py                                           │  │
│ │ - receive_html_generate_pdf() endpoint                     │  │
│ │ - Parse HTML payload                                        │  │
│ │ - Call WeasyPrint(html).write_pdf()                        │  │
│ │ - Return PDF bytes                                          │  │
│ │ - Embed CSS: DEFAULT_CSS                                   │  │
│ └────────────────────────────────────────────────────────────┘  │
└──────────────┬──────────────────────────────────────────────────┘
               │ Returns PDF file
               ↓
┌──────────────────────────────────────────────────────────────────┐
│ Frontend Browser                                                 │
│ - Create blob from response                                      │
│ - Trigger download                                               │
│ - User gets: sow_filename.pdf                                    │
└──────────────────────────────────────────────────────────────────┘
```

**Key Code:**
- Frontend: `frontend/app/api/generate-pdf/route.ts`
- Backend: `backend/main.py` (uses WeasyPrint)
- Env var: `NEXT_PUBLIC_PDF_SERVICE_URL` (default `http://localhost:8000`)

---

## PROPOSED APPROACH 1: CSV Export (PHASE 1 - MVP)

### Simple CSV Download (NO Backend Required)

```
┌────────────────────────────────────────────────────────────────┐
│ Frontend (Next.js)                                             │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ SOW Portal View (/portal/sow/[id])                       │  │
│ │ - Display SOW content                                     │  │
│ │ - [Export PDF] button  ← Existing                        │  │
│ │ - [Export CSV] button  ← NEW                             │  │
│ │ - [Push to Sheets]* button ← Coming Phase 2             │  │
│ └──────────────────────────────────────────────────────────┘  │
│         ↓ Click Export CSV                                     │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ sow-to-csv.ts (NEW)                                       │  │
│ │ - Input: SOW data (TipTap JSON + pricing)                │  │
│ │ - Parse TipTap content                                    │  │
│ │ - Extract pricing table                                   │  │
│ │ - Extract deliverables                                    │  │
│ │ - Extract assumptions/timeline                           │  │
│ │ - Format as CSV rows                                      │  │
│ │ - Output: CSV string                                      │  │
│ └──────────────────────────────────────────────────────────┘  │
│         ↓ Create Blob + Download                              │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Browser Download API                                      │  │
│ │ - Create object URL from CSV blob                        │  │
│ │ - Programmatically click <a href=blob>                  │  │
│ │ - Trigger browser download                               │  │
│ │ - File: [client]_[title]_SOW_[date].csv                │  │
│ └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ User's Computer                                                │
│ - CSV file downloads                                           │
│ - User opens with Google Sheets, Excel, etc.                  │
│ - User manually uploads to Google Drive if needed             │
└────────────────────────────────────────────────────────────────┘
```

**Architecture: FRONTEND ONLY** ✅
- No backend needed
- No API calls
- Works entirely in browser
- Zero latency (instant download)

**Dependencies:**
```json
{
  "papaparse": "^5.4.1"  // CSV generation
}
```

**CSV Output Format:**
```
Social Garden - Statement of Work
Project,Client Name - Project Title
Date,2025-10-19

Role,Hours,Rate (AUD),Total Cost (+GST)
Tech - Producer - Email,15,120,1800
Tech - Specialist - Design,12,180,2160
Tech - Head Of - Senior PM,5,365,1825
Tech - Delivery - Project Coordination,4,110,440
Account Management - Account Manager,8,180,1440

TOTAL HOURS,44,,7665 +GST

Assumptions
"• Hours outlined are capped and an estimate"
"• Social Garden to be briefed by client"
"• Timeline: 4 weeks from kick-off"
```

---

## PROPOSED APPROACH 2: Google Sheets API (PHASE 2 - Full Integration)

### One-Click "Push to Sheets"

```
┌────────────────────────────────────────────────────────────────┐
│ Frontend (Next.js)                                             │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ SOW Portal View                                           │  │
│ │ - [Export PDF] button                                     │  │
│ │ - [Export CSV] button                                     │  │
│ │ - [Push to Sheets] button ← Phase 2                      │  │
│ └──────────────────────────────────────────────────────────┘  │
│         ↓ Click "Push to Sheets"                              │
│         ↓ First time?                                         │
│    ┌────┴─────┐                                              │
│    │YES → Redirect to Google OAuth                           │
│    │NO → Skip auth, use stored token                         │
│    └────┬──────┐                                             │
│         ↓                                                    │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Google OAuth Consent Screen                               │  │
│ │ (User approves once, token stored)                        │  │
│ │ - "This app wants to:"                                    │  │
│ │   • Create and edit Google Sheets                         │  │
│ │   • See your Google Drive files                           │  │
│ │ [✓ Approve]  [✗ Deny]                                     │  │
│ └──────────────────────────────────────────────────────────┘  │
│         ↓ User approves                                       │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ /api/push-to-sheets/route.ts (Next.js API Route)         │  │
│ │ - Receive: sowData, clientName, projectTitle             │  │
│ │ - Get Google access token (from DB if exists)             │  │
│ │ - Call backend service                                    │  │
│ └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬──────────────────────────────────────┘
               │ POST to backend
               ↓
┌────────────────────────────────────────────────────────────────┐
│ Backend (FastAPI)                                              │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ /services/google_sheets_service.py (NEW)                 │  │
│ │ Endpoints:                                                │  │
│ │ - POST /api/sheets/create                                │  │
│ │ - POST /api/sheets/update                                │  │
│ │ - GET /api/sheets/list                                   │  │
│ │                                                           │  │
│ │ Methods:                                                  │  │
│ │ - create_sheet(title, data, accessToken)                │  │
│ │ - update_sheet(sheetId, data, accessToken)              │  │
│ │ - share_sheet(sheetId, email)                           │  │
│ │                                                           │  │
│ │ Uses:                                                     │  │
│ │ - google-auth library                                     │  │
│ │ - googleapiclient.discovery.build()                     │  │
│ │ - Sheets API v4                                          │  │
│ └──────────────────────────────────────────────────────────┘  │
│         ↓ Call Google Sheets API                              │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Google Sheets API v4                                      │  │
│ │ - batchUpdate() → Create sheet                           │  │
│ │ - values().update() → Insert data                        │  │
│ │ - formatCells() → Add colors, bold headers               │  │
│ │ - returns URL                                             │  │
│ └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬──────────────────────────────────────┘
               │ Returns sheet URL
               ↓
┌────────────────────────────────────────────────────────────────┐
│ Frontend: Success Screen                                       │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ ✅ Sheet Created Successfully!                           │  │
│ │                                                           │  │
│ │ [Open in Google Sheets] button                           │  │
│ │ [Copy Link to Clipboard] button                          │  │
│ │                                                           │  │
│ │ Link: https://docs.google.com/spreadsheets/d/xxxxx      │  │
│ └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ User's Google Drive                                            │
│ - New sheet created: "[Client] - [Title] SOW"                │
│ - Owned by user                                               │
│ - Ready to share/edit                                         │
│ - Can be synced/updated automatically (future)               │
└────────────────────────────────────────────────────────────────┘
```

**Architecture: Frontend + Backend + Google API**
- Requires OAuth 2.0
- Requires database to store tokens
- Requires Google Cloud project setup
- More complex but full integration

---

## FEATURE COMPARISON TABLE

| Feature | CSV (Phase 1) | Google Sheets (Phase 2) |
|---------|---------------|------------------------|
| **Button Text** | Download CSV | Push to Sheets |
| **Backend Required** | ❌ No | ✅ Yes |
| **Database Changes** | ❌ No | ✅ Yes (tokens) |
| **User Auth Needed** | ❌ No | ✅ Yes (1st time) |
| **Time to Implement** | 4-6 hours | 12-16 hours |
| **Import Method** | Manual upload | Automatic creation |
| **Format** | CSV (universal) | Google Sheets (formatted) |
| **Sync Capability** | ❌ One-way | ✅ Can auto-sync |
| **User Setup** | ❌ None | ✅ Grant permissions |
| **File Location** | Downloads folder | Google Drive (auto) |
| **Complexity** | Simple | Medium |

---

## IMPLEMENTATION CHECKLIST

### Phase 1 (CSV - THIS WEEK)

**Frontend:**
- [ ] Create `/frontend/lib/sow-to-csv.ts` with:
  - `generateSOWasCSV()` function
  - Parse TipTap JSON
  - Extract pricing/roles
  - Format as CSV rows
- [ ] Create `/frontend/components/sow/export-button.tsx` with:
  - CSV download button
  - Download handler
  - Loading state
- [ ] Modify `/frontend/app/portal/sow/[id]/page.tsx`:
  - Add export button UI
  - Wire up click handlers
- [ ] Test with real SOW data
- [ ] Verify CSV opens in Excel + Google Sheets

**Deployment:**
- [ ] `npm run build` ✓
- [ ] `pm2 restart sow-frontend` ✓
- [ ] Test in production

**Time: 4-6 hours**

---

### Phase 2 (Google Sheets - NEXT WEEK)

**Google Cloud Setup:**
- [ ] Create Google Cloud Project
- [ ] Enable Sheets API + Drive API
- [ ] Create OAuth 2.0 credentials (Client ID/Secret)
- [ ] Set authorized redirect URIs
- [ ] Store credentials in `.env`

**Backend (`Python/FastAPI`):**
- [ ] Create `/backend/services/google_sheets_service.py`:
  - `create_sheet(title, data, accessToken)`
  - `update_sheet(sheetId, data, accessToken)`
  - `share_sheet(sheetId, email)`
- [ ] Create `/backend/main.py` endpoints:
  - POST `/api/sheets/create` → calls create_sheet
  - POST `/api/sheets/update` → calls update_sheet
  - GET `/api/sheets/verify` → check token validity

**Frontend (`Next.js/TypeScript`):**
- [ ] Create `/frontend/lib/google-sheets-client.ts`:
  - OAuth flow initialization
  - Token management
  - Sheet API calls
- [ ] Create `/frontend/app/api/sheets/callback/route.ts`:
  - OAuth redirect handler
  - Store refresh token in DB
- [ ] Create `/frontend/app/api/push-to-sheets/route.ts`:
  - Handle button click
  - Call backend service
  - Return sheet URL
- [ ] Modify export button component:
  - Add "Push to Sheets" button
  - Show success modal
  - Display sheet link

**Database:**
- [ ] Add `google_oauth_tokens` table
- [ ] Add migration script

**Time: 12-16 hours**

---

## QUICK DECISION MATRIX

**Question: Which approach should we use?**

### If you want feature FAST (TODAY):
→ **Go with Phase 1 (CSV)**
- 4-6 hours implementation
- Users can download + import manually
- Zero complexity
- No OAuth setup needed

### If you want ONE-CLICK integration:
→ **Plan Phase 2 (Google Sheets)**
- 12-16 hours implementation
- Automatic sheet creation
- Professional experience
- Do after Phase 1 feedback

### RECOMMENDED PATH:
1. **Week 1:** Implement CSV export (Phase 1)
2. **Get user feedback:** Do users like the feature?
3. **Week 2:** If users want one-click → do Phase 2
4. **Week 3:** If CSV is enough → skip Phase 2

---

## NEXT IMMEDIATE STEPS

**What I recommend you do RIGHT NOW:**

1. ✅ **Review this document**
   - Make sure CSV approach makes sense for you
   - Check if Phase 1 timeline works

2. ✅ **Decide: CSV first or full Sheets?**
   - If you want feature NOW → approve Phase 1
   - If you want full feature → approve both phases

3. ✅ **Give me the go-ahead**
   - "Okay, start with CSV" → I implement today
   - "Wait, let me review" → I'll hold

4. ✅ **Then**
   - I'll start coding Phase 1
   - Should be deployed by EOD tomorrow
   - You'll have working "Download CSV" button

**Time estimate if you say YES:**
- Phase 1: 4-6 hours dev + testing → Deploy tomorrow
- Phase 2: 12-16 hours dev (next week if needed)

---

## QUESTIONS TO ANSWER

Before proceeding, clarify:

1. **Do you want both phases or just CSV?**
   - Option A: CSV only (fast, simple)
   - Option B: Start CSV, plan Phase 2 later
   - Option C: Do full Google Sheets now (slower, complete)

2. **If doing Google Sheets: Do you have Google Cloud account?**
   - Yes → We can set up immediately
   - No → I can guide you through setup

3. **Delivery timeline:**
   - How soon do you need this working?
   - Is "by EOD tomorrow" acceptable for CSV?

4. **User feedback:**
   - Who will test this first?
   - What's the success metric?

---

**File Location:** `/root/the11/GOOGLE-SHEETS-INTEGRATION-STRATEGY.md`  
**Status:** Ready for approval  
**Next Action:** Awaiting your decision on Phase 1 vs Both phases
