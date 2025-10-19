# Fix Database Connection with Pooling
Write-Host "Fixing database connection..." -ForegroundColor Green

# Update .env with connection pooler
$envContent = 'DATABASE_URL="postgresql://postgres.sfmeemhtjxwseuvzcjyd:LKZC1GSTR3U7TnSz@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:LKZC1GSTR3U7TnSz@db.sfmeemhtjxwseuvzcjyd.supabase.co:5432/postgres"
SUPABASE_URL="https://sfmeemhtjxwseuvzcjyd.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmbWVlbWh0anh3c2V1dnpjanlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ3MzEsImV4cCI6MjA3NjQwMDczMX0.KOUF3EAgTrPpiz4CkD00N1QtM4gXUa91nN2GgubbZbM"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="mcnmart-development-secret-key-2024"
ADMIN_EMAIL="admin@mcnmart.com"
ADMIN_PASSWORD="admin123"'

$envContent | Out-File -FilePath ".env" -Encoding ascii -Force
Write-Host "Connection pooler configured!" -ForegroundColor Green
Write-Host "Restart your dev server: npm run dev" -ForegroundColor Yellow
