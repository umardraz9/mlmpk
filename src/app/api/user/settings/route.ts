import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET - Fetch user settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Default settings (stored in localStorage on client side for now)
    const defaultSettings = {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      marketingEmails: true,
      commissionAlerts: true,
      referralNotifications: true,
      profileVisibility: 'public',
      showEarnings: false,
      showReferrals: true,
      allowMessages: true,
      language: 'en',
      currency: 'PKR',
      timezone: 'Asia/Karachi',
      twoFactorAuth: false,
      loginAlerts: true,
      sessionTimeout: '30'
    };

    const userSettings = defaultSettings;

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      settings: userSettings
    });

  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT - Update user settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      email, 
      currentPassword, 
      newPassword, 
      settings: newSettings 
    } = body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};

    // Update email if provided and different
    if (email && email !== user.email) {
      // Check if email is already taken
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        );
      }
      
      updateData.email = email;
    }

    // Update password if provided
    if (currentPassword && newPassword) {
      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      
      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
      }

      // Validate new password
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: 'New password must be at least 8 characters long' },
          { status: 400 }
        );
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      updateData.password = hashedPassword;
    }

    // Update notification preferences if settings provided
    if (newSettings) {
      // Update or create notification preferences
      await prisma.notificationPreference.upsert({
        where: { userId: user.id },
        update: {
          emailEnabled: newSettings.emailNotifications ?? true,
          emailCommissions: newSettings.commissionAlerts ?? true,
          emailReferrals: newSettings.referralNotifications ?? true,
          pushEnabled: newSettings.pushNotifications ?? true,
          pushCommissions: newSettings.commissionAlerts ?? true,
          pushReferrals: newSettings.referralNotifications ?? true,
          timezone: newSettings.timezone ?? 'Asia/Karachi',
          updatedAt: new Date()
        },
        create: {
          userId: user.id,
          emailEnabled: newSettings.emailNotifications ?? true,
          emailCommissions: newSettings.commissionAlerts ?? true,
          emailReferrals: newSettings.referralNotifications ?? true,
          pushEnabled: newSettings.pushNotifications ?? true,
          pushCommissions: newSettings.commissionAlerts ?? true,
          pushReferrals: newSettings.referralNotifications ?? true,
          timezone: newSettings.timezone ?? 'Asia/Karachi'
        }
      });
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        updatedAt: true,
        notificationPreferences: true
      }
    });

    return NextResponse.json({
      message: 'Settings updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user account
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In a real app, you might want to:
    // 1. Soft delete instead of hard delete
    // 2. Clean up related data
    // 3. Send confirmation emails
    // 4. Handle referral relationships
    
    await prisma.user.delete({
      where: { email: session.user.email }
    });

    return NextResponse.json({
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
