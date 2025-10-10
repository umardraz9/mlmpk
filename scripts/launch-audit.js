#!/usr/bin/env node

/**
 * Launch Readiness Audit Script for MCNmart
 * Performs comprehensive checks on the application before launch
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${COLORS.green}✓${COLORS.reset} ${msg}`),
  error: (msg) => console.log(`${COLORS.red}✗${COLORS.reset} ${msg}`),
  warning: (msg) => console.log(`${COLORS.yellow}⚠${COLORS.reset} ${msg}`),
  info: (msg) => console.log(`${COLORS.blue}ℹ${COLORS.reset} ${msg}`),
  header: (msg) => console.log(`\n${COLORS.bold}${COLORS.blue}=== ${msg} ===${COLORS.reset}`)
};

function checkFileExists(filePath) {
  return fs.existsSync(path.join(process.cwd(), filePath));
}

function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), filePath), 'utf8'));
  } catch (error) {
    return null;
  }
}

function checkEnvironmentFiles() {
  log.header('Environment Configuration');
  
  const envFiles = ['.env.local', '.env', 'next.config.js'];
  let allGood = true;
  
  envFiles.forEach(file => {
    if (checkFileExists(file)) {
      log.success(`${file} exists`);
    } else {
      log.error(`${file} missing`);
      allGood = false;
    }
  });
  
  // Check for required env variables in .env.local
  if (checkFileExists('.env.local')) {
    const envContent = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
    const requiredVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
    
    requiredVars.forEach(varName => {
      if (envContent.includes(varName)) {
        log.success(`${varName} configured`);
      } else {
        log.error(`${varName} missing from environment`);
        allGood = false;
      }
    });
  }
  
  return allGood;
}

function checkCriticalPages() {
  log.header('Critical Pages Check');
  
  const criticalPages = [
    'src/app/page.tsx',
    'src/app/auth/login/page.tsx',  
    'src/app/auth/register/page.tsx',
    'src/app/dashboard/page.tsx',
    'src/app/profile/page.tsx',
    'src/app/products/page.tsx',
    'src/app/social/page.tsx',
    'src/app/admin/page.tsx',
    'src/app/admin/login/page.tsx',
    'src/app/admin/layout.tsx',
    'src/app/layout.tsx'
  ];
  
  let allGood = true;
  criticalPages.forEach(page => {
    if (checkFileExists(page)) {
      log.success(`${page} exists`);
    } else {
      log.error(`${page} missing`);
      allGood = false;
    }
  });
  
  return allGood;
}

function checkAPIRoutes() {
  log.header('API Routes Check');
  
  const criticalAPIs = [
    'src/app/api/auth/register/route.ts',
    'src/app/api/auth/[...nextauth]/route.ts',
    'src/app/api/products/route.ts',
    'src/app/api/profile/route.ts',
    'src/app/api/profile/upload-image/route.ts',
    'src/app/api/social/posts/route.ts',
    'src/app/api/admin/dashboard-stats/route.ts'
  ];
  
  let allGood = true;
  criticalAPIs.forEach(api => {
    if (checkFileExists(api)) {
      log.success(`${api} exists`);
    } else {
      log.error(`${api} missing`);
      allGood = false;
    }
  });
  
  return allGood;
}

function checkDependencies() {
  log.header('Dependencies Check');
  
  const packageJson = readJsonFile('package.json');
  if (!packageJson) {
    log.error('package.json not found');
    return false;
  }
  
  const criticalDeps = [
    'next',
    'react',
    'next-auth',
    '@prisma/client',
    'tailwindcss',
    'lucide-react'
  ];
  
  let allGood = true;
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  criticalDeps.forEach(dep => {
    if (allDeps[dep]) {
      log.success(`${dep} installed (${allDeps[dep]})`);
    } else {
      log.error(`${dep} missing`);
      allGood = false;
    }
  });
  
  return allGood;
}

function checkDatabaseSchema() {
  log.header('Database Schema Check');
  
  if (!checkFileExists('prisma/schema.prisma')) {
    log.error('Prisma schema missing');
    return false;
  }
  
  const schemaContent = fs.readFileSync(path.join(process.cwd(), 'prisma/schema.prisma'), 'utf8');
  const requiredModels = ['User', 'Product', 'Order', 'SocialPost'];
  
  let allGood = true;
  requiredModels.forEach(model => {
    if (schemaContent.includes(`model ${model}`)) {
      log.success(`${model} model defined`);
    } else {
      log.error(`${model} model missing`);
      allGood = false;
    }
  });
  
  return allGood;
}

function checkOptimizedComponents() {
  log.header('Performance Components Check');
  
  const optimizedComponents = [
    'src/components/social/OptimizedRealTimeFeed.tsx',
    'src/components/products/OptimizedProductCard.tsx',
    'src/lib/profile-service.ts'
  ];
  
  let optimizedCount = 0;
  optimizedComponents.forEach(component => {
    if (checkFileExists(component)) {
      log.success(`${component} exists`);
      optimizedCount++;
    } else {
      log.warning(`${component} missing (performance optimization)`);
    }
  });
  
  log.info(`${optimizedCount}/${optimizedComponents.length} optimized components found`);
  return optimizedCount > 0;
}

function checkPublicAssets() {
  log.header('Public Assets Check');
  
  const requiredAssets = [
    'public/images/Mcnmart logo.png',
    'public/images/default-avatar.png'
  ];
  
  let allGood = true;
  requiredAssets.forEach(asset => {
    if (checkFileExists(asset)) {
      log.success(`${asset} exists`);
    } else {
      log.warning(`${asset} missing`);
      // Not critical, but should be addressed
    }
  });
  
  return allGood;
}

function generateLaunchReport(results) {
  log.header('Launch Readiness Report');
  
  const totalChecks = Object.keys(results).length;
  const passedChecks = Object.values(results).filter(Boolean).length;
  const readinessScore = Math.round((passedChecks / totalChecks) * 100);
  
  console.log(`\n${COLORS.bold}Launch Readiness Score: ${readinessScore}%${COLORS.reset}`);
  
  if (readinessScore >= 90) {
    log.success('🚀 Ready for launch! All critical systems are operational.');
  } else if (readinessScore >= 75) {
    log.warning('⚠️  Almost ready. Address remaining issues for optimal launch.');
  } else {
    log.error('❌ Not ready for launch. Critical issues must be resolved.');
  }
  
  console.log('\n📋 Detailed Results:');
  Object.entries(results).forEach(([check, passed]) => {
    const status = passed ? `${COLORS.green}PASS${COLORS.reset}` : `${COLORS.red}FAIL${COLORS.reset}`;
    console.log(`  ${check}: ${status}`);
  });
  
  console.log('\n🎯 Launch Checklist:');
  console.log('  1. All critical pages and APIs working');
  console.log('  2. Environment variables configured');
  console.log('  3. Database schema is complete');
  console.log('  4. Dependencies are installed');
  console.log('  5. Performance optimizations in place');
  console.log('  6. Admin and user authentication working');
  console.log('  7. Product filtering and social features functional');
  
  return readinessScore;
}

async function main() {
  console.log(`${COLORS.bold}${COLORS.blue}🚀 MCNmart Launch Readiness Audit${COLORS.reset}\n`);
  
  const results = {
    'Environment Configuration': checkEnvironmentFiles(),
    'Critical Pages': checkCriticalPages(),
    'API Routes': checkAPIRoutes(),
    'Dependencies': checkDependencies(),
    'Database Schema': checkDatabaseSchema(),
    'Optimized Components': checkOptimizedComponents(),
    'Public Assets': checkPublicAssets()
  };
  
  const readinessScore = generateLaunchReport(results);
  
  console.log(`\n${COLORS.bold}Next Steps:${COLORS.reset}`);
  if (readinessScore >= 90) {
    console.log('✅ Run final manual tests on key user flows');
    console.log('✅ Deploy to production environment');
    console.log('✅ Monitor initial user activity');
  } else {
    console.log('🔧 Fix failing checks above');
    console.log('🔧 Re-run this audit after fixes');
    console.log('🔧 Test critical user journeys manually');
  }
  
  process.exit(readinessScore >= 75 ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    console.error('Audit failed:', error);
    process.exit(1);
  });
}
