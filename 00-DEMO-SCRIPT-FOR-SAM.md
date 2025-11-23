# 🎯 How to Demo Requirements Page to Sam

**Quick 5-minute demo script to prove what you built matches what he asked for**

---

## Setup (30 seconds)

1. Open terminal: `cd frontend && pnpm dev`
2. Wait for server to start (http://localhost:3333)
3. Open two browser tabs:
   - **Tab 1:** `http://localhost:3333/portal/requirements` (Requirements page)
   - **Tab 2:** `http://localhost:3333/portal/sow/[any-sow-id]` (Live SOW example)

---

## Demo Script (4 minutes)

### Step 1: Show Overall Completion (30 seconds)

**SAY:** "Let me show you exactly what you asked for vs. what I built."

**DO:**
- Point to the big **93%** completion stat at the top
- Show the breakdown: 39 completed, 3 partial, 0 not started
- Scroll down to the 6 category cards

**SAY:** "I broke down all 42 requirements from your brief into 6 categories. Let's dive into the critical ones."

---

### Step 2: Pricing & Role Logic (90 seconds)

**SAY:** "You said every role and rate must match the Social Garden rate card, and all prices must be in AUD."

**DO:**
- Click **"Pricing & Role Logic"** tab in sidebar
- Scroll to requirement **3.1 - Rate Card Usage**
- Show the ✅ Completed badge
- Point to implementation: "Complete 82-role rate card embedded in THE_ARCHITECT_SYSTEM_PROMPT"
- Point to location: `frontend/lib/knowledge-base.ts`

**SAY:** "Here's proof it's in the code..."

**DO:**
- Switch to Tab 2 (live SOW)
- Click "Generate New Scope" or open existing SOW chat
- Ask AI: "Show me the pricing table for a 3-month CRM implementation"
- Wait for AI response with pricing table
- Point to the roles (e.g., "Tech-Delivery - Salesforce Developer - $165/hr AUD")

**SAY:** "Every role name and rate comes from the exact rate card you specified."

---

### Step 3: PDF Branding & Font (60 seconds)

**SAY:** "You wanted branded PDFs with the actual Social Garden logo and Plus Jakarta Sans font."

**DO:**
- Go back to Tab 1 (Requirements page)
- Click **"PDF & Document Presentation"** tab
- Show requirement **5.2 - Branding: Use actual Social Garden logo**
- Show requirement **5.3 - Font: Plus Jakarta Sans**
- Both have ✅ Completed badges

**SAY:** "Let me show you the actual output..."

**DO:**
- Switch to Tab 2 (live SOW)
- Click "Export PDF" button (top right)
- Wait for PDF download
- Open the PDF
- Point to:
  - Social Garden logo in header (not text)
  - Font throughout document (Plus Jakarta Sans)
  - Brand colors (dark teal + green)

**SAY:** "This is production-ready. You can send this directly to clients."

---

### Step 4: SOW Structure (60 seconds)

**SAY:** "You specified the exact structure: Overview, Scope, Outcomes, Phases, Deliverables as bullets, Pricing, Assumptions, Timeline."

**DO:**
- Go back to Tab 1 (Requirements page)
- Click **"SOW Structure & Content"** tab
- Show requirement **2.1 - Adherence to Social Garden Structure**
- Show requirement **2.2 - Deliverables must be bulleted items**

**DO:**
- Switch to Tab 2 (live SOW)
- Scroll through an existing SOW
- Point out each section:
  - ✅ Overview at top
  - ✅ "What Does the Scope Include?" section
  - ✅ Project Outcomes
  - ✅ Deliverables as **bullet points** (not paragraph)
  - ✅ Pricing table with roles/hours/rates
  - ✅ Assumptions
  - ✅ Timeline

**SAY:** "Every section you asked for is here, in the right order."

---

### Step 5: The 3 Partial Items (30 seconds)

**SAY:** "There are 3 items marked 'partial' - but they all work, just manually instead of automated."

**DO:**
- Go back to Tab 1 (Requirements page)
- Click **"Functionality & Editing"** tab
- Point to the 3 orange ⚠️ badges:
  - 4.3 - Discount Presentation
  - 4.6 - Toggle Total Price
  - 4.7 - CSV Export

**SAY:** "These work - you can edit tables in the editor, add discounts, copy data to Excel. They just don't have a dedicated button yet. If you want the buttons, I can add them."

---

### Step 6: Wrap-Up (30 seconds)

**SAY:** "So to answer your question: Did I build what you asked for?"

**DO:**
- Go to Tab 1 (Requirements page)
- Click **"Overview"** tab
- Point to the completion stats
- Scroll down to "Key Achievements" section

**SAY:** 
- ✅ "82-role rate card with AUD pricing"
- ✅ "Complete system prompt with all your pricing logic"
- ✅ "Branded PDF export with your logo and font"
- ✅ "Two-step workflow: chat, refine, edit, export"
- ✅ "Multi-workspace architecture for analytics"

**SAY:** "Everything you asked for is built and documented. This page proves it."

---

## Follow-Up Questions (Be Ready)

### Q: "Can I change the rate card?"
**A:** "Yes. It's in `frontend/lib/knowledge-base.ts`. Edit the THE_ARCHITECT_SYSTEM_PROMPT constant. The AI will use the new rates immediately."

### Q: "Can I add more roles?"
**A:** "Yes. Just add them to the rate card in the system prompt. Format: `- Role Name: $XXX/hr`"

### Q: "What about those 3 partial items?"
**A:** "They work via the editor now. If you want dedicated UI buttons, I can add them. Should take 1-2 hours each."

### Q: "Can clients see this Requirements page?"
**A:** "It's at `/portal/requirements` - you can share the link. Or we can make a simplified client-facing version without the technical details."

### Q: "How do I update the system prompt?"
**A:** "Edit `frontend/lib/knowledge-base.ts` → update THE_ARCHITECT_SYSTEM_PROMPT → restart the server. Changes apply immediately."

---

## Troubleshooting

### If AI doesn't show pricing table:
- Make sure you're in a SOW-type workspace (not generic)
- Check that the workspace has THE_ARCHITECT_SYSTEM_PROMPT applied
- Try: "Generate a pricing table for [service] with [roles]"

### If PDF export fails:
- Check backend is running: `curl http://localhost:8000/health`
- Check env var: `echo $NEXT_PUBLIC_PDF_SERVICE_URL`
- Check browser console for errors

### If Requirements page doesn't load:
- Check URL: Must be `/portal/requirements` (no trailing slash)
- Check frontend is running: `ps aux | grep next`
- Check browser console for React errors

---

## Pro Tips

1. **Show the code live**: If Sam wants proof, open `frontend/lib/knowledge-base.ts` in VS Code and search for "RATE CARD" to show the actual data.

2. **Generate a fresh SOW during demo**: Instead of showing an old one, generate a new SOW live. Ask: "Create a 4-month Salesforce implementation SOW with 3 phases" and watch it generate with correct rates.

3. **Export PDF live**: Don't use a pre-made PDF. Generate one during the demo so Sam sees the end-to-end workflow.

4. **Highlight the system prompt**: Show him THE_ARCHITECT_SYSTEM_PROMPT in the code. It's 500+ lines of detailed instructions - that's where all the magic happens.

5. **Compare to his original brief**: Have his requirements document open on another screen. Go line-by-line if needed.

---

## Time Allocation

| Section | Time | Why |
|---------|------|-----|
| Overview stats | 30s | Quick confidence builder |
| Pricing/Roles | 90s | Most critical requirement |
| PDF Export | 60s | Visual proof of branding |
| SOW Structure | 60s | Shows attention to detail |
| Partial items | 30s | Transparency about gaps |
| Wrap-up | 30s | Strong closing |
| **TOTAL** | **5 min** | Focused, high-impact |

---

## Success Criteria

You've successfully demoed when Sam says:

✅ "This is exactly what I asked for"  
✅ "The rate card is perfect"  
✅ "The PDF looks professional"  
✅ "I can use this with clients today"

---

**Good luck! 🚀**
