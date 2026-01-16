# Reset PostgreSQL Password Guide

## The Issue
Password authentication is failing even though password is set to 1573.

## Solution: Reset Password Using pgAdmin

### Step 1: Open pgAdmin
1. Press `Windows Key`
2. Type "pgAdmin"
3. Open pgAdmin 4

### Step 2: Connect to Server
1. In pgAdmin, you'll see "Servers" in the left panel
2. Click on your PostgreSQL server (usually "PostgreSQL 14" or "PostgreSQL 17")
3. Enter password: `1573` when prompted
4. If it connects, the password is correct but might be for a different user

### Step 3: Reset Password
1. Right-click on "PostgreSQL" server
2. Select "Properties"
3. Go to "Connection" tab
4. Change the password to: `1573`
5. Click "Save"

### Step 4: Or Change via SQL
1. In pgAdmin, right-click on your database
2. Select "Query Tool"
3. Run this command:
   ```sql
   ALTER USER postgres WITH PASSWORD '1573';
   ```
4. Click "Execute" (F5)

### Step 5: Try Setup Again
After resetting, run:
```powershell
npm run setup
```

## Alternative: Check Which User Has Password 1573

The password might be for a different user. Try updating .env with:
- User: your Windows username
- Or check pgAdmin for other users

