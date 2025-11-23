/**
 * MIGRATION SCRIPT: Recalculate total_investment for all existing SOWs
 * 
 * Run with: npx tsx scripts/recalculate-investments.ts
 * 
 * This script:
 * 1. Fetches all SOWs from database
 * 2. Parses content to extract pricing tables
 * 3. Calculates total investment
 * 4. Updates database
 */

import { query } from '../lib/db';
import { extractPricingFromContent } from '../lib/export-utils';

interface SOW {
  id: string;
  title: string;
  content: any;
  total_investment: number;
}

async function recalculateAllInvestments() {
  console.log('🔄 Starting investment recalculation...\n');

  try {
    // Fetch all SOWs
    const sows = await query<SOW>('SELECT id, title, content, total_investment FROM sows');
    console.log(`📊 Found ${sows.length} SOWs to process\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const sow of sows) {
      try {
        // Parse content if it's a string
        let content = sow.content;
        if (typeof content === 'string') {
          try {
            content = JSON.parse(content);
          } catch (e) {
            console.log(`⚠️  ${sow.title}: Invalid JSON content, skipping`);
            skipped++;
            continue;
          }
        }

        // Extract pricing rows
        const pricingRows = extractPricingFromContent(content);
        
        if (pricingRows.length === 0) {
          console.log(`⚠️  ${sow.title}: No pricing table found, skipping`);
          skipped++;
          continue;
        }

        // Calculate total
        const totalInvestment = pricingRows.reduce((sum, row) => sum + row.total, 0);

        // Update if different from current value
        if (Math.abs(totalInvestment - sow.total_investment) > 0.01) {
          await query(
            'UPDATE sows SET total_investment = ? WHERE id = ?',
            [totalInvestment, sow.id]
          );
          console.log(`✅ ${sow.title}: Updated from $${sow.total_investment.toFixed(2)} → $${totalInvestment.toFixed(2)}`);
          updated++;
        } else {
          console.log(`✓  ${sow.title}: Already correct ($${totalInvestment.toFixed(2)})`);
        }

      } catch (error: any) {
        console.error(`❌ ${sow.title}: Error - ${error.message}`);
        errors++;
      }
    }

    console.log('\n📈 SUMMARY:');
    console.log(`   Total SOWs: ${sows.length}`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⚠️  Skipped (no pricing): ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    
  } catch (error: any) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

// Run the migration
recalculateAllInvestments();
