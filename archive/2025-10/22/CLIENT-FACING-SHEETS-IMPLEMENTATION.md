# Direct Google Sheets Generation - Implementation Guide

**Status:** Ready to build  
**Approach:** Create client-facing professional sheets directly (no CSV intermediate)  
**Timeline:** 10-14 hours, deploy within 1 week  

---

## THE NEW FLOW

### Before (CSV Approach - Not Client-Facing)
```
User clicks [Export CSV]
        ↓
CSV downloads to computer
        ↓
User uploads to Google Drive manually
        ↓
User creates new sheet
        ↓
User imports CSV data
        ↓
User formats manually
        ↓
User shares with client
❌ Too many steps, not professional
```

### After (Direct Sheets - CLIENT-FACING)
```
User clicks [Create Sheet]
        ↓
Backend creates professional Google Sheet in user's Drive
        ↓
Sheet includes:
  • Social Garden branding
  • Professional formatting
  • All SOW content
  • Proper colors & layout
  • Pricing table formatted
        ↓
Share link displayed to user
        ↓
User clicks [Share with Client] or copies link
        ↓
Client receives professional SOW sheet
✅ Professional, ready to go, no manual work
```

---

## WHAT THE CREATED SHEET LOOKS LIKE

### Sheet Tab Name
```
"[Client Name] - [Project Title] SOW"
```

### Sheet Content Structure

```
╔════════════════════════════════════════════════════════════════╗
║ ROW 1 (Merged A-D):                                            ║
║ 📊 Social Garden (text/logo in green)                         ║
║                                                                ║
║ ROW 2 (Green Header Band - Merged A-D):                       ║
║ CLIENT | Marketing Automation | PROJECT | SERVICES            ║
║                                                                ║
║ ROW 3 (Spacing): [blank]                                      ║
║                                                                ║
║ ROW 4-6: OVERVIEW Section                                     ║
║ "This scope of work details a proposed solution..."           ║
║                                                                ║
║ ROW 7: WHAT DOES THE SCOPE INCLUDE?                          ║
║ • Deliverable 1                                               ║
║ • Deliverable 2                                               ║
║ • Deliverable 3                                               ║
║                                                                ║
║ ROW 10: PROJECT OUTCOMES                                      ║
║ • Outcome 1: [description]                                    ║
║ • Outcome 2: [description]                                    ║
║ • Outcome 3: [description]                                    ║
║                                                                ║
║ ROW 15: PROJECT PHASES                                        ║
║ • Discovery & Planning                                        ║
║ • Technical Assessment & Setup                               ║
║ • Quality Assurance & Testing                                ║
║ • Final Delivery & Go-live                                    ║
║                                                                ║
║ ROW 20 (Light Gray Header): PRICING SUMMARY                  ║
║ Role        | Hours | Rate (AUD) | Total Cost                ║
║ ─────────────────────────────────────────────────────────── ║
║ [role]      | [hrs] | $[rate]    | $[total]                  ║
║ [role]      | [hrs] | $[rate]    | $[total]                  ║
║ TOTAL HOURS | [sum] |            | $[total] +GST             ║
║                                                                ║
║ ROW 30: ASSUMPTIONS                                           ║
║ • Hours outlined are capped and provided as an estimate      ║
║ • Social Garden to be briefed by client                       ║
║ • Project timeline will be finalised post sign-off            ║
║                                                                ║
║ ROW 34: TIMELINE                                              ║
║ Estimated project duration: [X] weeks from kick-off           ║
╚════════════════════════════════════════════════════════════════╝
```

