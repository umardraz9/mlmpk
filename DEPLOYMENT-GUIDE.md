# MLM-Pak Task System Deployment Guide

## Overview

This guide covers the deployment of the MLM-Pak platform with the new policy-compliant task system and content engagement features.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Database (SQLite for development, PostgreSQL for production)
- Environment variables configured

## Quick Setup

### 1. Install Dependencies
```bash
# Install main MLM-Pak platform
cd mlm-pak
npm install

# Install content site dependencies
cd content-site
npm install
```

### 2. Environment Variables

Create `.env.local` in the root directory:

```bash
# Database
DATABASE_URL="file:./dev.db"

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Content Site
CONTENT_SITE_URL=http://localhost:3002
MLM_SITE_URL=http://localhost:3000

# Email (optional)
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email
EMAIL_SERVER_PASSWORD=your-password
EMAIL_FROM=noreply@mlmpak.com
```

### 3. Database Setup

```bash
# Run database migrations
npx prisma migrate dev

# Seed content tasks
npx ts-node scripts/seed-content-tasks.ts

# Seed demo data (optional)
npx ts-node scripts/seed-demo-data.ts
```

### 4. Start Development Servers

```bash
# Terminal 1: Main MLM-Pak platform
cd mlm-pak
npm run dev

# Terminal 2: Content site
cd content-site
npm run dev
```

## Production Deployment

### Option 1: Vercel (Recommended)

#### Main MLM-Pak Platform
1. Push code to GitHub
2. Import project to Vercel
3. Set environment variables
4. Deploy

#### Content Site
1. Create separate Vercel project
2. Set content site environment variables
3. Deploy content-site directory

### Option 2: Netlify

#### Main Platform
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Configure environment variables

#### Content Site
1. Create separate Netlify site
2. Set build command: `npm run build`
3. Set publish directory: `content-site/.next-content`
4. Configure environment variables

### Option 3: Traditional Server

#### Requirements
- Node.js 18+
- PM2 for process management
- Nginx for reverse proxy
- SSL certificates

#### Setup Steps

1. **Server Setup**
```bash
# Install Node.js and PM2
sudo apt update
sudo apt install nodejs npm pm2

# Clone repository
git clone https://github.com/your-repo/mlm-pak.git
cd mlm-pak

# Install dependencies
npm install
```

2. **Database Setup**
```bash
# For PostgreSQL
sudo apt install postgresql postgresql-contrib
sudo -u postgres createdb mlmpak

# Update DATABASE_URL in .env
DATABASE_URL="postgresql://user:password@localhost:5432/mlmpak"
```

3. **Build and Deploy**
```bash
# Build application
npm run build

# Start with PM2
pm2 start npm --name "mlm-pak" -- start
pm2 startup
pm2 save
```

4. **Nginx Configuration**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Environment Variables Reference

### Required Variables
```bash
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# Authentication
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key

# Content Site
CONTENT_SITE_URL=https://content.your-domain.com
MLM_SITE_URL=https://your-domain.com
```

### Optional Variables
```bash
# Email Service
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=noreply@your-domain.com

# Payment Integration
JAZZCASH_MERCHANT_ID=your-merchant-id
JAZZCASH_PASSWORD=your-password
EASYPAISA_STORE_ID=your-store-id
EASYPAISA_HASH_KEY=your-hash-key

# Analytics
GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX
FACEBOOK_PIXEL_ID=FB-XXXXXXXXX
```

## Content Site Deployment

### Static Hosting (Simple)

1. **Upload Files**
   - Upload `content-site/index.html` to any static host
   - Configure custom domain
   - Update CONTENT_SITE_URL

2. **CDN Options**
   - Cloudflare Pages
   - Netlify
   - Vercel
   - GitHub Pages

### Dynamic Hosting (Advanced)

1. **Express Server**
```bash
# Install Express
cd content-site
npm init -y
npm install express

# Run server
node deploy-content-site.js
```

2. **Docker Container**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3002
CMD ["node", "deploy-content-site.js"]
```

## Security Considerations

### HTTPS Setup
- Use Let's Encrypt for SSL certificates
- Configure automatic renewal
- Force HTTPS redirects

### Security Headers
```nginx
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
```

### Rate Limiting
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/m;
limit_req zone=api burst=20 nodelay;
```

## Monitoring

### Health Checks
```bash
# Check main platform
curl https://your-domain.com/api/health

# Check content site
curl https://content.your-domain.com/health

# Check database connection
npx prisma db ping
```

### Logging
```bash
# PM2 logs
pm2 logs mlm-pak

# Application logs
tail -f ~/.pm2/logs/mlm-pak-out.log
tail -f ~/.pm2/logs/mlm-pak-error.log
```

## Troubleshooting

### Common Issues

1. **Database Connection**
   - Check DATABASE_URL format
   - Verify database permissions
   - Check firewall settings

2. **Authentication Issues**
   - Verify NEXTAUTH_SECRET
   - Check NEXTAUTH_URL matches domain
   - Ensure HTTPS in production

3. **Content Site Not Loading**
   - Check CONTENT_SITE_URL
   - Verify CORS settings
   - Check firewall/port settings

4. **Task Verification Failures**
   - Check referrer settings
   - Verify token validation
   - Check engagement tracking

### Support Commands

```bash
# Check service status
pm2 status

# Restart services
pm2 restart mlm-pak

# View logs
pm2 logs mlm-pak --lines 50

# Update application
git pull origin main
npm install
npm run build
pm2 restart mlm-pak
```

## Performance Optimization

### Database Optimization
- Use connection pooling
- Regular database maintenance
- Index optimization

### CDN Setup
- Use Cloudflare for DNS and CDN
- Configure caching headers
- Optimize images and assets

### Monitoring Tools
- Google Analytics
- Sentry for error tracking
- Uptime monitoring services

## Scaling Considerations

### Horizontal Scaling
- Load balancer setup
- Multiple server instances
- Database replication

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Implement caching layers

This deployment guide provides comprehensive instructions for setting up the MLM-Pak platform with the new policy-compliant task system in various environments.
