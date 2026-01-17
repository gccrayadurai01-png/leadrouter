# 🚀 Deploy LeadRouter to Render

Complete guide for deploying LeadRouter to Render.com.

## 📋 Prerequisites

- GitHub repository with your code
- Render account (free tier available)
- 10-15 minutes

## 🎯 Quick Deployment Steps

### Step 1: Prepare Your Repository

1. **Push your code to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

### Step 2: Create PostgreSQL Database on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `leadrouter-db`
   - **Database**: `leadrouter`
   - **User**: `leadrouter_user`
   - **Region**: Choose closest to you
   - **Plan**: Starter (free) or higher
4. Click **"Create Database"**
5. **Save the connection details** - you'll need them!

### Step 3: Create Web Service

1. In Render Dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure the service:

   **Basic Settings:**
   - **Name**: `leadrouter`
   - **Environment**: `Node`
   - **Region**: Same as database
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: Leave empty (root of repo)

   **Build & Deploy:**
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`

   **Environment Variables:**
   Add these variables (click "Add Environment Variable"):

   ```
   NODE_ENV=production
   PORT=3001
   JWT_SECRET=<generate a strong random string>
   CLIENT_URL=https://your-app-name.onrender.com
   ```

   **Database Connection:**
   - Click **"Add Database"** → Select your `leadrouter-db`
   - This automatically adds `DATABASE_URL` environment variable

   **Additional Environment Variables:**
   ```
   DB_HOST=<from database Internal Database URL>
   DB_PORT=5432
   DB_NAME=leadrouter
   DB_USER=<from database credentials>
   DB_PASSWORD=<from database credentials>
   ADMIN_PASSWORD=<change from default>
   BDR_PASSWORD=<change from default>
   BYPASS_AUTH=false
   ```

4. Click **"Create Web Service"**

### Step 4: Generate JWT Secret

Generate a secure JWT secret:

```bash
# On Mac/Linux:
openssl rand -base64 32

# On Windows (PowerShell):
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Copy the output and paste it as `JWT_SECRET` in Render.

### Step 5: Wait for First Deployment

1. Render will automatically:
   - Clone your repository
   - Install dependencies (`npm install`)
   - Build the React app (`npm run build`)
   - Start the server (`npm run start`)
   - Run database setup automatically

2. **Monitor the logs** in Render dashboard
3. Wait for "Your service is live" message

### Step 6: Run Database Setup

After the first deployment, you need to run the database setup:

1. Go to your web service in Render
2. Click **"Shell"** tab
3. Run:
   ```bash
   node server/db/setup.js
   ```

This will:
- Create database schema
- Create admin and BDR users
- Seed sample data

### Step 7: Access Your Application

1. Your app will be available at: `https://your-app-name.onrender.com`
2. **Login credentials:**
   - **Admin**: `admin@leadrouter.com` / (your ADMIN_PASSWORD)
   - **BDR**: `bdr@leadrouter.com` / (your BDR_PASSWORD)

## 🔧 Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3001` |
| `JWT_SECRET` | JWT signing secret | `(random 32+ char string)` |
| `CLIENT_URL` | Your app URL | `https://leadrouter.onrender.com` |
| `DATABASE_URL` | Auto-added by Render | `postgresql://...` |

### Database Variables (Alternative to DATABASE_URL)

