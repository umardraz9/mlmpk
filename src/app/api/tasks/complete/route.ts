import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { validateTaskAccess } from '@/lib/task-country-middleware'

// Disable CSRF protection for this API route
export const dynamic = 'force-dynamic'

// Disable Next.js built-in CSRF protection
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  // Skip CSRF validation by not checking for CSRF token
  const headers = {
    'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
  }

  try {
    // Check country restrictions first
    const countryBlockResponse = await validateTaskAccess(request)
    if (countryBlockResponse) {
      return countryBlockResponse
    }
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { 
        status: 401,
        headers 
      })
    }

    const body = await request.json()
    const { taskId, reward, trackingData } = body

    if (!taskId || !reward || !trackingData) {
      return NextResponse.json({ error: 'Missing required fields' }, { 
        status: 400,
        headers 
      })
    }

    // Validate tracking data
    if (!trackingData.isValid) {
      return NextResponse.json({ error: 'Task requirements not met' }, { 
        status: 400,
        headers 
      })
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check if task was already completed by this user
      const existingCompletion = await tx.taskCompletion.findFirst({
        where: {
          userId: session.user.id,
          taskId: taskId
        }
      })

      if (existingCompletion) {
        throw new Error('Task already completed')
      }

      // Get user's current balance
      const user = await tx.user.findUnique({
        where: { id: session.user.id },
        select: { balance: true }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Create task completion record
      const taskCompletion = await tx.taskCompletion.create({
        data: {
          userId: session.user.id,
          taskId: taskId,
          reward: reward,
          trackingData: JSON.stringify(trackingData),
          completedAt: new Date(),
          status: 'COMPLETED'
        }
      })

      // Update user balance
      const updatedUser = await tx.user.update({
        where: { id: session.user.id },
        data: {
          balance: {
            increment: reward
          }
        }
      })

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId: session.user.id,
          type: 'TASK_REWARD',
          amount: reward,
          description: `Task completion reward - Task ID: ${taskId}`,
          status: 'COMPLETED',
          metadata: JSON.stringify({
            taskId: taskId,
            taskCompletionId: taskCompletion.id,
            trackingData: trackingData
          })
        }
      })

      return {
        taskCompletion,
        transaction,
        newBalance: updatedUser.balance
      }
    })

    return NextResponse.json({
      success: true,
      transactionId: result.transaction.id,
      newBalance: result.newBalance,
      reward: reward,
      message: `Task completed successfully! PKR ${reward} has been added to your account.`
    }, { headers })

  } catch (error) {
    console.error('Task completion error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json({ 
        success: false,
        error: error.message 
      }, { status: 400, headers })
    }

    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500, headers })
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
