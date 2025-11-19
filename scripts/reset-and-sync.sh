#!/bin/bash
# Master Reset and Sync Script
# This script performs a complete reset and sync of database and AnythingLLM
# WARNING: This will clean up orphaned data. Always backup first!

set -e

echo "🔄 Database & AnythingLLM Reset and Sync"
echo "=========================================="
echo ""

# Check if backups exist
if [ ! -d "./backups" ] || [ -z "$(ls -A ./backups 2>/dev/null)" ]; then
    echo "⚠️  WARNING: No backups found!"
    echo "   It's recommended to run backup scripts first."
    read -p "   Continue anyway? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "❌ Aborted. Run backup scripts first."
        exit 1
    fi
fi

echo "📋 Steps:"
echo "   1. Backup database"
echo "   2. Backup AnythingLLM workspaces"
echo "   3. Sync database with AnythingLLM (dry run)"
echo "   4. Clean up orphans (dry run)"
echo "   5. Apply sync (if confirmed)"
echo ""

# Step 1: Backup database
echo "📦 Step 1: Backing up database..."
bash ./scripts/backup-database.sh || {
    echo "❌ Database backup failed!"
    exit 1
}
echo ""

# Step 2: Backup AnythingLLM
echo "📦 Step 2: Backing up AnythingLLM workspaces..."
node ./scripts/backup-anythingllm-workspaces.js || {
    echo "❌ AnythingLLM backup failed!"
    exit 1
}
echo ""

# Step 3: Sync analysis (dry run)
echo "🔄 Step 3: Analyzing sync status (dry run)..."
node ./scripts/sync-database-anythingllm.js || {
    echo "❌ Sync analysis failed!"
    exit 1
}
echo ""

# Step 4: Cleanup analysis (dry run)
echo "🧹 Step 4: Analyzing orphans (dry run)..."
node ./scripts/cleanup-orphans.js || {
    echo "❌ Cleanup analysis failed!"
    exit 1
}
echo ""

# Ask for confirmation
echo "⚠️  Ready to apply changes?"
echo "   This will:"
echo "   - Create missing workspaces in AnythingLLM"
echo "   - Create missing folders in database"
echo "   - Delete orphaned data (if confirmed)"
echo ""
read -p "   Apply sync? (yes/no): " applySync

if [ "$applySync" = "yes" ]; then
    echo ""
    echo "🔄 Applying sync..."
    node ./scripts/sync-database-anythingllm.js --live || {
        echo "❌ Sync failed!"
        exit 1
    }
    echo ""
    
    read -p "   Delete orphans? (yes/no): " deleteOrphans
    if [ "$deleteOrphans" = "yes" ]; then
        echo ""
        echo "🧹 Deleting orphans..."
        node ./scripts/cleanup-orphans.js --live --confirm || {
            echo "❌ Cleanup failed!"
            exit 1
        }
    fi
else
    echo "ℹ️  Skipping sync application. Run manually with:"
    echo "   node ./scripts/sync-database-anythingllm.js --live"
fi

echo ""
echo "✅ Reset and sync completed!"
echo ""
echo "📋 Next steps:"
echo "   1. Verify workspaces are in sync"
echo "   2. Test creating a new workspace in the app"
echo "   3. Verify it appears in both database and AnythingLLM"

