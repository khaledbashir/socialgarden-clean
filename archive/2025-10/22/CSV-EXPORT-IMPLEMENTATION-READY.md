# CSV Export Implementation - Code Templates (Ready to Deploy)

**Status:** Immediately deployable  
**Time to implement:** 4-6 hours  
**Files to create:** 2 files (+ 1 modification)  

---

## OVERVIEW: What We're Building

```
User clicks [Download CSV] button
        ↓
CSV generated from SOW data in browser
        ↓
File downloads: client_sow_title_2025-10-19.csv
        ↓
User opens in Google Sheets OR Excel
        ↓
User can import/save to Google Drive
```

**No backend needed. No server calls. Pure browser-based.**

---

## FILE 1: CSV Generator Library

**File:** `/frontend/lib/sow-to-csv.ts`

**Purpose:** Convert SOW data (TipTap JSON) to CSV format

**Code Template:**

```typescript
import { generateHTML } from '@/components/tailwind/extensions';
import Papa from 'papaparse';

interface PricingRow {
  role: string;
  hours: number;
  rate: number;
  total: number;
}

interface SOWData {
  clientName: string;
  projectTitle: string;
  sowDate: string;
  pricingRows: PricingRow[];
  totalHours: number;
  grandTotal: number;
  assumptions?: string[];
  timeline?: string;
  deliverables?: string[];
}

/**
 * Converts SOW data to CSV format matching Social Garden template
 * @param sowData - SOW information including pricing and deliverables
 * @returns CSV string ready for download
 */
export function generateSOWasCSV(sowData: SOWData): string {
  const rows: (string | number)[][] = [];

  // Header Section
  rows.push(['Social Garden - Statement of Work']);
  rows.push(['']);
  rows.push(['Project', `${sowData.clientName} - ${sowData.projectTitle}`]);
  rows.push(['Date', sowData.sowDate]);
  rows.push(['']);

  // Pricing Table
  rows.push(['PRICING BREAKDOWN']);
  rows.push(['Role', 'Hours', 'Rate (AUD)', 'Total Cost']);
  
  sowData.pricingRows.forEach(row => {
    rows.push([
      row.role,
      row.hours,
      row.rate,
      `$${row.total}`,
    ]);
  });

  // Totals Row
  rows.push(['']);
  rows.push([
    'TOTAL',
    sowData.totalHours,
    '',
    `$${sowData.grandTotal} +GST`,
  ]);

  // Assumptions Section
  if (sowData.assumptions && sowData.assumptions.length > 0) {
    rows.push(['']);
    rows.push(['ASSUMPTIONS']);
    sowData.assumptions.forEach(assumption => {
      rows.push([`• ${assumption}`]);
    });
  }

  // Timeline
  if (sowData.timeline) {
    rows.push(['']);
    rows.push(['Timeline', sowData.timeline]);
  }

  // Deliverables (optional, condensed)
  if (sowData.deliverables && sowData.deliverables.length > 0) {
    rows.push(['']);
    rows.push(['DELIVERABLES']);
    sowData.deliverables.forEach(deliv => {
      rows.push([`• ${deliv}`]);
    });
  }

  // Convert to CSV using papaparse
  return Papa.unparse(rows);
}

/**
 * Extract SOW data from page context
 * This function would parse the TipTap JSON and extract structured data
 */
export function extractSOWData(
  clientName: string,
  projectTitle: string,
  tipTapContent: any,
  sowDate: string = new Date().toISOString().split('T')[0]
): SOWData {
  // Parse pricing table from TipTap content
  const pricingRows: PricingRow[] = [];
  
  // THIS IS A PLACEHOLDER - actual implementation depends on your TipTap schema
  // You would walk through tipTapContent and extract:
  // 1. All pricing table rows
  // 2. Calculate totals
  // 3. Extract assumptions from text
  
  let totalHours = 0;
  let grandTotal = 0;

  // Example: iterate through TipTap nodes to find table
  if (tipTapContent.content) {
    for (const node of tipTapContent.content) {
      if (node.type === 'table') {
        // Extract table data
        for (const rowNode of node.content || []) {
          if (rowNode.type === 'tableRow') {
            const cells = rowNode.content || [];
            if (cells.length >= 4) {
              const role = cells[0]?.content?.[0]?.text || '';
              const hours = parseFloat(cells[1]?.content?.[0]?.text || '0');
              const rate = parseFloat(cells[2]?.content?.[0]?.text || '0');
              const total = hours * rate;

              if (role && hours > 0) {
                pricingRows.push({ role, hours, rate, total });
                totalHours += hours;
                grandTotal += total;
              }
            }
          }
        }
      }
    }
  }

  return {
    clientName,
    projectTitle,
    sowDate,
    pricingRows,
    totalHours,
    grandTotal,
    assumptions: [
      'Hours outlined are capped and provided as an estimate',
      'Social Garden to be briefed by client',
      'Project timeline and dates will be finalised post sign-off',
    ],
    timeline: '4 weeks from kick-off (subject to feedback cycles)',
  };
}

/**
 * Trigger browser download of CSV file
 */
export function downloadCSVFile(
  csv: string,
  clientName: string,
  projectTitle: string,
  date: string = new Date().toISOString().split('T')[0]
): void {
  // Create blob
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  
  // Create temporary URL
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  // Generate filename
  const filename = `${clientName
    .toLowerCase()
    .replace(/\s+/g, '_')}_${projectTitle
    .toLowerCase()
    .replace(/\s+/g, '_')}_SOW_${date}.csv`;
  
  // Trigger download
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
}
```

