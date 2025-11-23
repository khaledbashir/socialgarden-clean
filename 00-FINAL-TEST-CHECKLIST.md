# Final Test Checklist - System Prompt Fix Verification

**Objective:** Verify that the system message filter removal is working and the system prompt is now being enforced by AnythingLLM.

**Date:** 2024
**Status:** Ready for Testing

---

## Phase 1: Code Verification ✅ COMPLETE

- [x] System message filter removed from `frontend/app/api/anythingllm/stream-chat/route.ts` (lines 165-167)
- [x] TypeScript compilation: PASS (0 errors)
- [x] ESLint validation: PASS (0 warnings)
- [x] No other system message filters found in API routes
- [x] Backend is now passing system messages through to AnythingLLM

---

## Phase 2: AnythingLLM Admin Panel Verification (YOUR ACTION REQUIRED)

**Location:** AnythingLLM Admin Dashboard

### Checkpoint 2.1: Navigate to SOW Generator Workspace
- [ ] Open AnythingLLM admin panel
- [ ] Find the SOW generator workspace
  - Look for workspace named one of: `sow-generator`, `sowgen`, `gen-the-architect`, or similar
  - Note the exact workspace name: `_________________`

### Checkpoint 2.2: Verify System Prompt Configuration
- [ ] Click into the workspace settings
- [ ] Locate the "System Prompt" field
- [ ] **Copy the current system prompt text and verify it contains:**
  - [ ] Starts with: "You are SOWcial Garden AI..."
  - [ ] Contains: "PRE-FLIGHT CHECK" section
  - [ ] Contains: "OFFICIAL_RATE_CARD" or "official rate card" reference
  - [ ] Contains: "Use EXACT role names" instruction
  - [ ] Contains: "Never create new role names" warning

### Checkpoint 2.3: If System Prompt is Missing or Outdated
- [ ] If the prompt is NOT the Version 3 prompt with PRE-FLIGHT CHECK:
  - [ ] Delete the current system prompt (or leave it blank)
  - [ ] Paste in the Version 3 system prompt you have
  - [ ] Save the workspace configuration
  - [ ] Wait 30 seconds for AnythingLLM to reload
  - [ ] Verify the change was saved by refreshing the page

### Checkpoint 2.4: Confirm System Prompt is Saved
- [ ] Refresh the AnythingLLM admin page
- [ ] Navigate back to the workspace settings
- [ ] Verify the system prompt is still there
- [ ] Take a screenshot for reference

---

## Phase 3: Test Execution

### Checkpoint 3.1: Access the Chat Interface
- [ ] Open the SOW generator chat interface
- [ ] Verify you're in the correct workspace
- [ ] Note the workspace name shown: `_________________`

### Checkpoint 3.2: Send the Test Prompt
- [ ] Clear any previous conversation (start fresh if possible)
- [ ] Send this EXACT prompt:
  ```
  hubspot integration and 3 landing pages 22k discount 5 percent
  ```
- [ ] Record the time: `_________________`

### Checkpoint 3.3: Wait for Response
- [ ] Monitor the chat for the AI response
- [ ] Expected response time: 15-45 seconds
- [ ] Do NOT interrupt or send another message

---

## Phase 4: Verify the Response

### Critical Validation: PRE-FLIGHT CHECK Section

**MUST SEE:** The response should BEGIN with something like:

```
PRE-FLIGHT CHECK
================
Detected Parameters:
- Platform: HubSpot
- Scope Items: 3 Landing Pages
- Budget: $22,000 AUD
- Discount: 5%

Proceeding with SOW generation...
```

### Checkpoint 4.1: PRE-FLIGHT CHECK Present?
- [ ] YES - Response begins with PRE-FLIGHT CHECK section ✅
- [ ] NO - Response does NOT include PRE-FLIGHT CHECK ❌

**If NO:** The system prompt is not being applied. Stop here and report.

### Checkpoint 4.2: Role Names Validation

After the PRE-FLIGHT CHECK, the response should contain a pricing section with roles.

**VERIFY EACH ROLE NAME:**

Look through the response and find all role names listed. For each role, check that it matches EXACTLY one of these official roles:

**Copy-paste these official role names and check against the response:**

- [ ] "Account Management - (Senior Account Director)" (365 AUD/hr)
- [ ] "Account Management - (Account Director)" (295 AUD/hr)
- [ ] "Account Management - (Account Manager)" (180 AUD/hr)
- [ ] "Account Management - (Senior Account Manager)" (210 AUD/hr)
- [ ] "Project Management - (Account Director)" (295 AUD/hr)
- [ ] "Project Management - (Account Manager)" (180 AUD/hr)
- [ ] "Project Management - (Senior Account Manager)" (210 AUD/hr)
- [ ] "Tech - Delivery - Project Coordination" (110 AUD/hr)
- [ ] "Tech - Delivery - Project Management" (150 AUD/hr)
- [ ] "Tech - Producer - Campaign Build" (120 AUD/hr)
- [ ] "Tech - Producer - Copywriting" (120 AUD/hr)
- [ ] "Tech - Producer - Design" (120 AUD/hr)
- [ ] "Tech - Producer - Development" (120 AUD/hr)
- [ ] "Tech - Producer - Testing" (120 AUD/hr)
- [ ] "Tech - SEO Producer" (120 AUD/hr)
- [ ] "Tech - SEO Strategy" (180 AUD/hr)
- [ ] "Tech - Specialist - Campaign Optimisation" (180 AUD/hr)
- [ ] "Tech - Specialist - Integration Configuration" (180 AUD/hr)
- [ ] "Content - Campaign Strategy (Onshore)" (180 AUD/hr)
- [ ] "Content - SEO Copywriting (Onshore)" (150 AUD/hr)
- [ ] "Copywriting (Onshore)" (180 AUD/hr)
- [ ] "Design - Email (Onshore)" (295 AUD/hr)
- [ ] "Design - Landing Page (Onshore)" (190 AUD/hr)
- [ ] "Dev (orTech) - Landing Page - (Onshore)" (210 AUD/hr)

