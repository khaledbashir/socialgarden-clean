#!/bin/bash

# ================================================================
# Rate Card Roles Migration Script
# ================================================================
# Purpose: Apply the rate_card_roles table migration to the database
# Usage: ./scripts/migrate-rate-card.sh

set -e  # Exit on error

echo "🚀 Starting Rate Card Roles Migration..."
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ Loaded environment variables from .env"
else
    echo "⚠️  Warning: .env file not found"
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "Please set DATABASE_URL in your .env file"
    exit 1
fi

# Parse DATABASE_URL to extract connection details
# Format: mysql://user:password@host:port/database
DB_USER=$(echo $DATABASE_URL | sed -n 's|.*://\([^:]*\):.*|\1|p')
DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's|.*@\([^:]*\):.*|\1|p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's|.*/\([^?]*\).*|\1|p')

echo "📊 Database Connection Info:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""

# Migration file path
MIGRATION_FILE="database/migrations/add-rate-card-roles-table.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Error: Migration file not found at $MIGRATION_FILE"
    exit 1
fi

echo "📁 Migration file: $MIGRATION_FILE"
echo ""

# Confirm before proceeding
read -p "⚠️  This will create the rate_card_roles table and seed it with 90 roles. Continue? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled"
    exit 0
fi

echo ""
echo "🔄 Applying migration..."
echo ""

# Apply migration using mysql client
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "📋 Summary:"
    echo "   - rate_card_roles table created"
    echo "   - 90 roles seeded from official Master Rate Card"
    echo "   - Indexes created for performance"
    echo ""
    echo "🎯 Next Steps:"
    echo "   1. Visit /admin/rate-card to manage roles"
    echo "   2. API endpoints are available at /api/rate-card"
    echo "   3. Pricing tables will now fetch roles dynamically"
    echo "   4. AI prompts will use live data from the database"
    echo ""
else
    echo ""
    echo "❌ Migration failed!"
    echo "Please check the error messages above"
    exit 1
fi
