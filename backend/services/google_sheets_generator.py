"""
Google Sheets Generator Service
Handles creating formatted Google Sheets from SOW data
"""

import json
import os
from typing import Optional, Dict, Any
from google.oauth2 import service_account
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from datetime import datetime

# Social Garden branding colors
SG_GREEN = "#1CBF79"
SG_DARK = "#0e2e33"
SG_LIGHT_GRAY = "#f5f5f5"

class GoogleSheetsGenerator:
    """Generate formatted Google Sheets from SOW data"""
    
    def __init__(self, access_token: str = None):
        """Initialize Google Sheets client with OAuth access token or service account"""
        if access_token:
            # Use OAuth token
            print(f"DEBUG: Using OAuth token for authentication")
            self.credentials = Credentials(token=access_token)
            self.sheets_service = build('sheets', 'v4', credentials=self.credentials)
            self.drive_service = build('drive', 'v3', credentials=self.credentials)
            print("DEBUG: OAuth credentials initialized")
        else:
            # Fallback to service account (original code)
            service_account_json = os.getenv('GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON')
            if not service_account_json:
                raise ValueError("Either OAuth token or GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON must be provided")
            
            try:
                # Parse service account JSON
                print(f"DEBUG: Parsing service account JSON (length: {len(service_account_json)})")
                service_account_info = json.loads(service_account_json)
                print(f"DEBUG: Service account parsed. Project ID: {service_account_info.get('project_id')}")
                print(f"DEBUG: Service account email: {service_account_info.get('client_email')}")
                
                # Create credentials with quota project
                self.credentials = service_account.Credentials.from_service_account_info(
                    service_account_info,
                    scopes=['https://www.googleapis.com/auth/spreadsheets', 
                           'https://www.googleapis.com/auth/drive'],
                    quota_project_id=service_account_info.get('project_id')
                )
                print("DEBUG: Credentials created successfully")
                
                # Build service clients
                self.sheets_service = build('sheets', 'v4', credentials=self.credentials)
                self.drive_service = build('drive', 'v3', credentials=self.credentials)
                print("DEBUG: Service clients built successfully")
            except json.JSONDecodeError as e:
                raise ValueError(f"Failed to parse service account JSON: {str(e)}")
            except Exception as e:
                import traceback
                print(f"ERROR initializing Google Sheets: {traceback.format_exc()}")
                raise ValueError(f"Failed to initialize Google Sheets client: {str(e)}")
        
        self.auto_share_email = os.getenv('GOOGLE_SHEETS_AUTO_SHARE_EMAIL')
        print(f"DEBUG: Auto-share email: {self.auto_share_email}")
    
    def create_sow_sheet(self, client_name: str, service_name: str, sow_data: Dict[str, Any]) -> Dict[str, str]:
        """
        Create a formatted SOW in Google Sheets
        
        Args:
            client_name: Client name for sheet naming
            service_name: Service name for sheet naming
            sow_data: Dictionary containing SOW content sections
            
        Returns:
            Dictionary with sheet_id, sheet_url, and share_link
        """
        try:
            # Create spreadsheet
            sheet_id = self._create_spreadsheet(client_name, service_name)
            
            # Add header section
            self._add_header_section(sheet_id, client_name, service_name)
            
            # Add content sections
            if 'overview' in sow_data:
                self._add_section(sheet_id, "Overview", sow_data['overview'], row=8)
            
            if 'deliverables' in sow_data:
                self._add_section(sheet_id, "What's Included", sow_data['deliverables'], row=15)
            
            if 'outcomes' in sow_data:
                self._add_section(sheet_id, "Project Outcomes", sow_data['outcomes'], row=22)
            
            if 'phases' in sow_data:
                self._add_section(sheet_id, "Project Phases", sow_data['phases'], row=29)
            
            if 'pricing' in sow_data:
                self._add_pricing_section(sheet_id, sow_data['pricing'], row=36)
            
            if 'assumptions' in sow_data:
                self._add_section(sheet_id, "Assumptions", sow_data['assumptions'], row=50)
            
            if 'timeline' in sow_data:
                self._add_section(sheet_id, "Timeline", sow_data['timeline'], row=56)
            
            # Apply formatting
            self._apply_branding_formatting(sheet_id)
            
            # Share with auto-share email if configured
            if self.auto_share_email:
                self._share_sheet(sheet_id, self.auto_share_email, 'user', 'viewer')
            
            # Get sheet URLs
            sheet_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/edit"
            share_link = f"https://docs.google.com/spreadsheets/d/{sheet_id}/edit?usp=sharing"
            
            return {
                'sheet_id': sheet_id,
                'sheet_url': sheet_url,
                'share_link': share_link,
                'status': 'success'
            }
            
        except HttpError as e:
            if '403' in str(e):
                # If permission denied, provide helpful error message
                print(f"ERROR: Google Sheets API 403 Permission Denied")
                print(f"Full error: {e}")
                print(f"The service account needs:")
                print(f"1. Google Sheets API enabled in the Google Cloud project")
                print(f"2. Editor role on the project")
                print(f"3. Service Account User role (in IAM)")
                print(f"Service account email: {self.credentials.service_account_email if hasattr(self.credentials, 'service_account_email') else 'N/A'}")
                raise Exception(
                    f"Google Sheets API 403 Permission Denied. Error: {str(e)}"
                )
            raise Exception(f"Google Sheets API error: {str(e)}")
        except Exception as e:
            raise Exception(f"Failed to create SOW sheet: {str(e)}")
    
    def _create_spreadsheet(self, client_name: str, service_name: str) -> str:
        """Create a new spreadsheet with SOW naming convention"""
        title = f"SOW - {client_name} - {service_name} - {datetime.now().strftime('%b %Y')}"
        
        body = {
            'properties': {
                'title': title,
                'locale': 'en_AU',
                'timeZone': 'Australia/Sydney'
            }
        }
        
        request = self.sheets_service.spreadsheets().create(body=body)
        response = request.execute()
        sheet_id = response['spreadsheetId']
        
        # Move sheet to folder if folder ID is set
        folder_id = os.getenv('GOOGLE_SHEETS_FOLDER_ID')
        if folder_id:
            try:
                # Get current parents (default location)
                file_metadata = self.drive_service.files().get(
                    fileId=sheet_id,
                    fields='parents'
                ).execute()
                
                previous_parents = ",".join(file_metadata.get('parents', []))
                
                # Move to destination folder
                self.drive_service.files().update(
                    fileId=sheet_id,
                    addParents=folder_id,
                    removeParents=previous_parents,
                    fields='id, parents'
                ).execute()
                
                print(f"DEBUG: Sheet moved to folder {folder_id}")
            except Exception as e:
                print(f"WARNING: Could not move sheet to folder: {str(e)}")
        
        return sheet_id
    
    def _add_header_section(self, sheet_id: str, client_name: str, service_name: str):
        """Add Social Garden branding header"""
        requests = [
            # Merge cells for header
            {
                'mergeCells': {
                    'range': {
                        'sheetId': 0,
                        'startRowIndex': 0,
                        'endRowIndex': 1,
                        'startColumnIndex': 0,
                        'endColumnIndex': 6
                    }
                }
            },
            # Set header text
            {
                'updateCells': {
                    'range': {
                        'sheetId': 0,
                        'rowIndex': 0,
                        'columnIndex': 0
                    },
                    'rows': [
                        {
                            'values': [
                                {
                                    'userEnteredValue': {'stringValue': 'SOCIAL GARDEN'},
                                    'userEnteredFormat': {
                                        'backgroundColor': self._hex_to_rgb(SG_GREEN),
                                        'textFormat': {
                                            'foregroundColor': {'red': 1, 'green': 1, 'blue': 1},
                                            'fontSize': 18,
                                            'bold': True
                                        },
                                        'horizontalAlignment': 'CENTER',
                                        'verticalAlignment': 'MIDDLE',
                                        'padding': {'top': 10, 'bottom': 10}
                                    }
                                }
                            ]
                        }
                    ],
                    'fields': 'userEnteredValue,userEnteredFormat'
                }
            },
            # Set header row height
            {
                'updateSheetProperties': {
                    'fields': 'gridProperties.rowData(0)',
                    'properties': {
                        'sheetId': 0,
                        'gridProperties': {
                            'rowData': [{'pixelSize': 50}]
                        }
                    }
                }
            },
            # Add client/service info
            {
                'updateCells': {
                    'range': {
                        'sheetId': 0,
                        'rowIndex': 2,
                        'columnIndex': 0
                    },
                    'rows': [
                        {
                            'values': [
                                {'userEnteredValue': {'stringValue': f'CLIENT: {client_name}'}},
                                {'userEnteredValue': {'stringValue': f'SERVICE: {service_name}'}},
                                {'userEnteredValue': {'stringValue': f"DATE: {datetime.now().strftime('%d %b %Y')}"}},
                            ]
                        }
                    ],
                    'fields': 'userEnteredValue'
                }
            }
        ]
        
        self.sheets_service.spreadsheets().batchUpdate(
            spreadsheetId=sheet_id,
            body={'requests': requests}
        ).execute()
    
    def _add_section(self, sheet_id: str, title: str, content: str, row: int):
        """Add a text section to the sheet"""
        requests = [
            {
                'updateCells': {
                    'range': {
                        'sheetId': 0,
                        'rowIndex': row,
                        'columnIndex': 0
                    },
                    'rows': [
                        {
                            'values': [
                                {
                                    'userEnteredValue': {'stringValue': title},
                                    'userEnteredFormat': {
                                        'backgroundColor': self._hex_to_rgb(SG_LIGHT_GRAY),
                                        'textFormat': {
                                            'fontSize': 14,
                                            'bold': True,
                                            'foregroundColor': self._hex_to_rgb(SG_DARK)
                                        }
                                    }
                                }
                            ]
                        }
                    ],
                    'fields': 'userEnteredValue,userEnteredFormat'
                }
            },
            {
                'mergeCells': {
                    'range': {
                        'sheetId': 0,
                        'startRowIndex': row,
                        'endRowIndex': row + 1,
                        'startColumnIndex': 0,
                        'endColumnIndex': 6
                    }
                }
            },
            # Add content
            {
                'updateCells': {
                    'range': {
                        'sheetId': 0,
                        'rowIndex': row + 1,
                        'columnIndex': 0
                    },
                    'rows': [
                        {
                            'values': [
                                {
                                    'userEnteredValue': {'stringValue': content},
                                    'userEnteredFormat': {
                                        'wrapStrategy': 'WRAP',
                                        'verticalAlignment': 'TOP'
                                    }
                                }
                            ]
                        }
                    ],
                    'fields': 'userEnteredValue,userEnteredFormat'
                }
            },
            {
                'mergeCells': {
                    'range': {
                        'sheetId': 0,
                        'startRowIndex': row + 1,
                        'endRowIndex': row + 2,
                        'startColumnIndex': 0,
                        'endColumnIndex': 6
                    }
                }
            }
        ]
        
        self.sheets_service.spreadsheets().batchUpdate(
            spreadsheetId=sheet_id,
            body={'requests': requests}
        ).execute()
    
    def _add_pricing_section(self, sheet_id: str, pricing_data: list, row: int):
        """Add pricing table to sheet"""
        # This would be a more complex section with actual pricing table
        # For now, convert to formatted text
        pricing_text = self._format_pricing_table(pricing_data)
        self._add_section(sheet_id, "Pricing Summary", pricing_text, row)
    
    def _format_pricing_table(self, pricing_data: list) -> str:
        """Format pricing data as text"""
        if not pricing_data:
            return "No pricing data available"
        
        lines = []
        total = 0
        
        for item in pricing_data:
            if isinstance(item, dict):
                lines.append(f"{item.get('description', 'Item')}: ${item.get('amount', 0)}")
                total += float(item.get('amount', 0))
        
        lines.append(f"\nTOTAL: ${total:,.2f} + GST")
        return "\n".join(lines)
    
    def _apply_branding_formatting(self, sheet_id: str):
        """Apply Social Garden branding and formatting"""
        requests = [
            # Set column widths
            {
                'updateSheetProperties': {
                    'fields': 'gridProperties.columnData(0)',
                    'properties': {
                        'sheetId': 0,
                        'gridProperties': {
                            'columnData': [
                                {'pixelSize': 200},
                                {'pixelSize': 150},
                                {'pixelSize': 150},
                                {'pixelSize': 150},
                                {'pixelSize': 150},
                                {'pixelSize': 100}
                            ]
                        }
                    }
                }
            },
            # Freeze header rows
            {
                'updateSheetProperties': {
                    'fields': 'gridProperties.frozenRowCount',
                    'properties': {
                        'sheetId': 0,
                        'gridProperties': {'frozenRowCount': 4}
                    }
                }
            }
        ]
        
        self.sheets_service.spreadsheets().batchUpdate(
            spreadsheetId=sheet_id,
            body={'requests': requests}
        ).execute()
    
    def _share_sheet(self, sheet_id: str, email: str, role_type: str, role: str):
        """Share sheet with specified email address"""
        try:
            self.drive_service.permissions().create(
                fileId=sheet_id,
                body={
                    'type': role_type,
                    'role': role,
                    'emailAddress': email
                },
                fields='id'
            ).execute()
        except HttpError as e:
            # Silently fail on sharing - sheet is still created
            print(f"Warning: Could not share sheet with {email}: {str(e)}")
    
    @staticmethod
    def _hex_to_rgb(hex_color: str) -> dict:
        """Convert hex color to RGB format for Google Sheets API"""
        hex_color = hex_color.lstrip('#')
        r, g, b = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
        return {
            'red': r / 255,
            'green': g / 255,
            'blue': b / 255
        }


def create_sow_sheet(client_name: str, service_name: str, sow_data: Dict[str, Any], access_token: str = None) -> Dict[str, str]:
    """Helper function to create SOW sheet"""
    generator = GoogleSheetsGenerator(access_token=access_token)
    return generator.create_sow_sheet(client_name, service_name, sow_data)
