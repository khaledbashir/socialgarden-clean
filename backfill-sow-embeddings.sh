#!/bin/bash

# Backfill existing SOWs into AnythingLLM workspaces
# This script embeds all existing SOWs into their respective workspaces

cd /root/the11-dev/frontend

echo "📚 Backfilling SOW embeddings into AnythingLLM..."
echo ""

node -e "
const { query } = require('./lib/db.ts');
const { AnythingLLMService } = require('./lib/anythingllm.ts');
const { sowContentToHTML } = require('./lib/export-utils.ts');

async function backfillEmbeddings() {
  const anythingLLM = new AnythingLLMService();
  
  // Get all SOWs with workspace_slug
  const sows = await query(\`
    SELECT id, title, content, workspace_slug, client_name, vertical, service_line, created_at
    FROM sows
    WHERE workspace_slug IS NOT NULL
    ORDER BY created_at DESC
  \`);
  
  console.log(\`Found \${sows.length} SOWs with workspace mappings\`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const sow of sows) {
    try {
      console.log(\`\\n📄 Processing: \${sow.title} (workspace: \${sow.workspace_slug})\`);
      
      const contentObj = typeof sow.content === 'string' ? JSON.parse(sow.content) : sow.content;
      const htmlContent = sowContentToHTML(contentObj);
      
      // Embed in individual workspace
      const embedded = await anythingLLM.embedSOWDocument(
        sow.workspace_slug,
        sow.title,
        htmlContent,
        {
          docId: sow.id,
          createdAt: sow.created_at,
          clientName: sow.client_name,
          vertical: sow.vertical,
          serviceLine: sow.service_line,
        }
      );
      
      if (embedded) {
        console.log(\`  ✅ Embedded in workspace: \${sow.workspace_slug}\`);
        
        // Also embed in master dashboard
        try {
          await anythingLLM.embedSOWDocument(
            'sow-master-dashboard-63003769',
            \`[\${sow.workspace_slug}] \${sow.title}\`,
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
          console.log(\`  ✅ Also embedded in master dashboard\`);
          successCount++;
        } catch (dashError) {
          console.warn(\`  ⚠️  Master dashboard embed failed: \${dashError.message}\`);
          successCount++; // Still count as success if individual workspace worked
        }
      } else {
        console.error(\`  ❌ Failed to embed\`);
        failCount++;
      }
    } catch (error) {
      console.error(\`  ❌ Error: \${error.message}\`);
      failCount++;
    }
  }
  
  console.log(\`\\n📊 Summary:\`);
  console.log(\`  ✅ Success: \${successCount}\`);
  console.log(\`  ❌ Failed: \${failCount}\`);
  console.log(\`  📄 Total: \${sows.length}\`);
}

backfillEmbeddings().catch(console.error);
"

echo ""
echo "✅ Backfill complete!"
