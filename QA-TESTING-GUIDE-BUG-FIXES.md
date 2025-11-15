# QA Testing Guide: Bug Fixes Phase 2
## SOW System Hardening - Final Polish Validation

**Date:** November 15, 2025  
**Branch:** `sow-latest`  
**Commit:** `92abbd5`  
**Testing Priority:** HIGH (Production Blocker Fixes)

---

## Overview

This guide provides step-by-step instructions for QA validation of three critical bug fixes in the SOW generator system. All bugs have been fixed and deployed to staging. Your mission: Verify each fix works correctly in the live environment.

---

## 🔴 Test 1: Role Sorting Logic (P0 - CRITICAL)

### Bug Description
**BEFORE:** Account Management role appeared at position 3 (after Tech - Delivery), violating business requirements.  
**AFTER:** Account Management must appear at the BOTTOM of the pricing table, just before totals.

### Test Steps

1. **Navigate to SOW Generator**
   - Go to `/portal/requirements`
   - Start a new SOW creation

2. **Enter Basic Information**
   ```
   Client Name: Test Client ABC
   Project Name: Role Sorting Validation Test
   Brief Description: Testing mandatory role placement
   Budget: $50,000
   ```

3. **Generate Initial SOW**
   - Click "Generate SOW"
   - Wait for AI to complete generation
   - Document loads with pricing table

4. **Inspect Pricing Table Order**
   
   **Expected Order (Top to Bottom):**
   ```
   Position 1: Tech - Head Of - Senior Project Management
   Position 2: Tech - Delivery - Project Coordination
   Position 3+: [Any additional AI-suggested roles]
   Position LAST: Account Management - Senior Account Manager
   [Totals section below]
   ```

5. **Verification Checkpoints**
   - [ ] "Tech - Head Of" is the FIRST row in the pricing table
   - [ ] "Tech - Delivery" is the SECOND row in the pricing table
   - [ ] "Account Management" is the LAST row BEFORE totals
   - [ ] Any additional roles appear BETWEEN positions 2 and last
   - [ ] Order is maintained when editing the SOW

6. **Edge Case: Add Additional Roles**
   - Click "+ Add Role" button
   - Select "Senior Developer" from dropdown
   - Add hours (e.g., 40) and save
   - Verify: Account Management STILL appears at the bottom
   - Verify: New role appears in the middle section

7. **Edge Case: Drag and Drop**
   - Try to drag "Account Management" to a different position
   - Release the row
   - Verify: System maintains correct order OR prevents invalid reordering

### Pass Criteria
✅ All mandatory roles present  
✅ Head Of at top, Account Management at bottom  
✅ Order maintained across edits  
✅ Additional roles inserted in middle section  

### Fail Criteria
❌ Account Management appears at position 3  
❌ Mandatory roles in wrong order  
❌ Roles missing from table  

---

## 🟡 Test 2: Race Condition / Flicker (P1 - HIGH)

### Bug Description
**BEFORE:** Users briefly saw raw AI data with abbreviations ("Tec," "Acc") before enforcement engine corrected it. Caused confusing flicker.  
**AFTER:** Users see loading indicator, then only compliant data. No flicker.

### Test Steps

1. **Prepare for Visual Testing**
   - Clear browser cache (Ctrl+Shift+Del)
   - Open browser DevTools → Network tab
   - Set throttling to "Slow 3G" (to make flicker more visible if present)

2. **Create New SOW**
   - Navigate to `/portal/requirements`
   - Enter project details:
     ```
     Client: Race Condition Test
     Project: Visual Flicker Validation
     Budget: $30,000
     ```
   - Click "Generate SOW"

3. **Watch Pricing Table Load**
   
   **During Loading (Expected Behavior):**
   - [ ] Clean loading indicator appears
   - [ ] Loading indicator has spinner animation
   - [ ] Text says "Loading pricing table..."
   - [ ] NO pricing data visible during this phase

4. **When Table Appears (Expected Behavior):**
   - [ ] Loading indicator disappears
   - [ ] Pricing table appears in ONE render (no flicker)
   - [ ] First visible data shows FULL role names:
     - "Tech - Head Of - Senior Project Management"
     - "Tech - Delivery - Project Coordination"
     - "Account Management - Senior Account Manager"
   - [ ] NO abbreviations visible at any point:
     - ❌ "Tec" 
     - ❌ "Acc"
     - ❌ "Proj Mgmt"

