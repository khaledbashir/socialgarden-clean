import { readFileSync, writeFileSync } from 'fs';

const filePath = '/root/the11-dev/frontend/app/api/sow/[id]/route.ts';
let content = readFileSync(filePath, 'utf-8');

// Find and replace the problematic import section
const oldImports = `        // Import AnythingLLM service
        const { AnythingLLMService } = await import('@/lib/anythingllm');
        const anythingLLM = new AnythingLLMService();
        
        // Convert JSON content to HTML for embedding
        const { generateHTML } = await import('@tiptap/html');
        const { default: Document } = await import('@tiptap/extension-document');
        const { default: Paragraph } = await import('@tiptap/extension-paragraph');
        const { default: Text } = await import('@tiptap/extension-text');
        const { default: Heading } = await import('@tiptap/extension-heading');
        const { default: BulletList } = await import('@tiptap/extension-bullet-list');
        const { default: ListItem } = await import('@tiptap/extension-list-item');
        const { default: Bold } = await import('@tiptap/extension-bold');
        const { default: Italic } = await import('@tiptap/extension-italic');
        const { default: HorizontalRule } = await import('@tiptap/extension-horizontal-rule');
        const { EditablePricingTable } = await import('@/components/tailwind/extensions/editable-pricing-table');
        
        const contentObj = typeof content === 'string' ? JSON.parse(content) : content;
        const htmlContent = generateHTML(contentObj, [
          Document, Paragraph, Text, Heading, BulletList, ListItem,
          Bold, Italic, HorizontalRule, EditablePricingTable
        ]);`;

const newImports = `        // Import AnythingLLM service and HTML converter
        const { AnythingLLMService } = await import('@/lib/anythingllm');
        const { sowContentToHTML } = await import('@/lib/export-utils');
        const anythingLLM = new AnythingLLMService();
        
        // Convert JSON content to HTML for embedding
        const contentObj = typeof content === 'string' ? JSON.parse(content) : content;
        const htmlContent = sowContentToHTML(contentObj);`;

content = content.replace(oldImports, newImports);

writeFileSync(filePath, content, 'utf-8');
console.log('✅ Fixed TypeScript imports in route.ts');
