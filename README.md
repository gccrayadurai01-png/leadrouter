# LeadRouter

Production-grade lead assignment system with weighted round robin distribution, integrated with HubSpot.

## Features

- **Weighted Round Robin Algorithm**: Deterministic, fair lead distribution based on rep weights
- **Dual Queue System**: Separate SMB and ENT queues with independent rep pools
- **HubSpot Integration**: OAuth authentication and API integration for lead assignment
- **Role-Based Access**: Admin panel for Sales Ops, BDR dashboard for assignments
- **Audit Logging**: Complete audit trail of all system changes
- **Real-time Updates**: Live queue status and assignment tracking

## Architecture

### Backend
- **Node.js/Express**: RESTful API server
- **PostgreSQL**: Production database with proper schema
- **JWT Authentication**: Secure role-based access control
- **Weighted Round Robin Engine**: Deterministic assignment algorithm

### Frontend
- **React**: Modern UI with routing
- **Tailwind CSS**: Responsive, beautiful design
- **Role-Based Dashboards**: Separate views for Admin and BDR

## Database Schema

- `reps`: Sales representatives with weights and queue assignments
- `rep_scores`: Current weighted scores for round robin algorithm
- `assignments`: Complete assignment history
- `audit_logs`: System change audit trail
- `users`: Authentication and authorization

## Weighted Round Robin Algorithm

The system uses a deterministic weighted round robin algorithm:

1. For every active rep: `current_score += weight`
2. Pick rep with highest `current_score`
3. Assign lead to that rep
4. `current_score -= total_active_weight`
5. Persist state to database

This guarantees:
- Fairness over time
- No starvation
- No double assignment
- Perfect proportional distribution

## Quick Start

### Docker (Easiest)

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Start everything (auto-sets up database)
docker-compose up -d

# 3. Open http://localhost:3001
```

### Manual Setup

```bash
# 1. Install dependencies
npm install && cd client && npm install && cd ..

# 2. Set up environment
cp .env.example .env

# 3. Complete database setup (creates DB, migrations, seeds)
npm run setup

# 4. Start development
npm run dev
```

See `QUICKSTART.md` for detailed instructions.

### Default Credentials

- **Admin**: admin@leadrouter.com / admin123
- **BDR**: bdr@leadrouter.com / bdr123

**⚠️ Change these in production!**

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Reps (Admin only)
- `GET /api/reps` - List all reps
- `GET /api/reps/:id` - Get single rep
- `POST /api/reps` - Create rep
- `PUT /api/reps/:id` - Update rep
- `DELETE /api/reps/:id` - Delete rep

### Assignments (BDR/Admin)
- `GET /api/assignments/next/:queue` - Get next rep
- `POST /api/assignments/assign/:queue` - Assign lead
- `GET /api/assignments/queue/:queue/stats` - Get queue stats
- `GET /api/assignments` - Get assignment history

### Audit (Admin only)
- `GET /api/audit` - Get audit logs

## HubSpot Integration

HubSpot integration is structured but requires:
1. HubSpot app credentials (Client ID, Client Secret)
2. OAuth callback setup
3. HubSpot Owners API access

See `server/routes/hubspot.js` (to be implemented) for OAuth flow.

## Production Deployment

1. Set strong `JWT_SECRET` in environment
2. Use production PostgreSQL database
3. Configure HubSpot OAuth credentials
4. Set up SSL/TLS
5. Configure rate limiting appropriately
6. Set up monitoring and logging
7. Change default passwords

## License

MIT
