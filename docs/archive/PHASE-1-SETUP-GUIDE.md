# Phase 1: Database Setup + Tracking System
## Installation & Setup Guide

### 🎯 Completed in This Phase

1. ✅ **Database Schema Created** (`database/schema.sql`)
   - 6 tables: sows, sow_activities, sow_comments, sow_acceptances, sow_rejections, ai_conversations
   - 1 dashboard view: active_sows_dashboard
   - Full indexes for performance

2. ✅ **Database Connection** (`lib/db.ts`)
   - Connection pooling for performance
   - TypeScript types for all tables
   - Helper functions for queries

3. ✅ **API Routes Created**
   - `POST /api/sow/create` - Create new SOW
   - `GET /api/sow/[id]` - Fetch SOW with metrics
   - `PUT /api/sow/[id]` - Update SOW
   - `DELETE /api/sow/[id]` - Delete SOW
   - `POST /api/sow/[id]/send` - Send SOW to client
   - `POST /api/sow/[id]/track` - Track activity

4. ✅ **Package Updated**
   - Added `mysql2` dependency

---

## 📋 Setup Instructions

### Step 1: Install MySQL (if not already installed)

#### On Ubuntu/Debian:
```bash
sudo apt update
sudo apt install mysql-server -y
sudo systemctl start mysql
sudo systemctl enable mysql
sudo mysql_secure_installation
```

#### On macOS (with Homebrew):
```bash
brew install mysql
brew services start mysql
```

#### On Windows:
Download from: https://dev.mysql.com/downloads/mysql/

### Step 2: Create Database and User

```bash
# Login to MySQL as root
sudo mysql -u root -p

# Or if no password set:
sudo mysql
```

Then run:
```sql
source /root/the11/database/init.sql
```

Or manually:
```sql
CREATE DATABASE IF NOT EXISTS socialgarden_sow 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'sg_sow_user'@'localhost' 
  IDENTIFIED BY 'SG_sow_2025_SecurePass!';

GRANT ALL PRIVILEGES ON socialgarden_sow.* 
  TO 'sg_sow_user'@'localhost';

FLUSH PRIVILEGES;
EXIT;
```

### Step 3: Create Tables

```bash
# Login as the new user
mysql -u sg_sow_user -p socialgarden_sow

# Run schema
source /root/the11/database/schema.sql

# Or:
mysql -u sg_sow_user -p socialgarden_sow < /root/the11/database/schema.sql
```

### Step 4: Update Environment Variables

Add to `/root/the11/.env` and `/root/the11/novel-editor-demo/apps/web/.env`:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=sg_sow_user
DB_PASSWORD=SG_sow_2025_SecurePass!
DB_NAME=socialgarden_sow

# Base URL for portal links
NEXT_PUBLIC_BASE_URL=http://168.231.115.219:3333
```

### Step 5: Install Dependencies

```bash
cd /root/the11/novel-editor-demo/apps/web
pnpm install
```

### Step 6: Test Database Connection

Create test script:
```javascript
// test-db.js
const mysql = require('mysql2/promise');

async function test() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'sg_sow_user',
      password: 'SG_sow_2025_SecurePass!',
      database: 'socialgarden_sow'
    });
    
    console.log('✅ Database connection successful!');
    
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM sows');
    console.log('✅ Tables exist:', rows);
    
    await connection.end();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

test();
```

Run:
```bash
node test-db.js
```

### Step 7: Rebuild Docker Containers

```bash
cd /root/the11
docker compose down
docker compose up -d --build
```

---

## 🧪 Testing the API

### Test 1: Create SOW
```bash
curl -X POST http://localhost:3333/api/sow/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "HubSpot Implementation",
    "clientName": "ABC Corporation",
    "clientEmail": "john@abccorp.com",
    "content": "<h1>Test SOW</h1>",
    "totalInvestment": 50000,
    "folderId": "folder-123",
    "creatorEmail": "sam@socialgarden.com.au"
  }'
```

Expected response:
```json
{
  "success": true,
  "sowId": "sow-xxxxx-xxxxx",
  "message": "SOW created successfully"
}
```

### Test 2: Fetch SOW
```bash
curl http://localhost:3333/api/sow/[SOW_ID]
```

### Test 3: Send SOW to Client
```bash
curl -X POST http://localhost:3333/api/sow/[SOW_ID]/send \
  -H "Content-Type: application/json" \
  -d '{
    "clientEmail": "john@abccorp.com",
    "expiryDays": 30
  }'
```

Expected response:
```json
{
  "success": true,
  "portalUrl": "http://168.231.115.219:3333/portal/sow/sow-xxxxx-xxxxx",
  "expiresAt": "2025-11-14T...",
  "message": "SOW sent successfully"
}
```

### Test 4: Track Activity
```bash
curl -X POST http://localhost:3333/api/sow/[SOW_ID]/track \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "sow_opened",
    "metadata": {
      "device": "iPhone 14 Pro",
      "browser": "Safari"
    }
  }'
```

---

## 📊 Verify Data in Database

```bash
mysql -u sg_sow_user -p socialgarden_sow
```

```sql
-- Check SOWs
SELECT * FROM sows;

-- Check activities
SELECT * FROM sow_activities;

-- Check dashboard view
SELECT * FROM active_sows_dashboard;

-- Get engagement metrics for a SOW
SELECT 
  s.id,
  s.title,
  s.status,
  COUNT(a.id) as activity_count,
  MAX(a.created_at) as last_activity
FROM sows s
LEFT JOIN sow_activities a ON s.id = a.sow_id
WHERE s.id = 'YOUR_SOW_ID'
GROUP BY s.id;
```

---

## 🔍 Troubleshooting

### Issue: "Access denied for user"
**Solution:** Check password in .env file matches database user password

```bash
# Reset password if needed
sudo mysql
ALTER USER 'sg_sow_user'@'localhost' IDENTIFIED BY 'SG_sow_2025_SecurePass!';
FLUSH PRIVILEGES;
```

### Issue: "Can't connect to MySQL server"
**Solution:** Check MySQL is running

```bash
sudo systemctl status mysql
sudo systemctl start mysql
```

### Issue: "Table doesn't exist"
**Solution:** Run schema.sql again

```bash
mysql -u sg_sow_user -p socialgarden_sow < /root/the11/database/schema.sql
```

### Issue: "Connection pool errors"
**Solution:** Increase connection limit in db.ts or reduce load

---

## 📈 Next Steps (Phase 1 Continuation)

- [ ] Add "Send to Client" button to main editor UI
- [ ] Update client portal to fetch from database instead of localStorage
- [ ] Build notification system (email alerts)
- [ ] Create owner dashboard for viewing all SOWs
- [ ] Test complete workflow end-to-end

---

## 🎯 What You Can Do Now

1. **Create SOWs via API** - Use Postman or curl
2. **Track activities** - Log opens, views, interactions
3. **Query metrics** - Use SQL to see engagement data
4. **Test portal URLs** - Generate unique links for clients

**The foundation is ready! Next we'll connect it to the UI and add notifications.**

---

*Phase 1 Part 1-4 Complete: Database foundation is solid ✅*
*Created: October 15, 2025*
