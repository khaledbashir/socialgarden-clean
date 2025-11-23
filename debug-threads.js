/**
 * Debug script to check what threads exist in the workspace
 */

const ANYTHINGLLM_URL = 'https://ahmad-anything-llm.840tjq.easypanel.host';
const API_KEY = '0G0WTZ3-6ZX4D20-H35VBRG-9059WPA';
const WORKSPACE_SLUG = 'sow-master-dashboard';

async function debugWorkspace() {
  console.log('🔍 Checking workspace:', WORKSPACE_SLUG);
  console.log('');
  
  try {
    // Method 1: Get workspace details directly
    console.log('📊 Method 1: GET /api/v1/workspace/{slug}');
    const workspaceResponse = await fetch(
      `${ANYTHINGLLM_URL}/api/v1/workspace/${WORKSPACE_SLUG}`,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!workspaceResponse.ok) {
      console.error('❌ Failed to get workspace:', workspaceResponse.status);
    } else {
      const workspaceData = await workspaceResponse.json();
      console.log('✅ Workspace data:', JSON.stringify(workspaceData, null, 2));
      console.log('');
    }

    // Method 2: Get threads via threads endpoint
    console.log('📊 Method 2: GET /api/v1/workspace/{slug}/threads');
    const threadsResponse = await fetch(
      `${ANYTHINGLLM_URL}/api/v1/workspace/${WORKSPACE_SLUG}/threads`,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!threadsResponse.ok) {
      console.error('❌ Failed to get threads:', threadsResponse.status);
      const errorText = await threadsResponse.text();
      console.error('Error details:', errorText);
    } else {
      const threadsData = await threadsResponse.json();
      console.log('✅ Threads data:', JSON.stringify(threadsData, null, 2));
      console.log('');
      console.log('📋 Thread count:', threadsData.threads?.length || 0);
      
      if (threadsData.threads && threadsData.threads.length > 0) {
        console.log('');
        console.log('🧵 Threads found:');
        threadsData.threads.forEach((thread, i) => {
          console.log(`  ${i + 1}. ${thread.name || 'Untitled'} (slug: ${thread.slug})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugWorkspace();
