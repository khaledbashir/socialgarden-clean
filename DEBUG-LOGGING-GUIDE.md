# 🔍 AGGRESSIVE DEBUG LOGGING DEPLOYED

## Commit Information
- **Commit:** `679e4d0`
- **Message:** `debug(api): add aggressive payload logging to stream-chat route`
- **File Modified:** `frontend/app/api/anythingllm/stream-chat/route.ts`
- **Status:** ✅ Pushed to GitHub

---

## What This Does

This change adds **comprehensive payload logging** to the `/stream-chat` API endpoint. Every time a request comes in, it will dump the complete request body to server-side console logs BEFORE any processing occurs.

This will expose:
1. ✅ What workspace slug is being sent
2. ✅ What mode is being sent (query vs chat)
3. ✅ What the raw message content is
4. ✅ Everything about the thread and model parameters
5. ✅ Exactly what message is being sent to AnythingLLM

---

## Logging Output Format

When you trigger the logging, you'll see output like this in your server logs:

```
//////////////////////////////////////////////////
// CRITICAL DEBUG: INCOMING /stream-chat PAYLOAD //
//////////////////////////////////////////////////
FULL REQUEST BODY:
{
  "workspace": "sow-master-dashboard",
  "threadSlug": null,
  "mode": "query",
  "model": "anythingllm",
  "messages": [
    {
      "role": "system",
      "content": "..."
    },
    {
      "role": "user",
      "content": "hi"
    }
  ]
}

KEY FIELDS:
  workspace: sow-master-dashboard
  workspaceSlug: undefined
  threadSlug: null
  mode: query
  model: anythingllm
  messages.length: 2
  messages[0].role: system
  messages[0].content (first 200 chars): ...
  messages[messages.length-1].role: user
  messages[messages.length-1].content (first 200 chars): hi

//////////////////////////////////////////////////

=== WORKSPACE RESOLUTION ===
workspace param: sow-master-dashboard
workspaceSlug param: undefined
effectiveWorkspaceSlug: sow-master-dashboard

=== ABOUT TO SEND TO ANYTHINGLLM ===
Endpoint: https://ahmad-anything-llm.840tjq.easypanel.host/api/v1/workspace/sow-master-dashboard/stream-chat
Mode: query
ThreadSlug: null
Message to send (first 500 chars):
[[DASHBOARD_SYSTEM_OVERRIDES]]
You are in the Master Dashboard analytics workspace. You ONLY analyze existing embedded SOW knowledge to answer business/analytics questions. Never draft or generate a new SOW, proposal, or template. Keep answers concise, numeric where possible, and reference specific SOW titles when applicable.

[[USER]]
hi

...
=== END DEBUG ===
```

---

## How to Trigger the Logging

### Step 1: Ensure deployment is ready
The commit is on GitHub. You'll need to deploy this to your production environment (or trigger a rebuild if using auto-deploy).

### Step 2: Test in Master Dashboard
1. Navigate to the Master Dashboard in the application
2. Type: `hi` (or any message)
3. Send the message

### Step 3: Check Server Logs
- **If running locally:** Check your terminal/console where the Next.js server is running
- **If on EasyPanel:** Go to your application → Logs → Runtime Logs
- **If on PM2:** Run `pm2 logs sow-frontend` or `pm2 logs`

### Step 4: Look for the Debug Output
Search in the logs for:
```
CRITICAL DEBUG: INCOMING /stream-chat PAYLOAD
```

You should see the complete payload dump immediately after.

---

## What We're Looking For

### The Critical Question
Is the `workspace` parameter in the incoming request actually `sow-master-dashboard`?

**If YES:** Then the problem is NOT with what we're sending to AnythingLLM.  
**If NO:** Then we found the smoking gun - something else is overriding it.

### The Endpoint URL
Look at this line in the output:
```
Endpoint: https://ahmad-anything-llm.840tjq.easypanel.host/api/v1/workspace/sow-master-dashboard/stream-chat
```

Is the workspace slug in the URL exactly `sow-master-dashboard`?  
**If YES:** Correct ✅  
**If NO:** Wrong workspace is being used ❌

### The Message Being Sent
Look at the "Message to send" section. Does it contain:
```
[[DASHBOARD_SYSTEM_OVERRIDES]]
You are in the Master Dashboard analytics workspace. You ONLY analyze existing embedded SOW knowledge...
```

**If YES:** Correct dashboard override is being added ✅  
**If NO:** Override isn't being applied ❌

---

## Interpreting the Results

### Scenario 1: Logging Proves Everything is Correct
```
workspace: sow-master-dashboard ✅
effectiveWorkspaceSlug: sow-master-dashboard ✅
Endpoint: .../workspace/sow-master-dashboard/stream-chat ✅
Message contains [[DASHBOARD_SYSTEM_OVERRIDES]] ✅
```

**Conclusion:** The API is sending the RIGHT data. The problem is in AnythingLLM itself or how its response is being handled by the client.

**Next Step:** We investigate AnythingLLM's actual response and client-side rendering.

### Scenario 2: Logging Reveals the Problem
```
workspace: gen-the-architect ❌ (should be sow-master-dashboard)
```

**Conclusion:** The FRONTEND is sending the wrong workspace slug. Something on the client-side is passing the wrong value.

**Next Step:** We trace the client-side code that calls this API.

---

## Expected Behavior After Logging

The logging is **temporary and aggressive**. It will:
- ✅ Print to server console/logs (NOT visible to end users in UI)
- ✅ Not affect performance noticeably (only console.log calls)
- ✅ Not affect the actual chat response
- ✅ Not break anything
- ✅ Be easy to remove later (just delete the logging blocks)

---

## Next Steps After Collecting Logs

1. **Collect the logs** from your server after typing "hi" in Master Dashboard
2. **Share the output** with the debugging session
3. **Look for inconsistencies** in the workspace slug between:
   - What the frontend is sending (in the request body)
   - What we resolve as `effectiveWorkspaceSlug`
   - What endpoint URL we construct
   - What message content we build

This is the **single point of truth** - the logs cannot lie about what's happening on the wire.

---

## Important Notes

⚠️ **This is debug code** - remember to remove these console.log statements before final production merge. They're intentionally aggressive to expose the full picture.

✅ **This is safe** - it only adds logging, doesn't change any logic or behavior.

✅ **This is temporary** - once we identify the issue, these logs go away.

---

## Commit Details

```bash
commit 679e4d0
Author: AI Assistant
Date:   [timestamp]

    debug(api): add aggressive payload logging to stream-chat route
    
    Added comprehensive console logging to expose:
    - Complete incoming request body
    - Workspace slug resolution
    - Endpoint construction
    - Message content being sent to AnythingLLM
    
    This logging will print to server-side console only.
    Not visible to end users in UI.
```

---

Ready to identify the truth! 🔍