5. **Video Recording Test (Optional but Recommended)**
   - Use screen recording software (OBS, Loom, etc.)
   - Record the SOW generation process
   - Play back in slow motion
   - Verify no frame shows abbreviated role names

6. **Repeat Test 3 Times**
   - Clear cache between tests
   - Try with different project descriptions
   - Verify consistent behavior

### Pass Criteria
✅ Loading indicator appears smoothly  
✅ No flicker of invalid data  
✅ First render shows compliant, full role names  
✅ Consistent across multiple test runs  

### Fail Criteria
❌ Brief flash of "Tec" or "Acc" visible  
❌ Two distinct renders (raw data → corrected data)  
❌ No loading indicator shown  
❌ Inconsistent behavior between loads  

---

## 🟡 Test 3: Truncated Role Names (P1 - HIGH)

### Bug Description
**BEFORE:** Role names in the dropdown were truncated: "Project Management - (Account..."  
**AFTER:** Full role names visible without truncation.

### Test Steps

1. **Open Pricing Table Editor**
   - Create or open any SOW
   - Navigate to the pricing table section
   - Click on any role dropdown to edit

2. **Inspect Role Column Width**
   
   **Visual Check:**
   - [ ] Role column appears wider than before (30% width)
   - [ ] Full role names visible without "..." truncation
   - [ ] Can read complete role text:
     ```
     ✓ "Tech - Head Of - Senior Project Management"
     ✓ "Tech - Delivery - Project Coordination"  
     ✓ "Account Management - Senior Account Manager"
     ```

3. **Test All Role Dropdowns**
   
   For EACH row in the pricing table:
   - [ ] Click the role dropdown
   - [ ] Verify all options show full names in dropdown list
   - [ ] Select a different role
   - [ ] Verify selected role displays full name (not truncated)
   - [ ] No need to re-open dropdown to verify selection

4. **Test Hover Tooltips**
   - Hover mouse over each selected role name
   - Verify tooltip appears with full role text
   - Especially important for long role names

5. **Test Similar Role Names**
   
   If multiple similar roles exist:
   ```
   - Account Management - Senior Account Manager
   - Account Management - Account Manager
   - Account Management - Account Coordinator
   ```
   
   - [ ] Can distinguish between them WITHOUT opening dropdown
   - [ ] Full text visible in editor (WYSIWYG)
   - [ ] No ambiguity about which role is selected

