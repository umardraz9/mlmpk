import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    await requireAdmin();

    const paymentSettings = await prisma.paymentSettings.findMany({
      orderBy: { displayOrder: 'asc' }
    });

    return NextResponse.json({
      success: true,
      settings: paymentSettings
    });

  } catch (error) {
    console.error('Error fetching payment settings:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
      monthlyLimitPkr
    } = body;

    // Validation
    if (!type || !accountTitle || !accountNumber) {
      return NextResponse.json({
        success: false,
        error: 'Type, account title, and account number are required'
      }, { status: 400 });
    }

    // Get next display order
    const lastSetting = await prisma.paymentSettings.findFirst({
      orderBy: { displayOrder: 'desc' }
    });
    const displayOrder = (lastSetting?.displayOrder || 0) + 1;

    const computedMonthlyLimit =
      typeof monthlyLimitPkr === 'number'
        ? monthlyLimitPkr
        : (type === 'JAZZCASH' || type === 'EASYPAISA')
          ? 200000
          : null;

    const paymentSetting = await prisma.paymentSettings.create({
      data: {
        type,
        accountTitle,
        accountNumber,
        bankName: bankName || null,
        branchCode: branchCode || null,
        iban: iban || null,
        instructions: instructions || null,
        monthlyLimitPkr: computedMonthlyLimit,
        displayOrder,
        isActive: true
      } as any
    });

    return NextResponse.json({
      success: true,
      setting: paymentSetting
    });

  } catch (error) {
    console.error('Error creating payment setting:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
