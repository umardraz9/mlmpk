import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete ALL notifications for demo user and test notifications
    const deletedNotifications = await prisma.notification.deleteMany({
      where: {
        OR: [
          // All notifications to demo user
          {
            recipient: {
              email: 'demouser@example.com'
            }
          },
          // All notifications from demo user
          {
            createdBy: {
              email: 'demouser@example.com'
            }
          },
          // Specific demo notification titles
          {
            title: {
              in: [
                'Welcome to MCNmart!',
                'Referral Code Ready',
                'Investment Reminder',
                'Test Message',
                'Test message'
              ]
            }
          },
          // Any message containing test
          {
            message: {
              contains: 'Test'
            }
          }
        ]
      }
    });

    // Also delete test direct messages
    const deletedMessages = await prisma.directMessage.deleteMany({
      where: {
        OR: [
          {
            content: {
              contains: 'Test'
            }
          },
          {
            sender: {
              email: 'demouser@example.com'
            }
          },
          {
            recipient: {
              email: 'demouser@example.com'
            }
          }
        ]
      }
    });

    console.log(`Cleared ${deletedNotifications.count} notifications and ${deletedMessages.count} messages`);

    return NextResponse.json({
      success: true,
      message: `Successfully cleared ${deletedNotifications.count} demo notifications and ${deletedMessages.count} demo messages`,
      deletedNotifications: deletedNotifications.count,
      deletedMessages: deletedMessages.count
    });

  } catch (error) {
    console.error('Clear all demo data error:', error);
    return NextResponse.json({
      error: 'Failed to clear demo data',
      details: error.message
    }, { status: 500 });
  }
}
