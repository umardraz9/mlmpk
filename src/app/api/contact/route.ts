import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST /api/contact - Accept contact form submissions and store as admin notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, subject, message } = body || {}

    // Basic validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, error: 'Name, email, subject and message are required.' },
        { status: 400 }
      )
    }

    // Create a Notification entry so admins can view it in their notifications panel
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        title: `Contact: ${subject}`,
        message: message.toString().slice(0, 5000),
        type: 'contact',
        category: 'support',
        priority: 'high',
        audience: 'admin',
        role: 'admin',
        isGlobal: true,
        data: JSON.stringify({ name, email, phone: phone || null, subject }),
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create notification' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, id: notification.id })
  } catch (error) {
    console.error('Error handling contact submission:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit contact request' },
      { status: 500 }
    )
  }
}
