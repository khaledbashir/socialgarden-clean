/**
 * One-time script to delete the duplicate workspace
 * Run with: node delete-duplicate-workspace.js
 */

const ANYTHINGLLM_URL = 'https://ahmad-anything-llm.840tjq.easypanel.host';
const API_KEY = '0G0WTZ3-6ZX4D20-H35VBRG-9059WPA';
const DUPLICATE_WORKSPACE_SLUG = 'sow-master-dashboard-54307162';

async function deleteDuplicateWorkspace() {
  console.log('🗑️  Deleting duplicate workspace:', DUPLICATE_WORKSPACE_SLUG);
  
  try {
    const response = await fetch(
      `${ANYTHINGLLM_URL}/api/v1/workspace/${DUPLICATE_WORKSPACE_SLUG}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to delete workspace:', response.status, response.statusText);
      console.error('Error details:', errorText);
      process.exit(1);
    }

    console.log('✅ Duplicate workspace deleted successfully!');
    console.log('✅ The correct workspace "sow-master-dashboard" is now the only one.');
    console.log('');
    console.log('Next steps:');
    console.log('1. Refresh your app dashboard');
    console.log('2. Send a test message');
    console.log('3. Refresh again to verify history persists');
    
  } catch (error) {
    console.error('❌ Error deleting workspace:', error);
    process.exit(1);
  }
}

deleteDuplicateWorkspace();
