# 🚨 Quick Fix: Can't Deploy to Render

## 🔍 First: Check What Error You're Seeing

Go to **Render Dashboard → Your Service → Logs** and look for:
- ❌ Build errors (during build phase)
- ❌ Runtime errors (after service starts)
- ❌ Database connection errors
- ❌ Missing environment variables

**Share the exact error message and I can help!**

---

## 🎯 Most Common Issues (90% of problems)

### Issue #1: Service is in Docker Mode ❌

**How to Check:**
- Go to Settings → Build & Deploy
- Do you see "Dockerfile Path" field? → You're in Docker mode!

**Fix:**
1. **Delete current service**
2. **Create NEW Web Service**
3. When creating, select **"Node"** (NOT Docker)
4. Set:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`

---

### Issue #2: Missing Environment Variables

**Required Variables:**
```
NODE_ENV=production
JWT_SECRET=<your-secret>
CLIENT_URL=https://your-app.onrender.com
BYPASS_AUTH=false
DATABASE_URL=<auto-added when linking database>
```

**How to Add:**
1. Service → Environment tab
2. Add each variable
3. Link database (adds DATABASE_URL)

---

### Issue #3: Wrong Build/Start Commands

**Correct Commands:**
- Build Command: `npm install && npm run build`
- Start Command: `npm run start`

**Check:**
- Service → Settings → Build & Deploy
- Verify commands are correct

---

### Issue #4: Database Not Linked

**Fix:**
1. Service → Settings → Databases
2. Click "Add Database"
3. Select your database
4. This auto-adds `DATABASE_URL`

---

## ✅ Quick Diagnostic Checklist

Answer these questions:

1. **Service Type:**
   - [ ] Is it "Node" or "Docker"?
   - [ ] If Docker → Create new Node service!

2. **Build Command:**
   - [ ] Is it: `npm install && npm run build`?
   - [ ] If not → Update it!

3. **Start Command:**
   - [ ] Is it: `npm run start`?
   - [ ] If not → Update it!

4. **Environment Variables:**
   - [ ] `NODE_ENV=production` set?
   - [ ] `JWT_SECRET` set?
   - [ ] `BYPASS_AUTH=false` set?
   - [ ] `DATABASE_URL` set (or database linked)?

5. **Database:**
   - [ ] Database created?
   - [ ] Database linked to service?
   - [ ] Database status is "Available" (green)?

6. **Code:**
   - [ ] Code pushed to GitHub?
   - [ ] Repository connected in Render?

---

## 🚀 Step-by-Step: Fresh Start (Recommended)

If nothing works, start fresh:

### Step 1: Create Database
1. Render Dashboard → New + → PostgreSQL
2. Name: `leadrouter-db`
3. Database: `leadrouter`
4. Create

### Step 2: Create Web Service (Node.js!)
1. Render Dashboard → New + → Web Service
2. Connect GitHub repo
3. **IMPORTANT:** Select **"Node"** (NOT Docker!)
4. Configure:
   - Name: `leadrouter`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`
   - Node Version: `18`

### Step 3: Add Environment Variables
1. Service → Environment tab
2. Add:
   ```
   NODE_ENV=production
   JWT_SECRET=BZ1f0phiScuOQOc/w+Yin0q119NB65ZQd0wz0MUu9jM=
   CLIENT_URL=https://your-app-name.onrender.com
   BYPASS_AUTH=false
   ADMIN_PASSWORD=<your-password>
   BDR_PASSWORD=<your-password>
   ```

### Step 4: Link Database
1. Service → Settings → Databases
2. Add Database → Select `leadrouter-db`
3. This adds `DATABASE_URL` automatically

### Step 5: Deploy
1. Save all settings
2. Manual Deploy → Deploy latest commit
3. Watch logs

### Step 6: Run Database Setup
1. After first deploy, go to Shell tab
2. Run: `node server/db/setup.js`
3. This creates tables and users

---

## 📋 What to Share for Help

If still stuck, share:

1. **Error message** from Render logs
2. **Service type** (Node or Docker?)
3. **Build Command** you're using
4. **Start Command** you're using
5. **Environment variables** (list which ones are set)
6. **Database status** (is it linked? is it available?)

---

## 🎯 Most Likely Solution

**90% chance the issue is:**
- Service is in Docker mode instead of Node.js mode

**Quick fix:**
- Create new Node.js service (don't try to convert existing one)

---

**Check your logs first and share the error - I can give specific help!**
