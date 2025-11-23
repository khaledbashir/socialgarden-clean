# 🐳 EASYPANEL PRODUCTION COMMANDS REFERENCE

## Current Status
- Everything running on **EasyPanel** (not local dev)
- Frontend: `sow.qandu.me` (port 3001)
- Backend: `sow-backend.qandu.me` (port 8000)
- Database: `ahmad_mysql-database` (port 3306)
- AnythingLLM: `ahmad-anything-llm.840tjq.easypanel.host`

---

## 🔧 VERIFY PRODUCTION STATE

### 1. Check Running Containers
```bash
docker ps
# Look for:
# - ahmad_sow-qandu-me (frontend)
# - ahmad_socialgarden-backend (backend)
# - ahmad_mysql-database (MySQL)
# - ahmad_anything-llm (AnythingLLM)
```

### 2. Verify Database Migration is Ready
```bash
# Check if migration file exists
ls -la /root/the11-dev/database/migrations/add-dashboard-chat-schema.sql

# Expected: File exists and is readable
```

### 3. Check GitHub Push Succeeded
```bash
cd /root/the11-dev && git log --oneline -5 | head -1
# Should show: Add dashboard AI chat schema migration

# Also verify branch
git branch -v | grep enterprise-grade-ux
```

---

## 🚀 APPLY DATABASE MIGRATION TO PRODUCTION

### Option A: Using Docker Exec (RECOMMENDED)
```bash
# Get the container ID
MYSQL_CONTAINER=$(docker ps --filter "name=ahmad_mysql-database" -q)

# Apply migration
docker exec -i $MYSQL_CONTAINER mysql \
  -u sg_sow_user \
  -pSG_sow_2025_SecurePass! \
  socialgarden_sow < /root/the11-dev/database/migrations/add-dashboard-chat-schema.sql

# Result: Should see no errors
```

### Option B: Using MySQL CLI (if accessible)
```bash
mysql -h ahmad_mysql-database \
  -u sg_sow_user \
  -pSG_sow_2025_SecurePass! \
  socialgarden_sow < /root/the11-dev/database/migrations/add-dashboard-chat-schema.sql
```

### Option C: Using EasyPanel MySQL Admin UI
1. Open EasyPanel dashboard
2. Go to MySQL service → Admin tools
3. Use PhpMyAdmin or DbGate
4. Paste SQL migration file and execute

---

## ✅ VERIFY MIGRATION SUCCESS

### Check Tables Exist
```bash
# Option A: Using Docker Exec
MYSQL_CONTAINER=$(docker ps --filter "name=ahmad_mysql-database" -q)
docker exec -i $MYSQL_CONTAINER mysql \
  -u sg_sow_user \
  -pSG_sow_2025_SecurePass! \
  socialgarden_sow \
  -e "SHOW TABLES LIKE 'dashboard_%';"

# Expected Output:
# | Tables_in_socialgarden_sow (dashboard_%) |
# | dashboard_conversations                  |
# | dashboard_messages                       |

# Option B: MySQL CLI
mysql -h ahmad_mysql-database \
  -u sg_sow_user \
  -pSG_sow_2025_SecurePass! \
  socialgarden_sow \
  -e "SHOW TABLES LIKE 'dashboard_%';"
```

### Check Table Schema
```bash
# Option A: Using Docker Exec
MYSQL_CONTAINER=$(docker ps --filter "name=ahmad_mysql-database" -q)
docker exec -i $MYSQL_CONTAINER mysql \
  -u sg_sow_user \
  -pSG_sow_2025_SecurePass! \
  socialgarden_sow \
  -e "DESCRIBE dashboard_conversations; DESCRIBE dashboard_messages;"

# Option B: MySQL CLI
mysql -h ahmad_mysql-database \
  -u sg_sow_user \
  -pSG_sow_2025_SecurePass! \
  socialgarden_sow \
  -e "DESCRIBE dashboard_conversations; DESCRIBE dashboard_messages;"
```

### Verify Indexes
```bash
# Option A: Using Docker Exec
MYSQL_CONTAINER=$(docker ps --filter "name=ahmad_mysql-database" -q)
docker exec -i $MYSQL_CONTAINER mysql \
  -u sg_sow_user \
  -pSG_sow_2025_SecurePass! \
  socialgarden_sow \
  -e "SHOW INDEXES FROM dashboard_conversations; SHOW INDEXES FROM dashboard_messages;"

# Option B: MySQL CLI
mysql -h ahmad_mysql-database \
  -u sg_sow_user \
  -pSG_sow_2025_SecurePass! \
  socialgarden_sow \
  -e "SHOW INDEXES FROM dashboard_conversations; SHOW INDEXES FROM dashboard_messages;"
```

---

