# Deployment Fix Summary - Oct 15, 2025

## Problems Fixed

### 1. **Docker Container Issues** ✅
- **Problem**: Multiple duplicate containers running (`the11_frontend` vs `the11-frontend`)
- **Solution**: Removed all containers and rebuilt from scratch with `docker system prune -af`
- **Result**: Clean single container deployment

### 2. **Database Connection** ✅
- **Problem**: Environment variables not passed to Docker containers
- **Solution**: Added all DB vars to `docker-compose.yml`:
  ```yaml
  environment:
    - DB_HOST=168.231.115.219
    - DB_PORT=3306
    - DB_USER=sg_sow_user
    - DB_PASSWORD=SG_sow_2025_SecurePass!
    - DB_NAME=socialgarden_sow
  ```
- **Result**: Container can now connect to MySQL

### 3. **MySQL Network Binding** ✅
- **Problem**: MySQL only listening on `127.0.0.1` (localhost), not accessible from Docker
- **Solution**: Updated `/etc/mysql/mysql.conf.d/mysqld.cnf`:
  ```
  bind-address = 0.0.0.0
  ```
- **Result**: MySQL now accessible on `0.0.0.0:3306`

### 4. **MySQL User Permissions** ✅
- **Problem**: User `sg_sow_user` only had `@'localhost'` access
- **Solution**: Granted network access:
  ```sql
  CREATE USER 'sg_sow_user'@'%' IDENTIFIED BY 'SG_sow_2025_SecurePass!';
  GRANT ALL PRIVILEGES ON socialgarden_sow.* TO 'sg_sow_user'@'%';
  FLUSH PRIVILEGES;
  ```
- **Result**: Database accessible from Docker containers

### 5. **Browser Cache** ✅
- **Problem**: Old JavaScript/assets cached in browser
- **Solution**: Hard refresh (Ctrl+Shift+R) to clear cache
- **Result**: Latest code visible after page reload

## Test Results

✅ **Database API Working**:
```bash
curl -X POST http://168.231.115.219:3333/api/sow/create
# Response: {"success":true,"sowId":"sow-mgrke9il-8tkrt"}
```

## Current Status

- **Production URL**: `http://168.231.115.219:3333`
- **Database**: MySQL 8.x on host machine
- **Frontend**: Docker container with Next.js 15.1.4
- **PDF Service**: Docker container with Python 3.11

## Architecture

```
┌─────────────────────────────────────┐
│  Browser (168.231.115.219:3333)     │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  the11-frontend-1 (Docker)          │
│  - Next.js 15.1.4                   │
│  - Port 3000 → 3333                 │
│  - Env: DB_HOST=168.231.115.219     │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  MySQL 8.x (Host Machine)           │
│  - Port: 3306                       │
│  - Bind: 0.0.0.0                    │
│  - DB: socialgarden_sow             │
│  - User: sg_sow_user@%              │
└─────────────────────────────────────┘
```

## Next Steps

1. **Hard refresh browser** at `http://168.231.115.219:3333`
2. **Test "Send to Client" button** with new database integration
3. **Continue Phase 1**: Notification system (email alerts)
4. **Update client portal** to use database instead of localStorage

## Important Commands

```bash
# Restart containers
cd /root/the11 && docker compose restart

# Rebuild from scratch
cd /root/the11 && docker compose down && docker compose up -d --build

# View logs
docker logs the11-frontend-1 -f

# Check database connection
docker exec the11-frontend-1 env | grep DB_

# Test API
curl -X POST http://168.231.115.219:3333/api/sow/create \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","clientName":"Test","clientEmail":"test@test.com","content":"<h1>Test</h1>","totalInvestment":1000,"folderId":"test","creatorEmail":"test@test.com"}'
```

## AnythingLLM Configuration

- **Base URL**: `https://ahmad-anything-llm.840tjq.easypanel.host`
- **API Key**: `0G0WTZ3-6ZX4D20-H35VBRG-9059WPA` (hardcoded in `lib/anythingllm.ts`)
- **Status**: ✅ Working (tested with `/api/v1/auth`)

## OpenRouter Configuration

- **Endpoint**: `https://openrouter.ai/api/v1/chat/completions`
- **API Key**: Set in environment (OPENROUTER_API_KEY)
- **Status**: ✅ Configured

## Files Modified

1. `/root/the11/docker-compose.yml` - Added DB environment variables
2. `/etc/mysql/mysql.conf.d/mysqld.cnf` - Changed bind-address to 0.0.0.0
3. MySQL permissions - Added `sg_sow_user@'%'`

## Git Commits

- `e0bb3e0` - Fix: Add database environment variables to docker-compose
- `4d26f55` - Add comprehensive logging to debug API issues
- `dc7b069` - Add 'Send to Client' modal with database integration
- `ba77245` - Phase 1: Database setup + tracking system
