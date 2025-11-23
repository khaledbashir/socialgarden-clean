# Solution for JSON-to-Editor Insert Issue

## The Problem
Your V4.1 JSON is being inserted as raw text instead of being converted to editable pricing tables.

## Root Cause
The "Insert to Editor" functionality isn't triggering the JSON-to-TipTap conversion logic that was embedded in your original 7k+ page.tsx.

## Solution

### 1. Fixed "Insert to Editor" Handler
Replace your current "Insert to Editor" logic with this:

```typescript
// Fixed insert handler with JSON conversion
const handleInsertToEditor = (content: string) => {
  console.log('🔗 [INSERT] Processing content for insertion');
  
  try {
    // Step 1: Extract JSON from content
    const extractedJSON = extractJSONFromContent(content);
    
    if (extractedJSON) {
      console.log('📊 [INSERT] Converting V4.1 JSON to editable format');
      
      // Step 2: Convert JSON to editable markdown with pricing tables
      const editableMarkdown = convertV41JSONToEditableMarkdown(JSON.stringify(extractedJSON));
      
      // Step 3: Insert the formatted content
      insertIntoEditor(editableMarkdown);
      
      // Step 4: Also extract and store pricing data for multi-scope PDF
      if (extractedJSON.scopes && extractedJSON.scopes.length > 0) {
        setMultiScopePricingData({
          scopes: extractedJSON.scopes,
          discount: extractedJSON.discount || 0,
          projectTitle: 'Generated SOW',
          extractedAt: new Date().toISOString()
        });
        console.log('✅ [INSERT] Multi-scope data stored for PDF export');
      }
      
      return;
    }
    
    // Step 5: If no JSON, insert cleaned content
    console.log('📝 [INSERT] No JSON found, inserting cleaned content');
    const cleanedContent = cleanSOWContent(content);
    insertIntoEditor(cleanedContent);
    
  } catch (error) {
    console.error('❌ [INSERT] Error processing content:', error);
    // Fallback to raw content
    insertIntoEditor(content);
  }
};
```

### 2. Enhanced Conversion Function
This is the key function that converts your JSON to editable format:

```typescript
function convertV41JSONToEditableMarkdown(jsonStr: string): string {
  console.log('🔄 [JSON->MARKDOWN] Converting V4.1 JSON to editable markdown');
  
  try {
    const pricingData = JSON.parse(jsonStr);
    let markdown = `# Statement of Work - ${pricingData.currency} Project\n\n`;
    
    // Add project overview
    markdown += `**Currency:** ${pricingData.currency}  \n`;
    markdown += `**GST Rate:** ${pricingData.gst_rate}%  \n`;
    markdown += `**Total Investment:** ${pricingData.currency} ${pricingData.grand_total.toLocaleString()}  \n\n`;
    markdown += `---\n\n`;
    
    // Process each scope
    pricingData.scopes.forEach((scope: any, scopeIndex: number) => {
      const scopeNumber = scopeIndex + 1;
      markdown += `## Phase ${scopeNumber}: ${scope.scope_name}\n\n`;
      markdown += `**Description:** ${scope.scope_description}\n\n`;
      
      // Add deliverables
      if (scope.deliverables && scope.deliverables.length > 0) {
        markdown += `**Deliverables:**\n`;
        scope.deliverables.forEach((deliverable: string) => {
          markdown += `- ${deliverable}\n`;
        });
        markdown += `\n`;
      }
      
      // Add assumptions
      if (scope.assumptions && scope.assumptions.length > 0) {
        markdown += `**Assumptions:**\n`;
        scope.assumptions.forEach((assumption: string) => {
          markdown += `- ${assumption}\n`;
        });
        markdown += `\n`;
      }
      
      // Add pricing table
      markdown += `### Investment Breakdown - Phase ${scopeNumber}\n\n`;
      markdown += `| Role | Description | Hours | Rate (${pricingData.currency}) | Cost (${pricingData.currency}) |\n`;
      markdown += `|------|-------------|-------|------------------|------------------|\n`;
      
      scope.role_allocation.forEach((role: any) => {
        markdown += `| **${role.role}** | ${role.description} | ${role.hours} | ${role.rate} | ${role.cost} |\n`;
      });
      
      // Calculate scope total
      const scopeTotal = scope.role_allocation.reduce((sum: number, role: any) => sum + role.cost, 0);
      markdown += `| **SCOPE TOTAL** | | | | **${scopeTotal.toLocaleString()}** |\n\n`;
      
      // Add editable table marker for TipTap processing
      markdown += `[editablePricingTable scope="${scopeNumber}"]\n\n`;
    });
    
    // Add overall financial summary
    markdown += `---\n\n`;
    markdown += `## Investment Summary\n\n`;
    markdown += `**Subtotal (before discount):** ${pricingData.currency} ${pricingData.grand_total_pre_gst.toLocaleString()}\n`;
    
    if (pricingData.discount > 0) {
      const discountAmount = pricingData.grand_total_pre_gst * (pricingData.discount / 100);
      const discountedSubtotal = pricingData.grand_total_pre_gst - discountAmount;
      markdown += `**Project Discount:** ${pricingData.discount}% (-${pricingData.currency} ${discountAmount.toLocaleString()})\n`;
      markdown += `**Subtotal (after discount):** ${pricingData.currency} ${discountedSubtotal.toLocaleString()}\n`;
    } else {
      const discountedSubtotal = pricingData.grand_total_pre_gst;
      markdown += `**Subtotal (after discount):** ${pricingData.currency} ${discountedSubtotal.toLocaleString()}\n`;
    }
    
    markdown += `**GST:** ${pricingData.gst_rate}% (${pricingData.currency} ${pricingData.gst_amount.toLocaleString()})\n`;
    markdown += `**TOTAL PROJECT VALUE:** ${pricingData.currency} ${pricingData.grand_total.toLocaleString()}\n\n`;
    
    // Add global editable table marker
    markdown += `[editablePricingTable global]\n\n`;
    markdown += `---\n\n`;
    markdown += `*This Statement of Work was generated using The Architect V4.1 AI system with automatic pricing table integration.*`;
    
    console.log('✅ [JSON->MARKDOWN] Successfully converted JSON to editable markdown');
    return markdown;
    
  } catch (error) {
    console.error('❌ [JSON->MARKDOWN] Error converting JSON:', error);
    return jsonStr; // Return original if conversion fails
  }
}
```

### 3. Console Logging for Debugging
Add this to verify the conversion is working:

```typescript
// Add to your "Insert to Editor" button handler
const debugInsertion = (originalContent: string, insertedContent: string) => {
  console.log('🔍 [DEBUG] Insertion Details:');
  console.log('📝 [DEBUG] Original content length:', originalContent.length);
  console.log('📝 [DEBUG] Inserted content length:', insertedContent.length);
  console.log('📊 [DEBUG] Contains editable tables:', insertedContent.includes('[editablePricingTable'));
  console.log('📊 [DEBUG] Contains pricing tables:', insertedContent.includes('| Role |'));
  
  // Test if JSON was detected and converted
  const hasJSON = originalContent.includes('"currency"') && originalContent.includes('"scopes"');
  console.log('📊 [DEBUG] Original contained JSON:', hasJSON);
};
```

## Expected Results

After clicking "Insert to Editor", you should see:

### Console Output:
```
🔗 [INSERT] Processing content for insertion
📊 [INSERT] Converting V4.1 JSON to editable format
🔄 [JSON->MARKDOWN] Converting V4.1 JSON to editable markdown
✅ [JSON->MARKDOWN] Successfully converted JSON to editable markdown
✅ [INSERT] Multi-scope data stored for PDF export
🔍 [DEBUG] Insertion Details:
📝 [DEBUG] Original content length: 8723
📝 [DEBUG] Inserted content length: 5432
📊 [DEBUG] Contains editable tables: true
📊 [DEBUG] Contains pricing tables: true
📊 [DEBUG] Original contained JSON: true
```

### In the Editor:
- Structured markdown with proper headings
- Separate sections for each scope
- Markdown tables with pricing data
- Editable table markers `[editablePricingTable]`
- Financial summary with discount calculations

## Integration Steps

1. **Replace your current "Insert to Editor" handler** with the fixed version
2. **Import the conversion functions** into your workspace-chat component
3. **Add the debug logging** to verify it's working
4. **Test with your JSON** to confirm it converts properly

This should fix the issue where JSON was being inserted as raw text and instead convert it to the proper editable pricing table format that your original system was using.