6. **Test on Different Screen Sizes**
   
   - **Desktop (1920x1080):**
     - [ ] Full role names visible
   
   - **Laptop (1366x768):**
     - [ ] Full role names visible
   
   - **Tablet (768px width):**
     - [ ] Role names visible (may wrap to multiple lines - that's OK)

7. **Export to PDF**
   - Generate PDF from the SOW
   - Open PDF
   - Verify full role names appear in PDF (not truncated)

### Pass Criteria
✅ Full role names visible in editor  
✅ No "..." truncation in selected values  
✅ Hover tooltips show complete text  
✅ Can distinguish between similar roles  
✅ WYSIWYG - editor matches PDF output  

### Fail Criteria
❌ Role names truncated with "..."  
❌ Must open dropdown to verify selection  
❌ Similar roles indistinguishable  
❌ Different display in editor vs PDF  

---

## 🔄 Regression Tests

### Ensure Existing Functionality Still Works

1. **Existing SOWs Load Correctly**
   - [ ] Open SOWs created before this update
   - [ ] Pricing tables display correctly
   - [ ] No data loss or corruption
   - [ ] Can still edit and save

2. **Multi-Scope SOWs**
   - [ ] Create SOW with 3+ scopes
   - [ ] Each scope has correct role ordering
   - [ ] Each scope shows Account Management at bottom
   - [ ] Scope headers display correctly

3. **Drag and Drop**
   - [ ] Can still reorder rows within pricing table
   - [ ] Drag handle (⋮⋮) visible on hover
   - [ ] Drop target indicator appears
   - [ ] Reordering saves correctly

4. **Add/Remove Roles**
   - [ ] "+ Add Role" button works
   - [ ] Can remove non-mandatory roles
   - [ ] Cannot remove mandatory roles (or they re-appear)
   - [ ] Changes persist after save

5. **Rate Card Integration**
   - [ ] All rates match official Rate Card
   - [ ] Changing role updates rate automatically
   - [ ] Cannot manually override rates
   - [ ] Rate Card updates propagate to existing SOWs

6. **Financial Calculations**
   - [ ] Subtotal calculates correctly
   - [ ] Discount applies correctly
   - [ ] GST calculation accurate (10%)
   - [ ] All currency values show "+GST" suffix
   - [ ] Grand total matches expectations

---

## 🎯 End-to-End Validation

### Complete User Journey Test

1. **Create SOW from Scratch**
   ```
   Client: E2E Test Corporation
   Project: Complete System Validation
   Description: Full stack social media management
   Budget: $75,000
   Timeline: 3 months
   ```

2. **Generate and Verify**
   - [ ] Loading indicator appears (no flicker)
   - [ ] Pricing table loads with correct role order
   - [ ] All role names fully visible (not truncated)
   - [ ] Account Management at bottom

3. **Edit Pricing**
   - [ ] Add "Senior Developer" role
   - [ ] Adjust hours for Head Of role
   - [ ] Remove and re-add a non-mandatory role
   - [ ] Verify order maintained throughout

4. **Export to PDF**
   - [ ] Generate professional PDF
   - [ ] Open PDF and inspect pricing table
   - [ ] Verify role order matches editor
   - [ ] Verify full role names in PDF

5. **Send to Client**
   - [ ] Use "Send to Client" feature
   - [ ] Preview email template
   - [ ] Verify PDF attachment correct
   - [ ] (Optional) Send to test email and verify

---

## 📊 Test Summary Template

```
QA TESTER: [Your Name]
DATE: [Test Date]
BRANCH: sow-latest
COMMIT: 92abbd5
ENVIRONMENT: [Staging/Production]

TEST RESULTS:
┌─────────────────────────────────┬────────┬────────┐
│ Test                            │ Status │ Notes  │
├─────────────────────────────────┼────────┼────────┤
│ P0: Role Sorting                │ ✅/❌  │        │
│ P1: Race Condition              │ ✅/❌  │        │
│ P1: Truncated Names             │ ✅/❌  │        │
│ Regression: Existing SOWs       │ ✅/❌  │        │
│ Regression: Multi-Scope         │ ✅/❌  │        │
│ Regression: Drag & Drop         │ ✅/❌  │        │
│ Regression: Rate Card           │ ✅/❌  │        │
│ E2E: Complete Journey           │ ✅/❌  │        │
└─────────────────────────────────┴────────┴────────┘

OVERALL STATUS: ✅ PASS / ❌ FAIL

ISSUES FOUND:
1. [Issue description if any]
2. [Issue description if any]

RECOMMENDATION:
[ ] Approved for Production
[ ] Requires Additional Fixes
[ ] Blocked - Critical Issues Found

SIGN-OFF: ___________________
```

---

## 🚨 Bug Reporting Template

If you find issues during testing:

```markdown
### Bug Report

**Title:** [Brief description]

**Severity:** Critical / High / Medium / Low

**Test Case:** [Which test from this guide]

**Environment:**
- Browser: [Chrome/Firefox/Safari + version]
- OS: [Windows/Mac/Linux]
- Screen Resolution: [e.g., 1920x1080]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happened]

**Screenshots/Video:**
[Attach visual evidence]

**Console Errors:**
```
[Paste any browser console errors]
```

**Additional Context:**
[Any other relevant information]
```

---

## ✅ Sign-Off Checklist

Before approving for production:

- [ ] All P0 tests passed
- [ ] All P1 tests passed
- [ ] All regression tests passed
- [ ] E2E validation successful
- [ ] Tested on multiple browsers (Chrome, Firefox, Safari)
- [ ] Tested on different screen sizes
- [ ] No new console errors or warnings
- [ ] Performance acceptable (no slowdowns)
- [ ] Accessible to keyboard navigation
- [ ] Documentation reviewed and accurate

---

## 📞 Support Contacts

**Development Team:** [Team contact]  
**Project Manager:** [PM contact]  
**Escalation:** [Escalation contact]

**Slack Channel:** #sow-generator-qa  
**Jira Board:** [Board link]

---

**Happy Testing! 🧪**

Remember: These fixes eliminate production-blocking bugs. Thorough QA is essential before release.