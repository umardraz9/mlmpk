# Database Configuration for Vercel Deployment

## Required Changes for Vercel Deployment

### 1. Switch from SQLite to PostgreSQL

Your current setup uses SQLite (`DATABASE_URL="file:./dev.db"`), but Vercel's serverless environment doesn't support persistent file storage. You need to use PostgreSQL.

### 2. Environment Variables Setup

Create/update your production environment variables in Vercel dashboard:

```bash
# Production Database (PostgreSQL)
DATABASE_URL="postgresql://username:password@hostname:5432/database"

# NextAuth Configuration
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="your-production-secret-key"

# Admin Credentials
ADMIN_EMAIL="admin@your-domain.com"
ADMIN_PASSWORD="secure-admin-password"
```

### 3. Database Options for Vercel

Choose one of these PostgreSQL providers:

#### Option A: Vercel Postgres (Recommended)
1. In Vercel dashboard, go to your project → Storage → Create Database
2. Choose Postgres and follow the setup
3. Vercel will provide the DATABASE_URL

#### Option B: Supabase (Free tier available)
1. Create account at https://supabase.com
2. Create new project
3. Go to Settings → Database → Connection string
4. Use the provided connection string as DATABASE_URL

#### Option C: Neon (Free tier available)
1. Create account at https://neon.tech
2. Create new project
3. Copy the connection string from Dashboard

#### Option D: Railway (Free tier available)
1. Create account at https://railway.app
2. Create new PostgreSQL database
3. Copy the DATABASE_URL from variables

### 4. Update Prisma Schema

Add this to your schema.prisma:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"  // Change from "sqlite"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // For Prisma Accelerate (optional)
}
```

### 5. Database Migration for Production

```bash
# Generate Prisma client for PostgreSQL
npx prisma generate

# Create and apply migration
npx prisma migrate deploy

# (Optional) Seed production database
# npx prisma db seed
```

### 6. Important Notes

- **Never commit .env.local** - it contains sensitive database credentials
- **Set environment variables in Vercel dashboard**, not in code
- **Use different DATABASE_URL for development and production**
- **Test your deployment thoroughly** after database migration

### 7. Troubleshooting

If you encounter database connection issues:
- Verify DATABASE_URL format and credentials
- Check if database server is accessible
- Ensure SSL is properly configured for production
- Test with a simple query first

Would you like me to help you set up any specific database provider or update your Prisma configuration?
