# 🚀 LeadRouter Production Deployment Guide

Complete guide for deploying LeadRouter to a live production server.

## 📋 Prerequisites

- **Server**: Linux (Ubuntu 20.04+ recommended) or Windows Server
- **Docker**: Docker Engine 20.10+ and Docker Compose 2.0+
- **Domain**: A domain name pointing to your server (optional but recommended)
- **SSL Certificate**: For HTTPS (Let's Encrypt recommended)

## 🎯 Quick Deployment (Recommended)

### Step 1: Prepare Your Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### Step 2: Clone/Upload Your Project

```bash
# If using Git
git clone <your-repo-url> leadrouter
cd leadrouter

# Or upload your project files to the server
```

### Step 3: Configure Environment

```bash
# Copy production environment template
cp env.production.example .env

# Edit .env with your production values
nano .env  # or use your preferred editor
```

**Critical values to update:**

```env
# Generate a strong JWT secret
JWT_SECRET=$(openssl rand -base64 32)

# Set your database password
DB_PASSWORD=your_very_secure_password_here

# Set your production domain
CLIENT_URL=https://yourdomain.com

# Disable auth bypass in production
BYPASS_AUTH=false
```

### Step 4: Deploy

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

**Windows PowerShell:**
```powershell
.\deploy.ps1
```

**Manual deployment:**
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### Step 5: Verify Deployment

```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# Check application health
curl http://localhost:3001/health

# View logs
docker-compose -f docker-compose.prod.yml logs -f app
```

## 🌐 Setting Up Nginx Reverse Proxy (Recommended)

### Install Nginx

```bash
sudo apt install nginx -y
```

### Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/leadrouter
```

Add this configuration:

```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (will be set up by Certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Docker container
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

### Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/leadrouter /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

## 🔒 Setting Up SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is set up automatically
# Test renewal: sudo certbot renew --dry-run
```

## 🔐 Security Checklist

Before going live, ensure:

- [ ] **JWT_SECRET** is set to a strong random value
- [ ] **DB_PASSWORD** is a strong, unique password
- [ ] **BYPASS_AUTH** is set to `false`
- [ ] Default admin/BDR passwords are changed after first login
- [ ] SSL/HTTPS is configured and working
- [ ] Firewall is configured (only allow 22, 80, 443)
- [ ] Database backups are set up
- [ ] **CLIENT_URL** matches your production domain

### Configure Firewall

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Or iptables
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -A INPUT -j DROP
```

## 💾 Database Backups

### Manual Backup

```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres leadrouter > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres leadrouter < backup_20240101_120000.sql
```

### Automated Backups

Create `/etc/cron.daily/leadrouter-backup`:

```bash
#!/bin/bash
BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose -f /path/to/leadrouter/docker-compose.prod.yml exec -T postgres pg_dump -U postgres leadrouter > $BACKUP_DIR/leadrouter_$DATE.sql
# Keep only last 30 days
find $BACKUP_DIR -name "leadrouter_*.sql" -mtime +30 -delete
```

Make it executable:
```bash
sudo chmod +x /etc/cron.daily/leadrouter-backup
```

## 📊 Monitoring & Maintenance

### View Logs

```bash
# Application logs
docker-compose -f docker-compose.prod.yml logs -f app

# Database logs
docker-compose -f docker-compose.prod.yml logs -f postgres

# All logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Restart Services

```bash
# Restart application
docker-compose -f docker-compose.prod.yml restart app

# Restart all services
docker-compose -f docker-compose.prod.yml restart

# Stop services
docker-compose -f docker-compose.prod.yml down

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

### Update Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# Run migrations if needed
docker-compose -f docker-compose.prod.yml exec app node server/db/migrate.js
```

## 🔧 Troubleshooting

### Application Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs app

# Check database connection
docker-compose -f docker-compose.prod.yml exec app node server/db/connection-test.js

# Verify environment variables
docker-compose -f docker-compose.prod.yml exec app env | grep DB_
```

### Database Connection Issues

```bash
# Check if database is running
docker-compose -f docker-compose.prod.yml ps postgres

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Test connection
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d leadrouter -c "SELECT 1;"
```

### Port Already in Use

```bash
# Find process using port
sudo lsof -i :3001
# or
sudo netstat -tulpn | grep 3001

# Kill process
sudo kill -9 <PID>
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Check Nginx SSL configuration
sudo nginx -t
```

## 📈 Performance Optimization

### Database Tuning

Edit `docker-compose.prod.yml` to adjust PostgreSQL settings:

```yaml
postgres:
  command: postgres -c max_connections=200 -c shared_buffers=256MB -c effective_cache_size=1GB
```

### Application Scaling

For high traffic, consider:
- Using a load balancer (Nginx, HAProxy)
- Running multiple app instances
- Using a managed database service (AWS RDS, DigitalOcean Managed DB)

## 🆘 Support & Resources

- **Health Check**: `http://yourdomain.com/health`
- **Application Logs**: `docker-compose -f docker-compose.prod.yml logs -f app`
- **Database Logs**: `docker-compose -f docker-compose.prod.yml logs -f postgres`

## ✅ Post-Deployment Checklist

- [ ] Application is accessible via domain
- [ ] HTTPS is working (SSL certificate valid)
- [ ] Can log in with admin credentials
- [ ] Database is accessible and working
- [ ] Health check endpoint returns OK
- [ ] Backups are configured
- [ ] Monitoring is set up
- [ ] Default passwords are changed
- [ ] Firewall is configured
- [ ] Documentation is updated

---

**🎉 Your LeadRouter application is now live in production!**

For questions or issues, check the logs and refer to the troubleshooting section above.

