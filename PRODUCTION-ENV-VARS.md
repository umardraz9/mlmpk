# Production Environment Variables for Vercel Deployment

## Required Environment Variables

Set these in your Vercel dashboard (Project Settings → Environment Variables):

### Database Configuration
```bash
DATABASE_URL="postgresql://username:password@hostname:5432/database"
```

### NextAuth Configuration
```bash
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="your-secure-secret-key-min-32-chars"
```

### Admin Configuration
```bash
ADMIN_EMAIL="admin@your-domain.com"
ADMIN_PASSWORD="secure-admin-password"
```

## Optional Environment Variables

### Email Configuration (if using email features)
```bash
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="noreply@your-domain.com"
```

### Payment Integration (if applicable)
```bash
JAZZCASH_MERCHANT_ID="your-merchant-id"
JAZZCASH_PASSWORD="your-password"
EASYPAISA_STORE_ID="your-store-id"
EASYPAISA_HASH_KEY="your-hash-key"
```

### Analytics (if using)
```bash
GOOGLE_ANALYTICS_ID="GA-XXXXXXXXX"
FACEBOOK_PIXEL_ID="FB-XXXXXXXXX"
```

## How to Set Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Navigate to Settings → Environment Variables
4. Add each variable above
5. Redeploy your application

## Security Notes

- **Never commit .env.local to git** - it contains sensitive credentials
- **Use different values for production** than development
- **Generate secure NEXTAUTH_SECRET** (minimum 32 characters)
- **Keep database credentials secure** and rotate them regularly
- **Use HTTPS URLs** for production (NEXTAUTH_URL should start with https://)

## Verification

After setting environment variables:

1. Trigger a new deployment in Vercel
2. Check the deployment logs for any errors
3. Test your application thoroughly in the deployed environment
4. Verify database connections are working
5. Test authentication flows

Would you like me to help you with any specific environment variable or check your current configuration?
