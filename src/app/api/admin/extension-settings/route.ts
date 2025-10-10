import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const extensionSettings = await prisma.planExtensionSettings.findMany({
      include: {
        membershipPlan: {
          select: {
            name: true,
            displayName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedSettings = extensionSettings.map(setting => ({
      id: setting.id,
      planId: setting.planId,
      planName: setting.membershipPlan.displayName,
      baseEarningDays: setting.baseEarningDays,
      maxExtendedDays: setting.maxExtendedDays,
      referralsRequired: setting.referralsRequired,
      extensionRules: typeof setting.extensionRules === 'string' 
        ? JSON.parse(setting.extensionRules) 
        : setting.extensionRules,
      isActive: setting.isActive
    }));

    return NextResponse.json({
      success: true,
      settings: formattedSettings
    });

  } catch (error) {
    console.error('Error fetching extension settings:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      planId,
      baseEarningDays,
      maxExtendedDays,
      referralsRequired,
      extensionRules
    } = body;

    // Validation
    if (!planId || !baseEarningDays || !maxExtendedDays || !referralsRequired) {
      return NextResponse.json({
        success: false,
        error: 'All fields are required'
      }, { status: 400 });
    }

    // Check if plan exists
    const membershipPlan = await prisma.membershipPlan.findUnique({
      where: { id: planId }
    });

    if (!membershipPlan) {
      return NextResponse.json({
        success: false,
        error: 'Membership plan not found'
      }, { status: 404 });
    }

    // Check if extension settings already exist for this plan
    const existingSettings = await prisma.planExtensionSettings.findFirst({
      where: { planId }
    });

    if (existingSettings) {
      return NextResponse.json({
        success: false,
        error: 'Extension settings already exist for this plan'
      }, { status: 400 });
    }

    const extensionSetting = await prisma.planExtensionSettings.create({
      data: {
        planId,
        baseEarningDays,
        maxExtendedDays,
        referralsRequired,
        extensionRules: JSON.stringify(extensionRules),
        isActive: true
      },
      include: {
        membershipPlan: {
          select: {
            name: true,
            displayName: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      setting: {
        id: extensionSetting.id,
        planId: extensionSetting.planId,
        planName: extensionSetting.membershipPlan.displayName,
        baseEarningDays: extensionSetting.baseEarningDays,
        maxExtendedDays: extensionSetting.maxExtendedDays,
        referralsRequired: extensionSetting.referralsRequired,
        extensionRules: JSON.parse(extensionSetting.extensionRules),
        isActive: extensionSetting.isActive
      }
    });

  } catch (error) {
    console.error('Error creating extension setting:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
