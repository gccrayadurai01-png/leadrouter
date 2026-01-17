# 🔐 Setup Environment Variables for Render

## 📋 Quick Reference

Here are the **exact values** to add in Render Dashboard → Your Service → Environment:

### ✅ Required Variables (Copy & Paste)

```
NODE_ENV=production
PORT=10000
JWT_SECRET=BZ1f0phiScuOQOc/w+Yin0q119NB65ZQd0wz0MUu9jM=
CLIENT_URL=https://your-app-name.onrender.com
BYPASS_AUTH=false
ADMIN_PASSWORD=admin123
BDR_PASSWORD=bdr123
```

### 🔄 Database Configuration

**Option 1: Use DATABASE_URL (Recommended)**
- Link your database in Render → automatically adds `DATABASE_URL`
- No need to set individual DB_* variables

**Option 2: Individual Variables (if not using DATABASE_URL)**
```
DB_HOST=<from Render database Internal Database URL>
DB_PORT=5432
DB_NAME=leadrouter
DB_USER=<from database credentials>
DB_PASSWORD=<from database credentials>
```

## 📝 Step-by-Step Instructions

### Step 1: Generate Your Own JWT Secret (Optional but Recommended)

**Windows PowerShell:**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Mac/Linux:**
```bash
openssl rand -base64 32
```

### Step 2: Update CLIENT_URL

Replace `your-app-name` with your actual Render app name:
```
CLIENT_URL=https://leadrouter.onrender.com
```
(Use your actual Render app URL)

### Step 3: Change Default Passwords

Replace the default passwords:
```
ADMIN_PASSWORD=YourSecureAdminPassword123!
BDR_PASSWORD=YourSecureBDRPassword123!
```

### Step 4: Add to Render

1. Go to Render Dashboard → Your Service
2. Click **"Environment"** tab
3. Click **"Add Environment Variable"** for each:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `JWT_SECRET` | `BZ1f0phiScuOQOc/w+Yin0q119NB65ZQd0wz0MUu9jM=` |
   | `CLIENT_URL` | `https://your-app-name.onrender.com` |
   | `BYPASS_AUTH` | `false` |
   | `ADMIN_PASSWORD` | `<your-secure-password>` |
   | `BDR_PASSWORD` | `<your-secure-password>` |

4. **Link Database** (adds DATABASE_URL automatically)
   - Settings → Databases → Add Database → Select your database

5. Click **"Save Changes"**

### Step 5: Redeploy

After adding variables:
1. Go to **"Manual Deploy"** → **"Deploy latest commit"**
2. Watch the logs to verify everything works

## 🔒 Security Checklist

Before deploying, ensure:

- [ ] `BYPASS_AUTH=false` ✅
- [ ] `JWT_SECRET` is set (use generated one above) ✅
- [ ] `ADMIN_PASSWORD` changed from `admin123` ✅
- [ ] `BDR_PASSWORD` changed from `bdr123` ✅
- [ ] `CLIENT_URL` matches your actual Render URL ✅
- [ ] `NODE_ENV=production` ✅
- [ ] Database linked (DATABASE_URL added) ✅

## 📄 Files Created

- `.env.production` - Production template with all values
- Use this as reference when setting up Render

## ⚠️ Important Notes

1. **Never commit `.env` to Git** - it's already in `.gitignore` ✅
2. **Set these in Render Dashboard**, not in a local `.env` file
3. **DATABASE_URL** is automatically added when you link database
4. **Change passwords** immediately after first login
5. **Generate new JWT_SECRET** if you want (use command above)

## 🚀 After Setup

1. Save all environment variables in Render
2. Redeploy your service
3. Test login with new passwords
4. Verify authentication works (BYPASS_AUTH=false)

---

**Your app is now configured for production! 🎉**
