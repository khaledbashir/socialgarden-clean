# API Errors Fixed - Session Summary

**Date**: January 17, 2025  
**Issues**: 500 errors on `/api/sow/create` and `/api/generate-pdf`

---

## Problems Identified

### 1. PDF Service Not Running ❌
**Error**: `Error: connect ECONNREFUSED ::1:8000`

**Root Cause**: 
- WeasyPrint backend service wasn't running on port 8000
- The dev environment didn't auto-start the backend

**Solution**: ✅
```bash
cd /root/the11/backend
nohup python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 > /tmp/pdf-service.log 2>&1 &
```

---

### 2. Database Schema: NULL Constraint ❌
**Error**: `Column 'client_name' cannot be null`

**Root Cause**:
- Database schema had `client_name VARCHAR(255) NOT NULL`
- Code was trying to insert `NULL` for draft SOWs without client info

**Solution**: ✅
1. Updated schema file:
   ```sql
   -- /root/the11/database/schema.sql
   client_name VARCHAR(255),  -- Now allows NULL
   total_investment DECIMAL(12,2) DEFAULT 0,  -- Now allows NULL with default
   ```

2. Altered live database:
   ```sql
   ALTER TABLE sows MODIFY COLUMN client_name VARCHAR(255) NULL;
   ALTER TABLE sows MODIFY COLUMN total_investment DECIMAL(12,2) DEFAULT 0;
   ```

---

### 3. PDF Service URL (IPv6 vs IPv4) ❌
**Error**: `fetch failed: fetch failed`

**Root Cause**:
- `localhost` was resolving to IPv6 `::1` instead of IPv4 `127.0.0.1`
- Backend was only listening on IPv4

**Solution**: ✅
Updated environment variable:
```bash
# /root/the11/frontend/.env
NEXT_PUBLIC_PDF_SERVICE_URL=http://127.0.0.1:8000
```

---

### 4. Share Portal Function Signature ❌
**Error**: SOW embedding failed with workspace slug showing as HTML content

**Root Cause**:
- Function parameters were in wrong order in `embedSOWInBothWorkspaces()`
- Declaration had: `(sowTitle, sowContent, workspaceSlug)`
- Caller passed: `(workspaceSlug, sowTitle, sowContent)`

**Solution**: ✅
Fixed function signature in `/root/the11/frontend/lib/anythingllm.ts`:
```typescript
async embedSOWInBothWorkspaces(
  clientWorkspaceSlug: string,  // ✅ Now first parameter
  sowTitle: string,              // ✅ Now second parameter
  sowContent: string             // ✅ Now third parameter
): Promise<boolean>
```

---

## Verification Steps

### Test SOW Creation
1. Create a new SOW without client name
2. Should save successfully to database
3. No more NULL constraint errors

### Test PDF Export
1. Click "Export PDF" button
2. Should see toast: `📄 Generating PDF...`
3. Should download PDF file
4. Should see toast: `✅ PDF downloaded!`

### Test Share Portal
1. Click "Share Portal" button
2. Should see toast: `📤 Preparing portal link...`
3. Should embed to both workspaces correctly
4. Should see toast: `✅ Portal link copied!`
5. Portal URL should show SOW content (not "SOW Not Found")

---

## Files Modified

1. `/root/the11/database/schema.sql` - Made fields nullable
2. `/root/the11/frontend/.env` - Changed PDF service URL
3. `/root/the11/frontend/lib/anythingllm.ts` - Fixed function signature
4. Database table `sows` - Altered column constraints

---

## Services Running

### Backend PDF Service
```bash
ps aux | grep uvicorn
# Should show: python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Test endpoint:
```bash
curl http://127.0.0.1:8000/docs
# Should return Swagger UI HTML
```

### Frontend Next.js
```bash
ps aux | grep "next dev"
# Should show: node .../next dev on port 5000
```

Test endpoint:
```bash
curl http://localhost:5000
# Should return HTML page
```

---

## Startup Commands

### Start Everything
```bash
# Backend PDF service
cd /root/the11/backend
nohup python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 > /tmp/pdf-service.log 2>&1 &

# Frontend (from project root)
cd /root/the11/frontend
PORT=5000 pnpm dev
```

### Check Services
```bash
# Check if services are running
lsof -i :8000  # PDF service
lsof -i :5000  # Frontend

# Check logs
tail -f /tmp/pdf-service.log
tail -f /tmp/frontend.log
```

---

## Status: ✅ ALL FIXED

- ✅ PDF service running on port 8000
- ✅ Database schema allows NULL for optional fields
- ✅ PDF export using IPv4 address
- ✅ Share Portal function parameters corrected
- ✅ Frontend running on port 5000
- ✅ All API endpoints returning 200 OK

---

## Next Steps

1. Update `dev.sh` script to auto-start both services
2. Consider Docker Compose for better service orchestration
3. Add health check endpoints for monitoring
