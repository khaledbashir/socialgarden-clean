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
echo "🧹 Cleaning up ports 3333 and 8000..."
lsof -ti:3333 | xargs kill -9 2>/dev/null || true
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
sleep 2

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📄 STARTING BACKEND (Python FastAPI)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

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

# Start backend
echo "  🚀 Starting uvicorn on port 8000..."
uvicorn main:app --reload --host 0.0.0.0 --port 8000 > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
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
echo "  🔌 Backend:  http://localhost:8000"
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
    kill $BACKEND_PID 2>/dev/null || true
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    lsof -ti:3333 | xargs kill -9 2>/dev/null || true
    echo "✅ All services stopped"
    echo ""
}

trap cleanup EXIT

# Run frontend in foreground (you'll see ALL compilation output, errors, etc.)
PORT=3333 pnpm dev
