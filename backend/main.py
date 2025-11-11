from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import weasyprint
from jinja2 import Template
import base64
import os
from pathlib import Path
from typing import Optional, Dict, Any
from dotenv import load_dotenv
from services.google_sheets_generator import create_sow_sheet
from services.google_oauth_handler import get_oauth_handler

# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="Social Garden PDF & Sheets Service")

# Enable CORS for frontend requests
# 🔒 Security: Only allow requests from our frontend domain
# For local dev, add "http://localhost:3000" to the list
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://sow-generator.socialgarden.com.au",
        "http://localhost:3000",  # Local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PDFRequest(BaseModel):
    html_content: str
    filename: str = "document"
    show_pricing_summary: bool = True  # 🎯 Smart PDF Export: flag to control pricing summary visibility
    content: Optional[Dict[str, Any]] = None  # TipTap JSON content for enforcement checks
    final_investment_target_text: Optional[str] = None  # 🎯 Authoritative final price to display in PDF

class SheetRequest(BaseModel):
    client_name: str
    service_name: str
    overview: Optional[str] = ""
    deliverables: Optional[str] = ""
    outcomes: Optional[str] = ""
    phases: Optional[str] = ""
    pricing: Optional[list] = None
    assumptions: Optional[str] = ""
    timeline: Optional[str] = ""

# HTML template - Clean template with only logo and footer
SOW_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Statement of Work</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        {{ css_content }}
    </style>
</head>
<body>
    <div class="sow-document">
        <div class="sow-header">
            {% if logo_base64 %}
            <img src="data:image/png;base64,{{ logo_base64 }}" alt="Company Logo" class="sow-logo">
            {% endif %}
        </div>

        <div class="sow-content">
            {{ html_content }}
            {% if final_investment_target_text %}
            <h4 style="margin-top: 20px;">Summary</h4>
            <table class="summary-table">
                <tr>
                    <td style="text-align: right; padding-right: 12px;"><strong>Final Project Value:</strong></td>
                    <td class="num" style="color: #2C823D; font-size: 18px;">
                        <strong>{{ final_investment_target_text }}</strong>
                    </td>
                </tr>
            </table>
            <p style="color:#6b7280; font-size: 0.85em; margin-top: 4px;">This final project value is authoritative and supersedes any computed totals.</p>
            {% endif %}
        </div>

        <div class="sow-footer">
            <hr>
            <p><strong>Social Garden Pty Ltd</strong></p>
            <p>marketing@socialgarden.com.au | www.socialgarden.com.au</p>
            <p>This document is confidential and intended solely for the addressee.</p>
        </div>
    </div>
</body>
</html>
"""

# Professional CSS for PDF generation with Social Garden Branding
DEFAULT_CSS = """
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

body {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    line-height: 1.6;
    color: #0e2e33;
    margin: 0;
    padding: 0;
    background: white;
}

.sow-document {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    background: white;
}

.sow-header {
    text-align: center;
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 3px solid #20e28f;
}

.sow-logo {
    max-width: 180px;
    height: auto;
    margin: 0 auto;
    display: block;
}

h1, h2, h3, h4, h5, h6 {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 700;
    line-height: 1.3;
    color: #0e2e33;
    page-break-after: avoid;
}

h1 {
    font-size: 2rem;
    font-weight: 800;
    margin-bottom: 1.5rem;
    border-bottom: 3px solid #20e28f;
    padding-bottom: 0.5rem;
    page-break-after: avoid;
}

h2 {
    font-size: 1.75rem;
    font-weight: 700;
    margin-top: 2rem;
    margin-bottom: 1rem;
    color: #0e2e33;
    page-break-after: avoid;
}

h3 {
    font-size: 1.375rem;
    font-weight: 600;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
    page-break-after: avoid;
}

h4 {
    font-size: 1.125rem;
    font-weight: 600;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
}

p {
    margin-bottom: 1rem;
    line-height: 1.7;
}

strong, b {
    font-weight: 700;
    color: #0e2e33;
}

em, i {
    font-style: italic;
}

ul, ol {
    margin-bottom: 1rem;
    padding-left: 1.5rem;
    line-height: 1.8;
}

li {
    margin-bottom: 0.5rem;
}

/* Professional table styling with Social Garden colors */
table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5rem 0;
    font-size: 0.9rem;
    page-break-inside: auto;
    border: 2px solid #0e2e33;
}

thead {
    display: table-header-group;
}

tbody {
    display: table-row-group;
}

