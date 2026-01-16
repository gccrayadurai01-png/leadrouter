# Database Setup

## Quick Setup

Run the complete setup script:
```bash
npm run setup
```

This will:
1. Create the database (if it doesn't exist)
2. Run all migrations
3. Seed initial data (admin/BDR users, sample reps)

## Manual Setup

### Step 1: Create Database
```bash
psql -U postgres
CREATE DATABASE leadrouter;
\q
```

### Step 2: Run Migrations
```bash
npm run migrate
```

### Step 3: Seed Data
```bash
npm run seed
```

## Testing Connection

Test your database connection:
```bash
npm run test-db
```

## Database Schema

The schema includes:
- `reps` - Sales representatives
- `rep_scores` - Current weighted scores for round robin
- `assignments` - Lead assignment history
- `audit_logs` - System change audit trail
- `users` - Authentication and authorization
- `hubspot_sync` - HubSpot OAuth tokens

## Troubleshooting

### Connection Refused
- Check PostgreSQL is running
- Verify credentials in `.env`
- Check firewall settings

### Permission Denied
- Ensure database user has CREATE privileges
- Check database exists

### Tables Not Found
- Run migrations: `npm run migrate`
- Or run full setup: `npm run setup`