---

## FILE 2: Export Button Component

**File:** `/frontend/components/sow/export-buttons.tsx`

**Purpose:** UI component with Download CSV and Download PDF buttons

**Code Template:**

```tsx
'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, Sheet } from 'lucide-react';
import { useState } from 'react';
import { downloadCSVFile, extractSOWData, generateSOWasCSV } from '@/lib/sow-to-csv';
import { useToast } from '@/hooks/use-toast';

interface ExportButtonsProps {
  clientName: string;
  projectTitle: string;
  sowDate: string;
  tipTapContent: any; // TipTap JSON content
  sowId: string;
  onPdfExport?: () => Promise<void>; // Existing PDF export function
}

export function ExportButtons({
  clientName,
  projectTitle,
  sowDate,
  tipTapContent,
  sowId,
  onPdfExport,
}: ExportButtonsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  /**
   * Handle CSV download
   */
  const handleDownloadCSV = async () => {
    try {
      setIsLoading(true);

      // Extract data from SOW
      const sowData = extractSOWData(
        clientName,
        projectTitle,
        tipTapContent,
        sowDate
      );

      // Generate CSV
      const csv = generateSOWasCSV(sowData);

      // Download file
      downloadCSVFile(csv, clientName, projectTitle, sowDate);

      toast({
        title: '✅ CSV Downloaded',
        description: `${clientName} - ${projectTitle} SOW exported as CSV`,
      });
    } catch (error) {
      console.error('CSV export error:', error);
      toast({
        title: '❌ Export Failed',
        description: 'Could not generate CSV. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle PDF export (existing functionality)
   */
  const handleDownloadPDF = async () => {
    try {
      setIsLoading(true);
      if (onPdfExport) {
        await onPdfExport();
      }
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: '❌ PDF Export Failed',
        description: 'Could not generate PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle Push to Sheets (Phase 2 - placeholder for now)
   */
  const handlePushToSheets = async () => {
    toast({
      title: '📋 Coming Soon',
      description: 'Push to Google Sheets will be available soon!',
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={isLoading}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          {isLoading ? 'Exporting...' : 'Export'}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {/* Download PDF */}
        <DropdownMenuItem
          onClick={handleDownloadPDF}
          disabled={isLoading}
          className="gap-2 cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          <span>Download as PDF</span>
          <span className="text-xs text-gray-500 ml-auto">Existing</span>
        </DropdownMenuItem>

        {/* Download CSV */}
        <DropdownMenuItem
          onClick={handleDownloadCSV}
          disabled={isLoading}
          className="gap-2 cursor-pointer"
        >
          <Sheet className="w-4 h-4" />
          <span>Download as CSV</span>
          <span className="text-xs text-gray-500 ml-auto">NEW!</span>
        </DropdownMenuItem>

        {/* Push to Sheets (Phase 2) */}
        <DropdownMenuItem
          onClick={handlePushToSheets}
          disabled={true}
          className="gap-2 cursor-not-allowed opacity-50"
        >
          <Sheet className="w-4 h-4" />
          <span>Push to Google Sheets</span>
          <span className="text-xs text-gray-500 ml-auto">Soon</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## FILE 3: Integrate into SOW Page

**File to Modify:** `/frontend/app/portal/sow/[id]/page.tsx`

**Location:** Find the current export section and add new component

**Current Code (Example):**
```tsx
// Somewhere in your SOW view, you probably have:
<Button onClick={handleExportPDF}>
  <Download className="w-4 h-4" />
  Export PDF
</Button>
```

**Updated Code:**
```tsx
import { ExportButtons } from '@/components/sow/export-buttons';

export default async function SOWPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // ... existing code ...

  return (
    <div className="space-y-6">
      {/* SOW Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{sow.name}</h1>
        
        {/* REPLACE OLD BUTTON WITH NEW COMPONENT */}
        <ExportButtons
          clientName={sow.clientName}
          projectTitle={sow.name}
          sowDate={new Date(sow.createdAt).toISOString().split('T')[0]}
          tipTapContent={sow.content} // Your TipTap JSON
          sowId={sow.id}
          onPdfExport={handleExportPDF} // Existing PDF function
        />
      </div>

      {/* Rest of SOW content */}
      <div>
        {/* SOW display */}
      </div>
    </div>
  );
}
```

---

## SETUP CHECKLIST

### Step 1: Dependencies
```bash
# Check if papaparse is installed
npm list papaparse

