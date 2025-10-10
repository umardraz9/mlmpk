import { NextRequest, NextResponse } from 'next/server';
import { unstable_getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface ErrorReport {
  errorId: string;
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  url: string;
  userAgent: string;
  userId?: string | null;
  sessionId?: string | null;
}

// In-memory error storage (in production, use a database or external service)
let errorStore: ErrorReport[] = [];
const MAX_ERRORS = 1000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ErrorReport;

    // Validate required fields
    if (!body.errorId || !body.message || !body.timestamp) {
      return NextResponse.json(
        { error: 'Missing required error fields' },
        { status: 400 }
      );
    }

    // Get user session if available
    // @ts-ignore
    const session = await unstable_getServerSession(request, authOptions);

    // Store error report
    const errorReport: ErrorReport & { userEmail?: string } = {
      ...body,
      userId: // @ts-ignore
      session.user.id || body.userId,
    };

    // Add to in-memory store (rotate if needed)
    errorStore.unshift(errorReport);
    if (errorStore.length > MAX_ERRORS) {
      errorStore = errorStore.slice(0, MAX_ERRORS);
    }

    // Store in database for persistence (optional)
    try {
      await prisma.errorLog.create({
        data: {
          errorId: body.errorId,
          message: body.message,
          stack: body.stack || null,
          componentStack: body.componentStack || null,
          url: body.url,
          userAgent: body.userAgent,
          userId: body.userId || null,
          timestamp: new Date(body.timestamp),
          resolved: false,
        }
      });
    } catch (dbError) {
      console.error('Failed to store error in database:', dbError);
      // Continue without database storage
    }

    // Log critical errors to console
    if (body.message.includes('TypeError') || body.message.includes('ReferenceError')) {
      console.error('CRITICAL CLIENT ERROR:', {
        errorId: body.errorId,
        message: body.message,
        stack: body.stack,
        url: body.url,
        userAgent: body.userAgent,
        timestamp: body.timestamp
      });
    }

    return NextResponse.json({
      success: true,
      errorId: body.errorId,
      message: 'Error report received'
    });

  } catch (error) {
    console.error('Error reporting failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // @ts-ignore
    const session = await unstable_getServerSession(request, authOptions);

    if (!// @ts-ignore
    session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const resolved = searchParams.get('resolved') === 'true';

    // Fetch errors from database
    const errors = await prisma.errorLog.findMany({
      where: {
        resolved: resolved || undefined
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    const total = await prisma.errorLog.count({
      where: {
        resolved: resolved || undefined
      }
    });

    return NextResponse.json({
      errors,
      total,
      limit,
      offset
    });

  } catch (error) {
    console.error('Failed to fetch errors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch errors' },
      { status: 500 }
    );
  }
}

// Mark error as resolved
export async function PATCH(request: NextRequest) {
  try {
    // @ts-ignore
    const session = await unstable_getServerSession(request, authOptions);

    if (!// @ts-ignore
    session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { errorId, resolved } = body;

    if (!errorId) {
      return NextResponse.json(
        { error: 'Error ID required' },
        { status: 400 }
      );
    }

    const updatedError = await prisma.errorLog.update({
      where: { errorId },
      data: { resolved: resolved ?? true }
    });

    return NextResponse.json({
      success: true,
      error: updatedError
    });

  } catch (error) {
    console.error('Failed to update error:', error);
    return NextResponse.json(
      { error: 'Failed to update error' },
      { status: 500 }
    );
  }
}
