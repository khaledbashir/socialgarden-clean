# 🚀 RATE CARD FIX - QUICK START (5 Minutes)

## The Problem
SOW generator is using invented roles instead of the official rate card because the `rate_card_roles` table is missing/empty.

## The Solution
Run the migration script to populate the rate card table.

---

## ⚡ Quick Fix (Choose Your Method)

### Method 1: Local Development (MySQL installed)

```bash
cd the11-dev
mysql -h localhost -u sg_sow_user -p socialgarden_sow < database/scripts/001-create-rate-card-roles.sql
```

**Password:** `SG_sow_2025_SecurePass!`

### Method 2: Docker (recommended for production)

```bash
# 1. Find MySQL container name
docker ps | grep mysql

# 2. Run migration inside container
docker exec <mysql-container-name> mysql -u sg_sow_user -pSG_sow_2025_SecurePass! socialgarden_sow < database/scripts/001-create-rate-card-roles.sql

# Example:
docker exec socialgarden-mysql mysql -u sg_sow_user -pSG_sow_2025_SecurePass! socialgarden_sow < database/scripts/001-create-rate-card-roles.sql
```

### Method 3: Easypanel Web UI

1. Go to your Easypanel dashboard
2. Find the Database service (MySQL)
3. Click "Access" or "phpMyAdmin"
4. Select database: `socialgarden_sow`
5. Open SQL editor
6. Copy-paste entire contents of `database/scripts/001-create-rate-card-roles.sql`
7. Click Execute/Run
8. Done! ✅

---

## ✅ Verify It Worked

### In MySQL CLI:
```sql
SELECT COUNT(*) as total_roles FROM rate_card_roles WHERE is_active = TRUE;
-- Should return: 90 or more
```

### In Browser:
```
GET https://your-domain/api/rate-card/markdown
```
Should return JSON with 90+ roles.

### In SOW Generator:
- Create new SOW with budget $10,000+
- AI should now use official rate card roles
- Check JSON block has correct role allocations

---

## 🔧 Troubleshooting

### "Table already exists" error?
```sql
DROP TABLE IF EXISTS rate_card_roles;
-- Then re-run the migration
```

### "Unknown database" error?
Make sure you're using the correct database:
```bash
mysql -h localhost -u sg_sow_user -p socialgarden_sow -e "SHOW TABLES;"
```

### Still showing invented roles?
1. Clear browser cache (Ctrl+Shift+Delete)
2. Restart frontend container: `docker restart <frontend-container>`
3. Try SOW generation again

### API returns 500 error?
Check database connectivity:
```bash
docker logs <frontend-container> | grep -i "rate card\|database"
```

---

## 📊 What's Being Installed

- **91 Official Social Garden Roles** with accurate hourly rates
- **Rate range:** $110/hr (Producers) to $365/hr (Leadership)
- **Average rate:** ~$180/hr
- **All roles marked:** `is_active = TRUE`

### Sample Roles:
- Tech - Sr. Consultant - Integration Strategy: **$295/hr**
- Tech - Landing Page - (Onshore): **$210/hr**
- Tech - Specialist - Testing: **$180/hr**
- Tech - Producer - Design: **$120/hr**

---

## 📋 Post-Deployment Checklist

- [ ] Migration script executed successfully
- [ ] No SQL errors in output
- [ ] `SELECT COUNT(*)` query returns 90+
- [ ] API endpoint returns 200 OK
- [ ] Markdown contains official role names
- [ ] New SOW uses correct rates (not invented ones)
- [ ] Budget calculations match $10,530 firm requirement

---

## 🎯 Result

After this 5-minute fix:
✅ Rate card table populated with 91 official roles
✅ AI generates SOWs with correct Social Garden rates
✅ BBUBU HubSpot SOW now properly scoped with accurate roles
✅ Budget alignment with firm rates ($10,530 pre-GST)
✅ Client-facing SOW shows professional role allocations

---

## 📞 Need Help?

**Migration file:** `database/scripts/001-create-rate-card-roles.sql`
**Full guide:** `RATE-CARD-DEPLOYMENT-FIX.md`
**Diagnostic:** `scripts/diagnose-rate-card.sh`

Run diagnostic:
```bash
bash scripts/diagnose-rate-card.sh
```

---

**Expected time:** 5 minutes
**Difficulty:** Very Easy ⭐
**Impact:** Critical - Fixes all SOW generation accuracy