# 🚀 Deploy LeadRouter to DigitalOcean Droplet

Complete guide for deploying LeadRouter to a DigitalOcean droplet.

## 📋 Prerequisites

- DigitalOcean account
- A droplet created (Ubuntu 22.04 LTS recommended)
- SSH access to your droplet
- Domain name (optional but recommended)

## 🎯 Quick Start

### Step 1: Create Droplet

1. Go to [DigitalOcean Dashboard](https://cloud.digitalocean.com)
2. Click **"Create"** → **"Droplets"**
3. Choose:
   - **Image:** Ubuntu 22.04 (LTS)
   - **Plan:** Basic - Regular (1GB RAM minimum, $6/month)
   - **Region:** Choose closest to your users
   - **Authentication:** SSH keys (recommended) or Password
4. Click **"Create Droplet"**

### Step 2: Connect to Droplet

**Windows PowerShell:**
```powershell
ssh root@your-droplet-ip
```

**Or use PuTTY:**
- Host: `your-droplet-ip`
- Port: `22`
- Username: `root`

### Step 3: Initial Server Setup

```bash
# Update system
apt update && apt upgrade -y

# Create non-root user (recommended)
adduser leadrouter
usermod -aG sudo leadrouter
su - leadrouter
```

### Step 4: Clone Repository

```bash
# Install Git if not installed
sudo apt install git -y

# Clone your repository
cd /opt
sudo git clone https://github.com/gccrayadurai01-png/leadrouter.git
sudo chown -R $USER:$USER /opt/leadrouter
cd /opt/leadrouter
```

### Step 5: Configure Environment

```bash
# Copy environment template
cp env.production.example server/.env

# Edit environment file
nano server/.env
```

**Required variables for DigitalOcean:**

```env
# Database Configuration (Self-hosted PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=leadrouter
DB_USER=postgres
DB_PASSWORD=your_secure_password_here

# OR use DigitalOcean Managed Database:
# DATABASE_URL=postgresql://user:pass@db-postgresql-nyc3-12345.db.ondigitalocean.com:25060/dbname?sslmode=require

# Application
NODE_ENV=production
PORT=3001
JWT_SECRET=generate_random_secret_here
CLIENT_URL=http://your-droplet-ip:3001
# OR with domain: CLIENT_URL=https://yourdomain.com

# Authentication
BYPASS_AUTH=false

# Admin/BDR Passwords (optional, defaults to admin123/bdr123)
ADMIN_PASSWORD=your_secure_admin_password
BDR_PASSWORD=your_secure_bdr_password
```

**Generate JWT Secret:**
```bash
openssl rand -base64 32
```

### Step 6: Setup PostgreSQL Database

**Option A: Self-hosted PostgreSQL (Included)**

```bash
# PostgreSQL is installed by deploy script
# Create database and user
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE DATABASE leadrouter;
CREATE USER leadrouter_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE leadrouter TO leadrouter_user;
\q
```

**Option B: DigitalOcean Managed Database (Recommended for Production)**

1. Go to DigitalOcean Dashboard → **Databases** → **Create Database**
2. Choose PostgreSQL
3. Select region and plan
4. Copy the connection string
5. Use `DATABASE_URL` in your `.env` file

### Step 7: Run Deployment Script

```bash
# Make script executable
chmod +x deploy-digitalocean.sh

# Run deployment
./deploy-digitalocean.sh
```

The script will:
- ✅ Install Node.js, PostgreSQL, PM2, Nginx
- ✅ Install dependencies
- ✅ Build React client
- ✅ Setup database
- ✅ Start application with PM2

### Step 8: Configure Nginx (Reverse Proxy)

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/leadrouter
```

**Paste this configuration:**

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    # OR use IP: server_name your-droplet-ip;

    # Increase body size for file uploads
    client_max_body_size 10M;

    # Proxy to Node.js app
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
    }
}
```

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/leadrouter /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

### Step 9: Setup SSL (Optional but Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts and enter your email
```

**Update .env after SSL:**
```bash
nano server/.env
# Change CLIENT_URL to: https://yourdomain.com
pm2 restart leadrouter
```

### Step 10: Configure Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable

# Check status
sudo ufw status
```

## 🔧 Application Management

### PM2 Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs leadrouter

# Restart application
pm2 restart leadrouter

# Stop application
pm2 stop leadrouter

# Start application
pm2 start leadrouter

# Monitor (real-time)
pm2 monit
```

### Database Management

```bash
# Connect to database
sudo -u postgres psql leadrouter

# Backup database
sudo -u postgres pg_dump leadrouter > backup_$(date +%Y%m%d).sql

# Restore database
sudo -u postgres psql leadrouter < backup_20240101.sql
```

### Update Application

```bash
cd /opt/leadrouter

# Pull latest code
git pull

# Install new dependencies
npm install
cd client && npm install && cd ..

# Rebuild client
npm run build

# Run migrations if needed
node server/db/migrate.js

# Restart application
pm2 restart leadrouter
```

## 🗄️ Database Options Comparison

### Self-hosted PostgreSQL (Free)

**Pros:**
- ✅ Free (included with droplet)
- ✅ Full control
- ✅ No additional cost

**Cons:**
- ⚠️ You manage backups
- ⚠️ You manage updates
- ⚠️ Uses droplet resources

### DigitalOcean Managed Database ($15/month)

**Pros:**
- ✅ Automatic backups
- ✅ Automatic updates
- ✅ High availability
- ✅ Doesn't use droplet resources
- ✅ SSL included

**Cons:**
- ⚠️ Additional cost
- ⚠️ External connection (slight latency)

**Connection String Format:**
```
postgresql://user:password@db-postgresql-nyc3-12345.db.ondigitalocean.com:25060/dbname?sslmode=require
```

## 🔍 Troubleshooting

### Application won't start

```bash
# Check PM2 logs
pm2 logs leadrouter --lines 50

# Check if port is in use
sudo lsof -i :3001

# Test database connection
node server/db/connection-test.js
```

### Can't access from browser

```bash
# Check if app is running
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Test locally
curl http://localhost:3001/health

# Check firewall
sudo ufw status
```

### Database connection errors

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log

# Test connection
sudo -u postgres psql -c "SELECT version();"
```

## ✅ Deployment Checklist

- [ ] Droplet created and accessible via SSH
- [ ] Repository cloned to `/opt/leadrouter`
- [ ] `server/.env` file created and configured
- [ ] PostgreSQL installed and database created
- [ ] `DB_PASSWORD` set to secure value
- [ ] `JWT_SECRET` generated and set
- [ ] `BYPASS_AUTH=false` in production
- [ ] Deployment script run successfully
- [ ] Application running with PM2
- [ ] Nginx configured and running
- [ ] SSL certificate installed (if using domain)
- [ ] Firewall configured
- [ ] Can access application in browser
- [ ] Default passwords changed after first login

## 🎉 Success!

Your LeadRouter application is now live on DigitalOcean!

**Access it at:**
- `https://yourdomain.com` (if domain configured)
- `http://your-droplet-ip:3001` (direct access)

**Default Login:**
- Admin: `admin@leadrouter.com` / `admin123` (CHANGE THIS!)
- BDR: `bdr@leadrouter.com` / `bdr123` (CHANGE THIS!)

---

## 💰 Cost Estimate

**Minimum Setup:**
- Droplet (1GB RAM): $6/month
- Self-hosted PostgreSQL: Free (included)
- **Total: $6/month**

**Recommended Setup:**
- Droplet (2GB RAM): $12/month
- Managed Database (1GB): $15/month
- **Total: $27/month**

---

**Need help?** Check PM2 logs: `pm2 logs leadrouter`
