# 🚀 How to Start LeadRouter

## Step 1: Make Sure Docker Desktop is Running

1. **Open Docker Desktop** from Start Menu
2. **Wait** until you see "Docker Desktop is running" in the system tray
3. The Docker icon should be **steady** (not animating)

## Step 2: Start the App

### Option A: Use the PowerShell Script (Easiest)

```powershell
.\start-app.ps1
```

### Option B: Manual Commands

```powershell
# Start containers
docker-compose up -d

# Wait 30-60 seconds, then check status
docker-compose ps

# View logs
docker-compose logs -f app
```

## Step 3: Access the App

Once containers are running:

1. **Open your browser**
2. **Go to**: http://localhost:3001
3. **Login** with:
   - **Admin**: `admin@leadrouter.com` / `admin123`
   - **BDR**: `bdr@leadrouter.com` / `bdr123`

## Troubleshooting

### Docker Not Ready?
- Make sure Docker Desktop is fully started
- Wait 30-60 seconds after opening Docker Desktop
- Check system tray for "Docker Desktop is running"

### Containers Won't Start?
```powershell
# Check Docker status
docker ps

# View error logs
docker-compose logs

# Restart Docker Desktop and try again
```

### Port Already in Use?
- Make sure nothing else is using port 3001
- Or change port in docker-compose.yml

## What You'll See

### Admin Dashboard
- Manage sales reps
- View queue statistics  
- Assignment history
- Audit logs

### BDR Dashboard
- SMB Queue panel
- ENT Queue panel
- One-click lead assignment
- Real-time updates

## Need Help?

- Check logs: `docker-compose logs -f app`
- Check status: `docker-compose ps`
- Restart: `docker-compose restart`

