# LeadRouter Quick Start Guide

Get LeadRouter up and running in minutes!

## Option 1: Docker (Recommended - Easiest)

```bash
# 1. Clone or navigate to project directory
cd leadrouter

# 2. Copy environment file
cp .env.example .env

# 3. Edit .env (optional - defaults work for development)
# Change JWT_SECRET and passwords for production!

# 4. Start everything
docker-compose up -d

# 5. Check it's running
docker-compose logs -f app

# 6. Open in browser
# http://localhost:3001
```

**That's it!** The database is automatically set up, migrations run, and sample data is seeded.

## Option 2: Manual Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Steps

```bash
# 1. Install dependencies
npm install
cd client && npm install && cd ..

# 2. Set up environment
cp .env.example .env
# Edit .env with your database credentials

# 3. Set up database (creates DB, runs migrations, seeds data)
npm run setup

# 4. Test database connection
npm run test-db

# 5. Start development server
npm run dev

# 6. Open http://localhost:3000
```

## First Login

**Admin Account:**
- Email: `admin@leadrouter.com`
- Password: `admin123`

**BDR Account:**
- Email: `bdr@leadrouter.com`
- Password: `bdr123`

⚠️ **Change these passwords in production!**

## What You'll See

### BDR Dashboard
- Two queue panels (SMB and ENT)
- "Next Lead Will Go To" preview
- One-click lead assignment
- Real-time updates

### Admin Dashboard
- Manage sales reps
- View queue statistics
- Assignment history
- Audit logs

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
npm run test-db

# Check PostgreSQL is running
# Linux/Mac:
sudo systemctl status postgresql
# or
brew services list

# Windows: Check Services panel
```

### Port Already in Use

```bash
# Change port in .env
PORT=3002
```

### Reset Database

```bash
# Drop and recreate (Docker)
docker-compose down -v
docker-compose up -d

# Manual
psql -U postgres -c "DROP DATABASE leadrouter;"
npm run setup
```

## Next Steps

1. **Add Your Reps**: Login as admin and add your sales reps
2. **Set Weights**: Adjust rep weights based on capacity
3. **Connect HubSpot**: Set up HubSpot OAuth (see DEPLOYMENT.md)
4. **Deploy**: Follow DEPLOYMENT.md for production deployment

## Need Help?

- Check `DEPLOYMENT.md` for detailed deployment guide
- Check server logs: `docker-compose logs app` or `pm2 logs`
- Check database: `npm run test-db`


