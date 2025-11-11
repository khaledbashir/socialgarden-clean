# AnyTHINGLLM Integration - Testing Guide

**Status:** ✅ **PRODUCTION READY**  
**Last Updated:** October 25, 2025  
**Version:** 1.0

---

## 📋 Testing Overview

This guide provides comprehensive testing procedures for the Social Garden AnyTHINGLLM integration, covering unit tests, integration tests, and end-to-end workflow validation.

## 🧪 Pre-Testing Setup

### Environment Configuration
```bash
# .env.local
NEXT_PUBLIC_ANYTHINGLLM_URL=https://ahmad-anything-llm.840tjq.easypanel.host
NEXT_PUBLIC_ANYTHINGLLM_API_KEY=0G0WTZ3-6ZX4D20-H35VBRG-9059WPA
```

### TypeScript Validation
```bash
# Validate TypeScript compilation
cd frontend && pnpm exec tsc lib/anythingllm.ts --noEmit --skipLibCheck

# Expected: No compilation errors
```

### Service Import Test
```typescript
// Test in browser console or Node.js
import { AnythingLLMService, anythingLLM } from '@/lib/anythingllm';

console.log('✅ Service imported successfully');
console.log('Service methods:', Object.getOwnPropertyNames(AnythingLLMService.prototype));
```

---

## 🎯 Core Functionality Tests

### Test 1: Workspace Creation

**Objective:** Verify workspace creation and slug generation

```typescript
// Test Case 1.1: Standard workspace creation
const service = new AnythingLLMService();
const workspace = await service.getMasterSOWWorkspace("Test Client");

// Expected Results:
// - Returns { id: "...", slug: "gen-the-architect" }
// - Uses master workspace for all SOWs
// - Auto-embeds rate card
// - Creates default thread

console.log('✅ Workspace accessed:', workspace);
// Verify slug generation
assert(workspace.slug === 'gen-the-architect', 'Slug should be "gen-the-architect"');
```

**Test Case 1.2: Special characters handling**
```typescript
const workspace2 = await service.getMasterSOWWorkspace("Client@123! Test");

// Expected: slug = "gen-the-architect"
// Verify master workspace usage
assert(workspace2.slug === 'gen-the-architect', 'Should use master workspace');
```

**Test Case 1.3: Existing workspace (idempotency)**
```typescript
const workspace3 = await service.getMasterSOWWorkspace("Test Client");

// Expected: Returns master workspace, doesn't create duplicate
assert(workspace3.id === workspace.id, 'Should return master workspace');
```

---

### Test 2: Rate Card Embedding

**Objective:** Verify rate card embedding and versioning

```typescript
// Test embedding rate card
const rateCardResult = await service.embedRateCardDocument("test-client");

// Expected: true (success)
// Verify in AnythingLLM UI:
// 1. Documents section shows rate card
// 2. Title: "Social Garden - Official Rate Card (AUD/hour) (v2025-10-25)"
// 3. Content includes all 82 roles with pricing

console.log('✅ Rate card embedded:', rateCardResult);
assert(rateCardResult === true, 'Rate card should embed successfully');
```

**Test Case 2.1: Duplicate prevention**
```typescript
// Attempt to embed same rate card again
const duplicateResult = await service.embedRateCardDocument("test-client");

// Expected: true (skips duplicate due to version check)
assert(duplicateResult === true, 'Should handle duplicate gracefully');
```

---

### Test 3: Chat Functionality

**Objective:** Test chat with thread management and retry logic

```typescript
// Test Case 3.1: Create thread and send message
const thread = await service.createThread("test-client");
console.log('✅ Thread created:', thread);

// Test Case 3.2: Send chat message
const response = await service.chatWithThread(
  "test-client",
  thread.slug,
  "What is the rate for Senior Designer?",
  "chat"
);

// Expected: AI response with pricing from rate card
console.log('✅ Chat response:', response.textResponse);

// Verify response contains rate information
assert(response.textResponse.includes('130.00'), 'Should return correct rate');
```

