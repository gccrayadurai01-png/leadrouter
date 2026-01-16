# LeadRouter Deployment Guide

Complete guide for deploying LeadRouter to production.

## Quick Start (Docker)

The easiest way to deploy is using Docker Compose:

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Edit .env with your production values
# IMPORTANT: Change JWT_SECRET, DB_PASSWORD, and default passwords!

# 3. Start services
docker-compose up -d

# 4. Check logs
docker-compose logs -f app
```

## Manual Deployment

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Step 1: Database Setup

```bash
# Install PostgreSQL (if not installed)
# Ubuntu/Debian:
sudo apt-get install postgresql postgresql-contrib

# macOS:
brew install postgresql

# Windows: Download from postgresql.org
```

### Step 2: Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE leadrouter;

# Create user (optional)
CREATE USER leadrouter_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE leadrouter TO leadrouter_user;

# Exit
\q
```

### Step 3: Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your settings
nano .env  # or use your preferred editor
```

**Required environment variables:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=leadrouter
DB_USER=postgres
DB_PASSWORD=your_secure_password
JWT_SECRET=your-very-secure-random-secret-here
NODE_ENV=production
CLIENT_URL=https://yourdomain.com
```

### Step 4: Install Dependencies

```bash
# Install server dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..
```

### Step 5: Setup Database

```bash
# Run complete setup (creates DB, runs migrations, seeds data)
node server/db/setup.js

# Or step by step:
# npm run migrate  # Run migrations
# npm run seed      # Seed data
```

### Step 6: Build Client

```bash
cd client
npm run build
cd ..
```

### Step 7: Start Server

**Development:**
```bash
npm run dev
```

**Production (with PM2):**
```bash
# Install PM2 globally
npm install -g pm2

# Start server
pm2 start server/index.js --name leadrouter

# Save PM2 configuration
pm2 save
pm2 startup
```

**Production (with systemd):**
```bash
# Create systemd service file
sudo nano /etc/systemd/system/leadrouter.service
```

Add this content:
```ini
[Unit]
Description=LeadRouter Application
After=network.target postgresql.service

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/leadrouter
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable leadrouter
sudo systemctl start leadrouter
sudo systemctl status leadrouter
```

## Nginx Reverse Proxy

Create `/etc/nginx/sites-available/leadrouter`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    # Serve React app
    location / {
        root /path/to/leadrouter/client/build;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/leadrouter /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal is set up automatically
```

## Environment Variables for Production

**Critical settings to change:**

1. **JWT_SECRET**: Generate a strong random secret
   ```bash
   openssl rand -base64 32
   ```

2. **DB_PASSWORD**: Use a strong database password

3. **ADMIN_PASSWORD**: Change default admin password

4. **BDR_PASSWORD**: Change default BDR password

5. **NODE_ENV**: Set to `production`

## Database Backups

```bash
# Backup database
pg_dump -U postgres leadrouter > backup_$(date +%Y%m%d).sql

# Restore database
psql -U postgres leadrouter < backup_20240101.sql

# Automated backup script (add to crontab)
0 2 * * * pg_dump -U postgres leadrouter > /backups/leadrouter_$(date +\%Y\%m\%d).sql
```

## Monitoring

### Health Check

The server includes a health endpoint:
```bash
curl http://localhost:3001/health
```

### Logs

**PM2:**
```bash
pm2 logs leadrouter
```

**systemd:**
```bash
sudo journalctl -u leadrouter -f
```

**Docker:**
```bash
docker-compose logs -f app
```

## Updates

```bash
# Pull latest code
git pull

# Install new dependencies
npm install
cd client && npm install && cd ..

# Run migrations if schema changed
npm run migrate

# Rebuild client
cd client && npm run build && cd ..

# Restart server
pm2 restart leadrouter
# or
sudo systemctl restart leadrouter
```

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
node server/db/connection-test.js

# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection from server
psql -h localhost -U postgres -d leadrouter
```

### Port Already in Use

```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Permission Issues

```bash
# Fix file permissions
sudo chown -R $USER:$USER /path/to/leadrouter
```

## Security Checklist

- [ ] Changed JWT_SECRET to strong random value
- [ ] Changed default database password
- [ ] Changed default admin/BDR passwords
- [ ] Enabled SSL/HTTPS
- [ ] Configured firewall (only allow 80, 443, 22)
- [ ] Set up database backups
- [ ] Configured rate limiting
- [ ] Set NODE_ENV=production
- [ ] Disabled debug logging in production
- [ ] Set up monitoring/alerts

## Support

For issues or questions, check:
- Server logs
- Database logs
- Nginx logs (`/var/log/nginx/`)
- System logs (`journalctl`)


