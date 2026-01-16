# Connect Database - Step by Step Guide

## Current Issue
Password authentication is failing even though password is set to 1573 in .env

## Solution: Reset PostgreSQL Password

### Method 1: Using pgAdmin (Easiest)

1. **Open pgAdmin**
   - Press Windows Key
   - Type "pgAdmin"
   - Open pgAdmin 4

2. **Connect to Server**
   - In the left panel, find "Servers"
   - Click on your PostgreSQL server (PostgreSQL 14 or 17)
   - Enter password when prompted (try 1573 or your Windows password)

3. **Reset Password**
   - Right-click on "PostgreSQL" server
   - Select "Query Tool"
   - Copy and paste this SQL:
     ```sql
     ALTER USER postgres WITH PASSWORD '1573';
     ```
   - Click "Execute" (or press F5)
   - You should see "ALTER ROLE" message

4. **Test Connection**
   ```powershell
   npm run setup
   ```

### Method 2: Using Command Line (if psql is in PATH)

```powershell
# Find PostgreSQL bin directory
$pgPath = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
# Or try: "C:\Program Files\PostgreSQL\14\bin\psql.exe"

# Connect and reset password
& $pgPath -U postgres -c "ALTER USER postgres WITH PASSWORD '1573';"
```

### Method 3: Check if Password is for Different User

The password 1573 might be for your Windows user, not "postgres". Try:

1. Open pgAdmin
2. Check what users exist
3. See which user has password 1573
4. Update .env with that username:
   ```env
   DB_USER=your_username
   DB_PASSWORD=1573
   ```

## After Resetting Password

Once password is reset to 1573, run:

```powershell
npm run setup
```

This will:
- ✅ Connect to PostgreSQL
- ✅ Create leadrouter database
- ✅ Run all migrations
- ✅ Seed initial data (admin/BDR users, sample reps)

## Verify Connection

Test the connection:
```powershell
node test-db-connection.js
```

If it shows "✅ Successfully connected", you're good to go!

## Quick Fix Script

I've created `reset-postgres-password.sql` - open it in pgAdmin Query Tool and run it.