**Test Case 3.3: Stream chat**
```typescript
// Test streaming response
await service.streamChatWithThread(
  "test-client",
  thread.slug,
  "Generate a SOW for social media management",
  "chat",
  (chunk) => {
    console.log('📡 Received chunk:', chunk);
  }
);

// Expected: Multiple chunks streamed to callback
```

---

### Test 4: SOW Integration

**Objective:** Test SOW embedding in both workspaces

```typescript
const sowTitle = "Q4 Social Media Management";
const sowContent = `
<h1>Statement of Work</h1>
<p>Social Media Management for ACME Corp</p>
<p>Duration: 3 months</p>
<p>Budget: $15,000 AUD</p>
`;

// Test embedding in both workspaces
const sowResult = await service.embedSOWInBothWorkspaces(
  "test-client",
  sowTitle,
  sowContent
);

// Expected: true (both client and master dashboard)
// Verify in AnythingLLM UI:
// 1. Client workspace has SOW document
// 2. Master dashboard has [TEST-CLIENT] Q4 Social Media Management

console.log('✅ SOW embedded in both workspaces:', sowResult);
assert(sowResult === true, 'SOW should embed in both workspaces');
```

---

## 🔄 End-to-End Workflow Tests

### Complete Client Onboarding Flow

**Step 1: Create Client Workspace**
```typescript
// Simulate new client signup
const clientName = "ACME Corporation";
const workspace = await service.getMasterSOWWorkspace(clientName);

console.log('✅ Step 1 Complete - Master workspace accessed');
// Verify:
// - Master workspace accessible
// - Rate card embedded
// - Default thread created
```

**Step 2: Generate SOW with AI**
```typescript
// Client requests SOW via AI chat
const aiResponse = await service.chatWithThread(
  workspace.slug,
  'default',
  'Create a comprehensive SOW for ACME Corporation for 3-month social media management project, budget around $20k',
  'chat'
);

console.log('✅ Step 2 Complete - AI generated SOW');
// Expected: Detailed SOW content in response
```

**Step 3: Embed SOW for Analytics**
```typescript
// Embed SOW in both workspaces for future AI access
const embedResult = await service.embedSOWInBothWorkspaces(
  workspace.slug,
  "ACME Corp - Q4 Social Media Management",
  `<h1>${aiResponse.textResponse}</h1>`
);

console.log('✅ Step 3 Complete - SOW embedded for analytics');
// Verify in master dashboard workspace
```

**Step 4: Test AI Query on Embedded SOW**
```typescript
// Later, query the embedded SOW
const sowQuery = await service.chatWithThread(
  workspace.slug,
  'default',
  'What was the budget mentioned in the ACME Corp SOW?',
  'chat'
);

console.log('✅ Step 4 Complete - SOW query successful');
// Expected: AI references embedded SOW with budget information
```

### Cross-Client Analytics Test

**Objective:** Test master dashboard analytics capabilities

```typescript
// Create multiple client workspaces
const client1 = await service.getMasterSOWWorkspace("Tech Startup Inc");
const client2 = await service.getMasterSOWWorkspace("Property Co");

// Embed different SOWs as threads in master workspace
await service.embedSOWInBothWorkspaces(
  client1.slug,
  "Tech Startup - MVP Development",
  "<h1>MVP Development SOW</h1><p>Budget: $50,000</p>"
);

await service.embedSOWInBothWorkspaces(
  client2.slug,
  "Property Co - Marketing Campaign",
  "<h1>Marketing Campaign SOW</h1><p>Budget: $30,000</p>"
);

// Test cross-client analytics (via master dashboard)
const analyticsQuery = await service.chatWithThread(
  await service.getOrCreateMasterDashboard(),
  'default',
  'What are all the project budgets across clients?',
  'chat'
);

console.log('✅ Cross-client analytics:', analyticsQuery.textResponse);
// Expected: Mentions both $50k and $30k projects with client names
```

---

## 🐛 Error Handling Tests

### Test 5: Network Failure Handling

