# 📍 Where to Add DATABASE_URL in Render

## 🎯 Step-by-Step Instructions

### Step 1: Go to Your Web Service
1. Open **Render Dashboard** (https://dashboard.render.com)
2. Click on your **Web Service** (the one that's failing)
   - It should be named something like `leadrouter` or `leadrouter-3`

### Step 2: Go to Environment Tab
1. In your service page, look for tabs at the top:
   - **Overview** | **Logs** | **Metrics** | **Environment** | **Settings** | etc.
2. Click on **"Environment"** tab

### Step 3: Add DATABASE_URL Variable
1. You'll see a list of environment variables (or it might be empty)
2. Look for a button that says:
   - **"Add Environment Variable"** or
   - **"Add Variable"** or
   - **"+"** button
3. Click it

### Step 4: Enter the Values
A form will appear with two fields:

**Key (or Name):**
```
DATABASE_URL
```

**Value:**
```
postgresql://leadrouter_user:3kqSHm2tNMbRvWGkGFPnTBu6eP9wIDhY@dpg-d5lllfemcj7s73bg7so0-a/leadrouter
```

### Step 5: Save
1. Click **"Save Changes"** or **"Add"** button
2. You should see `DATABASE_URL` appear in your environment variables list

### Step 6: Redeploy
1. After saving, go to **"Manual Deploy"** tab (or look for deploy button)
2. Click **"Deploy latest commit"** or **"Deploy"**
3. Wait for deployment to complete
4. Check logs - database connection should work now!

---

## 🖼️ Visual Guide

**Where to find it:**
```
Render Dashboard
  └── Your Web Service (leadrouter)
      └── Environment Tab ← CLICK HERE
          └── Add Environment Variable ← CLICK THIS
              ├── Key: DATABASE_URL
              └── Value: postgresql://leadrouter_user:...
```

---

## ✅ Alternative: Link Database (Easier Method)

Instead of manually adding, you can **link the database**:

1. Go to your **Web Service** → **Settings** tab
2. Scroll down to **"Databases"** section
3. Click **"Add Database"** or **"Link Database"**
4. Select your `leadrouter` database from the list
5. **This automatically adds DATABASE_URL for you!**
6. Save and redeploy

**This is easier because:**
- ✅ Automatically adds DATABASE_URL
- ✅ Updates if database credentials change
- ✅ No need to copy/paste the URL

---

## 🔍 How to Verify It's Added

After adding, you should see in the Environment tab:

```
DATABASE_URL = postgresql://leadrouter_user:3kqSHm2tNMbRvWGkGFPnTBu6eP9wIDhY@dpg-d5lllfemcj7s73bg7so0-a/leadrouter
```

---

## ⚠️ Important Notes

1. **Use Internal Database URL** (not External) - you're using the right one ✅
2. **Don't add quotes** around the URL - paste it as-is
3. **After adding, you MUST redeploy** for it to take effect
4. **The URL contains your password** - keep it secure!

---

## 🚀 After Adding

1. ✅ DATABASE_URL is added
2. ✅ Save changes
3. ✅ Redeploy service
4. ✅ Check logs - should connect successfully
5. ✅ No more `ECONNREFUSED` errors!

---

**Quick Path: Service → Environment Tab → Add Environment Variable → DATABASE_URL → Paste URL → Save → Redeploy**
