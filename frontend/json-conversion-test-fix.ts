// Fix for the "Insert to Editor" JSON issue
// This ensures JSON gets converted to editable pricing tables

// Sample V4.1 JSON for testing
export const SAMPLE_V41_JSON = `{
  "currency": "AUD",
  "gst_rate": 10,
  "scopes": [
    {
      "scope_name": "HubSpot Integration",
      "scope_description": "Audit, map and implement a robust HubSpot CRM integration that automatically captures and routes leads from website forms with zero manual entry.",
      "deliverables": [
        "Technical discovery & data-mapping document",
        "HubSpot form handlers / API integration scripts",
        "Lead routing, scoring and notification workflows",
        "QA & UAT test scripts with sign-off record"
      ],
      "assumptions": [
        "Client has an active HubSpot Professional or Enterprise subscription",
        "CMS access and API key (or OAuth) provided within 24 hrs of kick-off",
        "No third-party middleware other than Zapier (if required) is included"
      ],
      "role_allocation": [
        {
          "role": "Solutions Architect",
          "description": "Discovery, mapping, solution design",
          "hours": 8,
          "rate": 295,
          "cost": 2360
        },
        {
          "role": "Senior Developer",
          "description": "API integration, workflow build, QA",
          "hours": 14,
          "rate": 285,
          "cost": 3990
        },
        {
          "role": "QA Lead",
          "description": "Testing, bug fixes, documentation",
          "hours": 4,
          "rate": 147.5,
          "cost": 590
        },
        {
          "role": "Project Manager",
          "description": "Coordination, risk & budget control",
          "hours": 4,
          "rate": 295,
          "cost": 1180
        }
      ],
      "discount": 0
    },
    {
      "scope_name": "Landing Page Design & Build",
      "scope_description": "Design and build two high-converting, mobile-first landing pages with persuasive copy, modular CMS components and integrated analytics.",
      "deliverables": [
        "Wireframes & UI designs (desktop + mobile)",
        "Two fully responsive landing pages with modular CMS components",
        "Conversion copy deck and SEO meta-data",
        "Form analytics & HubSpot tracking code installed"
      ],
      "assumptions": [
        "Copy supplied can be refined within included copywriting hours; full rewrite exceeds scope",
        "Client brand guidelines and asset library provided at kick-off",
        "Hosting environment supports PHP 8+ or Node 16+ (or HubSpot CMS)"
      ],
      "role_allocation": [
        {
          "role": "UX/UI Designer",
          "description": "Wireframes, visual design, hand-off",
          "hours": 16,
          "rate": 215,
          "cost": 3440
        },
        {
          "role": "Copywriter",
          "description": "Conversion copy, headlines, CTAs",
          "hours": 8,
          "rate": 230,
          "cost": 1840
        },
        {
          "role": "Senior Developer",
          "description": "Front-end build, CMS integration",
          "hours": 18,
          "rate": 285,
          "cost": 5130
        },
        {
          "role": "QA Lead",
          "description": "Cross-browser/device testing",
          "hours": 4,
          "rate": 147.5,
          "cost": 590
        },
        {
          "role": "Account Director",
          "description": "Client liaison & approvals",
          "hours": 4,
          "rate": 375,
          "cost": 1500
        }
      ],
      "discount": 0
    }
  ],
  "discount": 4,
  "grand_total_pre_gst": 19795,
  "gst_amount": 1979.5,
  "grand_total": 22000
}`;

// Enhanced function to convert JSON to editable markdown with pricing tables
export function convertV41JSONToEditableMarkdown(jsonStr: string): string {
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
      
      // Add pricing table with editable markers
      markdown += `### Investment Breakdown - Phase ${scopeNumber}\n\n`;
      markdown += `| Role | Description | Hours | Rate (${pricingData.currency}) | Cost (${pricingData.currency}) |\n`;
      markdown += `|------|-------------|-------|------------------|------------------|\n`;
      
      scope.role_allocation.forEach((role: any) => {
        markdown += `| **${role.role}** | ${role.description} | ${role.hours} | ${role.rate} | ${role.cost} |\n`;
      });
      
      // Calculate scope total
      const scopeTotal = scope.role_allocation.reduce((sum: number, role: any) => sum + role.cost, 0);
      markdown += `| **SCOPE TOTAL** | | | | **${scopeTotal.toLocaleString()}** |\n\n`;
      
      // Add scope discount if specified
      if (scope.discount && scope.discount > 0) {
        const discountAmount = scopeTotal * (scope.discount / 100);
        const finalScopeTotal = scopeTotal - discountAmount;
        markdown += `**Scope Discount:** ${scope.discount}% (-${pricingData.currency} ${discountAmount.toLocaleString()})\n`;
        markdown += `**Final Scope Total:** ${pricingData.currency} ${finalScopeTotal.toLocaleString()}\n\n`;
      }
      
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
    
    // Add closing
    markdown += `---\n\n`;
    markdown += `*This Statement of Work was generated using The Architect V4.1 AI system with automatic pricing table integration.*`;
    
    console.log('✅ [JSON->MARKDOWN] Successfully converted JSON to editable markdown');
    return markdown;
    
  } catch (error) {
    console.error('❌ [JSON->MARKDOWN] Error converting JSON:', error);
    return jsonStr; // Return original if conversion fails
  }
}

// Test function to verify JSON conversion works
export function testJSONConversion(): {
  converted: string;
  hasEditableMarkers: boolean;
  hasPricingTables: boolean;
} {
  console.log('🧪 [TEST] Testing JSON conversion...');
  
  const converted = convertV41JSONToEditableMarkdown(SAMPLE_V41_JSON);
  console.log('📝 [TEST] Converted markdown length:', converted.length);
  console.log('📝 [TEST] Preview:', converted.substring(0, 500));
  
  // Check if editable markers are present
  const hasEditableMarkers = converted.includes('[editablePricingTable');
  console.log('✅ [TEST] Has editable markers:', hasEditableMarkers);
  
  // Check if pricing tables are present
  const hasPricingTables = converted.includes('| Role |') && converted.includes('|------|');
  console.log('✅ [TEST] Has pricing tables:', hasPricingTables);
  
  return {
    converted,
    hasEditableMarkers,
    hasPricingTables
  };
}