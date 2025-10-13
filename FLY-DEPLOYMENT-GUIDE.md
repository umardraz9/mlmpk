# Fly.io Deployment Guide for MLMPK

## Prerequisites

1. **Install Fly.io CLI** (if not already installed):
   ```powershell
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   ```
   
2. **Restart your terminal** after installation to use the `fly` command

3. **Sign up/Login to Fly.io**:
   ```bash
   fly auth signup
   # OR if you already have an account
   fly auth login
   ```

## Deployment Steps

### 1. Launch Your App

```bash
fly launch --no-deploy
```

This will:
- Create a new app on Fly.io
- Generate `fly.toml` configuration (already created)
- Ask you to choose a region (select closest to your users)

### 2. Set Environment Variables

Set all required environment variables:

```bash
# Database URL (REQUIRED)
fly secrets set DATABASE_URL="postgresql://username:password@hostname:5432/database"

# NextAuth Configuration (REQUIRED)
fly secrets set NEXTAUTH_URL="https://your-app.fly.dev"
fly secrets set NEXTAUTH_SECRET="your-secure-secret-key-min-32-chars"

# Admin Configuration (REQUIRED)
fly secrets set ADMIN_EMAIL="admin@your-domain.com"
fly secrets set ADMIN_PASSWORD="secure-admin-password"

# Optional: Email Configuration
fly secrets set EMAIL_SERVER_HOST="smtp.gmail.com"
fly secrets set EMAIL_SERVER_PORT="587"
fly secrets set EMAIL_SERVER_USER="your-email@gmail.com"
fly secrets set EMAIL_SERVER_PASSWORD="your-app-password"
fly secrets set EMAIL_FROM="noreply@your-domain.com"

# Optional: Payment Integration
fly secrets set JAZZCASH_MERCHANT_ID="your-merchant-id"
fly secrets set JAZZCASH_PASSWORD="your-password"
fly secrets set EASYPAISA_STORE_ID="your-store-id"
fly secrets set EASYPAISA_HASH_KEY="your-hash-key"
```

### 3. Deploy Your Application

```bash
fly deploy
```

This will:
- Build your Docker image
- Push it to Fly.io
- Deploy your application
- Run database migrations (via Prisma)

### 4. Check Deployment Status

```bash
# View app status
fly status

# View logs
fly logs

# Open your app in browser
fly open
```

## Database Setup

### Option 1: Use Fly.io Postgres (Recommended)

Create a Postgres database on Fly.io:

```bash
# Create a new Postgres cluster
fly postgres create --name mlmpk-db --region iad

# Attach it to your app
fly postgres attach mlmpk-db

# This automatically sets DATABASE_URL
```

### Option 2: Use External Database

If you have an external database (e.g., Supabase, Railway, Neon):

```bash
fly secrets set DATABASE_URL="your-external-database-url"
```

## Post-Deployment

### Run Database Migrations

```bash
# SSH into your app
fly ssh console

# Run Prisma migrations
npx prisma migrate deploy

# Seed database (if needed)
npx prisma db seed

# Exit
exit
```

### Scale Your App

```bash
# Scale to multiple instances
fly scale count 2

# Change VM size
fly scale vm shared-cpu-2x --memory 2048
```

### Monitor Your App

```bash
# Real-time logs
fly logs

# App metrics
fly dashboard
```

## Troubleshooting

### Build Fails

```bash
# Check build logs
fly logs

# Try building locally first
docker build -t mlmpk .
docker run -p 3000:3000 mlmpk
```

### Database Connection Issues

```bash
# Check if DATABASE_URL is set
fly secrets list

# Test database connection
fly ssh console
npx prisma db push
```

### App Not Starting

```bash
# Check app status
fly status

# View detailed logs
fly logs --app mlmpk

# Restart app
fly apps restart mlmpk
```

## Custom Domain

To use a custom domain:

```bash
# Add certificate
fly certs add yourdomain.com

# Add DNS records (shown in output)
# Update NEXTAUTH_URL
fly secrets set NEXTAUTH_URL="https://yourdomain.com"
```

## Useful Commands

```bash
# View all apps
fly apps list

# View app info
fly info

# SSH into app
fly ssh console

# View secrets
fly secrets list

# Remove a secret
fly secrets unset SECRET_NAME

# Destroy app (careful!)
fly apps destroy mlmpk
```

## Cost Estimation

Fly.io Free Tier includes:
- Up to 3 shared-cpu-1x VMs (256MB RAM)
- 160GB outbound data transfer
- 3GB persistent volume storage

Your app configuration:
- 1 VM with 1GB RAM (paid tier)
- Estimated cost: ~$5-10/month

## Support

- Fly.io Documentation: https://fly.io/docs/
- Fly.io Community: https://community.fly.io/
- Status Page: https://status.fly.io/
