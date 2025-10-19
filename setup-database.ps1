# Supabase Database Setup Script
Write-Host "Starting Supabase Setup..." -ForegroundColor Green

# Create .env file
$envContent = 'DATABASE_URL="postgresql://postgres:LKZC1GSTR3U7TnSz@db.sfmeemhtjxwseuvzcjyd.supabase.co:5432/postgres?sslmode=require"
SUPABASE_URL="https://sfmeemhtjxwseuvzcjyd.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmbWVlbWh0anh3c2V1dnpjanlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ3MzEsImV4cCI6MjA3NjQwMDczMX0.KOUF3EAgTrPpiz4CkD00N1QtM4gXUa91nN2GgubbZbM"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="mcnmart-development-secret-key-2024"
ADMIN_EMAIL="admin@mcnmart.com"
ADMIN_PASSWORD="admin123"'

Write-Host "Creating .env file..." -ForegroundColor Yellow
$envContent | Out-File -FilePath ".env" -Encoding ascii -Force

Write-Host "SUCCESS: .env file created!" -ForegroundColor Green
Write-Host ""

Write-Host "Pushing database schema..." -ForegroundColor Yellow
npx prisma db push --skip-generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: Database schema pushed!" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Generating Prisma Client..." -ForegroundColor Yellow
    npx prisma generate
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "====================================" -ForegroundColor Green
        Write-Host "   SETUP COMPLETE!" -ForegroundColor Green
        Write-Host "====================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "  1. Run: npm run dev"
        Write-Host "  2. Open: http://localhost:3000"
        Write-Host "  3. Your app is ready!"
        Write-Host ""
    }
}
