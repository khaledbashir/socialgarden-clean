#!/bin/bash
# Database Backup Script - Preserves all data before cleanup
# Run this BEFORE any cleanup operations

set -e

echo "📦 Starting database backup..."

# Database credentials
DB_HOST="${DB_HOST:-ahmad_mysql-database}"
DB_USER="${DB_USER:-sg_sow_user}"
DB_PASSWORD="${DB_PASSWORD:-SG_sow_2025_SecurePass!}"
DB_NAME="${DB_NAME:-socialgarden_sow}"
DB_PORT="${DB_PORT:-3306}"

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

