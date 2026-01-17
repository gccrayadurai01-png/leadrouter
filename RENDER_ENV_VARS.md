# 🔐 Render Environment Variables Configuration

## ⚠️ Security Issues in Your Current Config

Your current `.env` has several **security issues** for production:

1. ❌ `BYPASS_AUTH=true` - **MUST be `false` in production!**
2. ❌ `JWT_SECRET=change-this-to-a-random-secret-in-production` - **Use a strong random secret!**
3. ❌ `ADMIN_PASSWORD=admin123` - **Change default password!**
4. ❌ `BDR_PASSWORD=bdr123` - **Change default password!**
5. ❌ `NODE_ENV=development` - **Should be `production`**
6. ❌ `DB_HOST=localhost` - **Use Render's DATABASE_URL instead**

## ✅ Production-Ready Environment Variables for Render

### Required Variables

```bash
# Environment
NODE_ENV=production

# Port (Render sets this automatically, but you can set it)
PORT=10000
# OR just let Render auto-set it (recommended)

# JWT Secret (GENERATE A NEW ONE - see below)
JWT_SECRET=<generate-strong-random-secret>

# Client URL (your Render app URL)
CLIENT_URL=https://your-app-name.onrender.com

# Database - Use DATABASE_URL (auto-added when you link database)
# OR use individual variables:
DB_HOST=<from Render database Internal Database URL>
DB_PORT=5432
DB_NAME=leadrouter
DB_USER=<from Render database credentials>
DB_PASSWORD=<from Render database credentials>

# Admin/BDR Passwords (CHANGE THESE!)
ADMIN_PASSWORD=<your-secure-admin-password>
BDR_PASSWORD=<your-secure-bdr-password>

# Authentication (MUST be false in production!)
BYPASS_AUTH=false
```

## 🔑 Generate Strong JWT Secret

Run this command to generate a secure JWT secret:

**Windows PowerShell:**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Mac/Linux:**
```bash
openssl rand -base64 32
```

**Or use this online tool:**
- https://www.lastpass.com/features/password-generator
- Generate 32+ character random string

## 📋 Step-by-Step: Add to Render

### Step 1: Go to Your Service
1. Render Dashboard → Your Web Service
2. Click **"Environment"** tab (or **"Settings"** → **"Environment"**)

### Step 2: Add Each Variable

Click **"Add Environment Variable"** for each:

#### Critical Security Variables (Add First!)

1. **NODE_ENV**
   - Key: `NODE_ENV`
   - Value: `production`

2. **JWT_SECRET** (Generate new one!)
   - Key: `JWT_SECRET`
   - Value: `<paste-generated-secret>`

3. **BYPASS_AUTH** (IMPORTANT!)
   - Key: `BYPASS_AUTH`
   - Value: `false`

4. **CLIENT_URL**
   - Key: `CLIENT_URL`
   - Value: `https://your-app-name.onrender.com`
   - Replace `your-app-name` with your actual Render app name

#### Database Variables

**Option A: Use DATABASE_URL (Recommended)**
- When you link your database in Render, `DATABASE_URL` is automatically added
- You don't need to set individual DB_* variables if using DATABASE_URL

**Option B: Use Individual Variables**
- Only if you're NOT using DATABASE_URL
- Get values from your Render database dashboard:
  - DB_HOST: From "Internal Database URL"
  - DB_PORT: `5432`
  - DB_NAME: `leadrouter` (or your database name)
  - DB_USER: From database credentials
  - DB_PASSWORD: From database credentials

#### Password Variables

5. **ADMIN_PASSWORD**
   - Key: `ADMIN_PASSWORD`
   - Value: `<choose-strong-password>`
   - Example: `MySecureAdminPass2024!`

6. **BDR_PASSWORD**
   - Key: `BDR_PASSWORD`
   - Value: `<choose-strong-password>`
   - Example: `MySecureBDRPass2024!`

#### Optional Variables

7. **JWT_EXPIRES_IN** (optional)
   - Key: `JWT_EXPIRES_IN`
   - Value: `24h` (or your preferred expiry)

8. **PORT** (optional - Render sets this automatically)
   - Key: `PORT`
   - Value: `10000` (Render's default)
   - Or leave it unset and let Render handle it

### Step 3: Link Database (Auto-adds DATABASE_URL)

1. In your service settings
2. Find **"Databases"** or **"Add Database"** section
3. Click and select your `leadrouter-db`
4. This automatically adds `DATABASE_URL` environment variable

## 🔒 Security Checklist

Before deploying, ensure:

- [ ] `BYPASS_AUTH=false` ✅
- [ ] `JWT_SECRET` is a strong random string (32+ characters) ✅
- [ ] `ADMIN_PASSWORD` changed from default ✅
- [ ] `BDR_PASSWORD` changed from default ✅
- [ ] `NODE_ENV=production` ✅
- [ ] `CLIENT_URL` matches your actual Render URL ✅
- [ ] Database credentials are secure ✅

## 📝 Complete Example for Render

Here's what your Render environment variables should look like:

```
NODE_ENV=production
PORT=10000
JWT_SECRET=aB3xK9mP2qR7vT5wY8zA1bC4dE6fG0hI2jK3lM4nO5pQ6rS7tU8vW9xY0zA1
CLIENT_URL=https://leadrouter.onrender.com
DATABASE_URL=postgresql://user:pass@host:5432/leadrouter
ADMIN_PASSWORD=MySecureAdmin2024!
BDR_PASSWORD=MySecureBDR2024!
BYPASS_AUTH=false
JWT_EXPIRES_IN=24h
```

## 🚨 Important Notes

1. **Never commit `.env` to Git** - it contains secrets!
2. **DATABASE_URL vs Individual Variables**: Use one or the other, not both
3. **Render automatically sets PORT** - you usually don't need to set it
4. **Change passwords immediately** after first login
5. **JWT_SECRET** - generate a new one, never reuse

## 🔄 After Setting Variables

1. **Save** all environment variables
2. **Redeploy** your service
3. **Test** login with new admin/BDR passwords
4. **Verify** authentication is working (BYPASS_AUTH=false)

## 🆘 Troubleshooting

**Database connection fails:**
- Check DATABASE_URL is set correctly
- Or verify individual DB_* variables match database credentials
- Ensure database is running (green status in Render)

**Authentication not working:**
- Verify BYPASS_AUTH=false
- Check JWT_SECRET is set
- Check CLIENT_URL matches your actual URL

**App won't start:**
- Check NODE_ENV=production
- Verify PORT is set (or let Render auto-set)
- Check logs in Render dashboard

---

**Remember: Security first! Change all default values before going live!** 🔒
