# Fix Database Password Issue

## Problem
PostgreSQL is installed and running, but the password in `.env` doesn't match.

## Solution Options

### Option 1: Find Your PostgreSQL Password

If you remember setting a password during PostgreSQL installation, update `.env`:

1. Open `.env` file
2. Change this line:
   ```
   DB_PASSWORD=postgres
   ```
   To your actual PostgreSQL password:
   ```
   DB_PASSWORD=your_actual_password
   ```

### Option 2: Reset PostgreSQL Password

If you forgot the password, you can reset it:

1. **Open pgAdmin** (installed with PostgreSQL)
2. Connect to localhost
3. Right-click on "PostgreSQL" → Properties → Change password

Or use command line:
```powershell
# This will prompt for new password
psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'newpassword';"
```

Then update `.env` with the new password.

### Option 3: Use Windows Authentication (if enabled)

If your PostgreSQL allows Windows authentication, you might not need a password. But this is less common.

## After Fixing Password

Run:
```powershell
npm run setup
```

This will:
- Create the database
- Run migrations
- Seed initial data

Then start the app:
```powershell
npm run dev
```

