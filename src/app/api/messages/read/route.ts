import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'You must be logged in to mark messages as read'
      }, { status: 401 })
    }

    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({
        error: 'Bad Request',
        message: 'userId is required'
      }, { status: 400 })
    }

    const currentUserId = session.user.id

    // Mark all messages from userId to currentUserId as read
    const { data: messages, error: updateError } = await supabase
      .from('direct_messages')
      .update({ status: 'read' })
      .eq('senderId', userId)
      .eq('recipientId', currentUserId)
      .neq('status', 'read')
      .select()

    if (updateError) {
      console.error('Error updating messages:', updateError)
      return NextResponse.json({
        error: 'Internal Server Error',
        message: 'Failed to mark messages as read'
      }, { status: 500 })
    }

    const updatedCount = messages?.length || 0

    // Note: Conversation tracking would need a separate conversations table
    // Skipping conversation update for now as schema doesn't show conversations table

    return NextResponse.json({
      success: true,
      message: 'Messages marked as read',
      updatedCount
    })

  } catch (error) {
    console.error('Error marking messages as read:', error)
    return NextResponse.json({
      error: 'Internal Server Error',
      message: 'Failed to mark messages as read'
    }, { status: 500 })
  }
}
