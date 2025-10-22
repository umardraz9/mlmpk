@echo off
echo 🚀 Deploying Vercel Build Fixes...
echo.

echo 📝 Committing changes to Git...
git commit -m "Fix Vercel build errors - Add server session functions and browser environment checks"

echo.
echo 📤 Pushing to GitHub...
git push origin master

echo.
echo ✅ Deployment to GitHub complete!
echo 💡 Vercel will automatically deploy from GitHub if connected.
echo.
pause
