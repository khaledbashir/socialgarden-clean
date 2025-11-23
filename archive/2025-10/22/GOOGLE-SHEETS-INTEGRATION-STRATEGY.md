# Google Sheets Integration for SOWs - Strategic Analysis & Approach

**Date:** October 19, 2025  
**Status:** Design & Planning  
**Goal:** Create "Push to Google Sheets" feature for generated SOWs

---

## 1. EXCEL TEMPLATE STRUCTURE (From Analysis)

### Sheet Overview
- **5 Total Sheets:**
  1. `Scope & Pricing Overview` - Main SOW summary
  2. `TEMPLATE MA | ONE OFF SCOPE` - Marketing Automation one-off project template
  3. `i.e. MA | Display Check-in automa` - MA display + automation example
  4. `Social Garden Rate Card` - Pricing reference
  5. `Rate Card wOld` - Legacy pricing

### Sheet Architecture Pattern

**Sheet 1: Scope & Pricing Overview**
- Header rows with merged cells (project metadata)
- Column structure: Project Name | Hours | Rate | Total Cost
- Row structure:
  - Rows 2-4: Metadata/headers
  - Rows 5+: Project details
  - Summary rows at bottom (Totals, GST calculations)

**Sheet 2-3: Template Examples**
- Header: Row 1-3 (project info)
- Pricing table: Rows 4-14
- Structure:
  - Col A: Project ID/reference
  - Col B: Role/resource name
  - Col C: Hours
  - Col D: Hourly rate (AUD)
  - Col E: Total cost (calculated)
- Footer: Summary totals

### Key Components Extracted
- Numbers found: hours (10, 5, 2.5), rates (120, 180, 365, 110), totals (1200, 1800)
- Formulas: #REF! errors suggest linked cells (hours × rate = total cost)
- Structure: Professional financial template with:
  - Client/Project header section
  - Itemized role/hours breakdown
  - Automatic total calculations
  - GST handling

---

## 2. CURRENT PDF EXPORT FLOW (Reference Model)

### How PDF Works Now
```
SOW Generated → HTML Created → Frontend API Call
↓
/api/generate-pdf (POST)
↓
Backend FastAPI Service (WeasyPrint)
↓
Returns PDF file
↓
User downloads
```

**Key Code Points:**
- Frontend: `/frontend/app/api/generate-pdf/route.ts`
- Backend: `/backend/main.py`
- Timeout: 30 seconds (AbortController)
- Libraries: WeasyPrint (HTML → PDF)

---

## 3. PROPOSED GOOGLE SHEETS INTEGRATION APPROACH

### Option A: Simple Export (Recommended for MVP)
**Approach:** Generate spreadsheet from SOW data, user downloads CSV, imports to Sheets manually

**Pros:**
- ✅ Fastest to implement (5-10 hours dev)
- ✅ No Google OAuth complexity
- ✅ Users have full control over where sheets go
- ✅ Works with any spreadsheet app (Excel, Sheets, etc.)
- ✅ Reusable CSV format

**Cons:**
- ❌ Requires manual import to Google Sheets
- ❌ No auto-sync capability

**Tech Stack:**
- Frontend: `papaparse` (CSV generation)
- Backend: N/A (frontend-only)
- Time: 4-6 hours

---

### Option B: Direct Google Sheets API Integration (Recommended for Production)
**Approach:** "Push to Sheet" button → Authenticate user → Create/update Google Sheet directly

**Pros:**
- ✅ One-click operation
- ✅ Professional experience
- ✅ Can auto-sync future updates
- ✅ Sharable link generation
- ✅ Audit trail in Google Sheets

**Cons:**
- ❌ Requires Google OAuth 2.0 setup
- ❌ More complex backend integration
- ❌ Rate limiting from Google API
- ⚠️ User must grant permissions

**Tech Stack:**
- Frontend: OAuth 2.0 flow, Google Sheets API v4 client
- Backend: Node.js `google-auth-library`, `google-auth-oauth2`
- Time: 12-16 hours

**Architecture:**
```
User clicks "Push to Sheets"
↓
Frontend redirects to Google OAuth consent screen
↓
User approves (or selects existing Sheet)
↓
Frontend gets access token + sheet ID
↓
Backend API receives data + sheet ID
↓
Backend calls Google Sheets API v4
├─ Create new sheet OR
├─ Update existing sheet
↓
Returns share link to user
```

---

### Option C: Hybrid Approach (BEST FOR YOU)
**Approach:** CSV export + Optional Google Sheets integration later

