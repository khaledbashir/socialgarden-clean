# 🔧 RATE CARD DEPLOYMENT FIX - COMPREHENSIVE GUIDE

## Problem Statement

The SOW generator is not using the official rate card because the `rate_card_roles` table is either:
1. **Missing** from the database
2. **Empty** (no data populated)
3. **Not accessible** due to database connection issues

When the rate card is unavailable, the AI falls back to invented roles and rates, breaking budget accuracy and client alignment.

---

## ✅ Quick Fix (5 minutes)

### For Local Development

```bash
cd the11-dev

# Connect to MySQL and run the migration
mysql -h localhost -u sg_sow_user -p socialgarden_sow < database/scripts/001-create-rate-card-roles.sql
```

**Password**: `SG_sow_2025_SecurePass!`

### For Production (Easypanel)

1. **SSH into your Easypanel server**
   ```bash
   ssh user@your-easypanel-host
   ```

2. **Access MySQL container**
   ```bash
   # Find the database container name
   docker ps | grep mysql
   
   # Access MySQL CLI
   docker exec -it <container_name> mysql -u sg_sow_user -p socialgarden_sow
   
   # Enter password: SG_sow_2025_SecurePass!
   ```

3. **Run the migration directly in MySQL**
   - Copy the entire contents of `database/scripts/001-create-rate-card-roles.sql`
   - Paste into the MySQL CLI
   - Press Enter

---

## 🔍 Verification Steps

After running the migration, verify success:

### In MySQL CLI

```sql
-- Check table exists
SHOW TABLES LIKE 'rate_card_roles';

-- Count total roles
SELECT COUNT(*) as total_roles FROM rate_card_roles WHERE is_active = TRUE;

-- View sample roles
SELECT role_name, hourly_rate FROM rate_card_roles 
WHERE is_active = TRUE 
ORDER BY hourly_rate DESC LIMIT 5;

-- Check rate card statistics
SELECT 
  MIN(hourly_rate) as min_rate,
  MAX(hourly_rate) as max_rate,
  AVG(hourly_rate) as avg_rate,
  COUNT(*) as total_roles
FROM rate_card_roles 
WHERE is_active = TRUE;
```

**Expected Results:**
- Table exists: ✅
- Total roles: 90 or more (we have 91)
- Min rate: 110.00 AUD/hr
- Max rate: 365.00 AUD/hr
- Avg rate: ~176 AUD/hr

### In Your Browser

1. **Test the Rate Card API**
   ```
   GET https://your-domain/api/rate-card/markdown
   ```

   Should return:
   ```json
   {
     "success": true,
     "markdown": "# Social Garden - Official Rate Card...",
     "version": "2025-10-27",
     "roleCount": 90
   }
   ```

2. **Test SOW Generation**
   - Go to your SOW generator UI
   - Create a test SOW with budget $10,000+
   - Verify the AI uses correct role names and rates from the rate card
   - Check that the JSON block contains proper role allocations

---

## 🐛 Troubleshooting

### Issue 1: "Rate card is unavailable"

**Symptom**: Frontend shows "Rate card API" error in logs

**Solution**:
```sql
-- Check if table exists
SHOW TABLES LIKE 'rate_card_roles';

-- If table doesn't exist, run the migration
-- See "Quick Fix" section above

-- If table exists, check data
SELECT COUNT(*) FROM rate_card_roles;
```

### Issue 2: "Unknown column" or SQL syntax error

**Symptom**: Migration fails with column-related errors

**Solution**: The table schema may have changed. Re-run with clean slate:
```sql
DROP TABLE IF EXISTS rate_card_roles;
-- Then run the migration script again
```

### Issue 3: Database connection timeout

**Symptom**: Rate card API returns 500 error with connection timeout

**In Easypanel**:
1. Check DB container is running: `docker ps | grep mysql`
2. Check environment variables are set in frontend service:
   - `DB_HOST` (should point to database service)
   - `DB_PORT` (usually 3306)
   - `DB_NAME` (should be `socialgarden_sow`)
   - `DB_USER` (should be `sg_sow_user`)
   - `DB_PASSWORD` (should be `SG_sow_2025_SecurePass!`)

3. Restart the frontend service after verifying env vars

### Issue 4: AI still not using official rates

**Symptom**: Rate card table is populated, but AI uses made-up roles

**Solution**: The AI prompt might not be receiving the rate card context. Check:

1. **Frontend fetches rate card successfully**:
   ```bash
   curl https://your-domain/api/rate-card/markdown
   ```
   Should return 200 with role data.

