#!/bin/bash

# Quick script to start the backend PDF service

cd /root/the11-dev/backend

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
    echo "✅ Virtual environment activated"
else
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    echo "📥 Installing dependencies..."
    pip install -r requirements.txt
fi

# Check if backend is already running
if lsof -ti:8000 > /dev/null 2>&1; then
    echo "⚠️  Backend already running on port 8000"
    echo "   Stopping existing process..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Start backend
echo "🚀 Starting backend PDF service on port 8000..."
uvicorn main:app --reload --host 0.0.0.0 --port 8000

