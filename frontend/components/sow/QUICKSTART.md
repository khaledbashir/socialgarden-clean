# SOW PDF Export - Quick Start Guide

## 🚀 Getting Started in 3 Steps

### 1. Import the Component

```tsx
import { SOWPdfExportWrapper } from '@/components/sow';
import type { SOWData } from '@/components/sow';
```

### 2. Prepare Your Data

```tsx
const mySOWData: SOWData = {
  company: {
    name: 'Your Company Name',
    logoUrl: '/path/to/logo.png', // Optional
  },
  clientName: 'Client Name',
  projectTitle: 'Your Project Title',
  projectSubtitle: 'ADVISORY & CONSULTATION | SERVICES',
  projectOverview: 'Brief description of the project...',
  budgetNotes: 'Payment terms and budget information...',
  scopes: [
    {
      id: 1,
      title: 'Scope 1 Title',
      description: 'What this scope covers...',
      items: [
        {
          description: 'Task description',
          role: 'Role Name',
          hours: 20,
          cost: 2000,
        },
      ],
      deliverables: ['Deliverable 1', 'Deliverable 2'],
      assumptions: ['Assumption 1', 'Assumption 2'],
    },
  ],
  currency: 'USD',
  gstApplicable: true,
  generatedDate: new Date().toLocaleDateString(),
};
```

### 3. Render the Component

```tsx
export default function MyPage() {
  return (
    <div>
      <h1>Generate SOW PDF</h1>
      <SOWPdfExportWrapper 
        sowData={mySOWData} 
        fileName="My-SOW.pdf" 
      />
    </div>
  );
}
```

## 📦 What You Get

- ✅ Download button with loading state
- ✅ Preview toggle button
- ✅ Professional PDF matching BBUBU format
- ✅ Automatic calculations (totals, hours, etc.)
- ✅ Responsive and clean UI

## 🎨 Customization Options

### Change Colors

Edit `/components/sow/SOWPdfExport.tsx`:

```typescript
scopeHeader: {
  backgroundColor: '#4A90E2', // Change this to your brand color
  // ...
}
```

### Change Currency

```typescript
currency: 'EUR', // or 'GBP', 'AUD', 'CAD'
```

### Custom Filename

```tsx
<SOWPdfExportWrapper 
  sowData={mySOWData} 
  fileName="Custom-Name-2025.pdf" 
/>
```

## 📁 Files Structure

```
/components/sow/
├── SOWPdfExport.tsx          # Core PDF component
├── SOWPdfExportWrapper.tsx   # UI wrapper with buttons
├── SOWPdfExportExample.tsx   # Example implementation
├── types.ts                  # TypeScript types
├── utils.ts                  # Helper functions
├── index.ts                  # Main export
├── README-SOW-PDF.md         # Full documentation
└── QUICKSTART.md            # This file
```

## 🔧 Using Just the PDF Component

If you want more control and don't need the UI wrapper:

```tsx
import { PDFDownloadLink } from '@react-pdf/renderer';
import { SOWPdfExport } from '@/components/sow';

<PDFDownloadLink 
  document={<SOWPdfExport sowData={mySOWData} />} 
  fileName="SOW.pdf"
>
  {({ loading }) => (loading ? 'Loading...' : 'Download')}
</PDFDownloadLink>
```

## 🧪 See It In Action

To see a working example:

```tsx
import { SOWPdfExportExample } from '@/components/sow';

// In your page
<SOWPdfExportExample />
```

## 🆘 Common Issues

### Logo Not Showing?
- Make sure the logo URL is absolute or publicly accessible
- For local images, use base64 encoding or a public URL

### Table Layout Issues?
- Adjust column widths in `styles` object
- Reduce font size if content is too long

### PDF Not Generating?
- Check all required fields are provided
- Use `validateSOWData()` helper to validate your data

## 💡 Pro Tips

1. **Validation**: Use the built-in validator
   ```tsx
   import { validateSOWData } from '@/components/sow';
   
   try {
     validateSOWData(mySOWData);
   } catch (error) {
     console.error('Invalid data:', error.message);
   }
   ```

2. **Calculate Totals**: Use helper functions
   ```tsx
   import { generateProjectTotals } from '@/components/sow';
   
   const totals = generateProjectTotals(mySOWData.scopes);
   console.log('Total cost:', totals.totalCost);
   console.log('Total hours:', totals.totalHours);
   ```

3. **Auto-Generate Filename**:
   ```tsx
   import { generateSOWFilename } from '@/components/sow';
   
   const filename = generateSOWFilename(
     mySOWData.clientName,
     mySOWData.projectTitle
   );
   ```

## 📚 Need More Help?

Check out:
- Full documentation: `README-SOW-PDF.md`
- Working example: `SOWPdfExportExample.tsx`
- Type definitions: `types.ts`
- Utility functions: `utils.ts`

## ✅ Checklist

Before generating your first PDF:

- [ ] Installed `@react-pdf/renderer` ✓ (already done)
- [ ] Prepared SOW data with all required fields
- [ ] Added company logo (optional)
- [ ] Imported the wrapper component
- [ ] Rendered the component in your page
- [ ] Tested download functionality
- [ ] Checked PDF preview

---

**You're all set!** 🎉 Start generating professional SOW PDFs.
