#!/bin/bash

# 🚀 DigitalOcean Droplet Deployment Script
# Run this script on your DigitalOcean droplet after cloning the repository

set -e  # Exit on error

echo "🚀 Starting DigitalOcean deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${YELLOW}⚠️  Running as root. Consider using a non-root user for security.${NC}"
fi

# Update system
echo -e "${GREEN}📦 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+ if not installed
if ! command -v node &> /dev/null; then
    echo -e "${GREEN}📦 Installing Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PostgreSQL if not installed
if ! command -v psql &> /dev/null; then
    echo -e "${GREEN}📦 Installing PostgreSQL...${NC}"
    sudo apt install postgresql postgresql-contrib -y
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

# Install PM2 for process management
if ! command -v pm2 &> /dev/null; then
    echo -e "${GREEN}📦 Installing PM2...${NC}"
    sudo npm install -g pm2
fi

# Install Nginx if not installed
if ! command -v nginx &> /dev/null; then
    echo -e "${GREEN}📦 Installing Nginx...${NC}"
    sudo apt install nginx -y
    sudo systemctl start nginx
    sudo systemctl enable nginx
fi

# Check if .env exists
if [ ! -f "server/.env" ]; then
    echo -e "${YELLOW}⚠️  server/.env not found. Creating from template...${NC}"
    if [ -f "env.production.example" ]; then
        cp env.production.example server/.env
        echo -e "${RED}⚠️  IMPORTANT: Edit server/.env and set your production values!${NC}"
        echo -e "${RED}   Required: DB_PASSWORD, JWT_SECRET, CLIENT_URL${NC}"
        exit 1
    else
        echo -e "${RED}❌ No .env template found. Please create server/.env manually.${NC}"
        exit 1
    fi
fi

# Install dependencies
echo -e "${GREEN}📦 Installing server dependencies...${NC}"
npm install

echo -e "${GREEN}📦 Installing client dependencies...${NC}"
cd client
npm install
cd ..

# Build client
echo -e "${GREEN}🏗️  Building React client...${NC}"
npm run build

# Setup database
echo -e "${GREEN}🗄️  Setting up database...${NC}"
node server/db/setup.js

# Start application with PM2
echo -e "${GREEN}🚀 Starting application with PM2...${NC}"
pm2 delete leadrouter 2>/dev/null || true  # Delete if exists
pm2 start server/index.js --name leadrouter
pm2 save
pm2 startup

echo -e "${GREEN}✅ Deployment completed!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Configure Nginx: sudo nano /etc/nginx/sites-available/leadrouter"
echo "2. Setup SSL: sudo certbot --nginx -d yourdomain.com"
echo "3. Check status: pm2 status"
echo "4. View logs: pm2 logs leadrouter"
echo ""
echo -e "${GREEN}Application should be running on port 3001${NC}"
