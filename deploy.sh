#!/bin/bash

# LeadRouter Production Deployment Script
# This script automates the deployment process

set -e  # Exit on error

echo "🚀 Starting LeadRouter Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from env.production.example...${NC}"
    if [ -f env.production.example ]; then
        cp env.production.example .env
        echo -e "${RED}⚠️  IMPORTANT: Please edit .env file with your production values before continuing!${NC}"
        echo -e "${RED}   Especially: DB_PASSWORD, JWT_SECRET, CLIENT_URL${NC}"
        read -p "Press Enter after you've updated .env file..."
    else
        echo -e "${RED}❌ env.production.example not found. Please create .env manually.${NC}"
        exit 1
    fi
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose is not installed. Please install it first.${NC}"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Validate critical environment variables
if [ -z "$DB_PASSWORD" ] || [ "$DB_PASSWORD" = "your_secure_database_password_here" ]; then
    echo -e "${RED}❌ DB_PASSWORD is not set or is using default value. Please update .env file.${NC}"
    exit 1
fi

if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "your-very-secure-random-jwt-secret-here-change-this" ]; then
    echo -e "${RED}❌ JWT_SECRET is not set or is using default value. Please update .env file.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables validated${NC}"

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down || true

# Build and start containers
echo "🏗️  Building and starting containers..."
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Check if database setup is needed
echo "🔧 Setting up database..."
docker-compose -f docker-compose.prod.yml exec -T app node server/db/setup.js || {
    echo -e "${YELLOW}⚠️  Database setup may have failed. Checking logs...${NC}"
    docker-compose -f docker-compose.prod.yml logs app | tail -20
}

# Wait a bit more for app to be fully ready
echo "⏳ Waiting for application to start..."
sleep 5

# Health check
echo "🏥 Checking application health..."
HEALTH_CHECK=$(curl -s http://localhost:${APP_PORT:-3001}/health || echo "failed")

if echo "$HEALTH_CHECK" | grep -q "ok"; then
    echo -e "${GREEN}✅ Application is healthy!${NC}"
else
    echo -e "${YELLOW}⚠️  Health check failed. Checking logs...${NC}"
    docker-compose -f docker-compose.prod.yml logs app | tail -30
fi

echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "📊 Application Status:"
docker-compose -f docker-compose.prod.yml ps
echo ""
echo "📝 Useful commands:"
echo "   View logs:     docker-compose -f docker-compose.prod.yml logs -f app"
echo "   Stop app:      docker-compose -f docker-compose.prod.yml down"
echo "   Restart app:   docker-compose -f docker-compose.prod.yml restart"
echo "   View status:   docker-compose -f docker-compose.prod.yml ps"
echo ""
echo "🌐 Application should be available at: http://localhost:${APP_PORT:-3001}"
echo ""

