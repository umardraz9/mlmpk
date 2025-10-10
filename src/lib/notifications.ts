import { db as prisma } from '@/lib/db'

export interface NotificationData {
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error' | 'money' | 'event' | 'task' | 'referral' | 'commission' | 'order' | 'blog'
  category?: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  recipientId?: string
  role?: string
  audience?: string
  data?: Record<string, any>
  actionUrl?: string
  actionText?: string
  imageUrl?: string
  scheduledFor?: Date
  expiresAt?: Date
  isGlobal?: boolean
  createdById?: string
}

class NotificationService {
  
  // Create a single notification
  async createNotification(notificationData: NotificationData) {
    try {
      const notification = await prisma.notification.create({
        data: {
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type || 'info',
          category: notificationData.category,
          priority: notificationData.priority || 'normal',
          recipientId: notificationData.recipientId,
          role: notificationData.role,
          audience: notificationData.audience,
          data: notificationData.data ? JSON.stringify(notificationData.data) : null,
          actionUrl: notificationData.actionUrl,
          actionText: notificationData.actionText,
          imageUrl: notificationData.imageUrl,
          scheduledFor: notificationData.scheduledFor,
          expiresAt: notificationData.expiresAt,
          isGlobal: notificationData.isGlobal || false,
          createdById: notificationData.createdById
        },
        include: {
          recipient: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } }
        }
      })

