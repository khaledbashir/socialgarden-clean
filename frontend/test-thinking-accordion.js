// Test script to verify thinking accordion functionality
const testContentWithThinking = `
<think>
Let me analyze this SOW to provide insights about the client's requirements and our proposed approach.

Looking at the data:
- This is a HubSpot integration project for RealEstateTT
- Project value: $8,500 + GST
- Duration: 4 weeks
- Services include: CRM setup, API integration, training

The client seems to be in the real estate vertical, which aligns well with our HubSpot expertise. The scope appears comprehensive with good scope for our team.

I should provide analytics on similar projects and potential upsell opportunities.
</think>

Here's my analysis of the RealEstateTT HubSpot integration SOW:

## 📊 SOW Analytics

**Project Overview:**
- **Client:** RealEstateTT
- **Project Type:** HubSpot CRM Integration
- **Value:** $8,500 + GST
- **Timeline:** 4 weeks
- **Status:** Active Proposal

**Key Insights:**

1. **Industry Vertical:** Real Estate - a high-value sector for HubSpot implementations
2. **Scope Components:**
   - CRM setup and configuration
   - API integrations with existing systems
   - Team training and documentation
   - Post-launch support

3. **Project Complexity:** Medium - typical for real estate CRM implementations

**Similar Projects Comparison:**
- Average real estate HubSpot projects: $7,200 - $9,800
- This project is positioned at market rate
- Timeline aligns with similar complexity projects

**Upsell Opportunities:**
- Marketing automation workflows
- Advanced reporting dashboards
- Lead scoring implementation

The project scope appears comprehensive and well-structured for successful delivery.
\`\`\`json
{
  "client": "RealEstateTT",
  "project_type": "HubSpot CRM Integration",
  "value": 8500,
  "currency": "AUD",
  "gst_applicable": true,
  "duration_weeks": 4,
  "status": "active_proposal",
  "vertical": "Real Estate",
  "services": [
    "CRM Setup",
    "API Integration", 
    "Team Training",
    "Documentation",
    "Post-launch Support"
  ],
  "complexity_score": 7,
  "similar_projects_avg": 8500
}
\`\`\`
`;

export function testThinkingAccordion() {
  console.log('🧪 Testing Thinking Accordion Component');
  console.log('========================================');
  
  console.log('📝 Test Content Length:', testContentWithThinking.length);
  console.log('🔍 Contains thinking tags:', testContentWithThinking.includes('<think>'));
  console.log('🔍 Contains JSON block:', testContentWithThinking.includes('```json'));
  
  // Test thinking extraction logic
  const thinkingMatch = testContentWithThinking.match(/<think>([\s\S]*?)<\/think>/gi);
  console.log('🎯 Thinking blocks found:', thinkingMatch ? thinkingMatch.length : 0);
  
  const jsonMatch = testContentWithThinking.match(/```json\s*([\s\S]*?)\s*```/);
  console.log('📊 JSON blocks found:', jsonMatch ? 1 : 0);
  
  if (jsonMatch && jsonMatch[1]) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      console.log('✅ JSON parsed successfully:', Object.keys(parsed).length, 'fields');
    } catch (e) {
      console.log('❌ JSON parsing failed:', e.message);
    }
  }
  
  return {
    content: testContentWithThinking,
    hasThinking: testContentWithThinking.includes('<think>'),
    hasJson: testContentWithThinking.includes('```json'),
    thinkingLength: thinkingMatch ? thinkingMatch[0].length : 0,
    jsonLength: jsonMatch ? jsonMatch[0].length : 0
  };
}

// Run test if this file is executed directly
if (typeof window === 'undefined') {
  const result = testThinkingAccordion();
  console.log('\n✅ Test completed successfully!');
  console.log('📋 Result:', result);
}