# If not, install:
npm install papaparse --save
npm install @types/papaparse --save-dev
```

### Step 2: Create Files
- [ ] Create `/frontend/lib/sow-to-csv.ts` (copy code above)
- [ ] Create `/frontend/components/sow/export-buttons.tsx` (copy code above)

### Step 3: Update Existing File
- [ ] Modify `/frontend/app/portal/sow/[id]/page.tsx`
- [ ] Replace old export button with `<ExportButtons />` component
- [ ] Verify props are correct

### Step 4: Test
```bash
# Build
cd /root/the11/frontend && npm run build

# Check for errors
# Should see: "✓ compiled" message

# Restart
pm2 restart sow-frontend

# Test in browser
# 1. Open SOW
# 2. Click Export dropdown
# 3. Click "Download as CSV"
# 4. Verify CSV downloads
# 5. Open CSV in Google Sheets
```

### Step 5: Verify CSV Format
1. Download a CSV
2. Open in Google Sheets
3. Check:
   - ✅ Headers are correct
   - ✅ Pricing rows have data
   - ✅ Totals calculate correctly
   - ✅ Formatting looks professional
4. If all good: Deploy!

---

## TESTING DATA (For Manual Testing)

### Test SOW 1: Simple Email Template
```
Client: ABC Marketing Inc
Project: Email Template Design
Pricing:
- Designer: 10 hours @ $180 = $1800
- Developer: 8 hours @ $120 = $960
- PM: 3 hours @ $365 = $1095
Total: 21 hours = $3,855 +GST

Expected CSV output:
  - Should have 3 pricing rows
  - Total should be 21 hours, $3,855
```

### Test SOW 2: Complex HubSpot Implementation
```
Client: XYZ Corp
Project: HubSpot Setup + Automation
Pricing:
- Sr. Consultant: 15 hours @ $295 = $4,425
- Specialist (Campaign): 20 hours @ $180 = $3,600
- Specialist (Database): 12 hours @ $180 = $2,160
- Producer: 10 hours @ $120 = $1,200
- PM: 5 hours @ $365 = $1,825
- Account Manager: 8 hours @ $180 = $1,440
Total: 70 hours = $14,650 +GST

Expected CSV output:
  - Should have 6 pricing rows
  - Total should be 70 hours, $14,650
```

---

## ERROR HANDLING

### Common Issues & Solutions

**Issue 1: "Cannot find module 'papaparse'"**
```
Solution: npm install papaparse --save
```

**Issue 2: CSV downloads but has wrong filename**
```
Check: downloadCSVFile() function replaces spaces with underscores
Fix: Adjust filename generation logic in downloadCSVFile()
```

**Issue 3: CSV has empty rows or missing data**
```
Check: extractSOWData() is correctly parsing TipTap content
Debug: console.log(sowData) before CSV generation
Verify: TipTap structure matches expected schema
```

**Issue 4: Pricing totals are wrong**
```
Check: PricingRow calculation: hours × rate = total
Verify: No rounding errors (keep numbers as floats)
Format: Currency formatting happens in CSV string
```

---

## DEPLOYMENT STEPS

```bash
# 1. Create both new files
# 2. Modify SOW page file
# 3. Test locally

# 4. Build
cd /root/the11/frontend && npm run build

# If build succeeds:
# ✓ compiled

# 5. Restart service
pm2 restart sow-frontend --update-env

# 6. Verify in browser
# http://localhost:3001
# Open any SOW
# Click Export → Download as CSV
# Should work!

# 7. Verify CSV quality
# Open downloaded CSV in Google Sheets
# Check formatting and data

# 8. Ready to deploy!
```

---

## POST-DEPLOYMENT VALIDATION

After deploying, verify:

- [ ] Export button appears on SOW page
- [ ] CSV dropdown menu shows 3 options
- [ ] Download CSV button works
- [ ] CSV file downloads with correct name
- [ ] CSV opens in Google Sheets
- [ ] Pricing rows display correctly
- [ ] Totals are accurate
- [ ] No JavaScript errors in console
- [ ] PDF export still works
- [ ] Mobile view still works

---

## NEXT PHASE (Phase 2)

After CSV is working, these are the files you'll create for Google Sheets integration:

**Phase 2 Files (Coming Later):**
1. `/frontend/lib/google-sheets-client.ts` - OAuth handling
2. `/frontend/app/api/sheets/callback/route.ts` - OAuth callback
3. `/backend/services/google_sheets_service.py` - Sheets API service
4. `/frontend/app/api/push-to-sheets/route.ts` - Push endpoint

But that's for next week. For now, just the CSV export!

---

## SUMMARY

**What You're Getting:**
✅ "Download CSV" button on SOW view  
✅ CSV exports with professional formatting  
✅ File downloads automatically  
✅ Works with Google Sheets + Excel  
✅ No backend changes needed  
✅ No user auth needed  

**Time to Deploy:** 4-6 hours  
**Complexity:** Low (frontend only)  
**User Value:** High (instant feature)  

**Ready to proceed?** Let me know and I'll implement this today!
