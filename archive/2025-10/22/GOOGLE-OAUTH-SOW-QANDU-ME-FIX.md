# Google OAuth Configuration for sow.qandu.me

## Problem
Getting `Error 400: redirect_uri_mismatch` when trying to authenticate with Google.

**Root Cause**: The Google OAuth credentials are configured for one domain, but you're trying to use a different domain.

## Solution: Update Google OAuth Credentials

### Step 1: Access Google Cloud Console
1. Go to https://console.cloud.google.com
2. Select project: `samsow-471202` (or your project name)
3. Navigate to: **APIs & Services** → **Credentials**

### Step 2: Find Your OAuth 2.0 Client
Look for the Web application credential with Client ID: 
```
450525611451-908peu5ph8oc201upikpdmu5duucm4un.apps.googleusercontent.com
```

### Step 3: Add Authorized Redirect URI
1. Click on the credential to edit it
2. Find the section: **Authorized redirect URIs**
3. Add this new URI:
   ```
   https://sow.qandu.me/api/oauth/callback
   ```
4. Keep any existing URIs (don't delete them)
5. Click **Save**

### Step 4: Verify Configuration

Your authorized redirect URIs should now include:
- ✅ `https://sow.qandu.me/api/oauth/callback` (NEW - for production)
- ✅ `https://ahmad-sow-qandu-me.840tjq.easypanel.host/api/oauth/callback` (existing)
- ✅ `http://localhost:3001/api/oauth/callback` (for local dev)

## Environment Variables Updated

✅ Updated in `frontend/.env`:
```env
GOOGLE_OAUTH_REDIRECT_URI=https://sow.qandu.me/api/oauth/callback
NEXT_PUBLIC_BASE_URL=https://sow.qandu.me
```

## Next Steps

1. ⏳ **Update Google OAuth** (in Cloud Console)
2. ⏳ **Rebuild Frontend** to pick up new .env values
3. ⏳ **Configure Easypanel/Traefik** to route `sow.qandu.me` to frontend

## Traefik Configuration Needed

If you want Easypanel to handle `sow.qandu.me` routing:

1. In Easypanel, create new route:
   - Domain: `sow.qandu.me`
   - Service: `sow-frontend` (PM2 app on port 3001)
   - Or use existing Docker container if available

2. Traefik should auto-generate SSL certificate for `sow.qandu.me`

## Testing OAuth Flow

Once configured:

1. Visit: `https://sow.qandu.me`
2. Click "GSheet" button to create Google Sheet
3. You should be redirected to Google login
4. After login, redirected back to: `https://sow.qandu.me/api/oauth/callback`
5. Should receive authorization code and create sheet

## Troubleshooting

If still getting `redirect_uri_mismatch`:

1. ❌ Typo in URL - check exact case sensitivity
2. ❌ Trailing slash missing - ensure URL matches exactly
3. ❌ Google hasn't processed the change - wait 5-10 minutes
4. ❌ Visiting wrong domain - make sure you're on `https://sow.qandu.me`

## Console Logs to Check

After login attempt, check browser console for:
- ✅ `GET https://sow.qandu.me/api/oauth/authorize` (should return 200)
- ✅ Redirect to Google login
- ✅ Redirect back to `https://sow.qandu.me/api/oauth/callback?code=...`

---

**Configuration Date**: October 20, 2025
**Status**: ⏳ PENDING Google Cloud Console Update
