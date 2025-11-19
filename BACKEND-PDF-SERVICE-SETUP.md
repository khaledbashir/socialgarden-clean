# Backend PDF Service Setup Guide

## Quick Start

The PDF export requires a backend service running. Here's how to set it up:

### Option 1: Run Backend Locally (Development)

```bash
cd /root/the11-dev/backend

# Create virtual environment if it doesn't exist
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the backend service
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`

### Option 2: Use EasyPanel Backend Service

If you have the backend deployed on EasyPanel, set the environment variable:

```bash
NEXT_PUBLIC_PDF_SERVICE_URL=https://ahmad-socialgarden-backend.840tjq.easypanel.host
```

### Option 3: Use Development Script

The project includes a `dev.sh` script that starts both frontend and backend:

```bash
chmod +x dev.sh
./dev.sh
```

## Verify Backend is Running

Test the backend health endpoint:

```bash
curl http://localhost:8000/health
```

Should return:
```json
{"status": "healthy", "service": "Social Garden PDF Service"}
```

## Backend Endpoints

The backend provides these PDF endpoints:

1. **Standard PDF Export**: `POST /generate-pdf`
   - Accepts: `html_content`, `filename`, `show_pricing_summary`, `final_investment_target_text`
   - Returns: PDF file

2. **Professional PDF Export**: `POST /generate-professional-pdf`
   - Accepts: Multi-scope structured data
   - Returns: PDF file

3. **Health Check**: `GET /health`
   - Returns: Service status

## Environment Variables

Make sure your frontend has:

```bash
NEXT_PUBLIC_PDF_SERVICE_URL=http://localhost:8000  # For local dev
# OR
NEXT_PUBLIC_PDF_SERVICE_URL=https://ahmad-socialgarden-backend.840tjq.easypanel.host  # For production
```

## Troubleshooting

### Backend Not Responding

1. Check if backend is running:
   ```bash
   ps aux | grep uvicorn
   ```

2. Check backend logs:
   ```bash
   tail -f /tmp/backend.log
   ```

3. Test backend directly:
   ```bash
   curl -X POST http://localhost:8000/health
   ```

### PDF Generation Fails

1. Check backend logs for errors
2. Verify WeasyPrint dependencies are installed
3. Check if logo file exists: `backend/social-garden-logo-dark-new.png`

### Connection Errors

1. Verify `NEXT_PUBLIC_PDF_SERVICE_URL` is set correctly
2. Check CORS settings in `backend/main.py` (line 24-33)
3. Ensure backend is accessible from frontend domain

## Backend Branch

If you have a separate backend branch:

```bash
# Checkout backend branch
git checkout backend-service

# Or merge backend changes
git merge backend-service
```

## Quick Test

Test PDF generation:

```bash
curl -X POST http://localhost:8000/generate-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "html_content": "<h1>Test</h1>",
    "filename": "test"
  }' \
  --output test.pdf
```

If this works, the backend is functioning correctly.

