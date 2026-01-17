# 🐛 Render Deployment Troubleshooting Guide

## Common Issues & Solutions

### Issue 1: Still Using Docker Mode ❌

**Symptoms:**
- Build fails with Docker-related errors
- See "Dockerfile Path" in settings
- Error about `npm ci` in Docker build

**Solution:**
1. **Create a NEW Web Service** (don't try to convert existing one)
2. When creating, select **"Node"** (NOT Docker)
3. Set:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`
   - Environment: Node

**See:** `FIX_RENDER_DOCKER_MODE.md` for details

---

### Issue 2: Build Command Fails

**Symptoms:**
- Build fails during `npm install` or `npm run build`
- Error about missing dependencies
- Lock file errors

**Solutions:**

**Check your Build Command:**
```
npm install && npm run build
```

**If you see lock file errors:**
```bash
# Update lock files locally first
cd client
npm install
cd ..
git add client/package-lock.json
git commit -m "Update lock files"
git push
```

**Verify package.json scripts:**
```json
{
  "scripts": {
    "build": "cd client && npm run build",
    "start": "node server/index.js"
  }
}
```

---

### Issue 3: Service Won't Start

**Symptoms:**
- Build succeeds but service fails to start
- "Application failed to respond" error
- Health check fails

**Solutions:**

1. **Check Start Command:**
   ```
   npm run start
   ```

2. **Check PORT:**
   - Render sets PORT automatically
   - Your code should use: `process.env.PORT || 3001`
   - Don't hardcode port 3001

3. **Check Logs:**
   - Go to Render Dashboard → Your Service → Logs
   - Look for error messages
   - Common issues:
     - Database connection failed
     - Missing environment variables
     - Port binding errors

4. **Verify server/index.js:**
   ```javascript
   const PORT = process.env.PORT || 3001;
   app.listen(PORT, () => {
     console.log(`Server running on port ${PORT}`);
   });
   ```

---

### Issue 4: Database Connection Fails

**Symptoms:**
- "Connection refused" errors
- "Database not found" errors
- Service starts but can't connect to DB

**Solutions:**

1. **Use DATABASE_URL (Recommended):**
   - Link your database in Render
   - This auto-adds `DATABASE_URL`
   - Your code should support it (already updated ✅)

2. **Check Database Status:**
   - Go to Render Dashboard → Your Database
   - Ensure it's "Available" (green status)
   - Wait 2-3 minutes after creating database

3. **Verify Environment Variables:**
   - `DATABASE_URL` is set (if using it)
   - OR individual DB_* variables are correct

4. **Test Connection:**
   - Use Render Shell to test:
   ```bash
   node server/db/connection-test.js
   ```

---

### Issue 5: Missing Environment Variables

**Symptoms:**
- Service starts but authentication fails
- "JWT_SECRET not found" errors
- Database connection issues

**Required Variables:**
```
NODE_ENV=production
PORT=10000 (or let Render auto-set)
JWT_SECRET=<your-secret>
CLIENT_URL=https://your-app.onrender.com
BYPASS_AUTH=false
DATABASE_URL=<auto-added when linking database>
ADMIN_PASSWORD=<your-password>
BDR_PASSWORD=<your-password>
```

**How to Add:**
1. Render Dashboard → Your Service
2. Environment tab
3. Add each variable
4. Save and redeploy

---

### Issue 6: React App Not Building

**Symptoms:**
- Build fails at `npm run build`
- Client build errors
- Missing dependencies

**Solutions:**

1. **Check Build Command:**
   ```
   npm install && npm run build
   ```

2. **Verify client/package.json exists**

3. **Check for build errors in logs:**
   - Look for specific error messages
   - Common: missing dependencies, syntax errors

4. **Test build locally:**
   ```bash
   npm install
   npm run build
   ```
   If it fails locally, fix before deploying

---

### Issue 7: Service Type Wrong

**Symptoms:**
- Can't find Build Command field
- Only see Docker settings
- Service type is "Docker"

**Solution:**
- **Delete and recreate service** with Node.js type
- See Issue 1 above

---

### Issue 8: Health Check Fails

**Symptoms:**
- Service starts but shows as unhealthy
- Health check endpoint returns error

**Solutions:**

1. **Verify /health endpoint exists:**
   ```javascript
   app.get('/health', async (req, res) => {
     // Check database
     await pool.query('SELECT 1');
     res.json({ status: 'ok', database: 'connected' });
   });
   ```

2. **Check health check path in Render:**
   - Settings → Health Checks
   - Path should be: `/health`

---

## 🔍 Debugging Steps

### Step 1: Check Build Logs
1. Render Dashboard → Your Service
2. Click "Logs" tab
3. Look for errors during build phase

### Step 2: Check Runtime Logs
1. After build, check runtime logs
2. Look for startup errors
3. Check for missing environment variables

### Step 3: Test Locally
```bash
# Test build
npm install
npm run build

# Test server
npm run start

# Test database connection
node server/db/connection-test.js
```

### Step 4: Verify Configuration
- [ ] Service type is "Node" (not Docker)
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `npm run start`
- [ ] All environment variables set
- [ ] Database is linked
- [ ] Code is pushed to GitHub

---

## 📋 Quick Checklist

Before deploying, ensure:

- [ ] Service type is **Node.js** (not Docker)
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `npm run start`
- [ ] All environment variables added
- [ ] Database is linked (adds DATABASE_URL)
- [ ] Code is pushed to GitHub
- [ ] `BYPASS_AUTH=false` (for production)
- [ ] `NODE_ENV=production`
- [ ] `CLIENT_URL` matches your Render URL

---

## 🆘 Still Stuck?

1. **Check Render Logs:**
   - Build logs (during build)
   - Runtime logs (after start)

2. **Common Error Messages:**
   - "Build failed" → Check build logs
   - "Service failed to start" → Check runtime logs
   - "Database connection failed" → Check DATABASE_URL
   - "Port already in use" → Don't set PORT, let Render handle it

3. **Get Help:**
   - Share the exact error message from logs
   - Check which step fails (build or runtime)
   - Verify service type is Node.js

---

## 🎯 Most Common Issue

**90% of deployment issues are:**
- Service is in Docker mode instead of Node.js mode
- Missing environment variables
- Database not linked

**Quick Fix:**
1. Create NEW Node.js service (not Docker)
2. Add all environment variables
3. Link database
4. Deploy

---

**Share your specific error message and I can help debug further!**
