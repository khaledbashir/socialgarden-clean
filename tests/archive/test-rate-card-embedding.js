#!/usr/bin/env node

/**
 * Test script to verify rate card embedding in AnyTHINGLLM workspaces
 * This will test if the rate card embedding functionality is working correctly
 */

const https = require('https');
const fs = require('fs');

// Configuration
const ANYTHINGLLM_BASE_URL = 'https://ahmad-anything-llm.840tjq.easypanel.host';
const ANYTHINGLLM_API_KEY = '0G0WTZ3-6ZX4D20-H35VBRG-9059WPA';

// Test workspace name
const TEST_WORKSPACE_NAME = 'test-rate-card-embedding';

function makeRequest(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(ANYTHINGLLM_BASE_URL + endpoint);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: method,
      headers: {
        'Authorization': `Bearer ${ANYTHINGLLM_API_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function testRateCardEmbedding() {
  console.log('🧪 Testing Rate Card Embedding in AnyTHINGLLM...\n');

  try {
    // Step 1: List existing workspaces
    console.log('📋 Step 1: Listing existing workspaces...');
    const workspacesResponse = await makeRequest('/api/v1/workspaces');
    
    if (workspacesResponse.status !== 200) {
      throw new Error(`Failed to list workspaces: ${workspacesResponse.status}`);
    }

    const workspaces = workspacesResponse.data.workspaces || [];
    console.log(`   Found ${workspaces.length} workspaces`);

    // Find or create test workspace
    let testWorkspace = workspaces.find(w => w.slug === TEST_WORKSPACE_NAME);
    
    if (!testWorkspace) {
      console.log('📁 Step 2: Creating test workspace...');
      const createResponse = await makeRequest('/api/v1/workspace/new', 'POST', {
        name: TEST_WORKSPACE_NAME,
      });

      if (createResponse.status !== 200) {
        throw new Error(`Failed to create workspace: ${createResponse.status}`);
      }

      testWorkspace = createResponse.data.workspace;
      console.log(`   ✅ Created workspace: ${testWorkspace.slug}`);
    } else {
      console.log(`   ✅ Using existing workspace: ${testWorkspace.slug}`);
    }

    // Step 3: Check workspace details before embedding
    console.log('\n📋 Step 3: Checking workspace details BEFORE embedding...');
    const detailsResponse = await makeRequest(`/api/v1/workspace/${TEST_WORKSPACE_NAME}`);
    
    if (detailsResponse.status === 200) {
      const workspace = detailsResponse.data.workspace;
      const documents = workspace.documents || [];
      console.log(`   Documents before embedding: ${documents.length}`);
      
      documents.forEach(doc => {
        const title = doc?.title || doc?.metadata?.title || 'Unknown';
        console.log(`   - ${title}`);
      });
    }

    // Step 4: Simulate rate card embedding
    console.log('\n📚 Step 4: Testing rate card embedding process...');
    
    // Build rate card content
    const rateCardContent = `# Social Garden - Official Rate Card (AUD/hour)

This document is the single source of truth for hourly rates across roles.

| Role | Rate (AUD/hr) |
|---|---:|
| Senior Project Manager | 210.00 |
| Account Manager | 180.00 |
| Project Coordinator | 110.00 |

Version: v2025-10-25

## Pricing Guidance
- Rates are exclusive of GST.
- Use these rates for project pricing and retainers unless client-approved custom rates apply.`;

    // Process document
    console.log('   🔄 Processing rate card document...');
    const processResponse = await makeRequest('/api/v1/document/raw-text', 'POST', {
      textContent: rateCardContent,
      metadata: {
        title: 'Social Garden - Official Rate Card (AUD/hour) (v2025-10-25)',
        docAuthor: 'Social Garden',
        description: 'Test rate card embedding',
        docSource: 'Rate Card Test',
      },
    });

    if (processResponse.status !== 200) {
      throw new Error(`Failed to process document: ${processResponse.status}`);
    }

    console.log('   ✅ Document processed successfully');
    const location = processResponse.data.documents?.[0]?.location;
    
    if (!location) {
      throw new Error('No location returned from document processing');
    }

    console.log(`   📍 Document location: ${location}`);

    // Embed in workspace
    console.log('   🔄 Embedding document in workspace...');
    const embedResponse = await makeRequest(`/api/v1/workspace/${TEST_WORKSPACE_NAME}/update-embeddings`, 'POST', {
      adds: [location],
    });

    if (embedResponse.status !== 200) {
      throw new Error(`Failed to embed document: ${embedResponse.status}`);
    }

    console.log('   ✅ Document embedded successfully');

    // Step 5: Check workspace details AFTER embedding
    console.log('\n📋 Step 5: Checking workspace details AFTER embedding...');
    const detailsAfterResponse = await makeRequest(`/api/v1/workspace/${TEST_WORKSPACE_NAME}`);
    
    if (detailsAfterResponse.status === 200) {
      const workspace = detailsAfterResponse.data.workspace;
      const documents = workspace.documents || [];
      console.log(`   Documents after embedding: ${documents.length}`);
      
      documents.forEach(doc => {
        const title = doc?.title || doc?.metadata?.title || 'Unknown';
        console.log(`   - ${title}`);
      });

      // Check if rate card is now present
      const rateCardFound = documents.some(doc => {
        const title = (doc?.title || doc?.metadata?.title || '').toLowerCase();
        return title.includes('official rate card');
      });

      console.log(`\n🎯 RESULT: Rate card embedding ${rateCardFound ? '✅ WORKING' : '❌ FAILED'}`);
      
      if (rateCardFound) {
        console.log('   ✅ The rate card embedding process is working correctly!');
        console.log('   ✅ Documents are being uploaded AND embedded properly.');
      } else {
        console.log('   ❌ The rate card embedding process failed.');
        console.log('   ❌ Documents may be uploaded but not properly embedded.');
      }
    }

    console.log('\n🏁 Test completed.');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Run the test
testRateCardEmbedding();