### Checkpoint 4.3: Document All Roles Used

List ALL role names that appear in the AI response:

1. `_________________________________`
2. `_________________________________`
3. `_________________________________`
4. `_________________________________`
5. `_________________________________`
6. `_________________________________`
7. `_________________________________`
8. `_________________________________`

### Checkpoint 4.4: Verify Each Role is Exact Match

For each role listed above, verify:
- [ ] Role 1: EXACT match from official list? YES / NO
- [ ] Role 2: EXACT match from official list? YES / NO
- [ ] Role 3: EXACT match from official list? YES / NO
- [ ] Role 4: EXACT match from official list? YES / NO
- [ ] Role 5: EXACT match from official list? YES / NO
- [ ] Role 6: EXACT match from official list? YES / NO
- [ ] Role 7: EXACT match from official list? YES / NO
- [ ] Role 8: EXACT match from official list? YES / NO

**CRITICAL:** If ANY role is:
- [ ] Abbreviated (e.g., "Acct Mgmt" instead of "Account Management - (Senior Account Director)")
- [ ] Hallucinated (e.g., a role not in the official list)
- [ ] Slightly different (e.g., missing punctuation or capitalization)
- [ ] Truncated

**Then the system prompt is NOT being enforced correctly.**

---

## Phase 5: Final Result

### SUCCESS CRITERIA ✅

All of the following must be TRUE:
1. [ ] PRE-FLIGHT CHECK section appears at the start of the response
2. [ ] All role names in the response are EXACT matches from the official rate card
3. [ ] NO hallucinated or abbreviated role names
4. [ ] The response includes pricing calculations
5. [ ] The 5% discount is reflected in the final pricing

### If SUCCESS:
🎉 **The system prompt fix is WORKING!**

The system message filter removal was successful, and AnythingLLM is now enforcing your role name constraints.

### If FAILURE:
❌ **The system prompt is still not being applied.**

Possible causes:
1. System prompt not saved in AnythingLLM admin
2. AnythingLLM service needs restart
3. Browser cache needs clearing (try incognito/private mode)
4. Workspace configuration is still outdated

**Action:** Go back to Phase 2 and verify the system prompt is correctly saved and visible.

---

## Additional Tests (Optional)

Once the main test passes, you can run these additional validation tests:

### Test 2: Different Prompt Format
Send: `Salesforce CRM setup and email marketing automation, 18k budget`

Expect: PRE-FLIGHT CHECK + exact role names

### Test 3: Edge Case with Typo
Send: `shopify store + 5 lading pages 15k`

Expect: AI handles typo gracefully but still uses exact role names

### Test 4: Complex Request
Send: `multiple integrations, api development, ongoing support 50k discount 10 percent`

Expect: Comprehensive SOW with only official role names

---

## Documentation

### Capture Results
- [ ] Take screenshot of PRE-FLIGHT CHECK section
- [ ] Take screenshot of roles section
- [ ] Record which roles were used
- [ ] Note any issues or surprises

### Share Results
Once testing is complete, share:
1. Screenshots of successful responses
2. List of role names that appeared
3. Any issues encountered
4. Confirmation that the fix is working

---

## Rollback Instructions (If Needed)

If the system prompt removal causes unexpected issues:

1. Go to `frontend/app/api/anythingllm/stream-chat/route.ts`
2. Find line 163 (should be blank now)
3. Add back these 4 lines:
   ```typescript
   // Guard: strip any system messages from actual processing
   if (Array.isArray(messages)) {
       messages = messages.filter((m: any) => m && m.role !== "system");
   }
   ```
4. Redeploy
5. The filtering will resume (unwanted, but restores old behavior)

**Note:** Rolling back is NOT recommended. The filtering was the root cause of the problem.

---

## Timeline

- **Phase 1 (Code Verification):** ✅ Already complete
- **Phase 2 (AnythingLLM Verification):** TODO - Estimated 5-10 minutes
- **Phase 3 (Test Execution):** TODO - Estimated 1-2 minutes
- **Phase 4 (Response Validation):** TODO - Estimated 5 minutes
- **Total Time:** Estimated 15-20 minutes

---

## Success Confirmation

Once you've verified all checkpoints, please confirm:

- [ ] All checkpoints in Phase 2 completed
- [ ] Test prompt sent and response received
- [ ] PRE-FLIGHT CHECK section verified
- [ ] All role names verified as exact matches
- [ ] Documentation captured
- [ ] Ready to declare SUCCESS or DEBUG further

**Status: READY TO TEST** 🚀
