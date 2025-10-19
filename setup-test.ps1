$env:DATABASE_URL="postgresql://postgres:LKZC1GSTR3U7TnSz@db.sfmeemhtjxwseuvzcjyd.supabase.co:5432/postgres?sslmode=require"
Write-Host "Testing Prisma connection..."
npx prisma db push
