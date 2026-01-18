# Setup Database on Render (Without Shell Access)

Since Shell access requires a Starter plan, here are alternative ways to set up your database:

## Option 1: Run Setup Locally (Recommended)

Run the setup script from your local machine, connecting to your Render database.

### Steps:

1. **Get your DATABASE_URL from Render:**
   - Go to Render Dashboard → Your Database → Info tab
   - Copy the "Internal Database URL" or "Connection String"
   - It looks like: `postgresql://user:password@dpg-xxxxx-a.render.com/dbname`

2. **Set environment variable locally:**
   
   **Windows PowerShell:**
   ```powershell
   $env:DATABASE_URL="postgresql://user:password@dpg-xxxxx-a.render.com/dbname"
   ```
   
   **Windows CMD:**
   ```cmd
   set DATABASE_URL=postgresql://user:password@dpg-xxxxx-a.render.com/dbname
   ```
   
   **Mac/Linux:**
   ```bash
   export DATABASE_URL="postgresql://user:password@dpg-xxxxx-a.render.com/dbname"
   ```

3. **Run the setup script:**
   ```bash
   node server/db/setup.js
   ```

4. **Verify it worked:**
   - Check Render logs - should see database connection successful
   - Try logging in with admin@leadrouter.com / admin123

---

## Option 2: Create a Setup Endpoint (One-Time Use)

Create a special endpoint that runs setup once. **⚠️ Remove this after setup for security!**

### Steps:

1. **Add this to your server/index.js** (temporarily):
   ```javascript
   // TEMPORARY: Database setup endpoint - REMOVE AFTER SETUP!
   app.post('/api/setup-database', async (req, res) => {
     try {
       const { setupDatabase } = require('./db/setup');
       await setupDatabase();
       res.json({ success: true, message: 'Database setup completed' });
     } catch (error) {
       res.status(500).json({ error: error.message });
     }
   });
   ```

2. **Deploy to Render**

3. **Call the endpoint once:**
   ```bash
   curl -X POST https://leadrouter-3.onrender.com/api/setup-database
   ```
   
   Or use Postman/Insomnia:
   - Method: POST
   - URL: https://leadrouter-3.onrender.com/api/setup-database

4. **Remove the endpoint** after setup for security!

---

## Option 3: Auto-Setup on First Request (Not Recommended)

Modify the login route to auto-setup if users table doesn't exist. This is less secure but works.

---

## Option 4: Use Render's One-Off Job (Requires Starter Plan)

If you upgrade to Starter plan:
- Go to Dashboard → New → One-Off Job
- Select your service
- Command: `node server/db/setup.js`
- Run

---

## Recommended: Option 1 (Run Locally)

This is the safest and easiest option. Just connect your local setup script to the Render database.
