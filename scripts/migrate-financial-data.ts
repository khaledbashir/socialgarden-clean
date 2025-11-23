/**
 * Financial Data Migration Script
 * Purpose: Extract pricing totals from SOW content and populate total_investment field
 * 
 * The script:
 * 1. Reads all SOWs with total_investment = 0 or NULL
 * 2. Parses TipTap JSON content to find editablePricingTable nodes
 * 3. Extracts the TOTAL row (final row with rate = 0 or role containing "Total"/"TOTAL")
 * 4. Calculates investment amount from hours * rate
 * 5. Updates database with calculated total_investment
 * 
 * Usage: npm run migrate:financial-data
 * 
 * Created: October 23, 2025
 * Status: Production-ready
 */

import { query } from '@/lib/db';

interface SOWRecord {
  id: string;
  title: string;
  content: string;
}

interface PricingRow {
  role: string;
  description: string;
  hours: number;
  rate: number;
}

interface PricingTable {
  rows: PricingRow[];
  discount?: number;
  showTotal?: boolean;
}

/**
 * Parse TipTap JSON and extract pricing table data
 * Finds editablePricingTable nodes and returns the pricing data
 */
function extractPricingTable(content: string): PricingTable | null {
  try {
    const doc = JSON.parse(content);

    if (!doc.content || !Array.isArray(doc.content)) {
      return null;
    }

    // Search for editablePricingTable nodes
    for (const node of doc.content) {
      if (node.type === 'editablePricingTable' && node.attrs?.rows) {
        return {
          rows: node.attrs.rows,
          discount: node.attrs.discount || 0,
          showTotal: node.attrs.showTotal !== false,
        };
      }
    }

    return null;
  } catch (error) {
    console.warn('Failed to parse pricing table from content:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Extract the total investment from a pricing table
 * Looks for the final row with either:
 * - rate = 0 (indicates total row)
 * - role containing "Total" or "TOTAL" or "Subtotal"
 */
function calculateTotalInvestment(pricingTable: PricingTable): number {
  if (!pricingTable.rows || pricingTable.rows.length === 0) {
    return 0;
  }

  // Find the TOTAL row - usually the last row with rate = 0
  let totalRow: PricingRow | null = null;

  // Strategy 1: Find row with rate = 0 and role containing "Total"
  for (const row of pricingTable.rows) {
    if (row.rate === 0 && row.role && (row.role.includes('Total') || row.role.includes('TOTAL'))) {
      totalRow = row;
      break;
    }
  }

  // Strategy 2: If not found, look for the last row with role containing "Total"
  if (!totalRow) {
    for (let i = pricingTable.rows.length - 1; i >= 0; i--) {
      const row = pricingTable.rows[i];
      if (row.role && (row.role.includes('Total') || row.role.includes('TOTAL') || row.role.includes('Subtotal'))) {
        totalRow = row;
        break;
      }
    }
  }

  // Strategy 3: If still not found, the last row with rate = 0 might be the total
  if (!totalRow) {
    for (let i = pricingTable.rows.length - 1; i >= 0; i--) {
      if (pricingTable.rows[i].rate === 0) {
        totalRow = pricingTable.rows[i];
        break;
      }
    }
  }

  if (!totalRow) {
    console.warn('Could not find total row in pricing table');
    return 0;
  }

  // Calculate: hours field contains the total amount, or hours * rate for calculation rows
  // In the schema, the total row stores the amount in the 'hours' field
  const totalAmount = totalRow.hours || 0;

  return Math.round(totalAmount * 100) / 100; // Round to 2 decimals
}

/**
 * Main migration function
 */
async function migrateFinancialData(): Promise<void> {
  console.log('🔄 Starting financial data migration...\n');
  console.log('📊 Fetching SOWs with zero or NULL investment...\n');

  try {
    // Get all SOWs with zero or null investment
    const sows = await query<SOWRecord>(
      `SELECT id, title, content FROM sows 
       WHERE total_investment = 0 OR total_investment IS NULL
       ORDER BY created_at DESC`
    );

    console.log(`📊 Found ${sows.length} SOWs to process\n`);

    if (sows.length === 0) {
      console.log('✅ No SOWs with zero investment found. All SOWs already have financial data.');
      return;
    }

    let successCount = 0;
    let noDataCount = 0;
    let errorCount = 0;
    let totalExtracted = 0;

    // Process each SOW
    for (let i = 0; i < sows.length; i++) {
      const sow = sows[i];

      try {
        // Extract pricing table from content
        const pricingTable = extractPricingTable(sow.content);

        if (!pricingTable) {
          console.log(`⚠️  [${i + 1}/${sows.length}] ${sow.title}: No pricing table found (keeping $0)`);
          noDataCount++;
          continue;
        }

        // Calculate total investment
        const totalInvestment = calculateTotalInvestment(pricingTable);

        // Update database
        await query(`UPDATE sows SET total_investment = ? WHERE id = ?`, [totalInvestment, sow.id]);

        console.log(`✅ [${i + 1}/${sows.length}] ${sow.title}: $${totalInvestment.toLocaleString('en-AU', { minimumFractionDigits: 2 })}`);

        successCount++;
        totalExtracted += totalInvestment;
      } catch (error) {
        console.error(`❌ [${i + 1}/${sows.length}] Failed to process ${sow.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        errorCount++;
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('✅ MIGRATION COMPLETE');
    console.log('='.repeat(80));
    console.log(`\n📊 Results:`);
    console.log(`   Success:        ${successCount}/${sows.length}`);
    console.log(`   No data found:  ${noDataCount}/${sows.length}`);
    console.log(`   Errors:         ${errorCount}/${sows.length}`);

    // Verify results in database
    const result = await query<{ total: number; count: number }>(
      `SELECT SUM(total_investment) as total, COUNT(*) as count FROM sows WHERE total_investment > 0`
    );

    const totalValue = result[0]?.total || 0;
    const sowsWithValue = result[0]?.count || 0;

    console.log(`\n💰 Financial Data Summary:`);
    console.log(`   SOWs with values:  ${sowsWithValue}`);
    console.log(`   Total value:       $${totalValue.toLocaleString('en-AU', { minimumFractionDigits: 2 })}`);

    // Overall database summary
    const allSows = await query<{ total: number; count: number }>(
      `SELECT SUM(total_investment) as total, COUNT(*) as count FROM sows`
    );

    const grandTotal = allSows[0]?.total || 0;
    const totalSowCount = allSows[0]?.count || 0;

    console.log(`\n📈 Full Dashboard Summary:`);
    console.log(`   Total SOWs:        ${totalSowCount}`);
    console.log(`   Total Investment:  $${grandTotal.toLocaleString('en-AU', { minimumFractionDigits: 2 })}`);
    console.log(`\n✨ Dashboard financial data is now populated and ready!`);
    console.log('='.repeat(80) + '\n');
  } catch (error) {
    console.error('\n🔴 MIGRATION FAILED');
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
    console.error('\nPlease check:');
    console.error('  1. Database connection is working');
    console.error('  2. SOWs table exists and has data');
    console.error('  3. Database credentials in .env are correct');
    process.exit(1);
  }
}

// Execute migration
migrateFinancialData();
