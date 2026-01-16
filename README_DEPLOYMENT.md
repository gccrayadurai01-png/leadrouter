# 🚀 LeadRouter - Production Deployment

Your LeadRouter application is ready for production deployment!

## 📁 Deployment Files Created

1. **`docker-compose.prod.yml`** - Production Docker Compose configuration
2. **`env.production.example`** - Production environment variables template
3. **`deploy.sh`** - Automated deployment script for Linux/Mac
4. **`deploy.ps1`** - Automated deployment script for Windows
5. **`PRODUCTION_DEPLOYMENT.md`** - Comprehensive deployment guide
6. **`QUICK_DEPLOY.md`** - Quick start deployment guide

## 🎯 Quick Start

### Option 1: Automated Deployment (Recommended)

**Linux/Mac:**
```bash
cp env.production.example .env
# Edit .env with your production values
nano .env
chmod +x deploy.sh
./deploy.sh
```

**Windows:**
```powershell
Copy-Item env.production.example .env
# Edit .env with your production values
notepad .env
.\deploy.ps1
```

### Option 2: Manual Deployment

```bash
# 1. Create .env file
cp env.production.example .env
nano .env  # Edit with your values

# 2. Start services
docker-compose -f docker-compose.prod.yml up -d --build

# 3. Setup database
docker-compose -f docker-compose.prod.yml exec app node server/db/setup.js

# 4. Verify
curl http://localhost:3001/health
```

## ⚙️ Critical Configuration

Before deploying, **MUST** update these in `.env`:

1. **`DB_PASSWORD`** - Strong database password
2. **`JWT_SECRET`** - Generate with: `openssl rand -base64 32`
3. **`CLIENT_URL`** - Your production domain (e.g., `https://leadrouter.yourdomain.com`)
4. **`BYPASS_AUTH=false`** - Disable authentication bypass

## 📚 Documentation

- **Quick Start**: See `QUICK_DEPLOY.md` for fast deployment
- **Full Guide**: See `PRODUCTION_DEPLOYMENT.md` for comprehensive instructions
- **Original Guide**: See `DEPLOYMENT.md` for development setup

## ✅ What's Included

✅ Production-ready Docker configuration  
✅ Automated deployment scripts  
✅ Environment variable templates  
✅ Database setup automation  
✅ Health checks and monitoring  
✅ Security best practices  
✅ SSL/HTTPS setup guide  
✅ Backup procedures  
✅ Troubleshooting guide  

## 🔒 Security Checklist

- [ ] Changed `DB_PASSWORD`
- [ ] Changed `JWT_SECRET`
- [ ] Set `BYPASS_AUTH=false`
- [ ] Changed default admin password
- [ ] Changed default BDR password
- [ ] Set up SSL/HTTPS
- [ ] Configured firewall

## 🌐 After Deployment

1. Access your app at: `http://your-server-ip:3001` or your domain
2. Login with default credentials (then change them!)
   - Admin: `admin` / `admin123`
   - BDR: `bdr` / `bdr123`
3. Set up Nginx reverse proxy (see `PRODUCTION_DEPLOYMENT.md`)
4. Configure SSL certificate (Let's Encrypt recommended)

## 🆘 Need Help?

- Check logs: `docker-compose -f docker-compose.prod.yml logs -f app`
- Health check: `curl http://localhost:3001/health`
- See troubleshooting in `PRODUCTION_DEPLOYMENT.md`

---

**Ready to deploy?** Start with `QUICK_DEPLOY.md` for the fastest path to production!

