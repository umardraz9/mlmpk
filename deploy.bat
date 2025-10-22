@echo off
echo 🚀 Deploying Production Session Fix...
echo.

echo 📝 Committing changes to Git...
git commit -m "CRITICAL FIX: Make session cookie accessible to JavaScript for production login"

echo.
echo 📤 Pushing to GitHub...
git push origin master

echo.
echo ✅ Deployment to GitHub complete!
echo 💡 Vercel will automatically deploy from GitHub if connected.
echo.
pause
