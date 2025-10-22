@echo off
echo 🚀 Deploying MLM Platform Authentication Fixes...
echo.

echo 📝 Committing changes to Git...
git commit -m "Fix authentication issues - Replace NextAuth with custom session management"

echo.
echo 📤 Pushing to GitHub...
git push origin main

echo.
echo ✅ Deployment to GitHub complete!
echo 💡 Vercel will automatically deploy from GitHub if connected.
echo.
pause
