import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import prisma from '../../../../lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database to ensure we have the ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const membershipTier = formData.get('membershipTier') as string
    const amount = formData.get('amount') as string
    const userPhone = formData.get('userPhone') as string
    const transactionId = formData.get('transactionId') as string
    const paymentMethod = formData.get('paymentMethod') as string
    const adminAccount = formData.get('adminAccount') as string
    const notes = (formData.get('notes') as string) || ''
    const screenshot = formData.get('screenshot') as File

    if (!membershipTier || !amount || !userPhone || !transactionId || !paymentMethod || !adminAccount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Handle optional screenshot
    let screenshotUrl: string | null = null
    if (screenshot) {
      const bytes = await screenshot.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      // Create unique filename
      const timestamp = Date.now()
      const extension = screenshot.name.split('.').pop()
      const filename = `payment_${user.id}_${timestamp}.${extension}`
      const uploadsDir = join(process.cwd(), 'public', 'uploads', 'payments')
      const filepath = join(uploadsDir, filename)
      
      // Ensure directory exists
      try {
        await mkdir(uploadsDir, { recursive: true })
      } catch (error) {
        // Directory might already exist
      }
      
      await writeFile(filepath, buffer)
      screenshotUrl = `/uploads/payments/${filename}`
    }

    // Map to PaymentConfirmation model (membership payments)
    // Store extra info in adminNotes as JSON for admin context
    const adminMeta = {
      userPhone,
      adminAccount,
      membershipTier,
      note: notes
    }

    const paymentRequest = await prisma.paymentConfirmation.create({
      data: {
        userId: user.id,
        membershipPlan: membershipTier,
        amount: parseFloat(amount),
        paymentMethod,
        paymentDetails: transactionId,
        paymentProof: screenshotUrl,
        status: 'PENDING',
        adminNotes: JSON.stringify(adminMeta)
      }
    })

    // Create notification for admin
    await prisma.notification.create({
      data: {
        title: 'New Membership Payment Confirmation',
        message: `${user.name || user.email} submitted a ${membershipTier} membership payment of PKR ${amount}`,
        type: 'payment',
        category: 'admin',
        priority: 'high',
        role: 'ADMIN',
        data: JSON.stringify({
          paymentConfirmationId: paymentRequest.id,
          userId: user.id,
          membershipPlan: membershipTier,
          amount: parseFloat(amount),
          paymentMethod
        }),
        actionUrl: `/admin/payments`
      }
    })

    return NextResponse.json({
      success: true,
      paymentRequestId: paymentRequest.id,
      orderNumber: paymentRequest.id,
      message: 'Payment request submitted successfully'
    })

  } catch (error) {
    console.error('Manual payment error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
