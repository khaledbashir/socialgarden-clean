# Quick Fix: Multi-Scope Tables Not Working

## Problem
The AI is generating only ONE big table instead of SEPARATE tables for each scope.

## Root Cause
Your current system prompt is instructing the AI to use the OLD JSON format (`scopeItems` with `roles`) instead of the NEW format (`scopes` with `role_allocation`).

## Solution: Update Your AnythingLLM Workspace System Prompt

### Step 1: Go to Your Workspace Settings
1. Open: https://ahmad-anything-llm.840tjq.easypanel.host/workspace/sow-generator/settings
2. Click on **"System Prompt"** tab

### Step 2: Replace the JSON Section
Find this section in your current prompt:
```
STEP 3: FINAL JSON BLOCK (HIDDEN DATA)
```

Replace the JSON example with this EXACT structure:

```json
{
  "currency": "AUD",
  "gst_rate": 10,
  "scopes": [
    {
      "scope_name": "HubSpot Onboarding & Strategy",
      "scope_description": "Complete HubSpot setup and customer journey mapping",
      "deliverables": [
        "Configured HubSpot instance",
        "Customer journey maps"
      ],
      "assumptions": [
        "Client provides access credentials within 2 business days",
        "Existing data is clean and structured"
      ],
      "role_allocation": [
        {
          "role": "Tech - Sr. Consultant - Strategy",
          "description": "Strategic oversight and journey mapping",
          "hours": 24,
          "rate": 295.00,
          "cost": 7080.00
        }
      ],
      "discount": 0
    }
  ],
  "discount": 0,
  "grand_total_pre_gst": 45454.54,
  "gst_amount": 4545.45,
  "grand_total": 50000.00
}
```

### Step 3: Key Changes to Make

**CHANGE THIS:**
```json
"scopeItems": [...]
```
**TO THIS:**
```json
"scopes": [...]
```

**CHANGE THIS:**
```json
"roles": [...]
```
**TO THIS:**
```json
"role_allocation": [...]
```

**ADD THESE FIELDS** to each scope:
- `scope_description` (string)
- `deliverables` (array of strings)
- `assumptions` (array of strings)

**ADD THIS FIELD** to each role:
- `description` (string explaining what the role does)

### Step 4: Update Instructions Text

Add this paragraph to your system prompt RIGHT BEFORE the JSON example:

```
⚠️ CRITICAL: You MUST use the exact JSON structure shown below. Use "scopes" NOT "scopeItems", and use "role_allocation" NOT "roles". Each scope must include scope_description, deliverables, and assumptions. This structure enables the application to generate SEPARATE INTERACTIVE TABLES for each scope.
```

### Step 5: Save and Test

1. Click **"Update Workspace"** button
2. Go back to the chat
3. Send a test message: "Create a 3-phase SOW for a website project"
4. Check the console logs for: `🎯 [V4.1 MULTI-SCOPE] Found X scopes`
5. Verify you see MULTIPLE separate pricing tables (one per scope)

## Quick Test Command

Paste this into your workspace:
```
Create a 3-phase website redesign SOW: Phase 1 Discovery (20 hours), Phase 2 Design (40 hours), Phase 3 Development (60 hours). Budget is firm at $30k AUD.
```

Expected result: **3 separate interactive pricing tables**

## Verification Checklist

After updating, verify:
- [ ] AI uses `"scopes"` instead of `"scopeItems"`
- [ ] AI uses `"role_allocation"` instead of `"roles"`
- [ ] Each scope has `scope_description`
- [ ] Each scope has `deliverables` array
- [ ] Each scope has `assumptions` array
- [ ] Browser console shows: `✅ Using multi-scope data with X scopes`
- [ ] You see X separate tables in the editor (not one big table)

## If Still Not Working

1. **Check Browser Console** (F12 → Console tab):
   - Look for: `🎯 [V4.1 MULTI-SCOPE]` messages
   - Look for: `🔄 [Multi-Scope Auto-Insert]` messages
   - If you see "OLD FORMAT" warnings, the AI is still using old structure

2. **Force AI to Use New Format**:
   Add this to the END of your user message:
   ```
   IMPORTANT: Use the new multi-scope JSON format with "scopes" and "role_allocation" fields.
   ```

3. **Check the Generated JSON**:
   - Click "View AI Response Content" 
   - Scroll to the bottom
   - Verify the JSON structure matches the new format

## Complete System Prompt Template

For a complete, ready-to-use system prompt, see:
`anythingllm-config/multi-scope-system-prompt.md`

You can copy that entire file into your workspace system prompt.

## Still Having Issues?

The code now has BACKWARD COMPATIBILITY, so it will automatically convert the old format to the new format. This means:

✅ **It should work NOW** even without updating the prompt!

Just restart your Next.js frontend to pick up the latest code changes:
```bash
# In your deployment, trigger a rebuild or restart the frontend container
docker restart the11-frontend  # or whatever your container is named
```

## Summary

**What Changed:**
- `scopeItems` → `scopes` ✅
- `roles` → `role_allocation` ✅
- Added: `scope_description`, `deliverables`, `assumptions` ✅
- Added backward compatibility in code ✅

**Result:**
Each scope in the JSON will generate its own separate, interactive pricing table! 🎉