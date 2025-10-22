@echo off
echo 🚀 Deploying API Fixes for All Major Pages...
echo.

echo 📝 Committing changes to Git...
git commit -m "Fix all major API endpoints - membership plans, products, social reels now working with demo data"

echo.
echo 📤 Pushing to GitHub...
git push origin master

echo.
echo ✅ Deployment to GitHub complete!
echo 💡 Vercel will automatically deploy from GitHub if connected.
echo.
pause
