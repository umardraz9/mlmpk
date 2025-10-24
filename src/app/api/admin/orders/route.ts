import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'

// GET - List orders with search and filters
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const orderStatus = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Fetch orders from Supabase with user details
    let query = supabase
      .from('orders')
      .select('*, order_items(*, product:products(*)), user:users(id, name, email, phone)', { count: 'exact' })
      .order('createdAt', { ascending: false })

    if (orderStatus) {
      query = query.eq('status', orderStatus)
    }

    if (search) {
      // Search by order number, user email, user name, or city
      query = query.or(`orderNumber.ilike.%${search}%,city.ilike.%${search}%,user.email.ilike.%${search}%,user.name.ilike.%${search}%`)
    }

    // Apply pagination after filtering
    query = query.range(from, to)

    const { data: orders, error: ordersError, count: total } = await query

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    // Transform orders to match expected format
    const ordersWithItems = (orders || []).map(order => ({
      ...order,
      items: order.order_items || []
    }))

    // Get order analytics
    const analytics = await getOrderAnalytics()

    return NextResponse.json({
      orders: ordersWithItems,
      pagination: {
        total: total || 0,
        page,
        limit,
        totalPages: Math.ceil((total || 0) / limit)
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
  try {
    // Get all orders
    const { data: allOrders, count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact' })

    // Get pending orders
    const { count: pendingOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('status', 'PENDING')

    // Get completed orders
    const { count: completedOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('status', 'COMPLETED')

    // Calculate revenue
    let totalRevenue = 0
    let paidAmount = 0
    let voucherUsed = 0
    let shippingRevenue = 0

    if (allOrders) {
      totalRevenue = allOrders.reduce((sum, order) => sum + (order.totalPkr || 0), 0)
      paidAmount = allOrders.reduce((sum, order) => sum + (order.totalPkr || 0), 0)
      voucherUsed = allOrders.reduce((sum, order) => sum + (order.voucherUsedPkr || 0), 0)
      shippingRevenue = allOrders.reduce((sum, order) => sum + (order.shippingPkr || 0), 0)
    }

    // Get recent orders
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(5)

    return {
      totalOrders: totalOrders || 0,
      pendingOrders: pendingOrders || 0,
      completedOrders: completedOrders || 0,
      cancelledOrders: (totalOrders || 0) - (completedOrders || 0) - (pendingOrders || 0),
      totalRevenue,
      paidAmount,
      voucherUsed,
      shippingRevenue,
      monthlyRevenue: totalRevenue,
      monthlyOrders: totalOrders || 0,
      topCustomers: [],
      recentOrders: recentOrders || []
    }
  } catch (error) {
    console.error('Error getting analytics:', error)
    return {
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      totalRevenue: 0,
      paidAmount: 0,
      voucherUsed: 0,
      shippingRevenue: 0,
      monthlyRevenue: 0,
      monthlyOrders: 0,
      topCustomers: [],
      recentOrders: []
    }
  }
}