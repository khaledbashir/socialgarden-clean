# Portal UI Cleanup - Visual Guide

## Client Portal Layout (After Cleanup)

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  [Menu]  [SG] Client Name         [Green Checkmark] PDF | Excel | Share
│           SOW Title                                                 │
│                                                                     │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                          OVERVIEW TAB CONTENT                        │
│                                                                      │
│  At a Glance                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Total Invest │  │   Timeline   │  │    Status    │              │
│  │  $XX,XXX AUD │  │   Start Date │  │  ⏳ Pending  │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                      │
│  [Meet the Team videos]                                             │
│  [Why Social Garden section]                                        │
│                                                                      │
│  What would you like to do?                                         │
│  ┌──────────────────────┐  ┌──────────────────────┐                │
│  │ Read Full Proposal   │  │  View Pricing        │                │
│  └──────────────────────┘  └──────────────────────┘                │
│  ┌──────────────────────┐  ┌──────────────────────┐                │
│  │ Ask AI Questions     │  │  Download PDF        │                │
│  └──────────────────────┘  └──────────────────────┘                │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

SIDEBAR (Left)                      AI CHAT PANEL (Right, when open)
├─ Overview [ACTIVE]              ├─ AI Assistant
├─ Full Document                   ├─ Quick questions
├─ Pricing                         ├─ Message history
├─ Timeline                        ├─ Text input
└─                                 └─
   [AI Assistant]                     
   [Download PDF]              
   [Download Excel] ← NEW!          
   [Accept Proposal] ← GREEN         
```

---

## Header Buttons (Top Right)

### Before Cleanup ❌
```
[Accepted ✓] [Share] [Create Sheet]
                      (Google OAuth)
```

### After Cleanup ✅
```
[Accepted ✓] [PDF] [Excel] [Share]
              ↓      ↓
          Download  Download
          PDF       Excel
```

---

## Button Locations

### Top Header Bar
Located in sticky header (always visible when scrolling):
- **PDF Button** (Download icon)
  - Hover color: Green (#1CBF79)
  - Downloads: `{ClientName}-SOW.pdf`
  
- **Excel Button** (FileSpreadsheet icon) — NEW
  - Hover color: Blue
  - Downloads: `{ClientName}-SOW-{YYYY-MM-DD}.xlsx`
  
- **Share Button** (Share2 icon)
  - Hover color: Green (#1CBF79)
  - Future: Opens share menu

### Sidebar Footer (Always Visible)
```
┌────────────────────────┐
│  Download PDF          │
│  Download Excel ← NEW! │
│                        │
│  Accept Proposal ✓ ← GREEN & PROMINENT
└────────────────────────┘
```

---

## Excel Export File Structure

### File Name
```
ClientName-SOW-2025-10-25.xlsx
```

### Sheet 1: Overview
```
┌─────────────────────┬──────────────────────┐
│ Social Garden SOW   │                      │
├─────────────────────┼──────────────────────┤
│ Client Name         │ Acme Corp            │
│ Document Title      │ Digital Marketing... │
│ Total Investment    │ $45,000 + GST        │
│ Created Date        │ 25/10/2025           │
│ Status              │ Pending / ✅ Accepted│
└─────────────────────┴──────────────────────┘
```

### Sheet 2: Content
```
┌────────────────────────────────────────┐
│ Full Proposal Content                  │
├────────────────────────────────────────┤
│ (All HTML removed, plain text only)    │
│                                        │
│ Scope of Work                          │
│ Services & Deliverables                │
│ Project Timeline                       │
│ Pricing Overview                       │
│ Terms & Conditions                     │
│ ... [full content from SOW] ...        │
└────────────────────────────────────────┘
```

### Sheet 3: Pricing
```
┌────────────────────────────┬────────────┐
│ Pricing Summary            │ AUD        │
├────────────────────────────┼────────────┤
│ Base Services Total        │ $35,000    │
│ Content Cost               │ $2,400     │
│ Social Media Cost          │ $500       │
│ Ad Management Fee          │ $3,000     │
│ Add-Ons Total              │ $1,500     │
├────────────────────────────┼────────────┤
│ Subtotal                   │ $42,400    │
│ GST (10%)                  │ $4,240     │
│ Discount (if any)          │ ($2,120)   │
├────────────────────────────┼────────────┤
│ GRAND TOTAL                │ $44,520    │
└────────────────────────────┴────────────┘
```

---

## User Actions & Flow

### Scenario 1: Client Reviews & Accepts
```
Client Portal Page Opens
         ↓