th {
    background-color: #0e2e33;
    color: white;
    padding: 0.875rem 1rem;
    text-align: left;
    font-weight: 700;
    border: 1px solid #0e2e33;
    font-family: 'Plus Jakarta Sans', sans-serif;
}

td {
    padding: 0.875rem 1rem;
    border: 1px solid #d1d5db;
    color: #0e2e33;
    vertical-align: top;
}

tbody tr:nth-child(even) {
    background-color: #f9fafb;
}

tbody tr:nth-child(odd) {
    background-color: white;
}

tbody tr:hover {
    background-color: #f0fdf4;
}

/* Ensure tables don't break mid-row */
tr {
    page-break-inside: avoid;
}

/* Code blocks */
pre {
    background: #f8f9fa;
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
    padding: 1rem;
    overflow-x: auto;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 0.875rem;
    margin: 1rem 0;
    page-break-inside: avoid;
}

code {
    background: #f3f4f6;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 0.875rem;
    color: #0e2e33;
}

pre code {
    background: transparent;
    padding: 0;
}

/* Blockquotes */
blockquote {
    border-left: 4px solid #20e28f;
    padding-left: 1rem;
    margin: 1.5rem 0;
    font-style: italic;
    color: #4b5563;
}

/* Links */
a {
    color: #20e28f;
    text-decoration: underline;
}

a:hover {
    color: #0e2e33;
}

/* Horizontal rules */
hr {
    border: none;
    border-top: 2px solid #20e28f;
    margin: 2rem 0;
}

/* Page breaks */
.page-break {
    page-break-before: always;
}

.no-break {
    page-break-inside: avoid;
}

/* Footer */
.sow-footer {
    margin-top: 3rem;
    padding-top: 1.5rem;
    border-top: 2px solid #20e28f;
}

.sow-footer p {
    color: #6b7280;
    font-size: 0.8rem;
    margin: 0.5rem 0;
    text-align: center;
}

/* Print-specific styles */
@media print {
    body {
        font-size: 11pt;
    }

    .sow-document {
        padding: 1rem;
        max-width: none;
    }

    h1 {
        font-size: 22pt;
    }

    h2 {
        font-size: 18pt;
    }

    h3 {
        font-size: 14pt;
    }

    table {
        font-size: 9pt;
    }
}

/* Ensure content readability */
.sow-content {
    font-size: 0.95rem;
}