2. **Check browser console for errors** (F12 → Console tab)
   - Look for failed fetch to `/api/rate-card/markdown`
   - Check if rate card data is being logged

3. **Verify AnythingLLM workspace has the prompt**:
   - Go to AnythingLLM workspace settings
   - Check system prompt includes rate card context
   - Prompt should start with official rate card markdown

---

## 📋 Rate Card Contents (91 Roles)

The migration includes all official Social Garden roles:

### Leadership (365 AUD/hr)
- Tech - Head Of - Senior Project Management
- Tech - Head Of - Customer Experience Strategy
- Tech - Head Of - Program Strategy
- Tech - Head Of - System Setup
- Tech - Sr. Architect - Approval & Testing
- Tech - Sr. Architect - Consultancy Services
- Tech - Sr. Architect - Data Strategy
- Tech - Sr. Architect - Integration Strategy

### Senior Consultants (295 AUD/hr)
- Tech - Sr. Consultant - Admin Configuration
- Tech - Sr. Consultant - Advisory & Consultation
- Tech - Sr. Consultant - Approval & Testing
- Tech - Sr. Consultant - Campaign Optimisation
- Tech - Sr. Consultant - Campaign Strategy
- Tech - Sr. Consultant - Database Management
- Tech - Sr. Consultant - Reporting
- Tech - Sr. Consultant - Services
- Tech - Sr. Consultant - Strategy
- Tech - Sr. Consultant - Training
- Account Management - (Account Director)
- Account Management - (Senior Account Director)
- Project Management - (Account Director)

### Specialists (180-210 AUD/hr)
- Tech - Specialist - Admin Configuration
- Tech - Specialist - Campaign Optimisation
- Tech - Specialist - Campaign Orchestration
- Tech - Specialist - Database Management
- Tech - Specialist - Email Production
- Tech - Specialist - Integration Configuration
- Tech - Specialist - Integration Services (190)
- Tech - Specialist - Lead Scoring Setup
- Tech - Specialist - Program Management
- Tech - Specialist - Reporting
- Tech - Specialist - Services
- Tech - Specialist - Testing
- Tech - Specialist - Training
- Tech - Specialist - Workflows
- Account Management - (Senior Account Manager)
- Project Management - (Senior Account Manager)

### Producers & Support (110-150 AUD/hr)
- Tech - Producer - [Various configurations] (120 AUD/hr each)
- Tech - Delivery - Project Coordination (110)
- Tech - Delivery - Project Management (150)
- Tech - SEO Strategy (180)
- Content roles (120-210 AUD/hr)
- Design roles (120-295 AUD/hr)
- Dev/Tech Landing Page roles (120-210 AUD/hr)

---

## 🚀 Deployment Checklist

- [ ] **Local**: Migration runs without errors
- [ ] **Local**: MySQL query confirms 90+ roles in table
- [ ] **Local**: `/api/rate-card/markdown` returns valid JSON
- [ ] **Local**: Test SOW generation uses correct rates
- [ ] **Production**: Deploy migration to Easypanel database
- [ ] **Production**: Verify rate card API is accessible
- [ ] **Production**: Test SOW generation with real budget
- [ ] **Production**: Monitor AI logs to confirm rate card context is being used
- [ ] **Monitoring**: Set up alert if rate card API starts failing

---

## 📞 Support

If issues persist:

1. **Check database logs**:
   ```bash
   docker logs <database_container_name>
   ```

2. **Check frontend logs**:
   ```bash
   docker logs <frontend_container_name> | grep -i "rate card"
   ```

3. **Test connectivity from frontend to database**:
   ```bash
   docker exec <frontend_container> nc -zv <db_host> <db_port>
   ```

4. **Verify migration file is correct**:
   ```bash
   cat database/scripts/001-create-rate-card-roles.sql | head -50
   ```

---

## 📝 Related Files

- **Migration Script**: `database/scripts/001-create-rate-card-roles.sql`
- **Rate Card API**: `frontend/app/api/rate-card/markdown/route.ts`
- **Rate Card Endpoint**: `frontend/app/api/rate-card/route.ts`
- **Database Setup**: `database/init.sql` and `database/schema.sql`
- **Previous Migrations**: `database/migrations/`

---

## ✨ Result

After deploying this fix:
1. ✅ Rate card table is populated with 91 official roles
2. ✅ AI receives official rate card context in prompts
3. ✅ SOW generation uses correct Social Garden rates
4. ✅ Budget calculations are accurate and aligned with firm rates
5. ✅ Client-facing SOWs show proper role allocations

**The BBUBU SOW will now generate with correct HubSpot integration and landing page roles/rates!**