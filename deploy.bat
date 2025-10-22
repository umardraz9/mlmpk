@echo off
echo 🚀 Deploying CRITICAL Business Logic Fix...
echo.

echo 📝 Committing changes to Git...
git commit -m "CRITICAL BUSINESS FIX: Remove demo data that gives free Standard Plans and PKR 1000 vouchers to new users"

echo.
echo 📤 Pushing to GitHub...
git push origin master

echo.
echo ✅ Deployment to GitHub complete!
echo 💡 Vercel will automatically deploy from GitHub if connected.
echo.
pause
