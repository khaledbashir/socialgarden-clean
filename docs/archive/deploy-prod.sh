#!/bin/bash

# Social Garden SOW Generator - Production Deployment Script
# This script deploys the application to production with proper configuration

set -e

echo "🚀 Social Garden SOW Generator - Production Deployment"
echo "====================================================="

# Check prerequisites
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed."
    exit 1
fi

# Check for environment file
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating template..."
    cat > .env << EOF
# OpenRouter API Key (required)
OPENROUTER_API_KEY=your-openrouter-api-key-here

# PDF Service Configuration
PDF_SERVICE_WORKERS=4

# Next.js Configuration
NODE_ENV=production
NEXT_PUBLIC_PDF_SERVICE_URL=http://pdf-service:8000

# Optional: SSL Configuration
SSL_CERT_PATH=/etc/ssl/certs/cert.pem
SSL_KEY_PATH=/etc/ssl/private/key.pem
EOF
    echo "📝 Please edit the .env file with your actual values before running this script again."
    exit 1
fi

echo "✅ Environment file found"

# Create production directories
echo "📁 Creating production directories..."
mkdir -p logs
mkdir -p data
mkdir -p ssl

# Pull latest images and build
echo "🏗️  Building production images..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Start services
echo "🚀 Starting production services..."
docker-compose -f docker-compose.prod.yml up -d

# Health check
echo "🔍 Performing health checks..."
sleep 15

# Check frontend health
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend health check failed"
fi

# Check PDF service health
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ PDF service is healthy"
else
    echo "❌ PDF service health check failed"
fi

echo ""
echo "🎉 Production deployment complete!"
echo ""
echo "🌐 Your application is now running in production mode"
echo "   Frontend: http://localhost:3000 (or your domain)"
echo "   PDF Service: http://localhost:8000"
echo ""
echo "📋 Useful commands:"
echo "   View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   Restart: docker-compose -f docker-compose.prod.yml restart"
echo "   Stop: docker-compose -f docker-compose.prod.yml down"
echo "   Update: docker-compose -f docker-compose.prod.yml pull && docker-compose -f docker-compose.prod.yml up -d"