If you prefer explicit database config:

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `DB_HOST` | Database host | Database → Internal Database URL |
| `DB_PORT` | Database port | Usually `5432` |
| `DB_NAME` | Database name | `leadrouter` |
| `DB_USER` | Database user | Database → Credentials |
| `DB_PASSWORD` | Database password | Database → Credentials |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ADMIN_PASSWORD` | Admin user password | `admin123` |
| `BDR_PASSWORD` | BDR user password | `bdr123` |
| `BYPASS_AUTH` | Bypass authentication | `false` (set to `false` in production!) |
| `HUBSPOT_CLIENT_ID` | HubSpot OAuth client ID | (optional) |
| `HUBSPOT_CLIENT_SECRET` | HubSpot OAuth secret | (optional) |

## 🔒 Security Checklist

Before going live, ensure:

- [ ] **JWT_SECRET** is set to a strong random value (32+ characters)
- [ ] **ADMIN_PASSWORD** is changed from default
- [ ] **BDR_PASSWORD** is changed from default
- [ ] **BYPASS_AUTH** is set to `false`
- [ ] Database credentials are secure
- [ ] HTTPS is enabled (automatic on Render)

## 🐛 Troubleshooting

### Build Fails

**Error: "Build command failed"**
- Check build logs in Render dashboard
- Ensure `package.json` has correct build script
- Verify Node.js version (Render uses Node 18+)

**Solution:**
```bash
# Check your package.json has:
"build": "cd client && npm run build"
```

### Database Connection Fails

**Error: "Connection refused" or "Database not found"**

1. Verify database is running (green status in Render)
2. Check `DATABASE_URL` is set correctly
3. For managed databases, use `DATABASE_URL` instead of individual DB_* vars
4. Check database credentials match

**Solution:**
- Use `DATABASE_URL` (auto-added when you link database)
- Or manually set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

### Application Won't Start

**Error: "Application failed to respond"**

1. Check logs in Render dashboard
2. Verify `PORT` environment variable matches Render's port
3. Check health endpoint: `/health`

**Solution:**
- Render automatically sets `PORT` - don't override it
- Or set `PORT=10000` (Render's default)

### Database Setup Fails

**Error: "Database setup failed"**

1. Ensure database is fully provisioned (wait 2-3 minutes)
2. Check database credentials
3. Run setup manually via Shell

**Solution:**
```bash
# In Render Shell:
node server/db/setup.js
```

### 404 Errors on Routes

**Issue: React routes return 404**

This is normal! The server serves the React app correctly. Ensure:
- React Router is configured
- All routes start with `/` (not relative paths)
- Build completed successfully

## 📊 Monitoring

### View Logs

1. Go to your web service
2. Click **"Logs"** tab
3. View real-time application logs

### Health Check

Render automatically monitors `/health` endpoint:
- `GET https://your-app.onrender.com/health`
- Should return: `{"status":"ok","database":"connected"}`

### Metrics

Render provides:
- Request metrics
- Response times
- Error rates
- In the **"Metrics"** tab

## 🔄 Updating Your Application

### Automatic Deploys

Render automatically deploys when you push to your connected branch:
```bash
git push origin main
```

### Manual Deploy

1. Go to Render dashboard
2. Click **"Manual Deploy"** → **"Deploy latest commit"**

### Database Migrations

After code changes that require schema updates:

1. Go to **"Shell"** tab
2. Run: `node server/db/migrate.js`

## 💰 Pricing

### Free Tier Limits

- **Web Service**: 
  - Spins down after 15 minutes of inactivity
  - 750 hours/month free
  - Auto-sleeps (takes ~30 seconds to wake up)
  
- **PostgreSQL Database**:
  - 90 days free trial
  - Then $7/month for starter plan

### Upgrade Options

For production use, consider:
- **Starter Plan** ($7/month): Always-on web service
- **Standard Plan** ($25/month): Better performance
- **Pro Plan** ($85/month): High availability

## 🎉 Post-Deployment

After successful deployment:

1. ✅ Test login with admin credentials
2. ✅ Create some test reps
3. ✅ Test lead assignment
4. ✅ Change default passwords
5. ✅ Set up monitoring/alerts (optional)
6. ✅ Configure custom domain (optional)

## 📝 Notes

- **First deployment** takes 5-10 minutes
- **Subsequent deployments** take 2-5 minutes
- **Free tier** services sleep after 15 min inactivity (wake up in ~30 seconds)
- **Database backups** are automatic on paid plans
- **HTTPS** is automatic and free on Render

## 🆘 Support

If you encounter issues:

1. Check Render logs
2. Check application logs
3. Verify environment variables
4. Test database connection via Shell
5. Review this guide's troubleshooting section

---

**🎉 Your LeadRouter is now live on Render!**

Access it at: `https://your-app-name.onrender.com`
