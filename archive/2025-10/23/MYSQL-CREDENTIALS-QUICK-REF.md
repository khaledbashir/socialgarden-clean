# 🚀 MYSQL QUICK REFERENCE CARD

## Connection Details
```
Host:     ahmad_mysql-database
Port:     3306
Database: socialgarden_sow
User:     sg_sow_user
Password: SG_sow_2025_SecurePass!
```

## Connection String
```
mysql://sg_sow_user:SG_sow_2025_SecurePass!@ahmad_mysql-database:3306/socialgarden_sow
```

## Quick CLI Commands

### Connect to Database
```bash
mysql -h ahmad_mysql-database -u sg_sow_user -p socialgarden_sow
# Enter password: SG_sow_2025_SecurePass!
```

### Check Tables
```bash
mysql -h ahmad_mysql-database -u sg_sow_user -p socialgarden_sow -e "SHOW TABLES;"
```

### View Schema
```bash
mysql -h ahmad_mysql-database -u sg_sow_user -p socialgarden_sow -e "DESCRIBE sows;"
```

### Count SOWs
```bash
mysql -h ahmad_mysql-database -u sg_sow_user -p socialgarden_sow -e "SELECT COUNT(*) as total FROM sows;"
```

### Check Vertical Column (Post-Migration)
```bash
mysql -h ahmad_mysql-database -u sg_sow_user -p socialgarden_sow -e "DESCRIBE sows;" | grep vertical
```

## Environment Variables

### Frontend (.env.local)
```
DB_HOST=ahmad_mysql-database
DB_USER=sg_sow_user
DB_PASSWORD=SG_sow_2025_SecurePass!
DB_NAME=socialgarden_sow
```

### Backend (main.py)
```
DATABASE_URL=mysql+aiomysql://sg_sow_user:SG_sow_2025_SecurePass!@ahmad_mysql-database:3306/socialgarden_sow
```

## Critical Tables

| Table | Purpose | Status |
|-------|---------|--------|
| `sows` | Main SOW documents | ✅ Has vertical/service_line (schema.sql) |
| `sow_activities` | Event tracking | ✅ Active |
| `sow_comments` | Client feedback | ✅ Active |
| `folders` | SOW organization | ✅ Active |

## Migration Status

**File:** `/root/the11-dev/database/migrations/add-vertical-service-line.sql`

**To Apply:**
```bash
mysql -h ahmad_mysql-database -u sg_sow_user -p socialgarden_sow < /root/the11-dev/database/migrations/add-vertical-service-line.sql
```

**What It Adds:**
- ✅ `vertical` column (ENUM: property, education, finance, healthcare, retail, hospitality, professional-services, technology, other)
- ✅ `service_line` column (ENUM: crm-implementation, marketing-automation, revops-strategy, managed-services, consulting, training, other)
- ✅ Indexes for performance

## Resource Usage
- CPU: 0.7% (healthy)
- Memory: 50.5 MB (efficient)
- Status: ✅ Running
