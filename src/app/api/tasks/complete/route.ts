import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/session'
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
    const session = await getSession()
    
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

    // Note: Supabase doesn't support transactions, using sequential operations
    // Check if task was already completed by this user
    const { data: existingCompletion } = await supabase
      .from('task_completions')
      .select('id')
      .eq('userId', session.user.id)
      .eq('taskId', taskId)
      .single();

    if (existingCompletion) {
      throw new Error('Task already completed');
    }

    // Get user's current balance
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', session.user.id)
      .single();

    if (userError || !user) {
      throw new Error('User not found');
    }

    // Create task completion record
    const { data: taskCompletion, error: completionError } = await supabase
      .from('task_completions')
      .insert({
        userId: session.user.id,
        taskId: taskId,
        reward: reward,
        trackingData: JSON.stringify(trackingData),
        completedAt: new Date().toISOString(),
        status: 'COMPLETED'
      })
      .select()
      .single();

    if (completionError || !taskCompletion) {
      console.error('Error creating task completion:', completionError);
      throw new Error('Failed to create task completion');
    }

    // Update user balance
    const newBalance = user.balance + reward;
    const { error: balanceError } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', session.user.id);

    if (balanceError) {
      console.error('Error updating balance:', balanceError);
      // Rollback: delete task completion
      await supabase.from('task_completions').delete().eq('id', taskCompletion.id);
      throw new Error('Failed to update balance');
    }

    // Create transaction record
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
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
      })
      .select()
      .single();

    if (txError) {
      console.error('Error creating transaction:', txError);
      // Continue even if transaction record fails
    }

    const result = {
      taskCompletion,
      transaction,
      newBalance
    }

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