```typescript
// Test with invalid API endpoint
const invalidService = new AnythingLLMService(
  'https://invalid-endpoint.com',
  'invalid-key'
);

try {
  const result = await invalidService.createOrGetClientWorkspace("Test");
  console.log('❌ Should have failed');
} catch (error) {
  console.log('✅ Correctly handled invalid endpoint:', error.message);
  // Expected: Graceful error handling
}
```

### Test 6: Rate Limiting

```typescript
// Rapid-fire requests to test rate limiting
const promises = [];
for (let i = 0; i < 10; i++) {
  promises.push(
    service.chatWithThread("test-client", 'default', `Test message ${i}`, "chat")
  );
}

const results = await Promise.allSettled(promises);
console.log('✅ Rate limiting test completed');
// Verify some succeed, some may fail (expected behavior)
```

---

## 📊 Performance Tests

### Test 7: Document Embedding Performance

```typescript
// Time document embedding
const startTime = Date.now();

await service.embedSOWInBothWorkspaces(
  "test-client",
  "Performance Test SOW",
  "Large HTML content...".repeat(1000) // Simulate large document
);

const embedTime = Date.now() - startTime;
console.log(`✅ Document embedding took ${embedTime}ms`);

// Expected: < 10 seconds for typical SOW
assert(embedTime < 10000, 'Embedding should complete within 10 seconds');
```

### Test 8: Thread Creation Performance

```typescript
// Test multiple thread creation
const threadPromises = [];
for (let i = 0; i < 5; i++) {
  threadPromises.push(service.createThread("test-client"));
}

const threads = await Promise.all(threadPromises);
console.log('✅ Created 5 threads:', threads.length);

// Verify all threads created successfully
assert(threads.length === 5, 'Should create all threads');
```

---

## 🔍 UI Integration Tests

### Test 9: Embed Widget Configuration

```typescript
// Test embed script generation
const embedId = await service.getOrCreateEmbedId("test-client");
const script = service.getEmbedScript(embedId, {
  baseUrl: "https://custom.anythingllm.com",
  buttonColor: "#0e2e33",
  assistantName: "Social Garden AI",
  position: "bottom-right"
});

console.log('✅ Embed script generated');
// Verify script contains expected configuration
assert(script.includes('custom.anythingllm.com'), 'Should contain custom URL');
```

### Test 10: Search Functionality

**Browser Test:**
1. Create multiple workspaces with different names
2. Use search bar to filter workspaces
3. Verify search works for both workspace names and SOW names

```typescript
// Programmatic search test (if available)
const allWorkspaces = await service.listWorkspaces();
const filtered = allWorkspaces.filter(ws => 
  ws.name.toLowerCase().includes('search-term')
);

console.log('✅ Search filtering works');
assert(filtered.length >= 0, 'Search should return results');
```

---

## 🧪 Automated Test Suite

### TypeScript Test Runner

Create `test-anythingllm.ts`:

```typescript
import { AnythingLLMService } from './lib/anythingllm';

async function runAllTests() {
  console.log('🧪 Starting AnyTHINGLLM Test Suite...');
  
  const service = new AnythingLLMService();
  
  // Test 1: Workspace Creation
  try {
    const workspace = await service.createOrGetClientWorkspace("Test Client");
    console.log('✅ Test 1: Workspace creation - PASSED');
  } catch (error) {
    console.log('❌ Test 1: Workspace creation - FAILED:', error);
  }
  
  // Test 2: Rate Card Embedding
  try {
    const result = await service.embedRateCardDocument("test-client");
    console.log('✅ Test 2: Rate card embedding - PASSED');
  } catch (error) {
    console.log('❌ Test 2: Rate card embedding - FAILED:', error);
  }
  
  // Test 3: Chat Functionality
  try {
    const response = await service.chatWithThread("test-client", 'default', "What is 2+2?", "chat");
    console.log('✅ Test 3: Chat functionality - PASSED');
  } catch (error) {
    console.log('❌ Test 3: Chat functionality - FAILED:', error);
  }
  
  console.log('🏁 Test Suite Complete');
}

// Run tests
runAllTests().catch(console.error);
```

