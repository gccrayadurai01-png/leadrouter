# 🚀 Deploy LeadRouter to Live Production Server

Complete step-by-step guide to deploy your LeadRouter application to a live production server.

## 📋 Prerequisites

Before starting, you need:
- ✅ A Linux server (Ubuntu 20.04+ recommended) with SSH access
- ✅ Domain name pointing to your server IP (optional but recommended)
- ✅ Basic knowledge of Linux commands

## 🎯 Step-by-Step Deployment

### Step 1: Prepare Your Local Machine

**Option A: Using Git (Recommended)**
```bash
# If your code is in Git, push it first
git add .
git commit -m "Ready for production deployment"
git push origin main
```

**Option B: Create Deployment Package**
On Windows, create a ZIP file of your project (excluding node_modules, .git, etc.)

### Step 2: Connect to Your Server

**Using SSH (Windows PowerShell or Git Bash):**
```bash
ssh username@your-server-ip
# Example: ssh root@192.168.1.100
```

**Or use PuTTY (Windows):**
- Download PuTTY
- Enter server IP and connect
- Login with username/password

### Step 3: Install Required Software on Server

Once connected to your server, run:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version

# Logout and login again for docker group to take effect
exit
# Then SSH back in
```

### Step 4: Upload Your Project to Server

**Option A: Using Git (Easiest)**
```bash
# On server
cd /opt  # or /var/www or wherever you want
git clone <your-repo-url> leadrouter
cd leadrouter
```

**Option B: Using SCP (Windows PowerShell)**
```powershell
# From your local Windows machine
scp -r C:\Users\Rayadurai\.cursor\* username@your-server-ip:/opt/leadrouter/
```

**Option C: Using FTP/SFTP Client**
- Use FileZilla, WinSCP, or similar
- Upload all project files to `/opt/leadrouter/` on server

**Option D: Manual Upload**
1. Create ZIP of project on Windows
2. Upload via web interface or FTP
3. On server: `unzip leadrouter.zip -d /opt/leadrouter/`

### Step 5: Configure Environment Variables

```bash
# Navigate to project directory
cd /opt/leadrouter  # or wherever you uploaded

# Create .env file from template
cp env.production.example .env

# Edit .env file
nano .env  # or use: vi .env
```

**CRITICAL: Update these values in .env:**

```env
# Database password (CHANGE THIS!)
DB_PASSWORD=your_very_secure_password_here_12345

# JWT Secret (Generate a random one)
JWT_SECRET=generate_random_secret_here

# Your domain (or server IP)
CLIENT_URL=https://yourdomain.com
# OR if no domain yet:
# CLIENT_URL=http://your-server-ip:3001

# IMPORTANT: Disable auth bypass in production
BYPASS_AUTH=false
```

**Generate JWT Secret:**
```bash
openssl rand -base64 32
# Copy the output and paste it as JWT_SECRET value
```

### Step 6: Deploy the Application

```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

**Or manually:**
```bash
# Build and start containers
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for database to be ready
sleep 15

# Setup database
docker-compose -f docker-compose.prod.yml exec app node server/db/setup.js

# Check status
docker-compose -f docker-compose.prod.yml ps
```

### Step 7: Verify Deployment

```bash
# Check if containers are running
docker-compose -f docker-compose.prod.yml ps

# Check application health
curl http://localhost:3001/health

# View logs
docker-compose -f docker-compose.prod.yml logs -f app
```

**Expected output:**
- Containers should show "Up" status
- Health check should return: `{"status":"ok","database":"connected",...}`

### Step 8: Access Your Application

**Option A: Direct IP Access (Temporary)**
```
http://your-server-ip:3001
```

**Option B: Setup Domain with Nginx (Recommended)**

1. **Install Nginx:**
```bash
sudo apt install nginx -y
```

2. **Create Nginx Configuration:**
```bash
sudo nano /etc/nginx/sites-available/leadrouter
```

3. **Paste this configuration:**
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

    # SSL certificates (will be added by Certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Proxy to application
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

4. **Enable the site:**
```bash
sudo ln -s /etc/nginx/sites-available/leadrouter /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

5. **Get SSL Certificate:**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate (replace yourdomain.com)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts and enter your email
```

6. **Update .env with domain:**
```bash
nano .env
# Change CLIENT_URL to: https://yourdomain.com
# Restart app
docker-compose -f docker-compose.prod.yml restart app
```

### Step 9: Configure Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable

# If using direct port access (not recommended for production)
# sudo ufw allow 3001/tcp
```

### Step 10: Change Default Passwords

1. **Access your application:**
   - Go to: `https://yourdomain.com` or `http://your-server-ip:3001`

2. **Login with default credentials:**
   - **Admin:** Username: `admin`, Password: `admin123`
   - **BDR:** Username: `bdr`, Password: `bdr123`

3. **Change passwords immediately** after first login!

## 🔧 Useful Commands

### View Logs
```bash
# Application logs
docker-compose -f docker-compose.prod.yml logs -f app

# Database logs
docker-compose -f docker-compose.prod.yml logs -f postgres

# All logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Restart Application
```bash
docker-compose -f docker-compose.prod.yml restart app
```

### Stop Application
```bash
docker-compose -f docker-compose.prod.yml down
```

### Start Application
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Update Application
```bash
# Pull latest code
git pull
# OR upload new files

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# Run migrations if needed
docker-compose -f docker-compose.prod.yml exec app node server/db/migrate.js
```

## 🗄️ Database Backup

```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres leadrouter > backup_$(date +%Y%m%d).sql

# Restore backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres leadrouter < backup_20240101.sql
```

## 🆘 Troubleshooting

### Application won't start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs app

# Check if port is in use
sudo lsof -i :3001

# Check database connection
docker-compose -f docker-compose.prod.yml exec app node server/db/connection-test.js
```

### Can't access from browser
```bash
# Check if app is running
docker-compose -f docker-compose.prod.yml ps

# Check firewall
sudo ufw status

# Test locally on server
curl http://localhost:3001/health
```

### Database errors
```bash
# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Restart database
docker-compose -f docker-compose.prod.yml restart postgres
```

## ✅ Deployment Checklist

- [ ] Server has Docker and Docker Compose installed
- [ ] Project files uploaded to server
- [ ] `.env` file created and configured
- [ ] `DB_PASSWORD` changed to secure value
- [ ] `JWT_SECRET` set to random value
- [ ] `BYPASS_AUTH=false` in production
- [ ] Application deployed and running
- [ ] Health check returns OK
- [ ] Can access application in browser
- [ ] Nginx configured (if using domain)
- [ ] SSL certificate installed (if using domain)
- [ ] Firewall configured
- [ ] Default passwords changed
- [ ] Database backups configured

## 🎉 Success!

Your LeadRouter application is now live! 

**Access it at:**
- `https://yourdomain.com` (if domain configured)
- `http://your-server-ip:3001` (direct access)

**Default Login:**
- Admin: `admin` / `admin123` (CHANGE THIS!)
- BDR: `bdr` / `bdr123` (CHANGE THIS!)

---

**Need help?** Check the logs or refer to `PRODUCTION_DEPLOYMENT.md` for more details.

