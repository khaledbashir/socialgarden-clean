# SOW PDF Export Component

A complete React-based PDF export system for Statement of Work (SOW) documents using `@react-pdf/renderer`. This component generates professional, structured PDFs that match the "BBUBU" SOW format.

## 📁 Files Created

1. **SOWPdfExport.tsx** - Core PDF document component
2. **SOWPdfExportWrapper.tsx** - Wrapper with download/preview UI
3. **SOWPdfExportExample.tsx** - Example implementation with sample data
4. **README-SOW-PDF.md** - This documentation file

## 🚀 Features

- ✅ Professional, structured PDF layout
- ✅ Colored scope header bars
- ✅ Detailed itemized cost tables
- ✅ Deliverables and Assumptions lists
- ✅ Scope & Price Overview summary table
- ✅ Dynamic totals calculation
- ✅ GST/Tax support
- ✅ Responsive table layouts
- ✅ Download and Preview functionality
- ✅ Fully typed with TypeScript
- ✅ No modification to existing PDF export code

## 📦 Installation

The required package `@react-pdf/renderer` has been installed:

```bash
npm install @react-pdf/renderer
```

## 📋 Data Structure

The component expects data in the following format:

```typescript
interface SOWData {
  company: {
    name: string;
    logoUrl?: string;
  };
  clientName: string;
  projectTitle: string;
  projectSubtitle: string;
  projectOverview: string;
  budgetNotes: string;
  scopes: SOWScope[];
  currency: string;
  gstApplicable: boolean;
  generatedDate: string;
}

interface SOWScope {
  id: number;
  title: string;
  description: string;
  items: SOWItem[];
  deliverables: string[];
  assumptions: string[];
}

interface SOWItem {
  description: string;
  role: string;
  hours: number;
  cost: number;
}
```

## 🎯 Usage

### Basic Usage

```tsx
import SOWPdfExportWrapper from '@/components/sow/SOWPdfExportWrapper';
import { SOWData } from '@/components/sow/SOWPdfExport';

const MyComponent = () => {
  const sowData: SOWData = {
    company: {
      name: 'Social Garden',
      logoUrl: '/logo.png',
    },
    clientName: 'BBUBU',
    projectTitle: 'HubSpot Integration and Custom Landing Page Development',
    projectSubtitle: 'ADVISORY & CONSULTATION | SERVICES',
    projectOverview: 'This project will deliver...',
    budgetNotes: 'Total investment: $6,930...',
    scopes: [
      {
        id: 1,
        title: 'HubSpot Integration Setup',
        description: 'This scope covers...',
        items: [
          {
            description: 'Handle HubSpot setup...',
            role: 'Tech - Specialist',
            hours: 21,
            cost: 3780,
          },
        ],
        deliverables: ['HubSpot account setup...'],
        assumptions: ['Client will provide access...'],
      },
    ],
    currency: 'USD',
    gstApplicable: true,
    generatedDate: new Date().toLocaleDateString(),
  };

  return (
    <SOWPdfExportWrapper 
      sowData={sowData} 
      fileName="My-SOW.pdf" 
    />
  );
};
```

### Advanced Usage - Direct PDF Component

If you need more control, use the core component directly:

```tsx
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import SOWPdfExport from '@/components/sow/SOWPdfExport';

// For download
<PDFDownloadLink 
  document={<SOWPdfExport sowData={sowData} />} 
  fileName="SOW.pdf"
>
  {({ loading }) => (loading ? 'Generating...' : 'Download PDF')}
</PDFDownloadLink>

// For preview
<PDFViewer width="100%" height="800px">
  <SOWPdfExport sowData={sowData} />
</PDFViewer>
```

## 🎨 PDF Layout Components

The generated PDF includes the following sections in order:

1. **Header Section**
   - Company logo (optional)
   - Project title
   - Project subtitle
   - Client name

2. **Scopes** (repeating for each scope)
   - Colored header bar with scope title
   - Scope description
   - Itemized cost table (Items, Role, Hours, Total Cost + GST)
   - Scope total row
   - Deliverables list (bulleted)
   - Assumptions list (bulleted)

3. **Grand Total Section**
   - Total project cost

4. **Scope & Price Overview Table**
   - Summary of all scopes
   - Total hours and costs per scope
   - Grand totals

5. **Text Sections**
   - Project Overview
   - Budget Notes

6. **Footer**
   - Company name
   - Generation date

## 🎨 Customization

### Changing Colors

Edit the `styles` object in `SOWPdfExport.tsx`:

```typescript
scopeHeader: {
  backgroundColor: '#4A90E2', // Change this color
  // ...
},
```

### Modifying Table Columns

Adjust column widths in the styles:

```typescript
colItems: { width: '45%' },
colRole: { width: '30%' },
colHours: { width: '10%' },
colCost: { width: '15%' },
```

### Adding Custom Fonts

Uncomment and modify the Font.register section:

```typescript
Font.register({
  family: 'Roboto',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
});
```

### Currency Formatting

The component supports different currencies. Modify the `formatCurrency` function for custom formatting:

```typescript
const formatCurrency = (amount: number, currency: string): string => {
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '$';
  return `${symbol}${amount.toLocaleString('en-US')}`;
};
```

## 🧪 Testing

To test the component, you can use the example page:

```tsx
import SOWPdfExportExample from '@/components/sow/SOWPdfExportExample';

// In your page or route
<SOWPdfExportExample />
```

## 📊 Calculations

The component automatically calculates:

- Individual scope totals (sum of all items in a scope)
- Total hours per scope
- Grand total (sum of all scope totals)
- Total project hours

All calculations are performed dynamically from the provided data.

## 🔧 Troubleshooting

### PDF Not Generating

- Ensure `@react-pdf/renderer` is installed
- Check that all required fields in `SOWData` are provided
- Verify logo URL is accessible (or set `logoUrl` to `undefined`)

### Layout Issues

- Use `wrap={false}` on sections to prevent page breaks within them
- Adjust font sizes if content is overflowing
- Modify table column widths if text is wrapping unexpectedly

### Images Not Showing

- Ensure logo URL is absolute or publicly accessible
- For local images, use a URL that the PDF renderer can access
- Consider converting images to base64 for embedded images

## 🚫 What This Does NOT Touch

This is a **completely separate** PDF export system. It does **NOT**:

- Modify any existing PDF export functionality
- Change any existing components
- Interfere with `jspdf` or `html2canvas` implementations
- Modify any other part of the application

## 📝 Notes

- The component uses A4 page size by default
- Colors can be customized via the `styles` object
- Tables automatically handle alternating row colors
- The footer is fixed at the bottom of each page
- Each scope section prevents page breaks for better readability

## 🔗 Related Documentation

- [@react-pdf/renderer Documentation](https://react-pdf.org/)
- [PDF Styling Guide](https://react-pdf.org/styling)
- [PDF Components Reference](https://react-pdf.org/components)

## 👥 Support

For questions or issues with this component, please refer to this README or check the example implementation in `SOWPdfExportExample.tsx`.
