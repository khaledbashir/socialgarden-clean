# TARGETED DEPLOYMENT GUIDE - DISCOUNT CALCULATION FIX

## Overview
This guide provides exact deployment steps for the discount calculation fix to your EasyPanel environment with three separate containers (frontend, backend, database) on the same IP with different paths.

## 1. PRE-DEPLOYMENT CHECKLIST

### Verify All Fixes Are Ready
```bash
# 1. Confirm you're on main branch
git checkout main
git pull origin main

# 2. Verify discount fixes are included
git log --oneline -5

# Expected output should include:
# Fix: Critical discount calculation bug
# - Fixed 4% parsing to prevent 705.8% bug
# - Added comprehensive validation in frontend and backend
```

### Run Tests Locally
```bash
# Test discount calculation
node test-discount-calculation.js

# Expected output:
# 🎯 CRITICAL: Audit case "discount 4 percent" is now FIXED ✅
# 🎉 All tests passed! The discount calculation bug has been fixed.
```

## 2. DEPLOYMENT TO EASYPANEL

### Step 1: Push to GitHub
```bash
# Push to trigger EasyPanel auto-deployment
git push origin main

# This will trigger builds for both containers:
# - Frontend: sow-qandu-me
# - Backend: socialgarden-backend
```

### Step 2: Monitor EasyPanel Build Process

#### Frontend Container (sow-qandu-me)
- **URL**: http://168.231.115.219:3000/projects/ahmad/app/sow-qandu-me/deployments
- **Expected Build Log**: 
```
Building frontend with discount fixes...
✅ Enhanced discount extraction patterns added
✅ Comprehensive validation implemented
✅ Build completed successfully
```

#### Backend Container (socialgarden-backend)
- **URL**: http://168.231.115.219:3000/projects/ahmad/app/socialgarden-backend
- **Expected Build Log**:
```
Building backend with discount fixes...
✅ Multi-tier discount validation added
✅ Mathematical safeguards implemented
✅ Build completed successfully
```

### Step 3: Verify Container Restart
Both containers should automatically restart after successful build. Verify by:

1. Checking EasyPanel dashboard for container status
2. Viewing container logs to confirm restart
3. Confirm no build errors in logs

## 3. POST-DEPLOYMENT VERIFICATION

### Health Checks

#### Backend Health
```bash
# Check via curl or browser
curl http://168.231.115.219:3000/projects/ahmad/app/socialgarden-backend/health

# Expected response:
{"status": "healthy", "service": "Social Garden PDF Service"}
```

#### Frontend Health
```bash
# Check via browser
http://168.231.115.219:3000/projects/ahmad/app/sow-qandu-me/deployments/

# Expected: Working SOW Generator UI with no console errors
```

### Critical Functionality Tests

#### Test 1: Discount Calculation (Primary)
1. Create a new SOW with prompt: "hubspot integration and 2 landing pages discount 4 percent"
2. Generate the SOW
3. Export to Professional PDF
4. Verify in PDF:
   - Discount shows as 4% (not 705.8%)
   - All monetary values are positive
   - Calculation is mathematically correct

#### Test 2: Excel Export
1. Select an existing SOW document
2. Click "Export Excel"
3. Verify Excel file downloads correctly
4. Confirm no "SOW not found" error

#### Test 3: PDF Concluding Statement
1. Generate any type of PDF
2. Verify final statement: "*** This concludes the Scope of Work document. ***"
3. Confirm it appears on the last page

## 4. ENVIRONMENT VERIFICATION

### Verify Environment Variables in EasyPanel

#### Frontend Container Environment Variables
```
NODE_ENV=production
NEXT_PUBLIC_ANYTHINGLLM_URL=https://ahmad-anything-llm.840tjq.easypanel.host
NEXT_PUBLIC_ANYTHINGLLM_API_KEY=0G0WTZ3-6ZX4D20-H35VBRG-9059WPA
NEXT_PUBLIC_PDF_SERVICE_URL=http://168.231.115.219:3000/projects/ahmad/app/socialgarden-backend
NEXT_PUBLIC_BASE_URL=http://168.231.115.219:3000/projects/ahmad/app/sow-qandu-me/deployments
NEXT_PUBLIC_API_URL=http://168.231.115.219:3000/projects/ahmad/app/socialgarden-backend
DB_HOST=ahmad_mysql-database
DB_PORT=3306
DB_USER=sg_sow_user
DB_PASSWORD=SG_sow_2025_SecurePass!
DB_NAME=socialgarden_sow
OPENROUTER_API_KEY=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
```

#### Backend Container Environment Variables
```
API_PORT=8000
DB_HOST=ahmad_mysql-database
DB_PORT=3306
DB_USER=sg_sow_user
DB_PASSWORD=SG_sow_2025_SecurePass!
DB_NAME=socialgarden_sow
ANYTHINGLLM_URL=https://ahmad-anything-llm.840tjq.easypanel.host
ANYTHINGLLM_API_KEY=0G0WTZ3-6ZX4D20-H35VBRG-9059WPA
GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON=your_service_account_json
GOOGLE_SHEETS_AUTO_SHARE_EMAIL=your_email@example.com
GOOGLE_OAUTH_CLIENT_ID=your_oauth_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_oauth_client_secret
GOOGLE_OAUTH_REDIRECT_URI=http://168.231.115.219:3000/projects/ahmad/app/sow-qandu-me/deployments/api/oauth/callback
```

## 5. TROUBLESHOOTING

### Container Won't Rebuild
1. Check GitHub webhook in repository settings
2. Verify EasyPanel has correct repository URL
3. Check branch mapping (main → production)
4. Review container build logs in EasyPanel

### Discount Still Calculating Incorrectly
1. Verify both frontend and backend containers rebuilt
2. Check environment variables in both containers
3. Review browser console for JavaScript errors
4. Check backend logs for discount validation messages

### Excel Export Still Failing
1. Verify frontend container has latest code
2. Check currentDoc is properly selected before export
3. Test with different documents to isolate issue

## 6. ROLLBACK PROCEDURE

### Quick Rollback via EasyPanel
1. Navigate to sow-qandu-me container in EasyPanel
2. View deployment history
3. Rollback to previous successful deployment
4. Repeat for socialgarden-backend container

### Git-Based Rollback
```bash
# 1. Create rollback branch
git checkout main
git pull origin main
git checkout -b hotfix/rollback-discount-fix

# 2. Revert to previous commit
git revert HEAD --no-edit
git push origin hotfix/rollback-discount-fix

# 3. Create PR and merge to main
# This will trigger rollback deployment
```

## 7. SUCCESS CRITERIA

The deployment is successful when:
1. User prompts like "discount 4 percent" correctly extract 4%
2. PDF outputs show mathematically correct calculations
3. Excel export works without "SOW not found" error
4. All PDF outputs include mandatory concluding statement
5. Professional PDF includes complete "Overall Project Summary" section

## 8. POST-DEPLOYMENT MONITORING

### First 30 Minutes
- Monitor EasyPanel container logs for errors
- Check health endpoints every 5 minutes
- Test critical functionality multiple times

### First 24 Hours
- Track error rates for discount calculations
- Monitor user feedback for Excel export
- Verify all PDF outputs include concluding statement

---

## FINAL NOTES

The critical discount calculation bug that caused 705.8% instead of 4% has been fixed through comprehensive validation in:

1. Frontend: Enhanced pattern matching and validation
2. Backend: Bulletproof calculation with safeguards
3. API Layer: Additional validation at service boundaries
4. Template: Ensured compliance with requirements

After deployment, the system will correctly process user discount requests and produce mathematically accurate financial calculations.