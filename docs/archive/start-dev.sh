#!/bin/bash

# Kill any existing processes
echo "🛑 Stopping existing processes..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "uvicorn" 2>/dev/null || true
pkill -f "turbo" 2>/dev/null || true
sleep 2

# Start PDF service
echo "🚀 Starting PDF service on port 8000..."
cd /workspaces/codespaces-nextjs/pdf-service
uvicorn main:app --host 0.0.0.0 --port 8000 --reload > /tmp/pdf-service.log 2>&1 &
PDF_PID=$!
echo "   PDF service PID: $PDF_PID"

# Wait for PDF service to be ready
echo "⏳ Waiting for PDF service to start..."
sleep 3
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ PDF service is running!"
else
    echo "❌ PDF service failed to start"
    cat /tmp/pdf-service.log
    exit 1
fi

# Start Next.js dev server
echo "🚀 Starting Next.js dev server on port 3000..."
cd /workspaces/codespaces-nextjs/novel-editor-demo
pnpm dev > /tmp/nextjs.log 2>&1 &
NEXT_PID=$!
echo "   Next.js PID: $NEXT_PID"

echo ""
echo "✅ All services started!"
echo "   - PDF Service: http://localhost:8000"
echo "   - Next.js App: http://localhost:3000"
echo ""
echo "📋 Process IDs:"
echo "   PDF Service: $PDF_PID"
echo "   Next.js: $NEXT_PID"
echo ""
echo "📝 Logs:"
echo "   PDF: tail -f /tmp/pdf-service.log"
echo "   Next.js: tail -f /tmp/nextjs.log"
echo ""
echo "🛑 To stop all services: pkill -f 'next dev' && pkill -f uvicorn"
echo ""

# Keep script running and show logs
tail -f /tmp/nextjs.log
