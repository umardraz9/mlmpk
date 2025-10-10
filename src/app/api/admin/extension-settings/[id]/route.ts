import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      extensionRules,
      isActive
    } = body;

    // Check if extension setting exists
    const existingSetting = await prisma.planExtensionSettings.findUnique({
      where: { id: params.id }
    });

    if (!existingSetting) {
      return NextResponse.json({
        success: false,
        error: 'Extension setting not found'
      }, { status: 404 });
    }

    // Update data object - only include fields that are provided
    const updateData: any = {};
    
    if (planId !== undefined) updateData.planId = planId;
    if (baseEarningDays !== undefined) updateData.baseEarningDays = baseEarningDays;
    if (maxExtendedDays !== undefined) updateData.maxExtendedDays = maxExtendedDays;
    if (referralsRequired !== undefined) updateData.referralsRequired = referralsRequired;
    if (extensionRules !== undefined) updateData.extensionRules = JSON.stringify(extensionRules);
    if (isActive !== undefined) updateData.isActive = isActive;

    const extensionSetting = await prisma.planExtensionSettings.update({
      where: { id: params.id },
      data: updateData,
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
        extensionRules: typeof extensionSetting.extensionRules === 'string' 
          ? JSON.parse(extensionSetting.extensionRules) 
          : extensionSetting.extensionRules,
        isActive: extensionSetting.isActive
      }
    });

  } catch (error) {
    console.error('Error updating extension setting:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if extension setting exists
    const existingSetting = await prisma.planExtensionSettings.findUnique({
      where: { id: params.id }
    });

    if (!existingSetting) {
      return NextResponse.json({
        success: false,
        error: 'Extension setting not found'
      }, { status: 404 });
    }

    await prisma.planExtensionSettings.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Extension setting deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting extension setting:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