/* Special styling for important sections */
.highlight {
    background-color: #ecfdf5;
    border-left: 4px solid #20e28f;
    padding: 1rem;
    margin: 1rem 0;
}
"""

@app.post("/generate-pdf")
async def generate_pdf(request: PDFRequest):
    try:
        print("=== DEBUG: PDF Generation Request ===")
        print(f"📄 Filename: {request.filename}")
        print(f"🎯 Show Pricing Summary: {request.show_pricing_summary}")
        print(f"� Final Investment Target: {request.final_investment_target_text}")
        print(f"�📊 HTML Content Length: {len(request.html_content)}")
        print("=== Has table tag:", "<table" in request.html_content.lower(), "===")
        
        # 🎯 CRITICAL FIX: When final_investment_target_text is provided,
        # strip any computed summary sections from the HTML to avoid duplicates
        html_content = request.html_content
        if request.final_investment_target_text:
            import re
            # Remove any <h4>Summary</h4> section and its following table/paragraph
            # This regex removes: <h4...>Summary</h4> + following <table...>...</table> + optional disclaimer <p>
            html_content = re.sub(
                r'<h4[^>]*>\s*Summary\s*</h4>\s*<table[^>]*>.*?</table>\s*(<p[^>]*>.*?</p>)?',
                '',
                html_content,
                flags=re.IGNORECASE | re.DOTALL
            )
            print("✅ Stripped computed summary section from HTML (final_investment_target_text provided)")
        
        # Load and encode the Social Garden logo
        logo_base64 = ""
        # Use the newer logo file that matches frontend branding
        logo_path = Path(__file__).parent / "social-garden-logo-dark-new.png"
        if logo_path.exists():
            with open(logo_path, "rb") as logo_file:
                logo_base64 = base64.b64encode(logo_file.read()).decode('utf-8')
            print(f"✅ Logo loaded successfully from {logo_path}")
        else:
            print(f"⚠️ Logo file not found at {logo_path}")
        
        # Render the HTML template with Jinja2
        template = Template(SOW_TEMPLATE)
        full_html = template.render(
            html_content=html_content,
            css_content=DEFAULT_CSS,
            logo_base64=logo_base64,
            final_investment_target_text=request.final_investment_target_text,
        )
        
        # Generate PDF with WeasyPrint
        html_doc = weasyprint.HTML(string=full_html)
        
        # Create output directory if it doesn't exist
        output_dir = Path("/tmp/pdfs")
        output_dir.mkdir(exist_ok=True)
        
        # Generate PDF
        pdf_path = output_dir / f"{request.filename}.pdf"
        
        # Write PDF to bytes then to file
        pdf_bytes = html_doc.write_pdf()
        
        # Write to file
        with open(pdf_path, 'wb') as f:
            f.write(pdf_bytes)

        # Return PDF file
        return FileResponse(
            pdf_path,
            media_type='application/pdf',
            filename=f"{request.filename}.pdf"
        )

    except Exception as e:
        import traceback
        error_detail = f"PDF generation failed: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)  # Log to console
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Social Garden PDF Service"}

@app.post("/create-sheet")
async def create_sheet(request: SheetRequest):
    """Create a formatted Google Sheet from SOW data"""
    try:
        sow_data = {
            'overview': request.overview,
            'deliverables': request.deliverables,
            'outcomes': request.outcomes,
            'phases': request.phases,
            'pricing': request.pricing or [],
            'assumptions': request.assumptions,
            'timeline': request.timeline
        }
        
        result = create_sow_sheet(request.client_name, request.service_name, sow_data)
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        error_detail = f"Sheet creation failed: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)
        raise HTTPException(status_code=500, detail=f"Sheet creation failed: {str(e)}")

@app.get("/oauth/authorize")
async def oauth_authorize():
    """Get Google OAuth authorization URL"""
    try:
        oauth_handler = get_oauth_handler()
        auth_url, state = oauth_handler.get_authorization_url()
        return {
            'auth_url': auth_url,
            'state': state
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class OAuthTokenRequest(BaseModel):
    code: str

@app.post("/oauth/token")
async def oauth_token(request: OAuthTokenRequest):
    """Exchange OAuth code for access token"""
    try:
        oauth_handler = get_oauth_handler()
        token_dict = oauth_handler.exchange_code_for_token(request.code)
        
        # Encode token for safe transmission
        encoded_token = oauth_handler.encode_token(token_dict)
        
        return {
            'token': encoded_token,
            'access_token': token_dict.get('access_token'),
            'expires_in': token_dict.get('expires_in')
        }
    except Exception as e:
        print(f"ERROR exchanging token: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to get access token: {str(e)}")

class SOWItem(BaseModel):
    description: str  # REQUIRED
    role: str
    hours: float
    cost: float

class SOWScope(BaseModel):
    id: int  # REQUIRED
    title: str
    description: str
    items: list[SOWItem]
    deliverables: list[str]
    assumptions: list[str]  # REQUIRED

class ProfessionalPDFRequest(BaseModel):
    projectTitle: str
    scopes: list[SOWScope]
    discount: float = 0
    clientName: Optional[str] = None
    company: Optional[str] = "Social Garden"
    budgetNotes: Optional[str] = None
    authoritativeTotal: Optional[float] = None  # 🎯 AI-calculated authoritative total

class SheetRequestOAuth(BaseModel):
    client_name: str
    service_name: str
    overview: Optional[str] = ""
    deliverables: Optional[str] = ""
    outcomes: Optional[str] = ""
    phases: Optional[str] = ""
    pricing: Optional[list] = None
    assumptions: Optional[str] = ""
    timeline: Optional[str] = ""
    access_token: str

@app.post("/create-sheet-oauth")
async def create_sheet_oauth(request: SheetRequestOAuth):
    """Create a formatted Google Sheet using OAuth token"""
    try:
        if not request.access_token:
            raise ValueError("access_token is required")
        
        sow_data = {
            'overview': request.overview,
            'deliverables': request.deliverables,
            'outcomes': request.outcomes,
            'phases': request.phases,
            'pricing': request.pricing or [],
            'assumptions': request.assumptions,
            'timeline': request.timeline
        }
        
        result = create_sow_sheet(request.client_name, request.service_name, sow_data, access_token=request.access_token)
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        error_detail = f"Sheet creation failed: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)
        raise HTTPException(status_code=500, detail=f"Sheet creation failed: {str(e)}")

@app.post("/generate-professional-pdf")
async def generate_professional_pdf(request: ProfessionalPDFRequest):
    """Generate professional multi-scope PDF using structured data"""
    try:
        print("=== DEBUG: Professional PDF Generation Request ===")
        print(f"📄 Project Title: {request.projectTitle}")
        print(f"📊 Scopes: {len(request.scopes)} scopes")
        print(f"💰 Discount: {request.discount}%")
        print(f"👤 Client: {request.clientName or 'N/A'}")
        print(f"🏢 Company: {request.company}")
        
        # DEBUG: Log scope details
        for i, scope in enumerate(request.scopes):
            print(f"  📋 Scope {i+1}: {scope.title} (ID: {scope.id})")
            print(f"    📝 Description: {scope.description}")
            print(f"    👥 Items: {len(scope.items)} items")
            total_hours = sum(item.hours for item in scope.items)
            total_cost = sum(item.cost for item in scope.items)
            print(f"    ⏱️ Total Hours: {total_hours}")
            print(f"    💵 Total Cost: ${total_cost:.2f}")
            print(f"    📋 Deliverables: {len(scope.deliverables)} items")
            print(f"    ⚠️ Assumptions: {len(scope.assumptions)} items")
            print()
        
        # Load the professional multi-scope template
        template_path = Path(__file__).parent / "multiscope_template.html"
        if not template_path.exists():
            raise HTTPException(status_code=500, detail="Multi-scope template not found")
        
        with open(template_path, 'r', encoding='utf-8') as f:
            template_content = f.read()
        
        # Load and encode the Social Garden logo
        logo_base64 = ""
        logo_path = Path(__file__).parent / "social-garden-logo-dark-new.png"
        if logo_path.exists():
            with open(logo_path, "rb") as logo_file:
                logo_base64 = base64.b64encode(logo_file.read()).decode('utf-8')
            print(f"✅ Logo loaded successfully from {logo_path}")
        else:
            print(f"⚠️ Logo file not found at {logo_path}")
        
        # Render the template with Jinja2
        template = Template(template_content)
        
        # Calculate totals
        calculated_subtotal = sum(sum(item.cost for item in scope.items) for scope in request.scopes)
        
        # 🎯 Use authoritative total if provided (from AI), otherwise use calculated
        if request.authoritativeTotal is not None:
            print(f"🎯 Using authoritative total from AI: ${request.authoritativeTotal:.2f}")
            # Use authoritative total as final amount, scale other components proportionally
            total = request.authoritativeTotal
            gst_amount = total * (10/110)  # GST portion of total (10/110 = ~9.09%)
            subtotal_after_discount = total * (100/110)  # Pre-GST portion (100/110 = ~90.91%)
            discount_amount = calculated_subtotal - subtotal_after_discount
            subtotal = calculated_subtotal  # Keep original calculated subtotal for display
        else:
            print(f"🧮 Using calculated totals: ${calculated_subtotal:.2f}")
            subtotal = calculated_subtotal
            discount_amount = subtotal * (request.discount / 100)
            subtotal_after_discount = subtotal - discount_amount
            gst_amount = subtotal_after_discount * 0.10
            total = subtotal_after_discount + gst_amount
        
        full_html = template.render(
            projectTitle=request.projectTitle,
            scopes=request.scopes,
            discount=request.discount,
            clientName=request.clientName,
            company=request.company,
            budgetNotes=request.budgetNotes,
            logo_base64=logo_base64,
            subtotal=subtotal,
            discount_amount=discount_amount,
            subtotal_after_discount=subtotal_after_discount,
            gst_amount=gst_amount,
            total=total
        )
        
        # Generate PDF with WeasyPrint
        html_doc = weasyprint.HTML(string=full_html)
        
        # Create output directory if it doesn't exist
        output_dir = Path("/tmp/pdfs")
        output_dir.mkdir(exist_ok=True)
        
        # Generate PDF
        pdf_path = output_dir / f"{request.projectTitle.replace(' ', '-')}-Professional.pdf"
        
        # Write PDF to bytes then to file
        pdf_bytes = html_doc.write_pdf()
        
        # Write to file
        with open(pdf_path, 'wb') as f:
            f.write(pdf_bytes)

        print("✅ Professional multi-scope PDF generated successfully")
        
        # Return PDF file
        return FileResponse(
            pdf_path,
            media_type='application/pdf',
            filename=f"{request.projectTitle.replace(' ', '-')}-Professional.pdf"
        )

    except Exception as e:
        import traceback
        error_detail = f"Professional PDF generation failed: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)  # Log to console
        raise HTTPException(status_code=500, detail=f"Professional PDF generation failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
