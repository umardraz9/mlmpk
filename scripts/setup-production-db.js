#!/usr/bin/env node

/**
 * Production Database Setup Script
 * This script will:
 * 1. Test database connection
 * 2. Push schema to database
 * 3. Create admin user
 */

const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// FRESH connection strings with RESET password: Aa69669900@
const DATABASE_URL = 'postgresql://postgres.sfmeemhtjxwseuvzcjyd:Aa69669900%40@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
const DIRECT_URL = 'postgresql://postgres:Aa69669900%40@db.sfmeemhtjxwseuvzcjyd.supabase.co:5432/postgres';
// Session pooler (Port 5432 with pooler host)
const SESSION_POOLER = 'postgresql://postgres.sfmeemhtjxwseuvzcjyd:Aa69669900%40@aws-1-us-east-1.pooler.supabase.com:5432/postgres';

// Set environment variables
process.env.DATABASE_URL = DATABASE_URL;
process.env.DIRECT_URL = DIRECT_URL;

// Try TRANSACTION POOLER (Port 6543 - recommended for most apps)
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

async function main() {
  console.log('🚀 Starting Production Database Setup...\n');

  try {
    // Step 1: Test connection
    console.log('1️⃣ Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully!\n');

    // Step 2: Check if tables exist
    console.log('2️⃣ Checking database schema...');
    try {
      const userCount = await prisma.user.count();
      console.log('✅ Database schema exists!');
      console.log(`   Current users: ${userCount}\n`);
    } catch (error) {
      console.log('⚠️  Database schema not found. Please run migrations.\n');
      console.log('   Run this command:');
      console.log('   DATABASE_URL="' + DATABASE_URL + '" npx prisma db push\n');
      process.exit(1);
    }

    // Step 3: Create admin user
    console.log('3️⃣ Setting up admin user...');
    const adminEmail = 'admin@mcnmart.com';
    const adminPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingAdmin) {
      // Update existing admin
      await prisma.user.update({
        where: { email: adminEmail },
        data: {
          isAdmin: true,
          role: 'ADMIN',
          isActive: true,
          password: hashedPassword
        }
      });
      console.log('✅ Admin user updated!');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
    } else {
      // Create new admin
      const admin = await prisma.user.create({
        data: {
          name: 'Admin User',
          email: adminEmail,
          password: hashedPassword,
          username: 'admin_' + Date.now(),
          firstName: 'Admin',
          lastName: 'User',
          phone: '+92 300 0000000',
          isActive: true,
          isAdmin: true,
          role: 'ADMIN',
          balance: 0,
          totalEarnings: 0,
          availableVoucherPkr: 0,
          referralCode: 'ADMIN' + Math.random().toString(36).slice(2, 8).toUpperCase()
        }
      });
      console.log('✅ Admin user created!');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
      console.log(`   ID: ${admin.id}`);
    }

    console.log('\n🎉 Production database setup complete!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Verify these environment variables are set in Vercel:');
    console.log('      DATABASE_URL (pooled connection)');
    console.log('      DIRECT_URL (direct connection)');
    console.log('   2. Redeploy on Vercel');
    console.log('   3. Login at: https://mlmpk.vercel.app/auth/login');
    console.log('   4. Use credentials above\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Check if Supabase project is active (not paused)');
    console.error('   2. Verify connection strings are correct');
    console.error('   3. Ensure internet connection is stable');
    console.error('   4. Visit: https://supabase.com/dashboard\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
