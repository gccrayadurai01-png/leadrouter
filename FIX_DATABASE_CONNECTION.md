# 🔧 Fix: Database Connection Refused Error

## ❌ Problem

Your app is trying to connect to `localhost:5432` instead of your Render database. This happens because `DATABASE_URL` is not set in your Render environment variables.

**Error:**
```
ECONNREFUSED 127.0.0.1:5432
```

## ✅ Solution: Add DATABASE_URL to Render

You have two options:

### Option 1: Link Database (Easiest - Recommended) ✅

1. Go to your **Web Service** in Render Dashboard
2. Click **"Settings"** tab
3. Scroll to **"Databases"** section
4. Click **"Add Database"** or **"Link Database"**
5. Select your `leadrouter` database
6. **This automatically adds `DATABASE_URL` environment variable!**
7. Save and redeploy

### Option 2: Manually Add DATABASE_URL

If linking doesn't work, add it manually:

1. Go to your **Web Service** → **Environment** tab
2. Click **"Add Environment Variable"**
3. **Key:** `DATABASE_URL`
4. **Value:** Copy from your database page:
   - Go to your database → **Info** tab
   - Copy the **"Internal Database URL"**
   - It looks like: `postgresql://leadrouter_user:password@dpg-d5lllfemcj7s73bg7so0-a/leadrouter`
5. Paste it as the value
6. Click **"Save Changes"**
7. **Redeploy** your service

## 📋 From Your Database Page

Based on your database info:
- **Hostname:** `dpg-d5lllfemcj7s73bg7so0-a`
- **Port:** `5432`
- **Database:** `leadrouter`
- **Username:** `leadrouter_user`
- **Password:** `3kqSHm2tNMbRvWGkGFPnTBu6eP9wIDhY` (from Internal URL)

**Internal Database URL format:**
```
postgresql://leadrouter_user:3kqSHm2tNMbRvWGkGFPnTBu6eP9wIDhY@dpg-d5lllfemcj7s73bg7so0-a/leadrouter
```

## 🔍 How to Verify

After adding DATABASE_URL:

1. **Check Environment Variables:**
   - Service → Environment tab
   - Verify `DATABASE_URL` is listed

2. **Redeploy:**
   - Manual Deploy → Deploy latest commit
   - Watch logs - should connect successfully

3. **Check Logs:**
   - Should see: "✅ Connected to database" (or similar)
   - No more `ECONNREFUSED` errors

## ⚠️ Important Notes

1. **Use Internal Database URL** (not External) for Render services
2. **Don't set individual DB_* variables** if using DATABASE_URL
3. **SSL is handled automatically** by the code
4. **After adding, redeploy** for changes to take effect

## 🚀 Quick Steps

1. Service → Settings → Databases
2. Click "Add Database" / "Link Database"
3. Select `leadrouter` database
4. Save
5. Redeploy service
6. ✅ Done!

---

**The easiest way is to link the database - it auto-adds DATABASE_URL!**
