from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from weasyprint import HTML, CSS
from jinja2 import Template
import os
import uuid
from typing import Optional

app = FastAPI(title="Social Garden PDF Service", version="1.0.0")

class PDFRequest(BaseModel):
    html_content: str
    css_content: Optional[str] = None
    filename: Optional[str] = "social_garden_sow"

# Professional Social Garden HTML template
SOW_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Social Garden - Scope of Work</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        {{ css_content }}
    </style>
</head>
<body>
    <div class="sow-document">
        <div class="sow-header">
            <img src="data:image/png;base64,{{ logo_base64 }}" alt="Social Garden Logo" class="sow-logo">
            <h1>Social Garden</h1>
            <p>Marketing Automation & CRM Specialists</p>
        </div>

        <div class="sow-content">
            {{ html_content }}
        </div>

        <div class="sow-footer">
            <hr style="border: 1px solid #8e4c24; margin: 2rem 0;">
            <p style="text-align: center; color: #666; font-size: 0.875rem;">
                This document is confidential and intended solely for the addressee.
                Social Garden Pty Ltd | marketing@socailgarden.com.au | www.socialgarden.com.au
            </p>
        </div>
    </div>
</body>
</html>
"""

# Professional CSS for PDF generation
DEFAULT_CSS = """
body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #1a1a1a;
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
    padding-bottom: 1rem;
    border-bottom: 3px solid #8e4c24;
}

.sow-logo {
    max-width: 200px;
    height: auto;
    margin-bottom: 1rem;
}

.sow-header h1 {
    font-family: 'Playfair Display', serif;
    font-size: 2.5rem;
    font-weight: 700;
    color: #8e4c24;
    margin: 0.5rem 0;
}

.sow-header p {
    color: #666;
    font-size: 1.1rem;
    margin: 0;
}

h1, h2, h3, h4, h5, h6 {
    font-family: 'Playfair Display', serif;
    font-weight: 600;
    line-height: 1.2;
    color: #1a1a1a;
    page-break-after: avoid;
}

h1 {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
    border-bottom: 2px solid #8e4c24;
    padding-bottom: 0.5rem;
    page-break-after: avoid;
}

h2 {
    font-size: 1.75rem;
    font-weight: 600;
    margin-top: 2rem;
    margin-bottom: 1rem;
    color: #8e4c24;
    page-break-after: avoid;
}

h3 {
    font-size: 1.375rem;
    font-weight: 600;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
    page-break-after: avoid;
}

p {
    margin-bottom: 1rem;
    text-align: justify;
}

ul, ol {
    margin-bottom: 1rem;
    padding-left: 1.5rem;
}

li {
    margin-bottom: 0.5rem;
}

/* Professional table styling */
table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5rem 0;
    font-size: 0.875rem;
    page-break-inside: avoid;
}

th {
    background-color: #8e4c24;
    color: white;
    padding: 0.75rem 1rem;
    text-align: left;
    font-weight: 600;
    border: 1px solid #6b3a1e;
}

td {
    padding: 0.75rem 1rem;
    border: 1px solid #e5e5e5;
    color: #1a1a1a;
}

tbody tr:nth-child(even) {
    background-color: #f9f9f9;
}

/* Code blocks */
pre {
    background: #f8f8f8;
    border: 1px solid #e5e5e5;
    border-radius: 0.375rem;
    padding: 1rem;
    overflow-x: auto;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 0.875rem;
    margin: 1rem 0;
    page-break-inside: avoid;
}

code {
    background: #f1f1f1;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 0.875rem;
}

/* Blockquotes */
blockquote {
    border-left: 4px solid #8e4c24;
    padding-left: 1rem;
    margin: 1.5rem 0;
    font-style: italic;
    color: #666;
}

/* Links */
a {
    color: #8e4c24;
    text-decoration: underline;
}

a:hover {
    color: #6b3a1e;
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
    text-align: center;
    border-top: 1px solid #e5e5e5;
    padding-top: 1rem;
}

.sow-footer p {
    color: #666;
    font-size: 0.75rem;
    margin: 0;
}

/* Print-specific styles */
@media print {
    body {
        font-size: 12pt;
    }

    .sow-document {
        padding: 1rem;
        max-width: none;
    }

    h1 {
        font-size: 24pt;
    }

    h2 {
        font-size: 18pt;
    }

    h3 {
        font-size: 14pt;
    }

    table {
        font-size: 10pt;
    }
}
"""

@app.post("/generate-pdf")
async def generate_pdf(request: PDFRequest):
    try:
        # Create unique filename
        pdf_filename = f"{request.filename}_{uuid.uuid4().hex[:8]}.pdf"
        pdf_path = f"/tmp/{pdf_filename}"

        # Get logo as base64 (you would replace this with actual logo)
        logo_base64 = ""  # Placeholder - would load actual logo

        # Combine HTML content with template
        template = Template(SOW_TEMPLATE)
        css_content = request.css_content or DEFAULT_CSS

        full_html = template.render(
            html_content=request.html_content,
            css_content=css_content,
            logo_base64=logo_base64
        )

        # Generate PDF using updated weasyprint API
        html_doc = HTML(string=full_html)
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)