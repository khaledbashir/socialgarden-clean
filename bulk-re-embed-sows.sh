#!/bin/bash
# Bulk Re-Embed All Existing SOWs into Master Dashboard
# Purpose: Fix dashboard analytics showing only 4 SOWs instead of 33
# Date: October 23, 2025

# This script fixes the issue where existing SOWs are in the database
# but NOT embedded in the master dashboard for analytics queries

# REQUIREMENTS:
# 1. Node.js installed
# 2. NEXT_PUBLIC_ANYTHINGLLM_URL environment variable set
# 3. NEXT_PUBLIC_ANYTHINGLLM_API_KEY environment variable set
# 4. Database credentials configured

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║    BULK RE-EMBED ALL SOWs TO MASTER DASHBOARD        ║"
echo "║           October 23, 2025 - FIX SCRIPT              ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Configuration
ANYTHINGLLM_URL="${NEXT_PUBLIC_ANYTHINGLLM_URL:-https://ahmad-anything-llm.840tjq.easypanel.host}"
ANYTHINGLLM_API_KEY="${NEXT_PUBLIC_ANYTHINGLLM_API_KEY:-0G0WTZ3-6ZX4D20-H35VBRG-9059WPA}"
MASTER_DASHBOARD_SLUG="sow-master-dashboard"

echo "Configuration:"
echo "  AnythingLLM URL: $ANYTHINGLLM_URL"
echo "  Master Dashboard: $MASTER_DASHBOARD_SLUG"
echo ""

# Create Node.js script for bulk embedding
cat > /tmp/bulk-embed-sows.js << 'NODEJS_SCRIPT'
const http = require('http');
const https = require('https');

// Configuration from environment
const ANYTHINGLLM_URL = process.env.NEXT_PUBLIC_ANYTHINGLLM_URL || 'https://ahmad-anything-llm.840tjq.easypanel.host';
const ANYTHINGLLM_API_KEY = process.env.NEXT_PUBLIC_ANYTHINGLLM_API_KEY || '0G0WTZ3-6ZX4D20-H35VBRG-9059WPA';
const MASTER_DASHBOARD_SLUG = 'sow-master-dashboard';

// MySQL configuration from environment
const DB_HOST = process.env.DB_HOST || 'ahmad_mysql-database';
const DB_USER = process.env.DB_USER || 'sg_sow_user';
const DB_PASSWORD = process.env.DB_PASSWORD || 'SG_sow_2025_SecurePass!';
const DB_NAME = process.env.DB_NAME || 'socialgarden_sow';

const mysql = require('mysql2/promise');

/**
 * HTTP/HTTPS request helper
 */
function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const request = protocol.request(url, options, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          resolve({
            status: response.statusCode,
            body: data ? JSON.parse(data) : {},
            headers: response.headers
          });
        } catch (e) {
          resolve({
            status: response.statusCode,
            body: data,
            headers: response.headers
          });
        }
      });
    });
    request.on('error', reject);
    request.end(options.body);
  });
}

/**
 * Get or create master dashboard workspace
 */
async function getOrCreateMasterDashboard() {
  console.log('📊 Getting or creating master dashboard...');
  
  try {
    // List workspaces
    const listUrl = new URL(`${ANYTHINGLLM_URL}/api/v1/workspaces`);
    const listResponse = await makeRequest(listUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ANYTHINGLLM_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (listResponse.status === 200 && listResponse.body.workspaces) {
      const existing = listResponse.body.workspaces.find(w => w.slug === MASTER_DASHBOARD_SLUG);
      if (existing) {
        console.log(`✅ Found existing master dashboard: ${MASTER_DASHBOARD_SLUG}`);
        return MASTER_DASHBOARD_SLUG;
      }
    }

    // Create new master dashboard
    console.log('🆕 Creating new master dashboard workspace...');
    const createUrl = new URL(`${ANYTHINGLLM_URL}/api/v1/workspace/new`);
    const createResponse = await makeRequest(createUrl.toString(), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANYTHINGLLM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: 'SOW Master Dashboard' })
    });

    if (createResponse.status === 200) {
      console.log(`✅ Created master dashboard: ${createResponse.body.workspace.slug}`);
      return createResponse.body.workspace.slug;
    }

    throw new Error(`Failed to create workspace: ${createResponse.status}`);
  } catch (error) {
    console.error('❌ Error managing master dashboard:', error.message);
    throw error;
  }
}

/**
 * Embed a single SOW document into a workspace
 */
