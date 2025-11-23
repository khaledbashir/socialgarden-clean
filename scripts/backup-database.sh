#!/bin/bash
# Database Backup Script - Preserves all data before cleanup
# Run this BEFORE any cleanup operations

set -e

echo "📦 Starting database backup..."

# Database credentials - MUST be set via environment variables
if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_NAME" ]; then
    echo "❌ Missing required environment variables:"
    echo "   - DB_HOST"
    echo "   - DB_USER"
    echo "   - DB_PASSWORD"
    echo "   - DB_NAME"
    exit 1
fi

DB_PORT="${DB_PORT:-3306}"

# Check if we can connect
echo "🔍 Testing database connection to ${DB_HOST}:${DB_PORT}..."
if ! mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" "$DB_NAME" &>/dev/null; then
    echo "❌ Cannot connect to database at ${DB_HOST}:${DB_PORT}"
    echo ""
    echo "💡 Troubleshooting:"
    echo "   1. If running from host machine, try:"
    echo "      export DB_HOST=localhost"
    echo "      export DB_HOST=127.0.0.1"
    echo "      # or use the external IP/domain"
    echo ""
    echo "   2. If running from Docker container, use:"
    echo "      export DB_HOST=ahmad_mysql-database"
    echo ""
    echo "   3. Check if MySQL is accessible:"
    echo "      mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p'$DB_PASSWORD' -e 'SELECT 1;'"
    echo ""
    exit 1
fi
echo "✅ Database connection successful!"
echo ""

# Backup directory
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "📊 Backing up database: $DB_NAME"
echo "📁 Backup file: $BACKUP_FILE"

# Create full database backup
mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" \
    "$DB_NAME" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Database backup completed successfully!"
    echo "📦 Backup saved to: $BACKUP_FILE"
    
    # Also create a JSON export of critical tables
    echo "📊 Creating JSON export of critical tables..."
    
    # Export folders
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" \
        "$DB_NAME" -e "SELECT * FROM folders;" > "${BACKUP_DIR}/folders_${TIMESTAMP}.txt"
    
    # Export SOWs
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" \
        "$DB_NAME" -e "SELECT id, title, client_name, folder_id, workspace_slug, thread_slug FROM sows;" > "${BACKUP_DIR}/sows_${TIMESTAMP}.txt"
    
    echo "✅ JSON exports created"
    echo ""
    echo "📋 Backup Summary:"
    echo "   - Full SQL backup: $BACKUP_FILE"
    echo "   - Folders export: ${BACKUP_DIR}/folders_${TIMESTAMP}.txt"
    echo "   - SOWs export: ${BACKUP_DIR}/sows_${TIMESTAMP}.txt"
else
    echo "❌ Database backup failed!"
    exit 1
fi