      return notification
    } catch (error) {
      console.error('Error creating notification:', error)
      throw error
    }
  }

  // Create multiple notifications (bulk)
  async createBulkNotifications(notifications: NotificationData[]) {
    try {
      const results = await Promise.all(
        notifications.map(notification => this.createNotification(notification))
      )
      return results
    } catch (error) {
      console.error('Error creating bulk notifications:', error)
      throw error
    }
  }

  // Notification templates for common events
  
  // MLM and Referral Notifications
  async notifyNewReferral(sponsorId: string, newUserId: string, newUserName: string) {
    return this.createNotification({
      title: 'New Referral Joined! 🎉',
      message: `${newUserName} joined your network using your referral code. Welcome them to the team!`,
      type: 'referral',
      category: 'mlm',
      priority: 'high',
      recipientId: sponsorId,
      actionUrl: '/dashboard/team',
      actionText: 'View Team',
      data: { newUserId, newUserName }
    })
  }

  async notifyCommissionEarned(userId: string, amount: number, level: number, fromUser: string) {
    return this.createNotification({
      title: `Commission Earned! 💰`,
      message: `You earned PKR ${amount.toLocaleString()} from your Level ${level} referral (${fromUser})`,
      type: 'commission',
      category: 'earnings',
      priority: 'high',
      recipientId: userId,
      actionUrl: '/dashboard/commissions',
      actionText: 'View Earnings',
      data: { amount, level, fromUser }
    })
  }

  // Task Notifications
  async notifyTaskCompleted(userId: string, taskTitle: string, reward: number) {
    return this.createNotification({
      title: 'Task Completed! ✅',
      message: `You've completed "${taskTitle}" and earned PKR ${reward}`,
      type: 'task',
      category: 'tasks',
      priority: 'normal',
      recipientId: userId,
      actionUrl: '/tasks',
      actionText: 'View Tasks',
      data: { taskTitle, reward }
    })
  }

  async notifyNewTasksAvailable(userId: string, taskCount: number) {
    return this.createNotification({
      title: 'New Tasks Available! 📋',
      message: `${taskCount} new tasks are available for you to complete`,
      type: 'task',
      category: 'tasks',
      priority: 'normal',
      recipientId: userId,
      actionUrl: '/tasks',
      actionText: 'View Tasks',
      data: { taskCount }
    })
  }

  // Order Notifications
  async notifyOrderStatusUpdate(userId: string, orderNumber: string, status: string) {
    const statusMessages = {
      'CONFIRMED': 'Your order has been confirmed and is being processed',
      'SHIPPED': 'Your order has been shipped and is on its way',
      'DELIVERED': 'Your order has been delivered successfully',
      'CANCELLED': 'Your order has been cancelled'
    }

    return this.createNotification({
      title: `Order ${status.toLowerCase()} 📦`,
      message: `Order #${orderNumber}: ${statusMessages[status as keyof typeof statusMessages] || 'Status updated'}`,
      type: status === 'DELIVERED' ? 'success' : 'info',
      category: 'orders',
      priority: 'normal',
      recipientId: userId,
      actionUrl: '/orders',
      actionText: 'View Order',
      data: { orderNumber, status }
    })
  }

  // Blog Notifications
  async notifyNewBlogPost(title: string, slug: string, authorName: string) {
    return this.createNotification({
      title: 'New Blog Post Published! 📝',
      message: `"${title}" by ${authorName} is now available to read`,
      type: 'blog',
      category: 'content',
      priority: 'low',
      isGlobal: true,
      audience: 'all',
      actionUrl: `/blog/${slug}`,
      actionText: 'Read Post',
      data: { title, slug, authorName }
    })
  }

  // System Notifications
  async notifySystemMaintenance(title: string, message: string, scheduledFor: Date) {
    return this.createNotification({
      title,
      message,
      type: 'warning',
      category: 'system',
      priority: 'high',
      isGlobal: true,
      audience: 'all',
      scheduledFor,
      data: { maintenanceTime: scheduledFor.toISOString() }
    })
  }

  async notifyAccountVerification(userId: string, verified: boolean) {
    return this.createNotification({
      title: verified ? 'Account Verified! ✅' : 'Account Verification Required',
      message: verified 
        ? 'Your account has been successfully verified. You can now access all features.'
        : 'Please verify your account to access all platform features.',
      type: verified ? 'success' : 'warning',
      category: 'account',
      priority: 'high',
      recipientId: userId,
      actionUrl: '/profile',
      actionText: verified ? 'View Profile' : 'Verify Account'
    })
  }

  // Payment Notifications
  async notifyPaymentReceived(userId: string, amount: number, method: string) {
    return this.createNotification({
      title: 'Payment Received! 💳',
      message: `Your payment of PKR ${amount.toLocaleString()} via ${method} has been processed successfully`,
      type: 'money',
      category: 'payments',
      priority: 'high',
      recipientId: userId,
      actionUrl: '/dashboard',
      actionText: 'View Balance',
      data: { amount, method }
    })
  }

  // Admin Notifications
  async notifyAdminNewUser(adminId: string, newUserName: string, newUserEmail: string) {
    return this.createNotification({
      title: 'New User Registration',
      message: `${newUserName} (${newUserEmail}) has joined the platform`,
      type: 'info',
      category: 'admin',
      priority: 'normal',
      recipientId: adminId,
      actionUrl: '/admin/users',
      actionText: 'View Users',
      data: { newUserName, newUserEmail }
    })
  }

  async notifyAdminTaskSubmission(adminId: string, taskTitle: string, userName: string) {
    return this.createNotification({
      title: 'New Task Submission',
      message: `${userName} submitted a task: "${taskTitle}"`,
      type: 'info',
      category: 'admin',
      priority: 'normal',
      recipientId: adminId,
      actionUrl: '/admin/tasks',
      actionText: 'Review Tasks',
      data: { taskTitle, userName }
    })
  }

  // Utility methods
  async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: {
        AND: [
          {
            OR: [
              { recipientId: userId },
              { isGlobal: true }
            ]
          },
          { isRead: false },
          { isActive: true },
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } }
            ]
          }
        ]
      }
    })
  }

  async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: {
        AND: [
          {
            OR: [
              { recipientId: userId },
              { isGlobal: true }
            ]
          },
          { id: notificationId }
        ]
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        OR: [
          { recipientId: userId },
          { isGlobal: true }
        ],
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })
  }

  async cleanupExpiredNotifications() {
    return prisma.notification.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    })
  }
}

// Export singleton instance
export const notificationService = new NotificationService()

// Export utility functions for easy use
export const {
  createNotification,
  createBulkNotifications,
  notifyNewReferral,
  notifyCommissionEarned,
  notifyTaskCompleted,
  notifyNewTasksAvailable,
  notifyOrderStatusUpdate,
  notifyNewBlogPost,
  notifySystemMaintenance,
  notifyAccountVerification,
  notifyPaymentReceived,
  notifyAdminNewUser,
  notifyAdminTaskSubmission,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  cleanupExpiredNotifications
} = notificationService 