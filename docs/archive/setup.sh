#!/bin/bash

echo "🚀 Setting up Social Garden SOW Generator..."
echo ""

# Check if Docker is available
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "🐳 Docker detected!"
    echo ""
    
    # Check if port 3000 is in use
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Port 3000 is already in use."
        echo "   Create a .env file with: FRONTEND_PORT=3333"
        echo "   Or run: FRONTEND_PORT=3333 docker-compose up --build"
        echo ""
    else
        echo "✅ Port 3000 is available."
        echo ""
    fi
    
    echo "To start the application, run:"
    echo "   docker-compose up --build"
    echo ""
    echo "To use a different port (e.g., 3333):"
    echo "   FRONTEND_PORT=3333 docker-compose up --build"
    echo ""
else
    echo "⚠️  Docker not detected."
    echo ""
    echo "To run manually, you need Node.js and pnpm:"
    echo "   npm install -g pnpm"
    echo "   cd novel-editor-demo"
    echo "   pnpm install"
    echo "   cd apps/web"
    echo "   pnpm run dev"
    echo ""
fi

echo "✅ Setup complete! Your repository is ready to run."
