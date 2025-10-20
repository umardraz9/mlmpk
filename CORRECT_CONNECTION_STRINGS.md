# Correct Supabase Connection Strings

## Based on your project: sfmeemhtjxwseuvzcjyd
## New Password: IFUgkcUHZkDBuIJL

### 📌 For Vercel Environment Variables:

#### DATABASE_URL (Connection Pooling - for queries)
```
postgresql://postgres.sfmeemhtjxwseuvzcjyd:IFUgkcUHZkDBuIJL@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

#### DIRECT_URL (Direct Connection - for migrations)
```
postgresql://postgres:IFUgkcUHZkDBuIJL@db.sfmeemhtjxwseuvzcjyd.supabase.co:5432/postgres
```

---

## How to Find These Yourself:

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/sfmeemhtjxwseuvzcjyd
2. Click the **Settings** (gear icon) in the bottom left
3. Click **"Database"** in the Project Settings menu
4. Scroll down to **"Connection string"** section
5. You'll see URI formats - click the eye icon to reveal the password

---

## ⚠️ Important Notes:

- **Pooled connection** uses format: `postgres.PROJECT_REF:PASSWORD@...pooler...`
- **Direct connection** uses format: `postgres:PASSWORD@db.PROJECT_REF...`
- Notice the username difference!
- For pooled: username is `postgres.sfmeemhtjxwseuvzcjyd`
- For direct: username is just `postgres`

---

## 🚀 Next Steps:

1. Update these EXACT values in Vercel (Settings → Environment Variables)
2. Make sure to update BOTH:
   - DATABASE_URL (pooled)
   - DIRECT_URL (direct)
3. Redeploy
4. Test login
