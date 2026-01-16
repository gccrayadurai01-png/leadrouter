# Manual Setup Guide for LeadRouter

## ✅ Step 1: Dependencies Installed (DONE!)

- ✅ Node.js v24.13.0
- ✅ npm v11.6.2
- ✅ Server dependencies installed
- ✅ Client dependencies installed

## 📋 Step 2: Install PostgreSQL

You need PostgreSQL for the database. Choose one option:

### Option A: Install PostgreSQL Locally

1. **Download PostgreSQL:**
   - Go to: https://www.postgresql.org/download/windows/
   - Download the Windows installer
   - Run the installer
   - Remember the password you set for the `postgres` user

2. **Verify Installation:**
   ```powershell
   psql --version
   ```

### Option B: Use Docker Just for PostgreSQL

If you don't want to install PostgreSQL locally, you can use Docker just for the database:

```powershell
# Start only PostgreSQL container
docker run -d --name leadrouter-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=leadrouter -p 5432:5432 postgres:15-alpine

# Wait a few seconds, then continue with setup
```

### Option C: Use Cloud PostgreSQL (Free Tier)

- **Supabase**: https://supabase.com (Free tier available)
- **Neon**: https://neon.tech (Free tier available)
- **Railway**: https://railway.app (Free tier available)

## 📝 Step 3: Create .env File

Create a `.env` file in the root directory with:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=leadrouter
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# JWT Configuration
JWT_SECRET=your-random-secret-here
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Default Passwords
ADMIN_PASSWORD=admin123
BDR_PASSWORD=bdr123
```

## 🗄️ Step 4: Set Up Database

Once PostgreSQL is running:

```powershell
# Run the complete setup (creates DB, migrations, seeds data)
npm run setup
```

Or step by step:
```powershell
# Create database manually (if needed)
createdb leadrouter

# Run migrations
npm run migrate

# Seed data
npm run seed
```

## 🚀 Step 5: Start the App

```powershell
# Start both server and client
npm run dev
```

This will start:
- **Backend**: http://localhost:3001
- **Frontend**: http://localhost:3000

## 🌐 Step 6: Access the App

1. Open browser: http://localhost:3000
2. Login with:
   - **Admin**: `admin@leadrouter.com` / `admin123`
   - **BDR**: `bdr@leadrouter.com` / `bdr123`

## 🔍 Troubleshooting

### PostgreSQL Connection Error
- Make sure PostgreSQL service is running
- Check password in .env matches your PostgreSQL password
- Verify PostgreSQL is listening on port 5432

### Port Already in Use
- Change PORT in .env
- Or stop the service using the port

### Database Setup Fails
- Make sure PostgreSQL is running
- Check database credentials
- Try creating database manually first

## 📊 Current Status

- ✅ Node.js installed
- ✅ Dependencies installed
- ⏳ PostgreSQL needed
- ⏳ Database setup needed
- ⏳ App ready to start