async function embedDocument(workspaceSlug, title, content) {
  try {
    // Step 1: Upload document
    const uploadUrl = new URL(`${ANYTHINGLLM_URL}/api/v1/document/raw-text`);
    const uploadResponse = await makeRequest(uploadUrl.toString(), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANYTHINGLLM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        documentName: title,
        text: content,
        addToWorkspaces: [workspaceSlug]
      })
    });

    if (uploadResponse.status !== 200) {
      console.warn(`⚠️ Upload failed for "${title}": ${uploadResponse.status}`);
      return false;
    }

    console.log(`✅ Embedded: ${title}`);
    return true;
  } catch (error) {
    console.error(`❌ Error embedding "${title}":`, error.message);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🔄 Connecting to database...');
    const connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME
    });

    console.log('✅ Connected to database');

    // Fetch all SOWs
    console.log('📄 Fetching all SOWs from database...');
    const [sows] = await connection.execute(
      `SELECT id, title, content, workspace_slug FROM sows WHERE workspace_slug IS NOT NULL ORDER BY created_at DESC`
    );

    console.log(`📊 Found ${sows.length} SOWs to embed`);

    if (sows.length === 0) {
      console.log('ℹ️  No SOWs found to embed');
      await connection.end();
      return;
    }

    // Get or create master dashboard
    const masterDashboardSlug = await getOrCreateMasterDashboard();

    // Embed all SOWs in batches
    let successful = 0;
    let failed = 0;
    const batchSize = 5;
    const batchDelay = 2000; // 2 seconds between batches

    for (let batchStart = 0; batchStart < sows.length; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize, sows.length);
      const batch = sows.slice(batchStart, batchEnd);

      console.log(`\n🔄 Processing batch ${Math.floor(batchStart / batchSize) + 1} (${batchStart + 1}-${batchEnd}/${sows.length})`);

      // Process batch concurrently
      const promises = batch.map(async (sow, index) => {
        const i = batchStart + index;
        const documentTitle = `[${sow.workspace_slug.toUpperCase()}] ${sow.title}`;
        
        console.log(`  [${i + 1}/${sows.length}] Embedding SOW: ${sow.title}`);

        // Parse content if JSON
        let content = sow.content;
        try {
          if (typeof content === 'string') {
            content = JSON.parse(content);
          }
          // Convert to readable text
          if (typeof content === 'object' && content.content) {
            content = JSON.stringify(content, null, 2);
          }
        } catch (e) {
          // Keep as-is if not valid JSON
        }

        const embedded = await embedDocument(masterDashboardSlug, documentTitle, content);
        
        if (embedded) {
          successful++;
        } else {
          failed++;
        }
      });

      await Promise.all(promises);

      // Wait between batches
      if (batchEnd < sows.length) {
        console.log(`⏳ Waiting ${batchDelay}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, batchDelay));
      }
    }

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║              EMBEDDING COMPLETE                        ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log(`║ Total SOWs:      ${sows.length.toString().padEnd(40)} ║`);
    console.log(`║ Successfully:    ${successful.toString().padEnd(40)} ║`);
    console.log(`║ Failed:          ${failed.toString().padEnd(40)} ║`);
    console.log('╚════════════════════════════════════════════════════════╝');

    await connection.end();

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
NODEJS_SCRIPT

echo "✅ Created bulk embedding script"
echo ""

# Install dependencies if needed
echo "📦 Checking dependencies..."
pnpm list mysql2 > /dev/null 2>&1 || pnpm add mysql2

# Run the script with environment variables
echo "🚀 Starting bulk embedding process..."
echo ""

export NEXT_PUBLIC_ANYTHINGLLM_URL="$ANYTHINGLLM_URL"
export NEXT_PUBLIC_ANYTHINGLLM_API_KEY="$ANYTHINGLLM_API_KEY"
export DB_HOST="${DB_HOST:-ahmad_mysql-database}"
export DB_USER="${DB_USER:-sg_sow_user}"
export DB_PASSWORD="${DB_PASSWORD:-SG_sow_2025_SecurePass!}"
export DB_NAME="${DB_NAME:-socialgarden_sow}"
export NODE_PATH="/root/the11-dev/frontend/node_modules"

node /tmp/bulk-embed-sows.js

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║           BULK EMBEDDING SCRIPT COMPLETE              ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "✨ All existing SOWs have been re-embedded to master dashboard!"
echo "📊 Dashboard analytics should now show all 33 SOWs"
echo ""
echo "Next steps:"
echo "  1. Refresh the dashboard page"
echo "  2. Try asking: 'How many total SOWs do we have?'"
echo "  3. Expected response: Should mention all 33 SOWs"
echo ""
