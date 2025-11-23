// Test script to verify JSON detection and conversion logic
const { extractJSONFromContent, convertV41JSONToEditorFormat } = require('./json-editor-conversion-fix.ts');

// Sample JSON response that would come from the AI
const sampleJSONResponse = `{
  "currency": "AUD",
  "gst_rate": 10,
  "scopes": [
    {
      "scope_name": "Digital Marketing Campaign Execution",
      "scope_description": "Comprehensive digital marketing campaign including strategy, content creation, and performance monitoring",
      "deliverables": ["Campaign Strategy Document", "Content Calendar", "Performance Reports"],
      "assumptions": ["Client provides brand guidelines", "Campaign runs for 3 months"],
      "role_allocation": [
        {
          "role": "Digital Marketing Manager",
          "description": "Overall campaign strategy and management",
          "hours": 80,
          "rate": 150,
          "cost": 12000
        },
        {
          "role": "Content Creator",
          "description": "Creating engaging content for campaigns",
          "hours": 120,
          "rate": 100,
          "cost": 12000
        }
      ],
      "discount": 5
    }
  ],
  "discount": 0,
  "grand_total_pre_gst": 24000,
  "gst_amount": 2400,
  "grand_total": 26400
}`;

console.log('🧪 Testing JSON detection and conversion...');

// Test 1: Raw JSON detection
console.log('\n📋 Test 1: Raw JSON Detection');
const detectedJSON = extractJSONFromContent(sampleJSONResponse);
console.log('✅ JSON detected:', !!detectedJSON);
if (detectedJSON) {
  console.log('📊 Currency:', detectedJSON.currency);
  console.log('💰 Total:', detectedJSON.grand_total);
  console.log('📦 Scopes count:', detectedJSON.scopes.length);
}

// Test 2: JSON conversion to markdown
console.log('\n🔄 Test 2: JSON to Markdown Conversion');
if (detectedJSON) {
  const markdownContent = convertV41JSONToEditorFormat(detectedJSON);
  console.log('📝 Generated markdown length:', markdownContent.length);
  console.log('📋 First 200 chars:', markdownContent.substring(0, 200));
}

// Test 3: JSON wrapped in markdown
console.log('\n📦 Test 3: JSON in Markdown Code Block');
const markdownWithJSON = `
Here is your pricing information:

\`\`\`json
${sampleJSONResponse}
\`\`\`

Please review the details above.
`;

const detectedInMarkdown = extractJSONFromContent(markdownWithJSON);
console.log('✅ JSON detected in markdown:', !!detectedInMarkdown);

// Test 4: No JSON content
console.log('\n❌ Test 4: No JSON Content');
const noJSON = extractJSONFromContent("This is just regular text with no JSON data.");
console.log('✅ Correctly returned null:', noJSON === null);

console.log('\n🎉 All tests completed!');