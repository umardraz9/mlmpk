# 🚀 Windsurf Performance Optimization Guide

## 🎯 **Immediate Solutions for Terminal Stuck Issues**

### **1. PowerShell Configuration (Windows)**
Create a PowerShell profile to prevent hanging:

```powershell
# Run this in PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### **2. Node.js Memory Optimization**
Add these to your environment variables:

```bash
NODE_OPTIONS=--max-old-space-size=4096
UV_THREADPOOL_SIZE=4
```

### **3. Next.js Development Settings**
Create `.env.local` with these optimizations:

```env
# Performance optimizations
NEXT_TELEMETRY_DISABLED=1
DISABLE_ESLINT_PLUGIN=true
FAST_REFRESH=false
```

## 🛠 **Windsurf IDE Settings**

### **Copy these settings to Windsurf Settings (Ctrl+,):**

```json
{
  "typescript.preferences.includePackageJsonAutoImports": "off",
  "typescript.suggest.autoImports": false,
  "typescript.updateImportsOnFileMove.enabled": "never",
  "editor.quickSuggestions": false,
  "editor.parameterHints.enabled": false,
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/.next/**": true,
    "**/out/**": true,
    "**/*.log": true
  },
  "terminal.integrated.defaultProfile.windows": "PowerShell",
  "extensions.autoUpdate": false,
  "git.autorefresh": false
}
```

## ⚡ **Alternative Development Workflow**

### **1. Use Non-Blocking Commands**
Instead of blocking commands, use these alternatives:

```bash
# Instead of: npm run dev
# Use: npm run dev &

# For Windows PowerShell:
Start-Process npm -ArgumentList "run", "dev" -NoNewWindow
```

### **2. Split Terminal Usage**
- **Terminal 1**: Development server only (`npm run dev`)
- **Terminal 2**: Git operations and file commands
- **Terminal 3**: Database operations and migrations

### **3. Batch Operations**
Group related commands to reduce terminal switching:

```bash
# Instead of running separately:
npm install && npm run build && npm run lint
```

## 🔧 **Project-Specific Optimizations**

### **1. Next.js Configuration Enhancement**
Update your `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable source maps in development for faster builds
  productionBrowserSourceMaps: false,
  
  // Optimize webpack
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    return config
  },
  
  // Reduce memory usage
  experimental: {
    workerThreads: false,
    cpus: 1
  }
}

module.exports = nextConfig
```

### **2. Package.json Script Optimization**
Add these optimized scripts:

```json
{
  "scripts": {
    "dev:fast": "next dev --turbo",
    "dev:quiet": "next dev > /dev/null 2>&1",
    "build:fast": "next build --no-lint",
    "clean": "rm -rf .next out node_modules/.cache"
  }
}
```

## 🚨 **Emergency Commands (When Terminal Stuck)**

### **Windows PowerShell:**
```powershell
# Kill all Node processes
Get-Process node | Stop-Process -Force

# Kill specific port (3000)
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# Restart development server
npm run dev
```

### **Alternative: Use Task Manager**
1. Open Task Manager (Ctrl+Shift+Esc)
2. Find "Node.js JavaScript Runtime"
3. End all Node processes
4. Restart development server

## 💡 **Best Practices to Prevent Issues**

### **1. Regular Cleanup**
```bash
# Run weekly
npm run clean
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### **2. Memory Management**
- Close unused browser tabs
- Restart Windsurf every 2-3 hours
- Monitor RAM usage (keep under 80%)

### **3. File Watching Limits**
```bash
# Increase file watching limits (Linux/Mac)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf

# Windows: Use PowerShell as Administrator
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Memory Management" -Name "LargeSystemCache" -Value 1
```

## 🎯 **Immediate Action Plan**

1. **Copy Windsurf settings** from `windsurf-settings.json`
2. **Add environment variables** for Node.js optimization
3. **Use split terminals** for different operations
4. **Run cleanup commands** if experiencing issues
5. **Monitor resource usage** and restart when needed

## 📞 **When All Else Fails**

1. **Restart Windsurf completely**
2. **Restart your computer**
3. **Use external terminal** (Windows Terminal, PowerShell ISE)
4. **Switch to npm instead of yarn** (or vice versa)
5. **Use GitHub Codespaces** as backup development environment

This guide should resolve 90% of terminal hanging issues in Windsurf!
