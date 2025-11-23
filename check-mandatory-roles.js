const sqlite3 = require('better-sqlite3');
const db = sqlite3('the-eleven.db');

// Get most recent SOW with pricing
const sow = db.prepare(`
  SELECT id, clientName, pricingJson, createdAt 
  FROM sows 
  WHERE pricingJson IS NOT NULL AND pricingJson != ''
  ORDER BY createdAt DESC 
  LIMIT 1
`).get();

if (!sow) {
  console.log('❌ No SOWs with pricing found');
  process.exit(1);
}

console.log(`📊 Most recent SOW: ${sow.clientName} (ID: ${sow.id})`);
console.log(`📅 Created: ${sow.createdAt}`);

const pricing = JSON.parse(sow.pricingJson);
console.log(`\n💰 Pricing breakdown has ${pricing.breakdown?.length || 0} roles`);

const mandatoryRoles = [
  'Tech - Head Of - Senior Project Management',
  'Tech - Delivery - Project Coordination',
  'Account Management - Senior Account Manager'
];

console.log(`\n🔍 Checking for mandatory roles:`);
mandatoryRoles.forEach(role => {
  const found = pricing.breakdown?.find(item => item.role === role);
  if (found) {
    console.log(`  ✅ ${role}`);
  } else {
    console.log(`  ❌ MISSING: ${role}`);
  }
});

db.close();