## 🔄 PUSH CODE CHANGES TO GITHUB

After making code changes locally:

```bash
cd /root/the11-dev

# Check status
git status

# Stage new files or changes
git add frontend/app/api/dashboard/ frontend/lib/chat-service.ts frontend/components/dashboard/

# Commit
git commit -m "Implement dashboard AI chat history persistence

- Add chat history storage to dashboard_messages table
- Implement conversation management endpoints
- Create conversation creation on first message
- Add message persistence to AnythingLLM streaming
- Build conversation sidebar UI component
- Add conversation switching functionality

Connects to production database for persistent chat."

# Push to GitHub
git push origin enterprise-grade-ux
```

---

## 🚀 EASYPANEL AUTO-DEPLOYMENT

**Important**: Once you push to GitHub:

1. EasyPanel watches the `enterprise-grade-ux` branch
2. On push, it automatically:
   - Pulls latest code
   - Rebuilds containers
   - Deploys new versions
   - Restarts services

3. Check deployment status:
   - Go to EasyPanel dashboard
   - Click on `sow-qandu-me` service
   - Check "Deployment" tab
   - Should show status: "Running" or "Building"

4. To verify production has latest code:
   - Open `https://sow.qandu.me`
   - Check browser console for new features

---

## 🔍 DEBUG PRODUCTION ISSUES

### View Container Logs
```bash
# Frontend logs
docker logs -f ahmad_sow-qandu-me --tail 100

# Backend logs
docker logs -f ahmad_socialgarden-backend --tail 100

# Database logs
docker logs -f ahmad_mysql-database --tail 100
```

### Test API Endpoint
```bash
# Test dashboard chat (production)
curl -X POST https://sow.qandu.me/api/dashboard/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "How many SOWs do we have?"}
    ],
    "conversationId": null,
    "userId": "test-user-1"
  }'

# Should stream response
```

### Check Frontend Environment
```bash
# View what's deployed
docker exec -it ahmad_sow-qandu-me env | grep -E "NEXT_PUBLIC|DB_|ANYTHINGLLM"
```

---

## 📊 DEPLOYMENT VERIFICATION CHECKLIST

After making changes and pushing to GitHub:

- [ ] Code pushed to `enterprise-grade-ux` branch
- [ ] GitHub push completed successfully
- [ ] EasyPanel dashboard shows "Building" or "Running" status
- [ ] Migration applied to production database
- [ ] `dashboard_conversations` table exists
- [ ] `dashboard_messages` table exists
- [ ] Frontend containers restarted
- [ ] `https://sow.qandu.me` loads without errors
- [ ] Dashboard chat works (test conversation)
- [ ] Messages persist after refresh
- [ ] Check browser console: no errors

---

## 🆘 QUICK TROUBLESHOOTING

### "Unknown MySQL server host"
```bash
# MySQL not accessible - check container is running
docker ps | grep mysql

# If not running:
docker ps -a  # Check if stopped
```

### "Connection refused" on port 3001
```bash
# Frontend not running
docker ps | grep sow-qandu-me

# If stopped, check logs:
docker logs ahmad_sow-qandu-me
```

### "API returns 500 error"
```bash
# Check backend logs
docker logs -f ahmad_socialgarden-backend --tail 50

# Look for: database connection errors, missing env vars
```

### "Tables don't exist"
```bash
# Migration didn't apply - run it again:
MYSQL_CONTAINER=$(docker ps --filter "name=ahmad_mysql-database" -q)
docker exec -i $MYSQL_CONTAINER mysql \
  -u sg_sow_user \
  -pSG_sow_2025_SecurePass! \
  socialgarden_sow < /root/the11-dev/database/migrations/add-dashboard-chat-schema.sql
```

---

## 📝 ENVIRONMENT VARIABLES

**Frontend** (.env.local on EasyPanel):
```
NEXT_PUBLIC_ANYTHINGLLM_URL=https://ahmad-anything-llm.840tjq.easypanel.host
ANYTHINGLLM_API_KEY=0G0WTZ3-6ZX4D20-H35VBRG-9059WPA
DB_HOST=ahmad_mysql-database
DB_USER=sg_sow_user
DB_PASSWORD=SG_sow_2025_SecurePass!
DB_NAME=socialgarden_sow
```

**Backend** (main.py):
```
DATABASE_URL=mysql+aiomysql://sg_sow_user:SG_sow_2025_SecurePass!@ahmad_mysql-database:3306/socialgarden_sow
```

---

## 🎯 NEXT STEPS

1. **Right now**: Verify production state with commands above
2. **Then**: Apply database migration
3. **Next**: Start implementing Phase 2 (update chat API)
4. **Push**: Commit to GitHub
5. **Deploy**: EasyPanel auto-redeploys
6. **Test**: Verify on production URL
