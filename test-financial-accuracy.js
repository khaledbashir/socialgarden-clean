#!/usr/bin/env node

// Test script for financial calculation accuracy in PDF generation
// Tests the transformScopesToPDFFormat function and PDF generation

const fs = require('fs');
const path = require('path');

// Sample AI output that should produce $25,002.12 total
const sampleMultiScopeData = {
  scopes: [
    {
      scope_name: "CRM Implementation",
      scope_description: "Complete CRM system implementation with data migration and user training",
      deliverables: [
        "CRM system configuration and setup",
        "Data migration from existing systems",
        "User training and documentation",
        "Go-live support and post-implementation review"
      ],
      assumptions: [
        "Client will provide access to existing data sources",
        "CRM vendor licensing will be procured by client",
        "Project timeline allows for 8 weeks implementation"
      ],
      role_allocation: [
        { role: "Senior CRM Consultant", hours: 120, rate: 150, cost: 18000 },
        { role: "CRM Developer", hours: 80, rate: 120, cost: 9600 },
        { role: "Data Analyst", hours: 40, rate: 100, cost: 4000 },
        { role: "Project Manager", hours: 60, rate: 140, cost: 8400 }
      ]
    }
  ],
  discount: 5,
  projectTitle: "CRM Implementation Project",
  authoritativeTotal: 25002.12  // AI-calculated authoritative total
};

// Transform function (copied from page.tsx)
const transformScopesToPDFFormat = (multiScopeData) => {
  console.log('🔄 [PDF Export] Transforming V4.1 multi-scope data to backend format...');

  // DEDUPLICATION: Collect all assumptions across scopes and remove duplicates
  const allAssumptions = new Set();
  multiScopeData.scopes.forEach(scope => {
    (scope.assumptions || []).forEach(assumption => {
      if (assumption && assumption.trim()) {
        // Normalize assumption text for better deduplication
        const normalized = assumption.trim().toLowerCase().replace(/\s+/g, ' ');
        allAssumptions.add(normalized);
      }
    });
  });

  const uniqueAssumptions = Array.from(allAssumptions);
  console.log(`✅ [Deduplication] Found ${uniqueAssumptions.length} unique assumptions from ${multiScopeData.scopes.reduce((sum, scope) => sum + (scope.assumptions?.length || 0), 0)} total assumptions across ${multiScopeData.scopes.length} scopes`);

  const transformedScopes = multiScopeData.scopes.map((scope, index) => {
    // Get rates for roles
    const items = scope.role_allocation.map((roleItem) => {
      const rate = roleItem.rate || 0;
      const hours = roleItem.hours || 0;
      const cost = roleItem.cost || (rate * hours);

      return {
        description: roleItem.role, // Use role name as description (required field)
        role: roleItem.role,
        hours: hours,
        cost: cost
      };
    });

    return {
      id: index + 1, // Required: Unique integer ID for each scope
      title: scope.scope_name,
      description: scope.scope_description,
      items: items,
      deliverables: scope.deliverables || [],
      assumptions: uniqueAssumptions // Use deduplicated assumptions for all scopes
    };
  });

  console.log(`✅ [PDF Export] Transformed ${transformedScopes.length} scopes for backend`);
  transformedScopes.forEach((scope, index) => {
    console.log(`  📋 Scope ${index + 1}: ${scope.title} (${scope.items.length} items, ${uniqueAssumptions.length} shared assumptions)`);
  });

  return {
    projectTitle: multiScopeData.projectTitle || 'SOW',
    scopes: transformedScopes,
    discount: multiScopeData.discount || 0,
    clientName: undefined,
    company: 'Social Garden',
    authoritativeTotal: multiScopeData.authoritativeTotal // Pass AI-calculated authoritative total
  };
};

// Test the transformation
console.log('=== TESTING FINANCIAL CALCULATION ACCURACY ===\n');

console.log('📊 Original AI Data:');
console.log(`Project: ${sampleMultiScopeData.projectTitle}`);
console.log(`Scopes: ${sampleMultiScopeData.scopes.length}`);
console.log(`AI Authoritative Total: $${sampleMultiScopeData.authoritativeTotal}`);

// Calculate expected totals manually
const calculatedSubtotal = sampleMultiScopeData.scopes.reduce((scopeTotal, scope) => {
  return scopeTotal + scope.role_allocation.reduce((itemTotal, item) => itemTotal + item.cost, 0);
}, 0);
const discountAmount = calculatedSubtotal * (sampleMultiScopeData.discount / 100);
const subtotalAfterDiscount = calculatedSubtotal - discountAmount;
const gstAmount = subtotalAfterDiscount * 0.10;
const calculatedTotal = subtotalAfterDiscount + gstAmount;

console.log('\n🧮 Manual Calculations:');
console.log(`Calculated Subtotal: $${calculatedSubtotal.toFixed(2)}`);
console.log(`Discount (${sampleMultiScopeData.discount}%): $${discountAmount.toFixed(2)}`);
console.log(`Subtotal after discount: $${subtotalAfterDiscount.toFixed(2)}`);
console.log(`GST (10%): $${gstAmount.toFixed(2)}`);
console.log(`Calculated Total: $${calculatedTotal.toFixed(2)}`);
console.log(`AI Authoritative Total: $${sampleMultiScopeData.authoritativeTotal}`);

console.log('\n🔄 Running Transformation...');
const transformedData = transformScopesToPDFFormat(sampleMultiScopeData);

console.log('\n✅ Transformation Complete:');
console.log(`Project Title: ${transformedData.projectTitle}`);
console.log(`Scopes: ${transformedData.scopes.length}`);
console.log(`Authoritative Total: $${transformedData.authoritativeTotal}`);

// Verify scope data
transformedData.scopes.forEach((scope, index) => {
  console.log(`\n📋 Scope ${index + 1}: ${scope.title}`);
  console.log(`  Items: ${scope.items.length}`);
  const scopeTotal = scope.items.reduce((sum, item) => sum + item.cost, 0);
  console.log(`  Total Cost: $${scopeTotal.toFixed(2)}`);
  console.log(`  Deliverables: ${scope.deliverables.length}`);
  console.log(`  Assumptions: ${scope.assumptions.length}`);
});

// Test PDF generation payload
console.log('\n📄 PDF Generation Payload:');
console.log(JSON.stringify(transformedData, null, 2));

// Save test data for backend testing
const testDataPath = path.join(__dirname, 'test-payload.json');
fs.writeFileSync(testDataPath, JSON.stringify(transformedData, null, 2));
console.log(`\n💾 Test payload saved to: ${testDataPath}`);

console.log('\n=== TEST COMPLETE ===');
console.log('Next: Run backend PDF generation with this payload to verify financial accuracy.');