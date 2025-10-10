const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Generate a secure random string for NEXTAUTH_SECRET
const generateSecret = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Create .env.local file with necessary configuration
const createEnvFile = () => {
  const envContent = `# Performance optimizations for Windsurf
NEXT_TELEMETRY_DISABLED=1
DISABLE_ESLINT_PLUGIN=true
FAST_REFRESH=false

# Node.js memory optimization
NODE_OPTIONS=--max-old-space-size=4096

# Database URL
DATABASE_URL="file:./dev.db"

# NextAuth configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="${generateSecret()}"

# Optional OAuth providers (uncomment and add your credentials if needed)
# GOOGLE_CLIENT_ID=""
# GOOGLE_CLIENT_SECRET=""
# FACEBOOK_CLIENT_ID=""
# FACEBOOK_CLIENT_SECRET=""
`;

  const envPath = path.join(__dirname, '..', '.env.local');
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\x1b[32m%s\x1b[0m', '✅ .env.local file created successfully!');
    console.log('\x1b[36m%s\x1b[0m', 'Environment configuration is ready for authentication.');
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Error creating .env.local file:');
    console.error(error);
  }
};

createEnvFile();
