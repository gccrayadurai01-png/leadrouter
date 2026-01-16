# ✅ Production Deployment Checklist

Use this checklist to ensure a successful deployment.

## 📦 Pre-Deployment

- [ ] Code is tested and working locally
- [ ] All features are implemented
- [ ] Code is committed to Git (if using version control)
- [ ] Server is provisioned and accessible via SSH

## 🖥️ Server Setup

- [ ] Server OS is Ubuntu 20.04+ or similar Linux
- [ ] Docker is installed (`docker --version`)
- [ ] Docker Compose is installed (`docker-compose --version`)
- [ ] User has sudo privileges
- [ ] Firewall is configured (UFW or iptables)

## 📁 Project Upload

- [ ] Project files uploaded to server
- [ ] Files are in correct directory (e.g., `/opt/leadrouter`)
- [ ] All necessary files are present
- [ ] File permissions are correct

## ⚙️ Configuration

- [ ] `.env` file created from `env.production.example`
- [ ] `DB_PASSWORD` set to strong password
- [ ] `JWT_SECRET` generated and set (use: `openssl rand -base64 32`)
- [ ] `CLIENT_URL` set to your domain or IP
- [ ] `BYPASS_AUTH=false` (production setting)
- [ ] `NODE_ENV=production`
- [ ] HubSpot credentials set (if using HubSpot integration)

## 🚀 Deployment

- [ ] Docker containers built successfully
- [ ] Database container is running
- [ ] Application container is running
- [ ] Database setup script ran successfully
- [ ] Health check endpoint returns OK
- [ ] Application logs show no errors

## 🌐 Network & Domain

- [ ] Domain DNS points to server IP (if using domain)
- [ ] Nginx is installed and configured (if using domain)
- [ ] SSL certificate is installed (if using domain)
- [ ] HTTPS is working (if using domain)
- [ ] Firewall allows ports 80, 443 (and 22 for SSH)
- [ ] Application is accessible from browser

## 🔒 Security

- [ ] Default admin password changed
- [ ] Default BDR password changed
- [ ] Strong database password set
- [ ] JWT secret is random and secure
- [ ] Auth bypass is disabled (`BYPASS_AUTH=false`)
- [ ] SSL/HTTPS is configured (if using domain)
- [ ] Firewall is properly configured
- [ ] Only necessary ports are open

## 📊 Verification

- [ ] Can access application in browser
- [ ] Can login with admin credentials
- [ ] Can login with BDR credentials
- [ ] Dashboard loads correctly
- [ ] Database queries work
- [ ] Assignment functionality works
- [ ] Charts and statistics display correctly

## 💾 Backup & Monitoring

- [ ] Database backup procedure is set up
- [ ] Backup location is configured
- [ ] Automated backup schedule is set (cron job)
- [ ] Log monitoring is configured
- [ ] Health check monitoring is set up

## 📝 Documentation

- [ ] Server access credentials documented (securely)
- [ ] Database credentials documented (securely)
- [ ] Domain/DNS information documented
- [ ] Backup procedures documented
- [ ] Team has access to deployment guide

## 🎯 Post-Deployment

- [ ] Team is notified of deployment
- [ ] Users can access the application
- [ ] All features are tested in production
- [ ] Performance is acceptable
- [ ] No critical errors in logs
- [ ] Monitoring alerts are configured

## 🔄 Maintenance

- [ ] Update procedure is documented
- [ ] Rollback procedure is documented
- [ ] Regular backup verification scheduled
- [ ] SSL certificate auto-renewal is working
- [ ] Log rotation is configured

---

**Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete

**Deployment Date:** _______________

**Deployed By:** _______________

**Notes:**
_________________________________________________
_________________________________________________
_________________________________________________

