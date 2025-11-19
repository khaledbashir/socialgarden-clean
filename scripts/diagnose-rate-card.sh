#!/bin/bash

##############################################################################
# RATE CARD DIAGNOSTIC SCRIPT
# Purpose: Diagnose rate card system connectivity and database state
# Usage: ./scripts/diagnose-rate-card.sh
##############################################################################

set -e

echo "=========================================="
echo "🔍 RATE CARD DIAGNOSTIC SCRIPT"
echo "=========================================="
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "pass" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $message"
    elif [ "$status" = "fail" ]; then
        echo -e "${RED}❌ FAIL${NC}: $message"
    else
        echo -e "${YELLOW}⚠️  WARN${NC}: $message"
    fi
}

# Function to print section header
print_header() {
    echo ""
    echo "=========================================="
    echo "📋 $1"
    echo "=========================================="
}

##############################################################################
# SECTION 1: Environment Variables Check
##############################################################################
print_header "SECTION 1: Environment Variables"

if [ -z "$DB_HOST" ]; then
    print_status "fail" "DB_HOST is not set"
    DB_HOST="localhost"
else
    print_status "pass" "DB_HOST is set to: $DB_HOST"
fi

if [ -z "$DB_PORT" ]; then
    print_status "warn" "DB_PORT is not set, using default 3306"
    DB_PORT="3306"
else
    print_status "pass" "DB_PORT is set to: $DB_PORT"
fi

if [ -z "$DB_NAME" ]; then
    print_status "fail" "DB_NAME is not set"
    DB_NAME="socialgarden_sow"
else
    print_status "pass" "DB_NAME is set to: $DB_NAME"
fi

if [ -z "$DB_USER" ]; then
    print_status "fail" "DB_USER is not set"
    DB_USER="sg_sow_user"
else
    print_status "pass" "DB_USER is set to: $DB_USER"
fi

if [ -z "$DB_PASSWORD" ]; then
    print_status "fail" "DB_PASSWORD is not set"
else
    print_status "pass" "DB_PASSWORD is set (hidden for security)"
fi

##############################################################################
# SECTION 2: Database Connectivity Check
##############################################################################
print_header "SECTION 2: Database Connectivity"

echo "Attempting to connect to database at $DB_HOST:$DB_PORT..."

# Try to connect to MySQL
if command -v mysql &> /dev/null; then
    echo "Using MySQL command-line client..."

    if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT 1;" &> /dev/null; then
        print_status "pass" "Successfully connected to MySQL database"
    else
        print_status "fail" "Could not connect to MySQL database"
        echo "  → Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD"
        echo "  → Ensure MySQL server is running"
    fi
else
    print_status "warn" "MySQL command-line client not found"
    echo "  → Install mysql-client to enable direct database testing"
fi

##############################################################################
# SECTION 3: Rate Card Table Check
##############################################################################
print_header "SECTION 3: Rate Card Table Status"

if command -v mysql &> /dev/null; then
    echo "Checking if rate_card_roles table exists..."

    TABLE_EXISTS=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SHOW TABLES LIKE 'rate_card_roles';" 2>/dev/null | wc -l)

    if [ "$TABLE_EXISTS" -gt 1 ]; then
        print_status "pass" "rate_card_roles table exists"

        # Count rows
        ROLE_COUNT=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT COUNT(*) FROM rate_card_roles WHERE is_active = TRUE;" 2>/dev/null | tail -1)

        if [ "$ROLE_COUNT" -gt 0 ]; then
            print_status "pass" "Table contains $ROLE_COUNT active roles"

            # Show sample roles
            echo ""
            echo "Sample roles from database:"
            mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT role_name, hourly_rate FROM rate_card_roles WHERE is_active = TRUE ORDER BY hourly_rate DESC LIMIT 5;" 2>/dev/null
        else
            print_status "fail" "Table exists but contains no active roles"
            echo "  → Run the migration script to populate roles"
        fi
    else
        print_status "fail" "rate_card_roles table does not exist"
        echo "  → Run the migration: database/scripts/001-create-rate-card-roles.sql"
    fi
else
    print_status "warn" "Cannot check table status without MySQL client"
fi

##############################################################################
# SECTION 4: API Endpoint Check
##############################################################################
print_header "SECTION 4: Rate Card API Endpoint"

# Check if we can reach the API endpoint
API_URL="${API_URL:-http://localhost:3000/api/rate-card/markdown}"

echo "Testing rate card API endpoint: $API_URL"

if command -v curl &> /dev/null; then
    echo "Sending GET request..."

    API_RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL" 2>/dev/null || echo "0")
    HTTP_CODE=$(echo "$API_RESPONSE" | tail -1)
    RESPONSE_BODY=$(echo "$API_RESPONSE" | head -n -1)

    if [ "$HTTP_CODE" = "200" ]; then
        print_status "pass" "API endpoint returned HTTP 200"

        # Check if response contains expected fields
        if echo "$RESPONSE_BODY" | grep -q '"success":true'; then
            print_status "pass" "API response indicates success"
        fi

        if echo "$RESPONSE_BODY" | grep -q '"markdown"'; then
            print_status "pass" "API response contains markdown field"
        fi

        # Count roles in response
        RESPONSE_ROLE_COUNT=$(echo "$RESPONSE_BODY" | grep -o '"roleCount":[0-9]*' | cut -d':' -f2)
        if [ ! -z "$RESPONSE_ROLE_COUNT" ]; then
            print_status "pass" "API reports $RESPONSE_ROLE_COUNT roles available"
        fi
    else
        print_status "fail" "API endpoint returned HTTP $HTTP_CODE"
        echo "  → Response: $RESPONSE_BODY"
    fi
else
    print_status "warn" "curl command not found, skipping API test"
fi

##############################################################################
# SECTION 5: Migration File Check
##############################################################################
print_header "SECTION 5: Migration File Status"

MIGRATION_FILE="database/scripts/001-create-rate-card-roles.sql"

if [ -f "$MIGRATION_FILE" ]; then
    print_status "pass" "Migration file found at $MIGRATION_FILE"

    FILE_SIZE=$(wc -c < "$MIGRATION_FILE")
    ROLE_COUNT=$(grep -c "INSERT INTO" "$MIGRATION_FILE" || echo "0")

    echo "  → File size: $FILE_SIZE bytes"
    echo "  → Contains $ROLE_COUNT INSERT statements"
else
    print_status "fail" "Migration file not found at $MIGRATION_FILE"
fi

##############################################################################
# SECTION 6: Recommendations
##############################################################################
print_header "SECTION 6: Recommendations"

if [ "$TABLE_EXISTS" -gt 1 ] && [ "$ROLE_COUNT" -gt 0 ]; then
    print_status "pass" "✅ Rate card system appears to be working correctly!"
    echo "  → Ensure frontend containers are restarted if they were running"
    echo "  → Clear browser cache: Ctrl+Shift+Delete"
    echo "  → Test SOW generation with new budget request"
else
    print_status "fail" "⚠️  Issues detected with rate card system"
    echo ""
    echo "To fix, run the migration:"
    echo "  cd the11-dev"
    echo "  mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p $DB_NAME < database/scripts/001-create-rate-card-roles.sql"
    echo ""
    echo "Or if using Docker:"
    echo "  docker exec <mysql-container> mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME < /app/database/scripts/001-create-rate-card-roles.sql"
fi

echo ""
print_header "✨ Diagnostic Complete"
echo "Generated: $(date)"
echo ""