**Phase 1 (NOW - Week 1):**
- Implement CSV export (Option A)
- Button: "Download as CSV"
- Users can open in Google Sheets themselves

**Phase 2 (LATER - Week 3-4):**
- Add Google Sheets API integration
- Button: "Push to Google Sheets" (requires auth)
- Auto-create sheet in user's Drive

**Benefits:**
- ✅ Get feature out fast (CSV works immediately)
- ✅ Gather user feedback before full OAuth setup
- ✅ No rushed Google setup
- ✅ Users not blocked on CSV option

---

## 4. DETAILED IMPLEMENTATION PLAN (Hybrid Approach)

### Phase 1: CSV Export (Quick Win)

**Files to Create/Modify:**

1. **Create: `/frontend/lib/sow-to-csv.ts`**
   - Function: `generateSOWasCSV(sowData: SOWData): string`
   - Converts TipTap JSON → CSV format matching your template
   - Output structure:
     ```
     Project Name,Client,Date
     [client name],[date]
     
     Item,Hours,Rate,Total
     [role 1],[hours],[rate],[total]
     [role 2],[hours],[rate],[total]
     ...
     TOTAL HOURS,[sum],[],[$sum+GST]
     ```

2. **Create: `/frontend/components/sow/export-buttons.tsx`**
   - New component with:
     - Download CSV button
     - Download PDF button (existing)
     - (Future) Push to Sheets button

3. **Modify: `/frontend/app/portal/sow/[id]/page.tsx`**
   - Add export button UI to SOW view
   - Add click handlers:
     - `downloadCSV()` → triggers CSV download
     - `downloadPDF()` → existing code
     - `pushToSheets()` → placeholder for Phase 2

**Dependencies:**
- `papaparse` - Already in package.json or install
- Native Blob API - built into browser

**Time Estimate:** 4-6 hours

**User Flow:**
```
View SOW
↓
Click "Download as CSV"
↓
CSV file downloads to user's computer
↓
User opens in Google Sheets OR Excel
↓
User manually uploads/creates sheet
```

---

### Phase 2: Google Sheets API Integration (Full Feature)

**Files to Create/Modify:**

1. **Create: `/frontend/lib/google-sheets-client.ts`**
   - OAuth 2.0 initialization
   - Sheet creation/update methods
   - Uses Google's client library (`gapi`)

2. **Create: `/frontend/app/api/sheets/authorize/route.ts`**
   - OAuth callback handler
   - Stores refresh tokens in database

3. **Create: `/backend/services/google_sheets_service.py`**
   - FastAPI endpoints for sheet operations
   - Uses `google-auth` + `google-auth-httplib2`
   - Methods:
     - `create_sheet(title, data)` → returns sheet URL
     - `update_sheet(sheet_id, data)` → updates existing
     - `share_sheet(sheet_id, user_email)`

4. **Create: `/frontend/app/api/push-to-sheets/route.ts`**
   - Handler for "Push to Sheets" button
   - Calls backend Google Sheets service
   - Returns sheet link to user

5. **Modify: `/frontend/components/sow/export-buttons.tsx`**
   - Add "Push to Google Sheets" button
   - Show loading state during upload
   - Display sheet link on success

**Dependencies:**
- `@google-auth-library/nodejs` (backend)
- `google-auth-oauth2` (frontend)
- Database migration: Add `google_refresh_tokens` table

**Time Estimate:** 12-16 hours

**User Flow:**
```
View SOW
↓
Click "Push to Google Sheets"
↓
Redirected to Google OAuth consent (first time only)
↓
Grant permissions
↓
Sheet created in Google Drive automatically
↓
Shared link displayed
↓
Users can access/edit in Sheets
```

---

## 5. TEMPLATE MAPPING (SOW Data → Spreadsheet)

### Header Section
```
Social Garden - Statement of Work
Project: [client_name] - [project_title]
Date: [creation_date]
SOW ID: [sow_id]
[blank line]
```

### Pricing Table
```
Role | Hours | Rate (AUD) | Total Cost (+GST)
---|---|---|---
[role_name] | [hours] | $[rate] | $[total]
[role_name] | [hours] | $[rate] | $[total]
...
TOTAL | [sum_hours] | | $[grand_total] +GST
```

### Deliverables Section
```
Deliverable Group | Phase | Tasks
---|---|---
[group_name] | [phase] | • [task 1] • [task 2]
[group_name] | [phase] | • [task 1] • [task 2]
```

