# 🚀 Quick Production Deployment Guide

## For Linux/Mac Servers

### 1. Prepare Server
```bash
# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Setup Project
```bash
# Upload your project to server (or git clone)
cd /path/to/leadrouter

# Create .env file
cp env.production.example .env
nano .env  # Edit with your values
```

### 3. Configure .env
**CRITICAL**: Update these values:
- `DB_PASSWORD` - Strong database password
- `JWT_SECRET` - Generate with: `openssl rand -base64 32`
- `CLIENT_URL` - Your domain (e.g., `https://leadrouter.yourdomain.com`)
- `BYPASS_AUTH=false` - Disable auth bypass

### 4. Deploy
```bash
chmod +x deploy.sh
./deploy.sh
```

### 5. Setup Nginx (Optional but Recommended)
```bash
# Install Nginx
sudo apt install nginx certbot python3-certbot-nginx -y

# Create config
sudo nano /etc/nginx/sites-available/leadrouter
```

Paste this (replace `yourdomain.com`):
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/leadrouter /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com
```

## For Windows Server

### 1. Install Docker Desktop
Download and install from: https://www.docker.com/products/docker-desktop

### 2. Setup Project
```powershell
# Navigate to project directory
cd C:\path\to\leadrouter

# Create .env file
Copy-Item env.production.example .env
notepad .env  # Edit with your values
```

### 3. Configure .env
Same as Linux - update critical values

### 4. Deploy
```powershell
.\deploy.ps1
```

## Verify Deployment

```bash
# Check status
docker-compose -f docker-compose.prod.yml ps

# Check health
curl http://localhost:3001/health

# View logs
docker-compose -f docker-compose.prod.yml logs -f app
```

## Default Login Credentials

**Admin:**
- Username: `admin`
- Password: `admin123` (CHANGE THIS!)

**BDR:**
- Username: `bdr`
- Password: `bdr123` (CHANGE THIS!)

## Common Commands

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f app

# Restart app
docker-compose -f docker-compose.prod.yml restart app

# Stop app
docker-compose -f docker-compose.prod.yml down

# Start app
docker-compose -f docker-compose.prod.yml up -d

# Update app
git pull
docker-compose -f docker-compose.prod.yml up -d --build
```

## Troubleshooting

**App won't start:**
```bash
docker-compose -f docker-compose.prod.yml logs app
```

**Database issues:**
```bash
docker-compose -f docker-compose.prod.yml logs postgres
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d leadrouter
```

**Port in use:**
```bash
# Linux
sudo lsof -i :3001
sudo kill -9 <PID>

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

## Security Checklist

- [ ] Changed `DB_PASSWORD` in .env
- [ ] Changed `JWT_SECRET` in .env
- [ ] Set `BYPASS_AUTH=false`
- [ ] Changed default admin password
- [ ] Changed default BDR password
- [ ] Set up SSL/HTTPS
- [ ] Configured firewall

---

**Need more details?** See `PRODUCTION_DEPLOYMENT.md` for comprehensive guide.

