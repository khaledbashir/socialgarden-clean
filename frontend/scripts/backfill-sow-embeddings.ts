/**
 * BACKFILL SCRIPT: Embed all existing SOWs into AnythingLLM workspaces
 * 
 * This script:
 * 1. Queries all SOWs from the database
 * 2. Converts their TipTap JSON content to HTML
 * 3. Embeds them using the Dual-embed protocol:
 *    - Individual workspace (for client-specific chats)
 *    - Master dashboard (for analytics queries)
 */

import { query } from '../lib/db';
import { AnythingLLMService } from '../lib/anythingllm';
import { tiptapToHTML } from '../lib/export-utils';

async function backfillSOWEmbeddings() {
  console.log('\n🚀 Starting SOW backfill process...\n');
  
  const anythingLLM = new AnythingLLMService();
  
  // Get all SOWs with workspace mappings
  const sows = await query(`
    SELECT 
      id, 
      title, 
      content, 
      workspace_slug, 
      client_name, 
      vertical, 
      service_line, 
      created_at
    FROM sows
    WHERE workspace_slug IS NOT NULL
      AND content IS NOT NULL
    ORDER BY created_at DESC
  `);
  
  console.log(`📚 Found ${sows.length} SOWs to embed\n`);
  
  let successCount = 0;
  let partialCount = 0;
  let failCount = 0;
  
  for (const sow of sows) {
    try {
      console.log(`\n📄 Processing: ${sow.title || `SOW ${sow.id}`}`);
      console.log(`   Workspace: ${sow.workspace_slug}`);
      
      // Convert TipTap JSON to HTML
      const contentObj = typeof sow.content === 'string' 
        ? JSON.parse(sow.content) 
        : sow.content;
      const htmlContent = tiptapToHTML(contentObj);
      
      // Embed in individual workspace (Dual-embed step 1)
      console.log(`   📤 Embedding in individual workspace...`);
      const embedded1 = await anythingLLM.embedSOWDocument(
        sow.workspace_slug,
        sow.title || `SOW ${sow.id}`,
        htmlContent,
        {
          docId: sow.id,
          createdAt: sow.created_at,
          clientName: sow.client_name,
          vertical: sow.vertical,
          serviceLine: sow.service_line,
        }
      );
      
      // Embed in master dashboard (Dual-embed step 2)
      console.log(`   📤 Embedding in master dashboard...`);
      const embedded2 = await anythingLLM.embedSOWDocument(
        'sow-master-dashboard-63003769',
        `[${sow.workspace_slug}] ${sow.title || `SOW ${sow.id}`}`,
        htmlContent,
        {
          docId: sow.id,
          workspace: sow.workspace_slug,
          createdAt: sow.created_at,
          clientName: sow.client_name,
          vertical: sow.vertical,
          serviceLine: sow.service_line,
        }
      );
      
      if (embedded1 && embedded2) {
        console.log(`   ✅ SUCCESS: Embedded in both workspaces`);
        successCount++;
      } else if (embedded1 || embedded2) {
        console.log(`   ⚠️  PARTIAL: Embedded in ${embedded1 ? 'individual' : 'dashboard'} only`);
        partialCount++;
      } else {
        console.log(`   ❌ FAILED: Could not embed in either workspace`);
        failCount++;
      }
    } catch (error: any) {
      console.error(`   ❌ ERROR: ${error.message}`);
      failCount++;
    }
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n\n📊 BACKFILL SUMMARY`);
  console.log(`====================`);
  console.log(`✅ Full Success:  ${successCount}/${sows.length}`);
  console.log(`⚠️  Partial:       ${partialCount}/${sows.length}`);
  console.log(`❌ Failed:        ${failCount}/${sows.length}`);
  console.log(`📄 Total SOWs:    ${sows.length}\n`);
  
  if (successCount === sows.length) {
    console.log(`🎉 ALL SOWS SUCCESSFULLY EMBEDDED!`);
  } else if (successCount + partialCount === sows.length) {
    console.log(`⚠️  Some SOWs only partially embedded - check logs above`);
  } else {
    console.log(`❌ Some SOWs failed to embed - check error messages above`);
  }
  
  console.log(`\n✨ Backfill process complete!\n`);
}

// Run the backfill
backfillSOWEmbeddings().catch((error) => {
  console.error('\n💥 FATAL ERROR:', error);
  process.exit(1);
});