### Assumptions & Terms
```
• [assumption 1]
• [assumption 2]
• Timeline: [timeline]
• Retainer: [if applicable]
```

---

## 6. TECHNICAL ARCHITECTURE

### CSV Export Only (Phase 1)

```
┌─────────────────────────────────────────────────────────┐
│ Frontend Component                                      │
│ ┌───────────────────────────────────────────────────┐  │
│ │ SOW View Page                                     │  │
│ │ - Generate button group                           │  │
│ │ - PDF button (existing) + CSV button (new)        │  │
│ └───────────────────────────────────────────────────┘  │
└────┬────────────────────────────────────────────────────┘
     │
     ↓ Click CSV button
     │
┌────┴────────────────────────────────────────────────────┐
│ sow-to-csv.ts (NEW)                                     │
│ ┌───────────────────────────────────────────────────┐  │
│ │ Function: generateSOWasCSV()                      │  │
│ │ - Parse TipTap JSON                               │  │
│ │ - Extract pricing table from markdown             │  │
│ │ - Generate CSV format                             │  │
│ └───────────────────────────────────────────────────┘  │
└────┬────────────────────────────────────────────────────┘
     │
     ↓ Generate blob
     │
┌────┴────────────────────────────────────────────────────┐
│ Browser Download                                        │
│ - Trigger download via <a href=blob>                   │
│ - Filename: [client]_[title]_SOW_[date].csv            │
└─────────────────────────────────────────────────────────┘
```

### Full Google Sheets Integration (Phase 2)

```
┌─────────────────────────────────────────────────────────┐
│ Frontend "Push to Sheets" Button                        │
└────┬────────────────────────────────────────────────────┘
     │
     ├─ First time: Redirect to Google OAuth
     │  ├─ User logs in
     │  ├─ Grants permissions
     │  └─ Frontend gets access token
     │
     └─ Subsequent: Use stored token
        │
        ↓
┌─────────────────────────────────────────────────────────┐
│ Frontend API: /api/push-to-sheets                       │
│ (POST with: sowData, accessToken, sheetId?)            │
└────┬────────────────────────────────────────────────────┘
     │
     ↓ Calls backend service
     │
┌─────────────────────────────────────────────────────────┐
│ Backend: google_sheets_service.py                       │
│ ┌───────────────────────────────────────────────────┐  │
│ │ Method 1: create_sheet()                          │  │
│ │ - Call Google Sheets API v4                       │  │
│ │ - Create new sheet in user's Drive                │  │
│ │ - Add headers + data                              │  │
│ │ - Return sheet URL                                │  │
│ │                                                   │  │
│ │ Method 2: update_sheet()                          │  │
│ │ - Update existing sheet with new data             │  │
│ │ - Preserve user edits (append mode)               │  │
│ └───────────────────────────────────────────────────┘  │
└────┬────────────────────────────────────────────────────┘
     │
     ↓
┌─────────────────────────────────────────────────────────┐
│ Google Sheets API                                       │
│ ├─ batchUpdate() - Create/format sheet                 │
│ ├─ values().update() - Add data                        │
│ └─ returnurl - Sheet is now ready                      │
└────┬────────────────────────────────────────────────────┘
     │
     ↓
┌─────────────────────────────────────────────────────────┐
│ Frontend: Show Success                                  │
│ - Share link to user                                    │
│ - "Open in Google Sheets" button                        │
│ - Copy link to clipboard                                │
└─────────────────────────────────────────────────────────┘
```

---

## 7. DATABASE SCHEMA CHANGES

### For Phase 2 (Google Sheets Integration)

```sql
-- New table: Store user Google auth tokens
CREATE TABLE `google_oauth_tokens` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `access_token` VARCHAR(500),
  `refresh_token` VARCHAR(500),
  `token_expiry` TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);

-- Optional: Track sheet creations
CREATE TABLE `sow_sheet_exports` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `sow_id` VARCHAR(255),
  `google_sheet_id` VARCHAR(255),
  `sheet_url` VARCHAR(500),
  `export_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `export_type` ENUM('csv', 'gsheet') DEFAULT 'csv'
);
```

---

## 8. IMPLEMENTATION TIMELINE

### Phase 1: CSV Export (This Week)
- **Day 1-2:** Design CSV format, create `sow-to-csv.ts`
- **Day 3:** Create export button component
- **Day 4:** Testing and UI polish
- **Day 5:** Deploy and gather feedback
- **Effort:** 4-6 hours dev

### Phase 2: Google Sheets (Next Week)
- **Day 1-2:** Google OAuth setup + credentials
- **Day 3-4:** Backend Google Sheets service
- **Day 5-6:** Frontend integration + button UI
- **Day 7-8:** Testing, error handling, permissions
- **Day 9-10:** Deployment
- **Effort:** 12-16 hours dev

---

## 9. GOOGLE SHEETS API SETUP REQUIREMENTS

### Credentials Needed (Phase 2)
1. **Google Cloud Project**
   - Create in Google Cloud Console
   - Enable "Google Sheets API" + "Google Drive API"

2. **OAuth 2.0 Credentials**
   - Client ID + Client Secret
   - Authorized redirect URIs: `https://yourdomain.com/api/sheets/callback`

