#!/bin/bash

# 🚀 Social Garden SOW Generator - Development Server
# Runs frontend + backend with one command!

set -e

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔥 STARTING SOW GENERATOR DEV MODE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: Must run from /root/the11/ directory!"
    exit 1
fi

# Kill any Docker containers
echo "🛑 Stopping Docker containers..."
docker-compose down 2>/dev/null || true

# Kill any processes on our ports
if [ "$USE_REMOTE_BACKEND" = "1" ]; then
    echo "🧹 Cleaning up port 3333 (using remote backend; skipping local backend cleanup)..."
    lsof -ti:3333 | xargs kill -9 2>/dev/null || true
else
    echo "🧹 Cleaning up ports 3333 and 8000..."
    lsof -ti:3333 | xargs kill -9 2>/dev/null || true
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
fi
sleep 2

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📄 STARTING BACKEND (Python FastAPI)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# If USE_REMOTE_BACKEND=1 is set, we intentionally skip starting the local backend
if [ "$USE_REMOTE_BACKEND" = "1" ]; then
    # Use the NEXT_PUBLIC_PDF_SERVICE_URL if provided, otherwise fallback to known Easypanel URL
    BACKEND_URL="${NEXT_PUBLIC_PDF_SERVICE_URL:-https://ahmad-socialgarden-backend.840tjq.easypanel.host}"
    echo "  🛰 Using remote backend; skipping local backend start."
    echo "  🔗 Backend URL: $BACKEND_URL"

    # Light health check against the remote backend (non-blocking)
    echo "  🔍 Verifying remote backend health..."
    # Use GET request instead of HEAD to avoid 405 responses from backends that disallow HEAD.
    if curl -s --fail "$BACKEND_URL/health" > /dev/null 2>&1; then
        echo "  ✅ Remote backend is healthy and responding"
    else
        echo "  ⚠️  Remote backend did not respond to health check (URL: $BACKEND_URL)"
        echo "     You can continue, but frontend requests to the remote backend may fail until it is available."
    fi
else
    cd backend

    # Setup venv
    if [ ! -d "venv" ]; then
        echo "  📦 Creating virtual environment..."
        python3 -m venv venv
        source venv/bin/activate
        echo "  📥 Installing dependencies..."
        pip install -q -r requirements.txt
        echo "  ✅ Backend setup complete"
    else
        source venv/bin/activate
        echo "  ✅ Virtual environment activated"
    fi

    # Start local backend
    echo "  🚀 Starting uvicorn on port 8000..."
    uvicorn main:app --reload --host 0.0.0.0 --port 8000 > /tmp/backend.log 2>&1 &
    BACKEND_PID=$!
    BACKEND_URL="http://127.0.0.1:8000"
    echo "  ✅ Backend running (PID: $BACKEND_PID)"
    echo "  📋 Logs: tail -f /tmp/backend.log"

    cd ..
    sleep 3

    # Check if backend is actually running
    if ! lsof -ti:8000 > /dev/null; then
        echo ""
        echo "❌ ERROR: Backend failed to start!"
        echo "📋 Check logs: tail -f /tmp/backend.log"
        exit 1
    fi

    # Verify backend is responding
    echo "  🔍 Verifying backend health..."
    if curl -s http://127.0.0.1:8000/docs > /dev/null 2>&1; then
        echo "  ✅ Backend is healthy and responding"
    else
        echo "  ⚠️  Backend started but not responding yet (may take a few more seconds)"
    fi
fi

# Ensure the frontend dev server sees the right backend URL
export NEXT_PUBLIC_PDF_SERVICE_URL="$BACKEND_URL"
export NEXT_PUBLIC_BACKEND_URL="$BACKEND_URL"
export NEXT_PUBLIC_API_URL="$BACKEND_URL"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎨 STARTING FRONTEND (Next.js)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "  📦 Installing dependencies (first time)..."
    pnpm install
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SERVICES RUNNING"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  🌐 Frontend: http://localhost:3333"
echo "  🔌 Backend:  ${BACKEND_URL:-http://localhost:8000}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 YOU'LL SEE COMPILATION OUTPUT BELOW:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  ✓ Watch for 'Ready in Xs' = App is ready"
echo "  ✓ Hot reload works automatically"
echo "  ✓ Errors will show here"
echo ""
echo "  🛑 Press Ctrl+C to stop everything"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Cleanup function to kill backend on exit
cleanup() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🛑 STOPPING SERVICES..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ "$USE_REMOTE_BACKEND" != "1" ]; then
        lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    fi
    lsof -ti:3333 | xargs kill -9 2>/dev/null || true
    echo "✅ All services stopped"
    echo ""
}

trap cleanup EXIT

# Run frontend in foreground (you'll see ALL compilation output, errors, etc.)
PORT=3333 pnpm dev