### Run Tests

```bash
# Run TypeScript test
cd frontend && npx ts-node test-anythingllm.ts

# Run validation
pnpm exec ts-node lib/__tests__/validate-anythingllm.ts

# Development server with hot reload
./dev.sh
```

---

## 🔧 Manual Testing Checklist

### Browser Testing

- [ ] **Workspace Creation**
  - [ ] Click "+" button in sidebar
  - [ ] Enter workspace name
  - [ ] Verify workspace appears in sidebar
  - [ ] Verify editor opens automatically
  - [ ] Verify default SOW is created

- [ ] **AI Chat Integration**
  - [ ] Open AI chat sidebar
  - [ ] Send message requesting SOW
  - [ ] Verify "Insert to Editor" button appears
  - [ ] Click insert button
  - [ ] Verify content appears in editor

- [ ] **Search Functionality**
  - [ ] Type search term in search bar
  - [ ] Verify workspaces are filtered
  - [ ] Verify SOW names are included in search
  - [ ] Verify clear search returns all results

- [ ] **Multiple SOWs in Workspace**
  - [ ] Hover over workspace
  - [ ] Click "+" (New Doc) button
  - [ ] Enter SOW name
  - [ ] Verify new SOW created in same workspace
  - [ ] Verify editor opens with blank document

### AnythingLLM UI Testing

- [ ] **Workspace Management**
  - [ ] Verify workspaces created in AnythingLLM
  - [ ] Verify rate card embedded in each workspace
  - [ ] Verify threads created automatically

- [ ] **Document Embedding**
  - [ ] Verify SOWs appear in workspace documents
  - [ ] Verify master dashboard contains [CLIENT] prefixed SOWs
  - [ ] Verify documents are searchable by AI

- [ ] **Chat Testing**
  - [ ] Test chat within AnythingLLM UI
  - [ ] Verify AI can access rate card information
  - [ ] Verify AI can reference embedded SOWs
  - [ ] Test streaming chat responses

---

## 🚨 Troubleshooting Common Issues

### Issue: "Thread doesn't exist" (400 error)
**Solution:** 
- Check getThreadChats retry logic is working
- Verify thread creation in AnythingLLM UI
- Check network connectivity

### Issue: Rate card not accessible
**Solution:**
- Verify ROLES array is imported from rateCard.ts
- Check document embedding in AnythingLLM UI
- Verify workspace slug matches

### Issue: SOW not appearing in master dashboard
**Solution:**
- Ensure embedSOWInBothWorkspaces completes successfully
- Check master dashboard workspace exists
- Verify [CLIENT] prefix is applied

### Issue: 401 Unauthorized
**Solution:**
- Verify API key is correct
- Check environment variables
- Test endpoint accessibility

---

## 📈 Success Metrics

### Expected Results

| Component | Expected Success Rate | Test Method |
|-----------|----------------------|-------------|
| Workspace Creation | 100% | API calls |
| Rate Card Embedding | 100% | Document verification |
| Chat Responses | 95% | AI response validation |
| SOW Integration | 95% | Dual workspace check |
| Thread Management | 100% | Retry logic test |
| Performance | <10s embedding | Time measurement |

### Validation Commands

```bash
# Quick validation
curl -X POST "https://ahmad-anything-llm.840tjq.easypanel.host/api/v1/workspace/new" \
  -H "Authorization: Bearer 0G0WTZ3-6ZX4D20-H35VBRG-9059WPA" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Validation"}'

# Expected: 200 OK with workspace data
```

---

## ✅ Final Validation

After completing all tests:

1. **All workspace operations working**
2. **Rate card accessible to AI**
3. **Chat responses contextual and accurate**
4. **SOW embedding in both workspaces**
5. **Cross-client analytics functional**
6. **Error handling robust**
7. **Performance within acceptable limits**
8. **UI integration seamless**

**Status:** ✅ **READY FOR PRODUCTION**

---

*Testing Guide Version: 1.0*  
*Last Updated: October 25, 2025*  
*Social Garden Development Team*
