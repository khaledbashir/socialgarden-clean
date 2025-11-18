// Script to check for missing UI components
const fs = require('fs');
const path = require('path');

// List of UI components that are being imported in our new components
const requiredComponents = [
  'button',
  'input',
  'dropdown-menu',
  'dialog',
  'tabs',
  'badge',
  'textarea',
  'scroll-area',
  'separator',
  'label',
  'select',
  'checkbox'
];

// Base path for UI components
const uiBasePath = path.join(__dirname, 'tailwind/ui');
const uiBackupPath = path.join(__dirname, '..');

console.log('Checking for missing UI components...\n');

const missingComponents = [];
const existingComponents = [];

// Check if each required component exists
requiredComponents.forEach(component => {
  const componentPath = path.join(uiBasePath, `${component}.tsx`);
  const backupPath = path.join(uiBackupPath, `${component}.tsx`);

  if (fs.existsSync(componentPath)) {
    existingComponents.push(component);
  } else if (fs.existsSync(backupPath)) {
    existingComponents.push(`${component} (in backup path)`);
  } else {
    missingComponents.push(component);
  }
});

console.log('✅ Existing components:');
existingComponents.forEach(comp => console.log(`  - ${comp}`));

if (missingComponents.length > 0) {
  console.log('\n❌ Missing components:');
  missingComponents.forEach(comp => console.log(`  - ${comp}`));

  console.log('\nTo create these components, you can either:');
  console.log('1. Create them manually');
  console.log('2. Copy from another project');
  console.log('3. Install a UI library like shadcn/ui');
} else {
  console.log('\n🎉 All required UI components are present!');
}

// Check if index file exists in UI components folder
const indexPath = path.join(uiBasePath, 'index.tsx');
if (fs.existsSync(indexPath)) {
  console.log('\n✅ UI components index file exists');
} else {
  console.log('\n⚠️ UI components index file is missing');
  console.log('   Consider creating an index file to export all UI components');
}
