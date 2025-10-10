# MCNmart Environment Setup Guide

## Required Environment Variables

You need to create a `.env.local` file in the root directory with the following content:

```env
# Performance optimizations for Windsurf
NEXT_TELEMETRY_DISABLED=1
DISABLE_ESLINT_PLUGIN=true
FAST_REFRESH=false

# Node.js memory optimization
NODE_OPTIONS=--max-old-space-size=4096

# Database URL (if not already set)
DATABASE_URL="file:./dev.db"

# NextAuth configuration (REQUIRED)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="mcnmart-secret-key-2024-production-ready"

# Optional OAuth providers (if needed)
# GOOGLE_CLIENT_ID="your-google-client-id"
# GOOGLE_CLIENT_SECRET="your-google-client-secret"
# FACEBOOK_CLIENT_ID="your-facebook-client-id"
# FACEBOOK_CLIENT_SECRET="your-facebook-client-secret"
```

## Setup Instructions

1. **Create .env.local file:**
   ```bash
   # Copy the template
   cp env-template.txt .env.local
   
   # Or create manually with the content above
   ```

2. **Verify Database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Seed Demo Data:**
   ```bash
   node scripts/create-demo-user.js
   node scripts/seed-sample-data.js
   ```

4. **Start Development Server:**
   ```bash
   npm run dev
   ```

## Demo User Credentials

- **Email:** demouser@example.com
- **Password:** Demo@123456
- **Phone:** +923001234561

## Verification Checklist

- [ ] .env.local file created with NEXTAUTH_SECRET
- [ ] Database seeded with demo data
- [ ] Can access homepage at http://localhost:3000
- [ ] Can login with demo credentials
- [ ] Tasks page accessible after login
- [ ] Admin panel accessible (if admin user)

## Troubleshooting

### Authentication Issues
- Ensure NEXTAUTH_SECRET is set in .env.local
- Verify NEXTAUTH_URL matches your development URL
- Check that demo user exists in database

### Database Issues
- Run `npx prisma db push` to sync schema
- Check DATABASE_URL points to correct SQLite file
- Verify file permissions on dev.db

### API Errors
- Check server console for detailed error messages
- Ensure user is authenticated for protected routes
- Verify Prisma client is properly initialized
