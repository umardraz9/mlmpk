import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// POST - Pay for task system renewal
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { weeks, paymentMethod } = await request.json();
    const renewalFee = 300; // PKR 300 per week
    const totalAmount = renewalFee * weeks;

    // Check if user has sufficient balance
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        balance: true,
        totalPoints: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check user's earnings balance
    const totalEarnings = user.balance + user.totalPoints;
    
    if (totalEarnings < totalAmount) {
      return NextResponse.json({ 
        error: 'Insufficient balance. Required: PKR ' + totalAmount + 
               ', Available: PKR ' + totalEarnings 
      }, { status: 400 });
    }

    // Calculate new expiry date
    const now = new Date();
    const newExpiry = new Date(now);
    newExpiry.setDate(newExpiry.getDate() + (weeks * 7));

    // Create renewal record
    const renewal = await prisma.taskRenewal.create({
      data: {
        userId: session.user.id,
        amount: totalAmount,
        weeks,
        expiresAt: newExpiry,
        paymentMethod,
        status: 'ACTIVE'
      }
    });

    // Update user balance
    let updatedBalance = user.balance;
    let updatedTotalPoints = user.totalPoints;
    
    if (user.balance >= totalAmount) {
      updatedBalance = user.balance - totalAmount;
    } else {
      const remainingFromPoints = totalAmount - user.balance;
      updatedBalance = 0;
      updatedTotalPoints = user.totalPoints - remainingFromPoints;
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        balance: updatedBalance,
        totalPoints: updatedTotalPoints
      }
    });

    return NextResponse.json({ 
      success: true,
      renewal,
      newExpiry,
      amount: totalAmount
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to process renewal' }, { status: 500 });
  }
}

// GET - Check task system status (simplified - no referral check)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        balance: true,
        totalPoints: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const totalEarnings = user.balance + user.totalPoints;

    return NextResponse.json({
      enabled: true, // Simplified: always enabled unless admin disables
      renewalFee: 300,
      currency: 'PKR',
      balance: totalEarnings
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
}
