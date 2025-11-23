// @ts-nocheck
// Use require to avoid ESM/.ts extension resolution headaches in ts-node
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { calculatePricingTable } = require('./pricingCalculator');

const testCases = [
  { budget: 10000, roles: ['Tech - Delivery - Project Management', 'Account Management - (Account Manager)', 'Tech - Producer - Development'], tolerance: 0.03 },
  { budget: 15000, roles: ['Tech - Head Of- Senior Project Management', 'Account Management - (Account Manager)', 'Tech - Producer - Development'], tolerance: 0.03 },
  { budget: 30000, roles: ['Tech - Head Of- Senior Project Management', 'Account Management - (Account Manager)', 'Tech - Producer - Development', 'Tech - Integrations'], tolerance: 0.03 },
];

function runTests() {
  let allPass = true;
  for (const { budget, roles, tolerance } of testCases) {
    const rows = calculatePricingTable(roles, budget);
    const total = rows.reduce((sum, r) => sum + (r.hours * r.rate), 0);
    const withinTolerance = total <= budget && total >= budget * (1 - tolerance);
    console.log(`Budget: $${budget}, Total: $${total.toFixed(2)}, Roles: ${roles.join(', ')}`);
    if (!withinTolerance) {
      console.error(`❌ FAIL: Total ${total.toFixed(2)} not within tolerance for budget ${budget}`);
      allPass = false;
    } else {
      console.log('✅ PASS');
    }
  }
  console.log(allPass ? 'All tests passed.' : 'Some tests failed.');
}

runTests();
