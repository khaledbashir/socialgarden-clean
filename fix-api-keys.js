#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of files to fix
const filesToFix = [
  '/root/the11-dev/frontend/app/api/anythingllm/threads/route.ts',
  '/root/the11-dev/frontend/app/api/folders/[id]/route.ts',
  '/root/the11-dev/frontend/app/api/dashboard/chat/route.ts',
  '/root/the11-dev/frontend/app/api/sow/analyze-client/route.ts',
  '/root/the11-dev/frontend/app/api/admin/backfill-tags/route.ts'
];

const keyPattern = /0G0WTZ3-6ZX4D20-H35VBRG-9059WPA/g;
const envPattern = /process\.env\.ANYTHINGLLM_API_KEY \|\| '0G0WTZ3-6ZX4D20-H35VBRG-9059WPA'/g;

filesToFix.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace hardcoded key with environment variable
    content = content.replace(keyPattern, 'process.env.NEXT_PUBLIC_ANYTHINGLLM_API_KEY');
    content = content.replace(envPattern, "process.env.NEXT_PUBLIC_ANYTHINGLLM_API_KEY");

    // Add validation after API key assignment
    if (content.includes("const ANYTHINGLLM_API_KEY = process.env.NEXT_PUBLIC_ANYTHINGLLM_API_KEY;")) {
      const validationCode = `

      // Security validation: Ensure API key is set
      if (!ANYTHINGLLM_API_KEY) {
        throw new Error('Security Error: ANYTHINGLLM_API_KEY environment variable is required but not set.');
      }`;

      // Insert validation after the API key line
      content = content.replace(
        "const ANYTHINGLLM_API_KEY = process.env.NEXT_PUBLIC_ANYTHINGLLM_API_KEY;",
        "const ANYTHINGLLM_API_KEY = process.env.NEXT_PUBLIC_ANYTHINGLLM_API_KEY;" + validationCode
      );
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${path.basename(filePath)}`);
  } else {
    console.log(`❌ File not found: ${filePath}`);
  }
});

console.log('\n🔒 API key security fixes completed!');
console.log('\n📋 Next steps:');
console.log('1. Set environment variables in your deployment:');
console.log('   ANYTHINGLLM_API_KEY=your_actual_api_key');
console.log('   ANYTHINGLLM_WORKSPACE_SLUG=your_workspace_slug');
console.log('2. Restart your application to load new environment variables');
