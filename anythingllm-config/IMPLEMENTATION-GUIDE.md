# Client-Facing Prompt Implementation Guide

## Quick Start (5 Minutes)

### Step 1: Copy the New Prompt

1. Open `READY-TO-COPY-CLIENT-FACING-PROMPT.txt` in this folder
2. Select all content (Ctrl+A / Cmd+A)
3. Copy to clipboard (Ctrl+C / Cmd+C)

### Step 2: Update Your AnythingLLM Workspace

1. Log into your AnythingLLM instance
2. Navigate to your SOW generation workspace (e.g., "SOW Generator" or "Social Garden SOW")
3. Click **Settings** → **Chat Settings**
4. Find the **System Prompt** field
5. **Select all existing text** and delete it
6. **Paste the new prompt** from your clipboard
7. Click **Save Changes**

### Step 3: Test the Output

Send a test request:

```
Create SOW for HubSpot integration and 3 landing pages.
Client: BBUBU
Budget: $10,530 firm
Include basic CRM setup, workflow automation, and responsive design.
```

### Step 4: Verify the Output

✅ **Should See:**
- Clean document starting with "**Client:** BBUBU"
- Professional prose sections for each scope
- Clean investment breakdown table
- JSON block at the very end

❌ **Should NOT See:**
- "### STEP 1: SOW PROSE ASSEMBLY"
- "### STEP 2: INVESTMENT OVERVIEW"
- "### STEP 3: FINAL JSON BLOCK"
- "[editablePricingTable]" placeholders
- Meta-commentary or internal instructions

---

## What Changed?

### Before → After

| Before | After |
|--------|-------|
| "### STEP 1: SOW PROSE ASSEMBLY" | No internal labels - starts with client content |
| Brief scope descriptions | 2-3 paragraph detailed prose per scope |
| "[editablePricingTable]" | Formatted Markdown table with real numbers |
| Instructional tone | Professional, consultative tone |
| Meta-commentary visible | 100% client-ready content |

---

## Expected Output Structure

```
**Client:** [Client Name]

## [Project Title]

### Project Overview
[2-3 paragraphs explaining the project]

### Project Objectives
- Objective 1
- Objective 2
- Objective 3

### [Scope 1 Name]
[2-3 paragraphs of detailed prose]

### [Scope 2 Name]
[2-3 paragraphs of detailed prose]

---

## Investment Breakdown

| Scope | Estimated Hours | Investment (AUD) |
|-------|----------------|------------------|
| **Scope 1** | XX | $X,XXX |
| **Scope 2** | XX | $X,XXX |
| **Total (ex GST)** | XXX | $XX,XXX |
| **GST (10%)** | - | $X,XXX |
| **Total Investment** | XXX | $XX,XXX |

---

### Budget Context
[1-2 paragraphs about timeline and value]

```json
{...JSON block for system parsing...}
```
```

---

## Testing Scenarios

### Test 1: Basic SOW with 2 Scopes

**Input:**
```
Create SOW for website redesign.
Client: TechCorp
Budget: $45,000
Scopes: Discovery & Strategy, Design & Development
```

**Verify:**
- [ ] No "STEP" labels visible
- [ ] Two scope sections with detailed prose
- [ ] Investment table shows 2 scopes + totals
- [ ] JSON has 2 items in "scopes" array

### Test 2: Firm Budget Calculation

**Input:**
```
Create SOW for Salesforce integration.
Client: FinanceHub
Budget: $28,000 firm
This is the final price including GST.
```

**Verify:**
- [ ] Grand total in JSON equals $28,000
- [ ] GST calculation is correct
- [ ] Hours/roles adjusted to hit exact budget
- [ ] Investment table shows $28,000 as final total

### Test 3: Multi-Scope Complex Project

**Input:**
```
Create SOW for full marketing automation project.
Client: RetailPro
Budget: $85,000
Scopes:
1. HubSpot implementation
2. Email campaign setup
3. Landing page development
4. Training & handover
```

**Verify:**
- [ ] Four distinct scope sections
- [ ] Each scope has 2-3 paragraphs
- [ ] Investment table lists all 4 scopes
- [ ] JSON has 4 items in "scopes" array
- [ ] Total adds up to $85,000

---

## Troubleshooting

