# VERCEL ENVIRONMENT VARIABLES FIX - STEP BY STEP

## Current Problem
Vercel is using OLD database credentials. You've been getting "Tenant or user not found" error.

## Correct Values (Copy these EXACTLY)

### DATABASE_URL (Transaction Pooling):
```
postgresql://postgres.sfmeemhtjxwseuvzcjyd:Aa69669900%40@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### DIRECT_URL (Direct Connection):
```
postgresql://postgres:Aa69669900%40@db.sfmeemhtjxwseuvzcjyd.supabase.co:5432/postgres
```

---

## Step-by-Step Instructions

### STEP 1: Delete Old Variables

1. Go to: https://vercel.com/umardraz9s-projects/mlmpak/settings/environment-variables
2. Find **DATABASE_URL** in the list
3. Click the **3 dots (⋯)** on the right
4. Click **"Delete"**
5. Confirm deletion
6. Do the same for **DIRECT_URL** if it exists

### STEP 2: Add DATABASE_URL

1. Click the **"Add New"** button (top right)
2. In the "Key" field, type: `DATABASE_URL`
3. In the "Value" field, paste EXACTLY (including the %40):
   ```
   postgresql://postgres.sfmeemhtjxwseuvzcjyd:Aa69669900%40@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
4. Under "Environments", check ONLY: **☑ Production**
5. Click **"Save"** button

### STEP 3: Add DIRECT_URL

1. Click **"Add New"** button again
2. In the "Key" field, type: `DIRECT_URL`
3. In the "Value" field, paste EXACTLY (including the %40):
   ```
   postgresql://postgres:Aa69669900%40@db.sfmeemhtjxwseuvzcjyd.supabase.co:5432/postgres
   ```
4. Under "Environments", check ONLY: **☑ Production**
5. Click **"Save"** button

### STEP 4: Verify Variables Are Saved

Look at your environment variables list. You should see:
- DATABASE_URL → Production
- DIRECT_URL → Production

### STEP 5: Redeploy

1. Go to: https://vercel.com/umardraz9s-projects/mlmpak/deployments
2. Click the **3 dots (⋯)** on the FIRST deployment in the list
3. Click **"Redeploy"**
4. In the popup:
   - **UNCHECK** the box that says "Use existing Build Cache"
   - Make sure environment is **"Production"**
5. Click **"Redeploy"** button
6. **WAIT 3-5 MINUTES** - watch the progress bar

### STEP 6: Verify Fix

After deployment completes:

1. Visit: https://mlmpk.vercel.app/api/check-env
2. You should see:
   - `aws-1-us-east-1` (NOT aws-0)
   - Port `6543` (NOT 5432)
   - `DIRECT_URL` has a value (NOT "NOT SET")

3. Then try login: https://mlmpk.vercel.app/auth/login
   - Email: admin@mcnmart.com
   - Password: admin123

---

## What Success Looks Like

### Correct /api/check-env Response:
```json
{
  "DATABASE_URL": "postgresql://postgres.sfmeemhtjxwseuvzcjyd:****@aws-1-us-east-1.pooler.supabase.com:6543/postgres",
  "DIRECT_URL": "postgresql://postgres:****@db.sfmeemhtjxwseuvzcjyd.supabase.co:5432/postgres",
  "NEXTAUTH_URL": "https://mlmpk.vercel.app/",
  "NEXTAUTH_SECRET": "SET (hidden)",
  "NODE_ENV": "production",
  "VERCEL_ENV": "production"
}
```

Notice:
- ✅ aws-1 (not aws-0)
- ✅ Port 6543 (not 5432)
- ✅ DIRECT_URL is set

---

## If Still Not Working

Take screenshots of:
1. Environment Variables page (showing DATABASE_URL and DIRECT_URL)
2. Latest deployment status
3. /api/check-env response

And share them for further debugging.
