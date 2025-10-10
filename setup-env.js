// Environment setup script
// Run this script to create .env.local file with required configuration

const fs = require('fs');
const path = require('path');

const envContent = `# Environment configuration for MCNmart
NEXT_TELEMETRY_DISABLED=1
DISABLE_ESLINT_PLUGIN=true
FAST_REFRESH=false

# Node.js memory optimization
NODE_OPTIONS=--max-old-space-size=4096

# Database URL
DATABASE_URL="file:./prisma/dev.db"

# NextAuth configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="mcnmart-development-secret-key-2024"

# Admin credentials for testing
ADMIN_EMAIL="admin@mcnmart.com"
ADMIN_PASSWORD="admin123"
`;

const envLocalPath = path.join(__dirname, '.env.local');
const envPath = path.join(__dirname, '.env');

try {
  fs.writeFileSync(envLocalPath, envContent);
  console.log('✅ .env.local file created successfully!');
  console.log('📍 Location:', envLocalPath);

  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!');
  console.log('📍 Location:', envPath);
} catch (error) {
  console.error('❌ Failed to create .env.local file:', error.message);
  console.log('\n📝 Please manually create .env.local file with this content:');
  console.log('=' * 50);
  console.log(envContent);
  console.log('=' * 50);
}
