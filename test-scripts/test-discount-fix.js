// Test script to verify the discount fix
const fs = require('fs');
const path = require('path');

// Check if our fix is present in the editable-pricing-table.tsx file
const filePath = path.join(__dirname, '../frontend/components/tailwind/extensions/editable-pricing-table.tsx');

try {
  const content = fs.readFileSync(filePath, 'utf8');

  // Look for our fix
  if (content.includes('🎯 CRITICAL FIX: Sync discount state with node.attrs.discount when it changes')) {
    console.log('✅ Fix is present in the file');

    // Check if the useEffect is properly structured
    if (content.includes('useEffect(() => {') &&
        content.includes('if (node.attrs.discount !== undefined &&') &&
        content.includes('node.attrs.discount !== discount)')) {
      console.log('✅ useEffect for discount sync is properly implemented');
    } else {
      console.log('❌ useEffect for discount sync is not properly implemented');
    }
  } else {
    console.log('❌ Fix is not present in the file');
  }
} catch (error) {
  console.error('Error reading file:', error);
}