### Formatting Applied
- **Header rows:** Green background (#1CBF79 - Social Garden brand color)
- **Section headers:** Bold, 12pt font
- **Pricing table:** 
  - Header row: Light gray background, bold
  - Data rows: Normal formatting
  - Total row: Bold, highlighted
  - Currency: Format as "$X,XXX +GST"
- **Text sections:** Proper spacing, bullet points as "•"
- **Borders:** Light gray borders on pricing table
- **Column widths:** Auto-sized for readability

---

## IMPLEMENTATION ARCHITECTURE

### Backend Service (Python/FastAPI)

**New File:** `/backend/services/google_sheets_generator.py`

```python
from google.oauth2 import service_account
from googleapiclient.discovery import build
from typing import Dict, List, Any

class SOWSheetGenerator:
    """Generate professional SOW Google Sheets with formatting"""
    
    def __init__(self, service_account_file: str):
        self.sheets_service = build('sheets', 'v4', credentials)
        self.drive_service = build('drive', 'v3', credentials)
    
    def create_sow_sheet(self, 
                        sow_data: Dict,
                        user_email: str,
                        parent_folder_id: str = None) -> str:
        """
        Create a professional SOW Google Sheet
        
        Args:
            sow_data: Dictionary with client_name, project_title, 
                     deliverables, pricing_rows, assumptions, timeline
            user_email: Email to share sheet with
            parent_folder_id: Optional folder to create sheet in
        
        Returns:
            Sheet URL
        """
        
        # Step 1: Create spreadsheet
        sheet_id = self._create_spreadsheet(sow_data)
        
        # Step 2: Clear default sheets
        self._clear_default_sheets(sheet_id)
        
        # Step 3: Add content sections
        self._add_header_section(sheet_id, sow_data)
        self._add_overview_section(sheet_id, sow_data)
        self._add_deliverables_section(sheet_id, sow_data)
        self._add_pricing_section(sheet_id, sow_data)
        self._add_assumptions_section(sheet_id, sow_data)
        
        # Step 4: Apply formatting
        self._apply_branding_formatting(sheet_id)
        self._apply_pricing_table_formatting(sheet_id)
        self._adjust_column_widths(sheet_id)
        
        # Step 5: Share with user
        self._share_sheet(sheet_id, user_email)
        
        # Step 6: Move to folder (optional)
        if parent_folder_id:
            self._move_to_folder(sheet_id, parent_folder_id)
        
        return f"https://docs.google.com/spreadsheets/d/{sheet_id}"
    
    def _create_spreadsheet(self, sow_data: Dict) -> str:
        """Create new spreadsheet with proper title"""
        title = f"{sow_data['client_name']} - {sow_data['project_title']} SOW"
        
        spreadsheet = {
            'properties': {
                'title': title,
                'locale': 'en_AU',
                'autoRecalc': 'ON_CHANGE',
                'timeZone': 'Australia/Sydney'
            }
        }
        
        result = self.sheets_service.spreadsheets().create(
            body=spreadsheet
        ).execute()
        
        return result.get('spreadsheetId')
    
    def _add_header_section(self, sheet_id: str, sow_data: Dict):
        """Add Social Garden branded header"""
        
        requests = [
            # Row 1: Social Garden branding
            {
                'updateCells': {
                    'range': {
                        'sheetId': 0,
                        'rowIndex': 0,
                        'columnIndex': 0,
                        'rowSpan': 1,
                        'columnSpan': 4
                    },
                    'rows': [{
                        'values': [{
                            'userEnteredValue': {'stringValue': 'SOCIAL GARDEN'},
                            'userEnteredFormat': {
                                'backgroundColor': {'red': 0.11, 'green': 0.75, 'blue': 0.48},  # #1CBF79
                                'textFormat': {
                                    'fontSize': 14,
                                    'bold': True,
                                    'foregroundColor': {'red': 1, 'green': 1, 'blue': 1}  # White
                                },
                                'alignment': {
                                    'horizontalAlignment': 'CENTER',
                                    'verticalAlignment': 'MIDDLE'
                                }
                            }
                        }]
                    }],
                    'fields': 'userEnteredValue,userEnteredFormat'
                }
            },
            
            # Row 2: Header info (CLIENT | PROJECT TYPE | SERVICES)
            {
                'updateCells': {
                    'range': {
                        'sheetId': 0,
                        'rowIndex': 1,
                        'columnIndex': 0,
                        'rowSpan': 1,
                        'columnSpan': 4
                    },
                    'rows': [{
                        'values': [{
                            'userEnteredValue': {
                                'stringValue': f"{sow_data.get('client_type', 'CLIENT')} | {sow_data.get('project_type', 'PROJECT')} | SERVICES"
                            },
                            'userEnteredFormat': {
                                'backgroundColor': {'red': 0.11, 'green': 0.75, 'blue': 0.48},
                                'textFormat': {
                                    'fontSize': 11,
                                    'foregroundColor': {'red': 1, 'green': 1, 'blue': 1},
                                    'bold': True
                                }
                            }
                        }]
                    }],
                    'fields': 'userEnteredValue,userEnteredFormat'
                }
            },
            
            # Merge header cells
            {
                'mergeCells': {
                    'range': {
                        'sheetId': 0,
                        'startRowIndex': 0,
                        'endRowIndex': 1,
                        'startColumnIndex': 0,
                        'endColumnIndex': 4
                    }
                }
            },
            {
                'mergeCells': {
                    'range': {
                        'sheetId': 0,
                        'startRowIndex': 1,
                        'endRowIndex': 2,
                        'startColumnIndex': 0,
                        'endColumnIndex': 4
                    }
                }
            }
        ]
        
        self.sheets_service.spreadsheets().batchUpdate(
            spreadsheetId=sheet_id,
            body={'requests': requests}
        ).execute()
    
    def _add_overview_section(self, sheet_id: str, sow_data: Dict):
        """Add overview text section"""
        
        overview_text = f"""Overview:
This scope of work details a proposed solution for Social Garden to support {sow_data.get('client_name', 'CLIENT')} with {sow_data.get('project_type', 'services')} related to the {sow_data.get('project_title', 'project')}."""
        
        requests = [
            {
                'updateCells': {
                    'range': {
                        'sheetId': 0,
                        'rowIndex': 3,
                        'columnIndex': 0,
                        'rowSpan': 2,
                        'columnSpan': 4
                    },
                    'rows': [{
                        'values': [{
                            'userEnteredValue': {'stringValue': overview_text},
                            'userEnteredFormat': {
                                'wrapStrategy': 'WRAP',
                                'textFormat': {'fontSize': 10}
                            }
                        }]
                    }],
                    'fields': 'userEnteredValue,userEnteredFormat'
                }
            }
        ]
        
        self.sheets_service.spreadsheets().batchUpdate(
            spreadsheetId=sheet_id,
            body={'requests': requests}
        ).execute()
    
    def _add_pricing_section(self, sheet_id: str, sow_data: Dict):
        """Add pricing table with formatting"""
        
        # Build pricing rows
        pricing_rows = []
        
        # Header row
        pricing_rows.append({
            'values': [
                {'userEnteredValue': {'stringValue': 'Role'}},
                {'userEnteredValue': {'stringValue': 'Hours'}},
                {'userEnteredValue': {'stringValue': 'Rate (AUD)'}},
                {'userEnteredValue': {'stringValue': 'Total Cost'}}
            ]
        })
        
        # Data rows
        for role_data in sow_data.get('pricing_rows', []):
            pricing_rows.append({
                'values': [
                    {'userEnteredValue': {'stringValue': role_data.get('role', '')}},
                    {'userEnteredValue': {'numberValue': role_data.get('hours', 0)}},
                    {'userEnteredValue': {'numberValue': role_data.get('rate', 0)}},
                    {'userEnteredValue': {'formulaValue': f'=B{len(pricing_rows)+1}*C{len(pricing_rows)+1}'}}
                ]
            })
        
        # Total row
        total_hours = sum([r.get('hours', 0) for r in sow_data.get('pricing_rows', [])])
        total_cost = sum([r.get('hours', 0) * r.get('rate', 0) for r in sow_data.get('pricing_rows', [])])
        
        pricing_rows.append({
            'values': [
                {'userEnteredValue': {'stringValue': 'TOTAL'}},
                {'userEnteredValue': {'numberValue': total_hours}},
                {'userEnteredValue': {'stringValue': ''}},
                {'userEnteredValue': {'stringValue': f'${total_cost:,.0f} +GST'}}
            ]
        })
        
        # Format header row
        for idx, row in enumerate(pricing_rows):
            if idx == 0:  # Header
                for cell in row['values']:
                    cell['userEnteredFormat'] = {
                        'backgroundColor': {'red': 0.9, 'green': 0.9, 'blue': 0.9},
                        'textFormat': {'bold': True}
                    }
        
        requests = [
            {
                'updateCells': {
                    'range': {
                        'sheetId': 0,
                        'rowIndex': 20,  # Row where pricing starts
                        'columnIndex': 0
                    },
                    'rows': pricing_rows,
                    'fields': 'userEnteredValue,userEnteredFormat'
                }
            }
        ]
        
        self.sheets_service.spreadsheets().batchUpdate(
            spreadsheetId=sheet_id,
            body={'requests': requests}
        ).execute()
    
    def _apply_branding_formatting(self, sheet_id: str):
        """Apply Social Garden branding throughout sheet"""
        
        requests = [
            {
                'updateSheetProperties': {
                    'properties': {
                        'sheetId': 0,
                        'gridProperties': {
                            'frozenRowCount': 2,  # Freeze header rows
                        }
                    },
                    'fields': 'gridProperties.frozenRowCount'
                }
            }
        ]
        
        self.sheets_service.spreadsheets().batchUpdate(
            spreadsheetId=sheet_id,
            body={'requests': requests}
        ).execute()
    
    def _adjust_column_widths(self, sheet_id: str):
        """Auto-size columns for readability"""
        
        requests = [
            {
                'autoResizeDimensions': {
                    'dimensions': {
                        'sheetId': 0,
                        'dimension': 'COLUMNS',
                        'startIndex': 0,
                        'endIndex': 4
                    }
                }
            }
        ]
        
        self.sheets_service.spreadsheets().batchUpdate(
            spreadsheetId=sheet_id,
            body={'requests': requests}
        ).execute()
    
    def _share_sheet(self, sheet_id: str, user_email: str):
        """Share sheet with user"""
        
        permission = {
            'type': 'user',
            'role': 'owner',
            'emailAddress': user_email
        }
        
        self.drive_service.permissions().create(
            fileId=sheet_id,
            body=permission,
            fields='id'
        ).execute()
```

### Frontend API Route

**New File:** `/frontend/app/api/create-sow-sheet/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { sowData, userEmail, accessToken } = await request.json();

    // Validate input
    if (!sowData || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Call backend service
    const response = await fetch('http://localhost:8000/api/sheets/create-sow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        sow_data: sowData,
        user_email: userEmail,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create sheet');
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      sheet_url: data.sheet_url,
      sheet_id: data.sheet_id,
    });
  } catch (error) {
    console.error('Error creating sheet:', error);
    return NextResponse.json(
      { error: 'Failed to create sheet' },
      { status: 500 }
    );
  }
}
```

### Frontend Component (Create Sheet Button)

**Update:** `/frontend/components/sow/create-sheet-button.tsx`

```tsx
'use client';

import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CreateSheetButtonProps {
  sowData: {
    clientName: string;
    projectTitle: string;
    deliverables: string[];
    pricingRows: Array<{ role: string; hours: number; rate: number }>;
    assumptions: string[];
    timeline: string;
  };
  userEmail: string;
}

export function CreateSheetButton({
  sowData,
  userEmail,
}: CreateSheetButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();

  const handleCreateSheet = async () => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/create-sow-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sowData,
          userEmail,
        }),
      });

      if (!response.ok) throw new Error('Failed to create sheet');

      const data = await response.json();
      setSheetUrl(data.sheet_url);
      setShowSuccess(true);

      toast({
        title: '✅ Sheet Created Successfully!',
        description: 'Professional SOW sheet ready to share.',
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: '❌ Failed to Create Sheet',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleCreateSheet}
        disabled={isLoading}
        className="gap-2"
      >
        <Share2 className="w-4 h-4" />
        {isLoading ? 'Creating Sheet...' : 'Create Professional Sheet'}
      </Button>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>✅ Professional Sheet Created!</DialogTitle>
            <DialogDescription>
              Your SOW sheet is ready to share with clients.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm">
              The sheet has been created in your Google Drive with professional
              Social Garden formatting and is ready to share.
            </p>

            <div className="bg-gray-100 p-3 rounded text-sm break-all">
              {sheetUrl}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => window.open(sheetUrl!, '_blank')}
                className="flex-1"
              >
                Open in Google Sheets
              </Button>

              <Button
                onClick={() => {
                  navigator.clipboard.writeText(sheetUrl!);
                  toast({ title: 'Link copied to clipboard' });
                }}
                variant="outline"
              >
                Copy Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

---

## DEPLOYMENT FLOW

```
1. User clicks [Create Professional Sheet]
        ↓
2. Frontend calls /api/create-sow-sheet
        ↓
3. Backend service:
   • Creates Google Sheet
   • Adds branding header
   • Adds all SOW sections
   • Applies formatting
   • Shares with user
        ↓
4. Sheet URL returned to frontend
        ↓
5. User sees success modal with:
   • [Open in Google Sheets] button
   • [Copy Link] button
   • Direct URL displayed
        ↓
6. User can:
   • Open in Sheets immediately
   • Copy link and send to client
   • Share via email
   • Collaborate in real-time
```

---

## TIMELINE TO DEPLOY

- **Day 1-2:** Backend service development (6-7 hours)
- **Day 3:** Frontend integration (2-3 hours)
- **Day 4:** Testing and refinement (2 hours)
- **Day 5:** Deploy to production (1 hour)

**Total:** 11-13 hours  
**Deploy by:** End of this week or early next

---

## ADVANTAGES

✅ **Client-facing immediately** - Professional sheet, not CSV  
✅ **One-click operation** - User clicks button, done  
✅ **Professional branding** - Social Garden styling included  
✅ **No manual work** - Formatting applied automatically  
✅ **Shareable** - Direct link to share with clients  
✅ **Collaborative** - Clients can comment/edit  
✅ **Better than PDF** - Editable and flexible  
✅ **Professional UX** - Modern, streamlined experience  

---

## NEXT DECISION

**Approve this approach?**
- ✅ Yes, build direct sheets with professional formatting
- ❓ Need clarification
- 🔄 Want to modify something

Let me know and I'll start implementation!
