# ✅ Backend Deployment Checklist for EasyPanel

## 📋 Pre-Deployment Check

- [x] Backend Dockerfile exists at `/backend/Dockerfile`
- [x] Backend requirements.txt exists and has all dependencies
- [x] Git repository is public and accessible
- [x] Database service `ahmad-mysql-database` is running
- [x] Frontend domain `sow.qandu.me` is working

---

## 🚀 Deployment Steps (Do These NOW)

### STEP 1: Open EasyPanel
- [ ] Navigate to https://840tjq.easypanel.host
- [ ] Login

### STEP 2: Create New Service
- [ ] Click "+ Service" button
- [ ] Select "Docker"

### STEP 3: Fill Service Details
- [ ] Service Name: `socialgarden-backend`
- [ ] Git Repository: `https://github.com/khaledbashir/the11-dev`
- [ ] Dockerfile Path: `/backend/Dockerfile`
- [ ] Build Context: `/`
- [ ] Port: `8000`

### STEP 4: Add Environment Variables
- [ ] `DB_HOST` = `ahmad-mysql-database`
- [ ] `DB_PORT` = `3306`
- [ ] `DB_USER` = `sg_sow_user`
- [ ] `DB_PASSWORD` = `SG_sow_2025_SecurePass!`
- [ ] `DB_NAME` = `socialgarden_sow`

### STEP 5: Deploy
- [ ] Click "Create Service" / "Deploy"
- [ ] Wait for build to complete (3-5 minutes)
- [ ] Service status shows "Running" (green)

### STEP 6: Create Domain (or use existing)
- [ ] Go to `socialgarden-backend` service
- [ ] Click "Domains"
- [ ] Verify domain points to port `8000`
- [ ] Domain should be: `ahmad-socialgarden-backend.840tjq.easypanel.host`

### STEP 7: Verify Backend is Working
- [ ] Test in terminal: `curl https://ahmad-socialgarden-backend.840tjq.easypanel.host/docs`
- [ ] Should return HTML with "Swagger UI" (NOT 404)

### STEP 8: Test Frontend
- [ ] Go to https://sow.qandu.me
- [ ] Hard refresh: **Ctrl+Shift+R** (or Cmd+Shift+R)
- [ ] Try to export a SOW to PDF
- [ ] Should work now! ✅

---

## 🛑 If Something Goes Wrong

### Service won't deploy?
- Check Activity log for error message
- Verify Dockerfile path: `/backend/Dockerfile`
- Verify Git repo is public

### Service won't start?
- Check service logs in EasyPanel
- Look for Python/dependency errors
- Verify DB_HOST is correct

### Backend returns 404?
- Service might still be starting (wait 1-2 min)
- Check port is `8000`
- Verify domain configuration

### PDF export still fails?
- Hard refresh browser (Ctrl+Shift+R)
- Check browser console for actual error
- Verify backend is "Running" in EasyPanel

---

## 📊 Expected Timeline

| Step | Time | Status |
|------|------|--------|
| Create service | < 1 min | Now |
| Docker build | 2-3 min | Automated |
| Container start | 1 min | Automated |
| Create domain | < 1 min | You |
| Test backend | < 1 min | You |
| Test PDF export | < 1 min | You |
| **TOTAL** | **~8-10 min** | ⏱️ |

---

## 🎯 Success Indicator

✅ **PDF Export Works When:**
1. Backend service shows "Running" (green) in EasyPanel
2. `curl https://ahmad-socialgarden-backend.840tjq.easypanel.host/docs` returns Swagger UI
3. Frontend page loads and PDFs can be exported without 404 errors

---

**Ready? Start with STEP 1 above! 🚀**
