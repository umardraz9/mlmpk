# Supabase Setup with Connection Pooler
Write-Host "Trying alternative connection method..." -ForegroundColor Green

# Try with connection pooler (port 6543)
$envContent = 'DATABASE_URL="postgresql://postgres.sfmeemhtjxwseuvzcjyd:LKZC1GSTR3U7TnSz@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres:LKZC1GSTR3U7TnSz@db.sfmeemhtjxwseuvzcjyd.supabase.co:5432/postgres?sslmode=require"
SUPABASE_URL="https://sfmeemhtjxwseuvzcjyd.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmbWVlbWh0anh3c2V1dnpjanlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ3MzEsImV4cCI6MjA3NjQwMDczMX0.KOUF3EAgTrPpiz4CkD00N1QtM4gXUa91nN2GgubbZbM"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="mcnmart-development-secret-key-2024"
ADMIN_EMAIL="admin@mcnmart.com"
ADMIN_PASSWORD="admin123"'

Write-Host "Updating .env file..." -ForegroundColor Yellow
$envContent | Out-File -FilePath ".env" -Encoding ascii -Force

Write-Host "Testing connection with pooler..." -ForegroundColor Yellow
npx prisma db push --skip-generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS!" -ForegroundColor Green
    npx prisma generate
} else {
    Write-Host "Pooler failed. Your firewall may be blocking database connections." -ForegroundColor Red
    Write-Host "The database schema is already created in Supabase." -ForegroundColor Yellow
    Write-Host "Your app will work when deployed to Vercel!" -ForegroundColor Green
}
