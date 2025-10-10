# 🚀 MCNmart Deployment & Domain Setup Guide

## Complete Step-by-Step Guide to Launch Your Site

---

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Option 1: Vercel Deployment (Recommended)](#option-1-vercel-deployment-recommended)
3. [Option 2: Traditional Hosting (cPanel/VPS)](#option-2-traditional-hosting-cpanelvps)
4. [Domain Configuration](#domain-configuration)
5. [SSL Certificate Setup](#ssl-certificate-setup)
6. [Post-Deployment Steps](#post-deployment-steps)
7. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### ✅ Code Preparation

```bash
# 1. Apply database migration
npx prisma db push

# 2. Run performance optimizations (if not done)
npm run perf:indexes

# 3. Build the application
npm run build

# 4. Test the build locally
npm start
```

### ✅ Environment Variables

Create `.env.production` file:

```env
# Database
DATABASE_URL="file:./prisma/prod.db"

# NextAuth
NEXTAUTH_URL="https://mcnmart.com"
NEXTAUTH_SECRET="your-super-secret-key-min-32-chars"

# Cron Job
CRON_SECRET="your-cron-secret-key"

# Optional: Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Optional: Payment Gateway
JAZZCASH_API_KEY="your-jazzcash-key"
EASYPAISA_API_KEY="your-easypaisa-key"
```

### ✅ Files to Include

**Must Upload:**
- `.next/` folder (after build)
- `public/` folder
- `prisma/` folder
- `node_modules/` (or run `npm install` on server)
- `package.json`
- `package-lock.json`
- `next.config.js`
- `.env.production`

**Do NOT Upload:**
- `.env.local`
- `.env.development`
- `node_modules/` (if installing on server)
- `.git/` folder
- Development files

---

## Option 1: Vercel Deployment (Recommended)

### Why Vercel?
- ✅ **Free tier available**
- ✅ **Automatic SSL**
- ✅ **Global CDN**
- ✅ **Zero configuration**
- ✅ **Automatic deployments from Git**
- ✅ **Built for Next.js**

### Step 1: Prepare Git Repository

```bash
# Initialize git (if not done)
git init

# Add all files
git add .

# Commit
git commit -m "Ready for deployment"

# Create GitHub repository and push
git remote add origin https://github.com/yourusername/mcnmart.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)**
2. **Sign up/Login** with GitHub
3. **Click "Add New Project"**
4. **Import your GitHub repository**
5. **Configure Project:**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

6. **Add Environment Variables:**
   Click "Environment Variables" and add:
   ```
   DATABASE_URL = file:./prisma/prod.db
   NEXTAUTH_URL = https://your-project.vercel.app
   NEXTAUTH_SECRET = your-secret-key
   CRON_SECRET = your-cron-secret
   ```

7. **Click "Deploy"**

### Step 3: Setup Custom Domain

1. **In Vercel Dashboard:**
   - Go to Project Settings → Domains
   - Click "Add Domain"
   - Enter: `mcnmart.com`
   - Click "Add"

2. **Vercel will show DNS records:**
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

3. **Add these records to your domain registrar** (see Domain Configuration section)

### Step 4: Setup Cron Jobs

Create `vercel.json` in project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-membership-expiration",
      "schedule": "0 0 * * *"
    }
  ]
}
```

Commit and push:
```bash
git add vercel.json
git commit -m "Add cron configuration"
git push
```

Vercel will automatically redeploy with cron jobs enabled.

---

## Option 2: Traditional Hosting (cPanel/VPS)

### Requirements
- Node.js 18+ installed
- PM2 process manager
- Nginx web server
- 2GB RAM minimum
- 10GB storage minimum

### Step 1: Server Setup

#### Install Node.js (Ubuntu/Debian)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Should show v18.x.x
```

#### Install PM2
```bash
sudo npm install -g pm2
```

#### Install Nginx
```bash
sudo apt-get update
sudo apt-get install nginx
```

### Step 2: Upload Files

#### Using FTP/SFTP:
1. Connect to your server
2. Upload to `/var/www/mcnmart/` or `/home/username/mcnmart/`
3. Upload all files except `node_modules/`

#### Using Git (Recommended):
```bash
cd /var/www/
git clone https://github.com/yourusername/mcnmart.git
cd mcnmart
```

### Step 3: Install Dependencies

```bash
cd /var/www/mcnmart
npm install --production
```

### Step 4: Setup Environment

```bash
# Create .env.production
nano .env.production

# Add your environment variables (see Pre-Deployment Checklist)
# Save: Ctrl+X, Y, Enter
```

### Step 5: Build Application

```bash
npm run build
```

### Step 6: Start with PM2

```bash
# Start application
pm2 start npm --name "mcnmart" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it shows

# Check status
pm2 status
pm2 logs mcnmart
```

### Step 7: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/mcnmart
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name mcnmart.com www.mcnmart.com;
    
    # Redirect to HTTPS (after SSL setup)
    # return 301 https://$server_name$request_uri;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Optimize static files
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, max-age=3600, immutable";
    }
    
    # Optimize images
    location /images {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 30d;
        add_header Cache-Control "public, max-age=2592000";
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/mcnmart /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

### Step 8: Setup Cron Jobs

```bash
crontab -e
```

Add:
```bash
# Check membership expiration daily at midnight
0 0 * * * curl -X GET http://localhost:3000/api/cron/check-membership-expiration -H "Authorization: Bearer your-cron-secret"
```

---

## Domain Configuration

### Where to Buy Domain
- **Namecheap** (Recommended): https://www.namecheap.com
- **GoDaddy**: https://www.godaddy.com
- **Google Domains**: https://domains.google

### DNS Configuration

#### For Vercel:

**A Record:**
```
Type: A
Host: @
Points to: 76.76.21.21
TTL: 3600
```

**CNAME Record:**
```
Type: CNAME
Host: www
Points to: cname.vercel-dns.com
TTL: 3600
```

#### For Traditional Hosting:

**A Records:**
```
Type: A
Host: @
Points to: YOUR_SERVER_IP
TTL: 3600

Type: A
Host: www
Points to: YOUR_SERVER_IP
TTL: 3600
```

### How to Add DNS Records

#### Namecheap:
1. Login to Namecheap
2. Go to "Domain List"
3. Click "Manage" next to your domain
4. Go to "Advanced DNS" tab
5. Click "Add New Record"
6. Add the records above
7. Wait 5-30 minutes for propagation

#### GoDaddy:
1. Login to GoDaddy
2. Go to "My Products"
3. Click "DNS" next to your domain
4. Click "Add" to add records
5. Add the records above
6. Save changes

---

## SSL Certificate Setup

### For Vercel:
✅ **Automatic!** Vercel provides free SSL automatically.

### For Traditional Hosting:

#### Using Let's Encrypt (Free):

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d mcnmart.com -d www.mcnmart.com

# Follow prompts:
# - Enter email
# - Agree to terms
# - Choose to redirect HTTP to HTTPS (recommended)

# Test auto-renewal
sudo certbot renew --dry-run
```

Certificate will auto-renew every 90 days.

#### Verify SSL:
Visit: https://www.ssllabs.com/ssltest/analyze.html?d=mcnmart.com

---

## Post-Deployment Steps

### 1. Test Everything

**Functionality Checklist:**
- [ ] Homepage loads
- [ ] User registration works
- [ ] Login/logout works
- [ ] Dashboard displays correctly
- [ ] Tasks system functional
- [ ] Products page loads
- [ ] Blog posts visible
- [ ] Partnership page accessible
- [ ] About page loads
- [ ] Support page works
- [ ] Admin panel accessible
- [ ] Payment methods display

### 2. Setup Monitoring

#### Google Analytics:
1. Go to [analytics.google.com](https://analytics.google.com)
2. Create property for mcnmart.com
3. Get tracking ID (G-XXXXXXXXXX)
4. Add to `src/app/layout.tsx`:

```typescript
<Script
  src={`https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX`}
  strategy="afterInteractive"
/>
<Script id="google-analytics" strategy="afterInteractive">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX');
  `}
</Script>
```

#### Uptime Monitoring:
1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Add monitor for https://mcnmart.com
3. Set alert email

#### Error Tracking (Sentry):
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

### 3. Setup Backups

#### Database Backup Script:
```bash
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/mcnmart"
DB_PATH="/var/www/mcnmart/prisma/prod.db"

mkdir -p $BACKUP_DIR
cp $DB_PATH $BACKUP_DIR/db_backup_$DATE.db

# Keep only last 30 days
find $BACKUP_DIR -name "db_backup_*.db" -mtime +30 -delete
```

Add to crontab:
```bash
0 2 * * * /path/to/backup-db.sh
```

### 4. Performance Optimization

```bash
# Enable Gzip compression in Nginx
sudo nano /etc/nginx/nginx.conf
```

Add in `http` block:
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
```

### 5. Security Hardening

#### Firewall Setup:
```bash
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

#### Fail2Ban (Prevent brute force):
```bash
sudo apt-get install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## Troubleshooting

### Issue: Site not loading

**Check:**
```bash
# Vercel: Check deployment logs in dashboard
# Traditional: Check PM2 logs
pm2 logs mcnmart

# Check Nginx
sudo nginx -t
sudo systemctl status nginx

# Check if app is running
curl http://localhost:3000
```

### Issue: Database errors

**Fix:**
```bash
cd /var/www/mcnmart
npx prisma generate
npx prisma db push
pm2 restart mcnmart
```

### Issue: Domain not pointing

**Check:**
```bash
# Check DNS propagation
nslookup mcnmart.com
dig mcnmart.com

# Online tool:
# https://www.whatsmydns.net/#A/mcnmart.com
```

Wait 24-48 hours for full DNS propagation.

### Issue: SSL certificate errors

**Fix:**
```bash
# Renew certificate
sudo certbot renew --force-renewal

# Restart Nginx
sudo systemctl restart nginx
```

### Issue: 502 Bad Gateway

**Fix:**
```bash
# Check if app is running
pm2 status

# Restart app
pm2 restart mcnmart

# Check logs
pm2 logs mcnmart --lines 100
```

### Issue: Slow performance

**Optimize:**
```bash
# Enable caching in next.config.js
# Run performance audit
npm run perf:test

# Check server resources
htop
df -h
```

---

## Maintenance Commands

```bash
# View logs
pm2 logs mcnmart

# Restart application
pm2 restart mcnmart

# Stop application
pm2 stop mcnmart

# Update application
cd /var/www/mcnmart
git pull
npm install
npm run build
pm2 restart mcnmart

# Check disk space
df -h

# Check memory usage
free -h

# Monitor real-time
pm2 monit
```

---

## Support Resources

### Documentation:
- Next.js: https://nextjs.org/docs
- Vercel: https://vercel.com/docs
- Prisma: https://www.prisma.io/docs

### Community:
- Next.js Discord: https://discord.gg/nextjs
- Stack Overflow: https://stackoverflow.com/questions/tagged/next.js

### Professional Help:
- Vercel Support: support@vercel.com
- Hire Developer: Upwork, Fiverr

---

## Quick Reference

### Vercel Deployment:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

### PM2 Commands:
```bash
pm2 start npm --name "mcnmart" -- start
pm2 stop mcnmart
pm2 restart mcnmart
pm2 delete mcnmart
pm2 logs mcnmart
pm2 monit
```

### Nginx Commands:
```bash
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl status nginx
sudo nginx -t  # Test configuration
```

---

## Cost Estimate

### Vercel (Recommended for Start):
- **Free Tier**: $0/month
  - 100GB bandwidth
  - Unlimited deployments
  - Automatic SSL
  - Global CDN

- **Pro Tier**: $20/month (when you grow)
  - 1TB bandwidth
  - Advanced analytics
  - Priority support

### Traditional Hosting:
- **VPS (DigitalOcean/Linode)**: $5-20/month
- **Domain**: $10-15/year
- **SSL**: Free (Let's Encrypt)

**Total**: ~$15-35/month

---

## Final Checklist Before Going Live

- [ ] All pages tested and working
- [ ] Database migrated and seeded
- [ ] Environment variables configured
- [ ] Domain DNS configured
- [ ] SSL certificate active
- [ ] Cron jobs setup
- [ ] Backups configured
- [ ] Monitoring tools setup
- [ ] Google Analytics added
- [ ] Error tracking enabled
- [ ] Performance optimized
- [ ] Security hardened
- [ ] Admin account created
- [ ] Test transactions completed
- [ ] Support email configured
- [ ] Legal pages reviewed

---

**🎉 Congratulations! Your MCNmart platform is now live!**

**Need help?** Contact your developer or refer to the documentation above.

**Last Updated**: 2025-10-07
**Version**: 1.0.0
