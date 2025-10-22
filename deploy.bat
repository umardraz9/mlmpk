@echo off
echo 🚀 Deploying Social Features and Profile Fixes...
echo.

echo 📝 Committing changes to Git...
git commit -m "Fix social features and profile display - Update all social API routes to use custom session management and fix profile data loading"

echo.
echo 📤 Pushing to GitHub...
git push origin master

echo.
echo ✅ Deployment to GitHub complete!
echo 💡 Vercel will automatically deploy from GitHub if connected.
echo.
pause
