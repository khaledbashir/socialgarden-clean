# 🔴 EMERGENCY: DO THIS RIGHT NOW - 1 MINUTE TO FIX

## The Problem (From Your Logs)

```
/api/generate-pdf:1  Failed to load resource: the server responded with a status of 404 ()
```

**Everything else works**:
- ✅ Dashboard loads
- ✅ Workspaces load  
- ✅ SOWs display
- ✅ AI agents work
- ❌ **PDF export fails with 404**

## The Solution (60 seconds in EasyPanel)

**Go to EasyPanel RIGHT NOW:**

1. **Click**: EasyPanel Dashboard
2. **Find**: `ahmad-socialgarden-backend` service
3. **Click**: That service
4. **Click**: Domains tab (or Middleware)
5. **Click**: The domain configuration (your reverse proxy)
6. **Find the Port field**
7. **Change**: `80` → `8000`
8. **Click**: Save
9. **Wait**: 30 seconds
10. **Go back to sow.qandu.me**
11. **Hard refresh**: Ctrl+Shift+R
12. **Try PDF export**

---

## What's Actually Happening

**Current:**
- Frontend on https://sow.qandu.me → ✅ WORKS
- PDF endpoint `/api/generate-pdf` → ✅ WORKS
- But backend on port 80 → ❌ NOTHING THERE
- Frontend tries to call `https://ahmad-socialgarden-backend.840tjq.easypanel.host` on port 80
- Gets 404 because FastAPI is on port 8000

**After you change port 80 → 8000:**
- Frontend tries same URL now pointing to port 8000
- Finds FastAPI backend ✅
- PDF exports work ✅

---

## Screenshot Guide

In EasyPanel, find this screen:

```
Update Domain
━━━━━━━━━━━━━━━
HTTPS: [on]
Host: ahmad-socialgarden-backend.840tjq.easypanel.host
Path: /

Destination:
Protocol: HTTP
Port: [80] ← CHANGE THIS TO [8000]
Path: /

[Save]
```

---

## Why This MUST Be Done

Without this change:
- Every PDF export fails
- Users can't download SOWs
- System is broken for primary use case

With this change:
- PDF exports work
- Everything is functional
- System is production-ready

**Just. Change. The. Port.**

---

## If You Get Stuck

1. Take a screenshot of the domain config
2. Show me where the port field is
3. I'll guide you through it

But it should be obvious - you have port 80 set, need to change to 8000.

**DO THIS NOW BEFORE ANYTHING ELSE.**

