# 🚀 Deploy LeadRouter to Live Server - Step by Step

Follow these steps to deploy your LeadRouter application to a live production server.

## 📋 What You Need

1. **A Linux Server** (Ubuntu 20.04+ recommended)
   - Can be from: DigitalOcean, AWS, Linode, Vultr, or your own server
   - Need: Server IP address, SSH username, and password/key

2. **SSH Access** to your server
   - Windows: Use PowerShell, Git Bash, or PuTTY

3. **Your Project Files** (already in this folder)

---

## 🎯 Step-by-Step Deployment

### STEP 1: Get Your Server Ready

**If you don't have a server yet:**
- Sign up at: DigitalOcean, AWS, Linode, or Vultr
- Create a new Ubuntu 20.04+ server
- Note your server IP address

**If you have a server:**
- Make sure you have SSH access
- Know your server IP and login credentials

---

### STEP 2: Connect to Your Server

**From Windows PowerShell:**
```powershell
ssh username@your-server-ip
# Example: ssh root@192.168.1.100
# Enter password when prompted
```

**Or use PuTTY:**
1. Download PuTTY from: https://www.putty.org/
2. Enter server IP
3. Click "Open"
4. Login with username/password

---

### STEP 3: Install Docker on Server

Once connected to your server, copy and paste these commands one by one:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add your user to docker group
sudo usermod -aG docker $USER

# Verify installation
docker --version
docker-compose --version
```

**Important:** After adding user to docker group, logout and login again:
```bash
exit
# Then SSH back in
ssh username@your-server-ip
```

---

### STEP 4: Upload Your Project to Server

**Option A: Using Git (Easiest - if your code is in Git)**

On your server:
```bash
cd /opt
git clone <your-git-repo-url> leadrouter
cd leadrouter
```

**Option B: Using SCP from Windows PowerShell**

From your Windows machine (in PowerShell):
```powershell
# Navigate to your project folder
cd C:\Users\Rayadurai\.cursor

# Upload files to server (replace with your server details)
scp -r * username@your-server-ip:/opt/leadrouter/
```

**Option C: Using FileZilla (GUI Method)**

1. Download FileZilla: https://filezilla-project.org/
2. Connect to your server (SFTP)
3. Upload all project files to `/opt/leadrouter/` on server
4. Make sure to upload:
   - All folders (server, client, etc.)
   - All files (package.json, docker-compose.prod.yml, etc.)
   - But NOT: node_modules, .git (if large)

---

### STEP 5: Configure Environment Variables

On your server:
```bash
cd /opt/leadrouter

# Create .env file from template
cp env.production.example .env

# Edit the .env file
nano .env
```

**In the editor, update these CRITICAL values:**

```env
# Change this to a strong password
DB_PASSWORD=MySecurePassword123!

# Generate a random secret (run this command first):
# openssl rand -base64 32
# Then paste the output here:
JWT_SECRET=paste_generated_secret_here

# Your server IP or domain
CLIENT_URL=http://your-server-ip:3001
# OR if you have a domain:
# CLIENT_URL=https://yourdomain.com

# IMPORTANT: Set to false for production
BYPASS_AUTH=false
```

**To save in nano:**
- Press `Ctrl + X`
- Press `Y` to confirm
- Press `Enter` to save

**Generate JWT Secret:**
```bash
openssl rand -base64 32
# Copy the output and paste it as JWT_SECRET in .env
```

---

### STEP 6: Deploy the Application

On your server:
```bash
cd /opt/leadrouter

# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

**Or deploy manually:**
```bash
# Build and start containers
docker-compose -f docker-compose.prod.yml up -d --build

# Wait a moment for database to start
sleep 15

# Setup database
docker-compose -f docker-compose.prod.yml exec app node server/db/setup.js

# Check if everything is running
docker-compose -f docker-compose.prod.yml ps
```

---

### STEP 7: Verify Deployment

```bash
# Check container status (should show "Up")
docker-compose -f docker-compose.prod.yml ps

# Check application health
curl http://localhost:3001/health

# View logs (to see if there are any errors)
docker-compose -f docker-compose.prod.yml logs app
```

**Expected output:**
- Containers should show "Up" status
- Health check should return: `{"status":"ok","database":"connected"}`

---

### STEP 8: Access Your Application

Open your web browser and go to:
```
http://your-server-ip:3001
```

**Example:** If your server IP is `192.168.1.100`, go to:
```
http://192.168.1.100:3001
```

**Default Login Credentials:**
- **Admin:** Username: `admin`, Password: `admin123`
- **BDR:** Username: `bdr`, Password: `bdr123`

**⚠️ IMPORTANT:** Change these passwords immediately after first login!

---

### STEP 9: Configure Firewall (Important!)

Allow access to your application:

```bash
# Allow SSH (port 22)
sudo ufw allow 22/tcp

# Allow HTTP (port 80) - for future use
sudo ufw allow 80/tcp

# Allow HTTPS (port 443) - for future use
sudo ufw allow 443/tcp

# Allow your application (port 3001)
sudo ufw allow 3001/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## ✅ Your Application is Now Live!

You should now be able to:
- ✅ Access the application at `http://your-server-ip:3001`
- ✅ Login with admin or BDR credentials
- ✅ Use all features of LeadRouter

---

## 🔧 Useful Commands

### View Logs
```bash
docker-compose -f docker-compose.prod.yml logs -f app
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

### Update Application (after code changes)
```bash
cd /opt/leadrouter
git pull  # if using git
# OR upload new files

docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 🆘 Troubleshooting

### Can't Access Application in Browser

1. **Check if app is running:**
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ```

2. **Check firewall:**
   ```bash
   sudo ufw status
   sudo ufw allow 3001/tcp
   ```

3. **Check logs for errors:**
   ```bash
   docker-compose -f docker-compose.prod.yml logs app
   ```

### Application Won't Start

1. **Check database connection:**
   ```bash
   docker-compose -f docker-compose.prod.yml logs postgres
   ```

2. **Check .env file:**
   ```bash
   cat .env
   # Make sure DB_PASSWORD and JWT_SECRET are set
   ```

3. **Restart everything:**
   ```bash
   docker-compose -f docker-compose.prod.yml down
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

### Database Errors

```bash
# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Restart database
docker-compose -f docker-compose.prod.yml restart postgres
```

---

## 🌐 Optional: Setup Domain & SSL

If you want to use a domain name (like `leadrouter.yourdomain.com`) instead of IP:

See `DEPLOY_TO_SERVER.md` for instructions on:
- Setting up Nginx reverse proxy
- Getting SSL certificate (Let's Encrypt)
- Configuring domain

---

## 📞 Need Help?

1. Check the logs: `docker-compose -f docker-compose.prod.yml logs app`
2. Verify health: `curl http://localhost:3001/health`
3. See detailed guide: `DEPLOY_TO_SERVER.md`
4. Check checklist: `DEPLOY_CHECKLIST.md`

---

**🎉 Congratulations! Your LeadRouter is now live in production!**

