import { notificationService } from './notifications'
import { db as prisma } from './db'

// Task completion notification trigger
export async function triggerTaskCompletionNotification(
  userId: string, 
  taskId: string, 
  reward: number
) {
  try {
    // Get task details
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { title: true, type: true }
    })

    if (!task) return

    // Send notification to user
    await notificationService.notifyTaskCompleted(userId, task.title, reward)

    // Notify admin of task completion for review tasks
    if (task.type === 'REVIEW' || task.type === 'CONTENT_CREATION') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true }
      })

      const admins = await prisma.user.findMany({
        where: { isAdmin: true },
        select: { id: true }
      })

      for (const admin of admins) {
        await notificationService.notifyAdminTaskSubmission(
          admin.id, 
          task.title, 
          user?.name || 'Unknown User'
        )
      }
    }
  } catch (error) {
    console.error('Error triggering task completion notification:', error)
  }
}

// New user registration notification trigger
export async function triggerNewUserNotification(
  newUserId: string, 
  sponsorId?: string
) {
  try {
    const newUser = await prisma.user.findUnique({
      where: { id: newUserId },
      select: { name: true, email: true }
    })

    if (!newUser) return

    // Notify sponsor about new referral
    if (sponsorId) {
      await notificationService.notifyNewReferral(
        sponsorId, 
        newUserId, 
        newUser.name || 'New User'
      )
    }

    // Notify admins about new user
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true }
    })

    for (const admin of admins) {
      await notificationService.notifyAdminNewUser(
        admin.id,
        newUser.name || 'Unknown',
        newUser.email || 'No email'
      )
    }

    // Send welcome notification to new user
    await notificationService.createNotification({
      title: 'Welcome to MLM-Pak! 🎉',
      message: 'Your account has been created successfully. Complete your profile and start building your network to earn commissions.',
      type: 'success',
      category: 'welcome',
      priority: 'normal',
      recipientId: newUserId,
      actionUrl: '/dashboard',
      actionText: 'Get Started'
    })
  } catch (error) {
    console.error('Error triggering new user notification:', error)
  }
}

// Commission earned notification trigger
export async function triggerCommissionNotification(
  userId: string,
  amount: number,
  level: number,
  fromUserId: string
) {
  try {
    const fromUser = await prisma.user.findUnique({
      where: { id: fromUserId },
      select: { name: true }
    })

    await notificationService.notifyCommissionEarned(
      userId,
      amount,
      level,
      fromUser?.name || 'Unknown User'
    )
  } catch (error) {
    console.error('Error triggering commission notification:', error)
  }
}

// Order status change notification trigger
export async function triggerOrderStatusNotification(
  userId: string,
  orderNumber: string,
  newStatus: string
) {
  try {
    await notificationService.notifyOrderStatusUpdate(
      userId,
      orderNumber,
      newStatus
    )
  } catch (error) {
    console.error('Error triggering order status notification:', error)
  }
}

// Payment received notification trigger
export async function triggerPaymentNotification(
  userId: string,
  amount: number,
  method: string
) {
  try {
    await notificationService.notifyPaymentReceived(userId, amount, method)
  } catch (error) {
    console.error('Error triggering payment notification:', error)
  }
}

// Blog post published notification trigger
export async function triggerBlogPostNotification(
  postId: string
) {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { id: postId },
      select: { 
        title: true, 
        slug: true,
        author: { select: { name: true } }
      }
    })

    if (!post) return

    await notificationService.notifyNewBlogPost(
      post.title,
      post.slug,
      post.author.name || 'Unknown Author'
    )
  } catch (error) {
    console.error('Error triggering blog post notification:', error)
  }
}

// System maintenance notification trigger
export async function triggerMaintenanceNotification(
  title: string,
  message: string,
  scheduledFor: Date
) {
  try {
    await notificationService.notifySystemMaintenance(title, message, scheduledFor)
  } catch (error) {
    console.error('Error triggering maintenance notification:', error)
  }
}

// Account verification notification trigger
export async function triggerAccountVerificationNotification(
  userId: string,
  verified: boolean
) {
  try {
    await notificationService.notifyAccountVerification(userId, verified)
  } catch (error) {
    console.error('Error triggering account verification notification:', error)
  }
}

// Bulk notification for system announcements
export async function triggerSystemAnnouncement(
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  audience: 'all' | 'active_users' | 'new_users' = 'all'
) {
  try {
    await notificationService.createNotification({
      title,
      message,
      type,
      category: 'announcement',
      priority: 'normal',
      isGlobal: true,
      audience
    })
  } catch (error) {
    console.error('Error triggering system announcement:', error)
  }
}

// Clean up old notifications (to be run periodically)
export async function cleanupNotifications() {
  try {
    await notificationService.cleanupExpiredNotifications()
  } catch (error) {
    console.error('Error cleaning up notifications:', error)
  }
} 