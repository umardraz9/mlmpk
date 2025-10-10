import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🗑️ Starting comprehensive demo data cleanup...');

    // Delete ALL demo notifications - very comprehensive
    const deletedNotifications = await prisma.notification.deleteMany({
      where: {
        OR: [
          // All demo titles
          { title: { contains: 'Test' } },
          { title: { contains: 'Demo' } },
          { title: { contains: 'Welcome' } },
          { title: { contains: 'Account Update' } },
          { title: { contains: 'System Update' } },
          { title: { contains: 'Level 2 Bonus' } },
          { title: { contains: 'New Referral' } },
          { title: { contains: 'Profile Update' } },
          { title: { contains: 'Team Meeting' } },
          { title: { contains: 'Commission Earned' } },
          { title: { contains: 'Referral Code Ready' } },
          { title: { contains: 'Investment Reminder' } },
          { title: { contains: 'New Task Available' } },
          { title: { contains: 'New Message' } },
          { title: { contains: 'Message Sent' } },
          { title: { contains: 'Meeting Reminder' } },
          
          // All demo messages
          { message: { contains: 'test' } },
          { message: { contains: 'demo' } },
          { message: { contains: 'Ahmed Hassan' } },
          { message: { contains: 'Sarah Ahmed' } },
          { message: { contains: 'REF123' } },
          { message: { contains: 'Level 1 referral' } },
          { message: { contains: 'Level 2 referral' } },
          { message: { contains: 'team members' } },
          { message: { contains: 'PKR 500' } },
          { message: { contains: 'PKR 200' } },
          { message: { contains: 'PKR 150' } },
          { message: { contains: 'profile information' } },
          { message: { contains: 'verification' } },
          { message: { contains: 'Image sharing' } },
          { message: { contains: 'emoji reactions' } },
          
          // All demo categories
          { category: { in: ['system', 'welcome', 'account', 'test', 'demo'] } },
          { type: { in: ['test', 'demo', 'system'] } },
          
          // Demo user related
          { createdById: 'demo-user-id' },
          {
            recipient: {
              email: 'demouser@example.com'
            }
          }
        ]
      }
    });

    // Delete ALL demo messages - very comprehensive
    const deletedMessages = await prisma.directMessage.deleteMany({
      where: {
        OR: [
          // Test and demo content
          { content: { contains: 'Test' } },
          { content: { contains: 'test' } },
          { content: { contains: 'demo' } },
          { content: { contains: 'Demo' } },
          
          // All demo conversation content
          { content: { contains: 'How can we assist you today?' } },
          { content: { contains: 'Thanks for the referral tips!' } },
          { content: { contains: 'Meeting scheduled for tomorrow' } },
          { content: { contains: 'Can you share the training materials?' } },
          { content: { contains: 'Great work on your recent sales!' } },
          { content: { contains: 'Keep it up!' } },
          { content: { contains: 'commission structure' } },
          { content: { contains: 'understanding the commission' } },
          { content: { contains: 'help with understanding' } },
          { content: { contains: 'I need help' } },
          
          // Messages from/to demo users
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

    console.log(`✅ Cleared ${deletedNotifications.count} demo notifications and ${deletedMessages.count} demo messages`);

    return NextResponse.json({
      success: true,
      message: `Successfully cleared ALL demo data: ${deletedNotifications.count} notifications and ${deletedMessages.count} messages`,
      deletedNotifications: deletedNotifications.count,
      deletedMessages: deletedMessages.count,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Clear demo data error:', error);
    return NextResponse.json({
      error: 'Failed to clear demo data',
      details: error.message
    }, { status: 500 });
  }
}
