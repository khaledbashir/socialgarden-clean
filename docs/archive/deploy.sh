#!/bin/bash

# Social Garden SOW Generator - Deployment Script
# This script sets up the entire application with Docker

set -e

echo "🚀 Social Garden SOW Generator - Deployment Script"
echo "=================================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p data

# Build and start services
echo "🏗️  Building and starting services..."
docker-compose up --build -d

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Services are running!"
    echo ""
    echo "🌐 Access your application:"
    echo "   Frontend: http://localhost:3000"
    echo "   PDF Service: http://localhost:8000"
    echo ""
    echo "📋 To view logs: docker-compose logs -f"
    echo "🛑 To stop: docker-compose down"
    echo ""
    echo "🎉 Deployment complete! Your Social Garden SOW Generator is ready."
else
    echo "❌ Services failed to start. Check logs with: docker-compose logs"
    exit 1
fi