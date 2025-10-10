import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import prisma from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const body = await request.json();
    const {
      type,
      accountTitle,
      accountNumber,
      bankName,
      branchCode,
      iban,
      instructions,
      isActive,
      monthlyLimitPkr
    } = body;

    // Check if payment setting exists
    const existingSetting = await prisma.paymentSettings.findUnique({
      where: { id: params.id }
    });

    if (!existingSetting) {
      return NextResponse.json({
        success: false,
        error: 'Payment setting not found'
      }, { status: 404 });
    }

    // Update data object - only include fields that are provided
    const updateData: any = {};
    
    if (type !== undefined) updateData.type = type;
    if (accountTitle !== undefined) updateData.accountTitle = accountTitle;
    if (accountNumber !== undefined) updateData.accountNumber = accountNumber;
    if (bankName !== undefined) updateData.bankName = bankName || null;
    if (branchCode !== undefined) updateData.branchCode = branchCode || null;
    if (iban !== undefined) updateData.iban = iban || null;
    if (instructions !== undefined) updateData.instructions = instructions || null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (monthlyLimitPkr !== undefined) updateData.monthlyLimitPkr = typeof monthlyLimitPkr === 'number' ? monthlyLimitPkr : null;

    const paymentSetting = await prisma.paymentSettings.update({
      where: { id: params.id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      setting: paymentSetting
    });

  } catch (error) {
    console.error('Error updating payment setting:', error);
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
    await requireAdmin();

    // Check if payment setting exists
    const existingSetting = await prisma.paymentSettings.findUnique({
      where: { id: params.id }
    });

    if (!existingSetting) {
      return NextResponse.json({
        success: false,
        error: 'Payment setting not found'
      }, { status: 404 });
    }

    await prisma.paymentSettings.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Payment setting deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting payment setting:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
