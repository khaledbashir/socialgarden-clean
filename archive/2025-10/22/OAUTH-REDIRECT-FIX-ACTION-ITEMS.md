# OAuth Redirect URI Fix - Action Items

## Current Status
✅ **Folder API**: Working - 45 folders loading from database
✅ **Frontend Build**: Successful
❌ **Google OAuth**: Getting `Error 400: redirect_uri_mismatch`

## Root Cause
Your environment is configured for `https://sow.qandu.me/api/oauth/callback`, but Google OAuth credentials haven't been updated in Google Cloud Console.

## What We Just Updated
✅ Updated `frontend/.env`:
```
NEXT_PUBLIC_BASE_URL=https://sow.qandu.me
GOOGLE_OAUTH_REDIRECT_URI=https://sow.qandu.me/api/oauth/callback
```

✅ Rebuilt frontend with new configuration
✅ Restarted PM2 frontend service

## What You Need to Do in Google Cloud Console

### Step 1: Open Google Cloud Console
Go to: https://console.cloud.google.com/

### Step 2: Select Your Project
Project: `samsow-471202`

### Step 3: Navigate to OAuth Credentials
- Click **APIs & Services**
- Click **Credentials**
- Find your Web Application credential:
  - **Client ID**: `450525611451-908peu5ph8oc201upikpdmu5duucm4un.apps.googleusercontent.com`

### Step 4: Add New Redirect URI
1. Click the credential to edit it
2. Scroll to **Authorized redirect URIs**
3. Click **Add URI**
4. Enter: `https://sow.qandu.me/api/oauth/callback`
5. Click **Save**

### Step 5: Verify Configuration
Your **Authorized redirect URIs** should now include:
- ✅ `https://sow.qandu.me/api/oauth/callback` (NEW - for production)
- ✅ `https://ahmad-sow-qandu-me.840tjq.easypanel.host/api/oauth/callback` (Easypanel subdomain)
- ✅ `http://localhost:3001/api/oauth/callback` (Local development)

## Testing After Configuration

1. **Wait 5-10 minutes** for Google to process the change
2. Visit: `https://sow.qandu.me`
3. Click the "GSheet" button
4. You should see Google login
5. After login, should be redirected back to create the sheet

## Expected Flow After Fix

```
User clicks "GSheet" button
    ↓
Frontend calls /api/oauth/authorize
    ↓
Backend returns Google authorization URL with sow.qandu.me redirect
    ↓
Browser redirected to Google login
    ↓
User logs in with ahmad.basheer@socialgarden.com.au
    ↓
Google redirects to: https://sow.qandu.me/api/oauth/callback?code=...
    ↓
Frontend exchanges code for access token
    ↓
Creates Google Sheet using OAuth token
```

## Traefik Configuration (Optional)

If Easypanel Traefik doesn't automatically route `sow.qandu.me`:

1. In Easypanel dashboard
2. Create new route for domain `sow.qandu.me`
3. Route to port `3001` (sow-frontend on host)
4. Traefik will auto-generate SSL certificate

---

**Current Environment**: `https://sow.qandu.me`
**Database**: ✅ Connected (45 folders loading)
**Folders API**: ✅ Working
**OAuth**: ⏳ Awaiting Google Cloud Console update

**Timeline**: 
- 5-10 minutes for Google to process changes
- Then test OAuth flow
