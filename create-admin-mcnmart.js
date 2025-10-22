const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 12);
    console.log('Password hashed successfully');

    // Generate unique ID and referral code
    const adminId = `admin-mcnmart-${Date.now()}`;
    const referralCode = 'MCNMART001';

    // Create the admin user
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          id: adminId,
          name: 'MCNmart Admin',
          email: 'admin@mcnmart.com',
          password: hashedPassword,
          role: 'ADMIN',
          referralCode: referralCode,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          username: 'mcnmart_admin',
          isActive: true,
          tasksEnabled: true,
          isAdmin: true,
          balance: 0,
          totalEarnings: 0,
          pendingCommission: 0,
          availableVoucherPkr: 0,
          totalPoints: 0,
          tasksCompleted: 0,
          membershipStatus: 'ACTIVE',
          taskEarnings: 0,
          referralEarnings: 0,
          dailyTasksCompleted: 0,
          minimumWithdrawal: 2000,
          renewalCount: 0,
          expirationNotified: false,
          profileVisibility: 'public',
          showEmail: false,
          showPhone: false,
          showBirthdate: false,
          allowMessages: true,
          allowFollows: true,
          showOnlineStatus: true,
          emailNotifications: true,
          pushNotifications: true,
          postLikes: true,
          postComments: true,
          newFollowers: true,
          directMessages: true,
          partnershipUpdates: true,
          weeklyDigest: true,
          partnerLevel: 'Bronze',
          teamRole: 'Admin'
        }
      ]);

    if (error) {
      console.error('Error creating admin user:', error);
      return;
    }

    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@mcnmart.com');
    console.log('Password: admin123');
    console.log('Role: ADMIN');

  } catch (error) {
    console.error('Error:', error);
  }
}

createAdminUser();
