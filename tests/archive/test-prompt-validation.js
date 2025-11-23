#!/usr/bin/env node

/**
 * Quick Prompt Validation Test
 * 
 * Tests if the enhanced Architect prompt now includes all Sam's requirements
 */

import { AnythingLLMService } from './frontend/lib/anythingllm.js';

const TEST_CLIENT = `Prompt Test ${Date.now()}`;
const TEST_BRIEF = "Generate a SOW for a Salesforce implementation with a budget of $50,000 AUD. Include custom objects, workflows, and email automation.";

const anythingLLM = new AnythingLLMService();

async function testPrompt() {
  console.log('\n🧪 TESTING ENHANCED ARCHITECT PROMPT\n');
  
  try {
    // Create workspace (applies THE_ARCHITECT_V2_PROMPT automatically)
    console.log('1️⃣ Creating workspace...');
    const workspace = await anythingLLM.createOrGetClientWorkspace(TEST_CLIENT);
    console.log(`✅ Workspace: ${workspace.slug}\n`);
    
    // Configure LLM
    console.log('2️⃣ Configuring LLM...');
    await anythingLLM.setWorkspaceLLMProvider(workspace.slug, 'openrouter', 'minimax/minimax-01');
    console.log('✅ LLM configured\n');
    
    // Create thread
    console.log('3️⃣ Creating thread...');
    const thread = await anythingLLM.createThread(workspace.slug);
    console.log(`✅ Thread: ${thread.slug}\n`);
    
    // Generate SOW
    console.log('4️⃣ Generating SOW...');
    console.log(`Brief: ${TEST_BRIEF}\n`);
    
    let fullResponse = '';
    let chunkCount = 0;
    const startTime = Date.now();
    
    await new Promise((resolve, reject) => {
      anythingLLM.streamChatWithThread(
        workspace.slug,
        thread.slug,
        TEST_BRIEF,
        (chunk) => {
          try {
            const data = JSON.parse(chunk.replace(/^data:\s*/, ''));
            if (data.textResponse) {
              chunkCount++;
              fullResponse += data.textResponse;
              if (chunkCount % 100 === 0) process.stdout.write('.');
            }
          } catch (e) {}
        }
      ).then(resolve).catch(reject);
    });
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n✅ Generated ${fullResponse.length} chars in ${duration}s\n`);
    
    // Validate against Sam's requirements
    console.log('📋 VALIDATION CHECKLIST:\n');
    
    const checks = {
      'Has <thinking> tags': fullResponse.includes('<thinking>'),
      'Has +GST suffix': fullResponse.includes('+GST') || fullResponse.includes('+ GST'),
      'Has JSON pricing table': fullResponse.includes('"suggestedRoles"'),
      'Has + prefix deliverables': fullResponse.includes('+ '),
      'Has round numbers': /\$50,000|\$45,000|\$60,000/g.test(fullResponse),
      'Platform-specific (Salesforce)': /salesforce|custom object|workflow/i.test(fullResponse),
      'Ends with closing phrase': fullResponse.includes('*** This concludes the Scope of Work document. ***')
    };
    
    let passCount = 0;
    Object.entries(checks).forEach(([check, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${check}`);
      if (passed) passCount++;
    });
    
    console.log(`\n📊 Score: ${passCount}/${Object.keys(checks).length} checks passed\n`);
    
    if (passCount === Object.keys(checks).length) {
      console.log('🎉 ALL CHECKS PASSED! The Architect prompt is working correctly.\n');
    } else {
      console.log('⚠️  Some checks failed. Review the output below:\n');
      console.log('--- SAMPLE OUTPUT (first 1000 chars) ---');
      console.log(fullResponse.substring(0, 1000));
      console.log('\n--- SAMPLE OUTPUT (last 1000 chars) ---');
      console.log(fullResponse.substring(fullResponse.length - 1000));
      console.log('\n');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPrompt();