3. **Service Account (Backend Option)**
   - Alternative to OAuth (app creates sheets, user doesn't auth)
   - Useful for auto-creating templates

### Environment Variables
```
GOOGLE_CLIENT_ID=xxxxx
GOOGLE_CLIENT_SECRET=xxxxx
GOOGLE_REDIRECT_URI=http://localhost:3001/api/sheets/callback
GOOGLE_SERVICE_ACCOUNT_KEY=/path/to/service-account.json
```

---

## 10. ESTIMATED COSTS & RESOURCES

### No Additional Costs
- ✅ Google Sheets API: Free tier (unlimited use)
- ✅ CSV export: Zero cost
- ✅ Hosting: No change

### Development Resources
- **Phase 1 (CSV):** 1 dev, 5-6 hours
- **Phase 2 (Sheets):** 1 dev, 12-16 hours
- **Total:** ~20-22 hours dev (can be 2-3 day sprint)

---

## 11. RECOMMENDED APPROACH FOR YOU

### Immediate Action (Next 2 Days)

**✅ RECOMMENDED: Start with Phase 1 (CSV Export)**

Why:
1. Get feature working NOW (4-6 hours)
2. Users can download SOW as CSV today
3. Works with Excel + Google Sheets (manual import)
4. No OAuth complexity = lower risk
5. Gather user feedback before Phase 2

**Implementation Priority:**
1. Create `sow-to-csv.ts` (converts SOW → CSV)
2. Add "Download CSV" button next to PDF button
3. Test with real SOW data
4. Deploy and get feedback

**Then (After 1 week):**
- If users ask for direct Sheets integration → do Phase 2
- If CSV is "good enough" → hold Phase 2

---

## 12. QUICK START (CSV Phase Only)

### Step 1: Install dependency
```bash
npm install papaparse --save  # if not already there
npm install @types/papaparse --save-dev
```

### Step 2: Create converter function
```typescript
// frontend/lib/sow-to-csv.ts
import Papa from 'papaparse';

export function generateSOWasCSV(
  clientName: string,
  projectTitle: string,
  roles: Array<{ name: string; hours: number; rate: number }>,
  sowDate: string
): string {
  const rows = [
    ['Social Garden - Statement of Work'],
    ['Project:', `${clientName} - ${projectTitle}`],
    ['Date:', sowDate],
    [],
    ['Role', 'Hours', 'Rate (AUD)', 'Total Cost'],
    ...roles.map(r => [r.name, r.hours, r.rate, r.hours * r.rate]),
    ['TOTAL', roles.reduce((sum, r) => sum + r.hours, 0), '', 
     roles.reduce((sum, r) => sum + (r.hours * r.rate), 0) + ' +GST'],
  ];
  
  return Papa.unparse(rows);
}
```

### Step 3: Add download button
```tsx
// In SOW view component
const downloadCSV = () => {
  const csv = generateSOWasCSV(clientName, title, roles, date);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${clientName}_SOW_${date}.csv`;
  a.click();
};
```

**Total time:** 2-3 hours

---

## SUMMARY & NEXT STEPS

| Item | Recommendation |
|------|-----------------|
| **MVP Feature** | CSV Export (Phase 1) |
| **Timeframe** | This week (2-3 days) |
| **Complexity** | Low (frontend-only) |
| **Google Sheets** | Hold for Phase 2 (next week) |
| **User Value** | Users can export + import to Sheets manually |
| **Future Upgrade** | Add one-click Sheets integration (Phase 2) |

**Action Items:**
1. ✅ Approve Phase 1 approach (CSV export)
2. ✅ Start implementation tomorrow
3. ✅ Deploy by end of week
4. ✅ Gather user feedback
5. ✅ Plan Phase 2 after user feedback
