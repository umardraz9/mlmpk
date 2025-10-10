import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import prisma from '@/lib/prisma';

// PUT /api/admin/payment-methods/[id] - Update payment method
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();

    const { id } = await params;
    const body = await request.json();
    const {
      name,
      type,
      accountName,
      accountNumber,
      bankName,
      branchCode,
      instructions,
      isActive,
      displayOrder
    } = body;

    // Check if payment method exists
    const existingMethod = await prisma.paymentMethod.findUnique({
      where: { id }
    });

    if (!existingMethod) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      );
    }

    // Check if account number conflicts with another method
    if (accountNumber !== existingMethod.accountNumber) {
      const conflictingMethod = await prisma.paymentMethod.findFirst({
        where: {
          accountNumber: accountNumber,
          type: type,
          id: { not: id }
        }
      });

      if (conflictingMethod) {
        return NextResponse.json(
          { error: 'Payment method with this account number already exists' },
          { status: 400 }
        );
      }
    }

    const updatedMethod = await prisma.paymentMethod.update({
      where: { id },
      data: {
        name,
        type,
        accountName,
        accountNumber,
        bankName: bankName || null,
        branchCode: branchCode || null,
        instructions: instructions || null,
        active: isActive ?? true,
        displayOrder: displayOrder ?? 0
      },
      include: {
        creator: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      paymentMethod: updatedMethod
    });

  } catch (error) {
    console.error('Error updating payment method:', error);
    return NextResponse.json(
      { error: 'Failed to update payment method' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/payment-methods/[id] - Delete payment method
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();

    const { id } = await params;

    // Check if payment method exists
    const existingMethod = await prisma.paymentMethod.findUnique({
      where: { id }
    });

    if (!existingMethod) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      );
    }

    await prisma.paymentMethod.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Payment method deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting payment method:', error);
    return NextResponse.json(
      { error: 'Failed to delete payment method' },
      { status: 500 }
    );
  }
}
