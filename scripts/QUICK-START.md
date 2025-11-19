# Quick Start: Running Sync Scripts

## Problem: Database Connection

The scripts use Docker internal hostnames by default. If you're running from the **host machine** (not inside a container), you need to set the correct DB_HOST.

## Solution: Set Environment Variables

### Option 1: Use localhost (if MySQL port is exposed)

```bash
export DB_HOST=localhost
export DB_PORT=3306
export DB_USER=sg_sow_user
export DB_PASSWORD=SG_sow_2025_SecurePass!
export DB_NAME=socialgarden_sow

# Then run the script
bash scripts/reset-and-sync.sh
```

### Option 2: Use Docker container IP

Find the MySQL container IP:
```bash
docker inspect ahmad_mysql-database.1.n1d51pctlblkqwjmhgxqc30pl --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
```

Then:
```bash
export DB_HOST=<container-ip>
export DB_PORT=3306
# ... rest of variables
```

### Option 3: Run from inside a container

If you have a frontend container running:
```bash
docker exec -it <frontend-container> bash
# Then run scripts from inside
```

## Quick Test

Test database connection first:
```bash
export DB_HOST=localhost  # or container IP
mysql -h "$DB_HOST" -P 3306 -u sg_sow_user -p'SG_sow_2025_SecurePass!' -e "SELECT 1;" socialgarden_sow
```

If that works, the scripts will work too!