### Problem: Still seeing "STEP 1", "STEP 2" labels

**Solution:**
- Confirm you copied the ENTIRE new prompt
- Check that you saved changes in AnythingLLM
- Try refreshing the workspace page
- Clear browser cache if needed

### Problem: Output has placeholder text like "[editablePricingTable]"

**Solution:**
- The AI may be falling back to old instructions
- Verify the system prompt was actually saved
- Check if there's a different workspace being used
- Ensure no hardcoded prompt in your backend code

### Problem: JSON format is wrong (uses "scopeItems" instead of "scopes")

**Solution:**
- This is critical - the new prompt explicitly requires "scopes"
- Check if rate card context is being passed correctly
- Verify the AI is using the updated system prompt
- Test with a simpler request first

### Problem: Math doesn't add up in the investment table

**Solution:**
- The prompt includes calculation rules
- Verify the rate card has correct rates
- Check if the AI is working backwards from firm budget
- May need to manually verify totals before sending

### Problem: Prose sections are too brief or bullet-pointy

**Solution:**
- The prompt requires 2-3 paragraphs per scope
- Try adding more context in your request
- Specify "detailed scope descriptions"
- May need to regenerate if too brief

---

## Advanced Configuration

### Adjusting Prose Length

If you want more/less detail in scope descriptions, modify this section in the prompt:

```
Write 2-3 paragraphs of client-facing prose...
```

Change to:
- "1-2 paragraphs" for briefer descriptions
- "3-4 paragraphs" for more detailed descriptions

### Adding Custom Sections

To add a "Timeline" or "Next Steps" section, add to the prompt structure:

```
### 8. Timeline & Next Steps (Optional)

Include a brief timeline and next steps section if relevant.
```

### Customizing Investment Table Format

Current format:
```
| Scope | Estimated Hours | Investment (AUD) |
```

Can modify to:
```
| Phase | Duration | Team | Investment (AUD) |
```

---

## Integration with Frontend

### How the JSON Block is Used

The JSON block at the end is parsed by your backend to:
1. Generate interactive pricing tables (one per scope)
2. Show deliverables in expandable sections
3. Display assumptions
4. Enable role-by-role editing
5. Calculate totals dynamically

### What the Client Sees

Clients see the **prose sections** and **investment table** ONLY.

The JSON block is:
- Hidden from the rendered output
- Used only for backend data structure
- Never displayed in the PDF or final document

---

## Maintenance

### When to Update the Prompt

Update the prompt when:
- ✅ Sam requests new sections or format changes
- ✅ You need different calculation logic
- ✅ Writing style needs adjustment
- ✅ New compliance or legal requirements

### How to Version Control

1. Keep old prompts in dated files:
   - `multi-scope-system-prompt-v1-2024-01.md`
   - `multi-scope-system-prompt-v2-2024-06.md`
   - `READY-TO-COPY-CLIENT-FACING-PROMPT.txt` (current)

2. Document changes in `BEFORE-AFTER-CLIENT-FACING-PROMPT.md`

3. Test thoroughly before deploying to production workspace

---

## Success Metrics

After implementing the new prompt, you should see:

📈 **Quality Improvements:**
- More professional, polished SOW documents
- Less manual editing required
- Higher client conversion rates
- Consistent format across all SOWs

⏱️ **Time Savings:**
- 50-70% reduction in SOW creation time
- Minimal post-generation editing
- Faster review and approval process

✅ **Technical Benefits:**
- JSON parsing still works perfectly
- Multi-scope tables render correctly
- All calculations remain accurate
- Backend integration unchanged

---

## Support

If you encounter issues:

1. **Check `BEFORE-AFTER-CLIENT-FACING-PROMPT.md`** for visual comparison
2. **Review testing scenarios** above
3. **Verify rate card context** is being passed correctly
4. **Test with simple request** before complex ones
5. **Check browser console** for JSON parsing errors

---

## Next Steps

After successful implementation:

- [ ] Update documentation for your team
- [ ] Train Sam/users on the new format
- [ ] Update any SOW templates to match
- [ ] Consider adding custom sections if needed
- [ ] Monitor output quality and iterate

---

**Last Updated:** 2025-01-XX  
**Version:** 2.0 (Client-Facing)  
**Status:** ✅ Ready for Production