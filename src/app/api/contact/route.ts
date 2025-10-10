import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

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
    const notification = await prisma.notification.create({
      data: {
        title: `Contact: ${subject}`,
        message: message.toString().slice(0, 5000),
        type: 'contact',
        category: 'support',
        priority: 'high',
        audience: 'admin',
        role: 'admin',
        isGlobal: true,
        data: JSON.stringify({ name, email, phone: phone || null, subject }),
      },
    })

    return NextResponse.json({ success: true, id: notification.id })
  } catch (error) {
    console.error('Error handling contact submission:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit contact request' },
      { status: 500 }
    )
  }
}