[Read overview, watch videos]
         ↓
[Click "Full Document" to read proposal]
         ↓
[Click "Pricing" to see breakdown]
         ↓
[Ask "What if we reduce scope?" via AI]
         ↓
[Download PDF for their records: PDF button]
         ↓
[Click "Accept Proposal"] → Green button → Toast: "Accepted!"
         ↓
Status changes to ✅ Accepted
```

### Scenario 2: Client Needs to Share/Import
```
Client Portal Page Opens
         ↓
[Review proposal content]
         ↓
[Download Excel: Excel button] → `ClientName-SOW-2025-10-25.xlsx`
         ↓
[Opens in Excel / Google Sheets / Numbers]
         ↓
[Can format, print, share with stakeholders]
         ↓
[Share button to send link to team]
         ↓
[Back to portal, Accept Proposal]
```

### Scenario 3: Client Has Questions
```
Client Portal Page Opens
         ↓
[Ask AI Assistant] → Chat panel opens on right
         ↓
[Type question: "What's included in Phase 2?"]
         ↓
[AI responds with context from SOW]
         ↓
[Download Excel for reference]
         ↓
[Accept or request adjustments]
```

---

## What Changed

| Feature | Old | New |
|---------|-----|-----|
| Google Auth | ✅ Required | ❌ Removed |
| "Create Sheet" button | ✅ Present | ❌ Gone |
| PDF Download | ✅ Works | ✅ Works (improved) |
| Excel Export | ❌ None | ✅ Direct download |
| Accept Button | ✅ Present | ✅ More prominent |
| Sidebar buttons | 2 | 3 (added Excel) |
| Header buttons | 3 | 3 (replaced Google with Excel) |

---

## Mobile Responsiveness

### Mobile Header (Stack vertically)
```
[Menu] [SG] Client
    SOW Title

[PDF] [Excel] [Share]
(stacked or wrapped)
```

### Mobile Sidebar
```
Buttons stack vertically:
- Download PDF
- Download Excel
- Accept Proposal (prominent green)
- AI Assistant (toggle)
```

---

## Keyboard Shortcuts (Future)

Could be added later:
- `P` = Download PDF
- `E` = Download Excel
- `A` = Accept Proposal
- `?` = Chat with AI

---

## Browser Console Messages

### Success Messages
```javascript
✅ PDF downloaded successfully!
✅ Excel file downloaded successfully!
🎉 Proposal accepted! We'll be in touch shortly to get started.
```

### Error Messages
```javascript
❌ Failed to download PDF. Please try again.
❌ Failed to download Excel file. Please try again.
❌ Failed to accept proposal. Please contact us directly.
```

---

## Color Scheme

- **Accept Button**: Green `#1CBF79` (Social Garden primary)
- **PDF Button**: Border green on hover
- **Excel Button**: Border blue on hover
- **Share Button**: Border green on hover
- **Accepted Status**: Green `#22c55e` (success)

---

## File Sizes

### Expected Downloads
- **PDF**: 2-5 MB (depending on images in SOW)
- **Excel**: 50-200 KB (very small)

---

## Support Documentation

For clients:
- "How do I download the proposal?" → Use PDF or Excel buttons
- "Can I import this into my CRM?" → Use Excel export
- "How do I accept the proposal?" → Click green "Accept Proposal" button
- "What if I have questions?" → Use AI Assistant panel

---

**Last Updated:** October 25, 2025  
**Status:** Production Ready ✅
