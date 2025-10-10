import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - List orders with search and filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const paymentStatus = searchParams.get('paymentStatus') || ''
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { user: { 
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { username: { contains: search } }
          ]
        }},
        { trackingNumber: { contains: search } },
        { city: { contains: search } }
      ]
    }
    
    if (status) {
      where.status = status
    }
    
    if (paymentStatus) {
      where.paymentStatus = paymentStatus
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z')
      }
    }

    // Get orders with pagination
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
              avatar: true,
              phone: true
            }
          }
        }
      }),
      prisma.order.count({ where })
    ])

    // Parse items JSON for each order
    const ordersWithParsedItems = orders.map(order => ({
      ...order,
      items: JSON.parse(order.items || '[]')
    }))

    // Get order analytics
    const analytics = await getOrderAnalytics()

    return NextResponse.json({
      orders: ordersWithParsedItems,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      analytics
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to get order analytics
async function getOrderAnalytics() {
  const [
    totalOrders,
    pendingOrders,
    completedOrders,
    revenueStats,
    monthlyStats,
    topCustomers,
    recentOrders
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.count({ where: { status: 'COMPLETED' } }),
    prisma.order.aggregate({
      _sum: {
        totalPkr: true,
        paidAmountPkr: true,
        voucherUsedPkr: true,
        shippingPkr: true
      }
    }),
    prisma.order.aggregate({
      _sum: { totalPkr: true },
      _count: { id: true },
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    }),
    prisma.order.groupBy({
      by: ['userId'],
      _count: { id: true },
      _sum: { totalPkr: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            avatar: true
          }
        }
      }
    })
  ])

  // Get user details for top customers
  const topCustomersWithDetails = await Promise.all(
    topCustomers.map(async (customer) => {
      const user = await prisma.user.findUnique({
        where: { id: customer.userId },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          avatar: true
        }
      })
      return {
        ...customer,
        user
      }
    })
  )

  // Parse items for recent orders
  const recentOrdersWithItems = recentOrders.map(order => ({
    ...order,
    items: JSON.parse(order.items || '[]')
  }))

  return {
    totalOrders,
    pendingOrders,
    completedOrders,
    cancelledOrders: totalOrders - completedOrders - pendingOrders,
    totalRevenue: revenueStats._sum.totalPkr || 0,
    paidAmount: revenueStats._sum.paidAmountPkr || 0,
    voucherUsed: revenueStats._sum.voucherUsedPkr || 0,
    shippingRevenue: revenueStats._sum.shippingPkr || 0,
    monthlyRevenue: monthlyStats._sum.totalPkr || 0,
    monthlyOrders: monthlyStats._count.id || 0,
    topCustomers: topCustomersWithDetails,
    recentOrders: recentOrdersWithItems
  }
} 