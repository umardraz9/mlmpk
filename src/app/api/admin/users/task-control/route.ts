import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const { userId, enabled } = await request.json()

    if (!userId || typeof enabled !== 'boolean') {
      return NextResponse.json({
        success: false,
        error: 'User ID and enabled status are required'
      }, { status: 400 })
    }

    // Update user's task enabled status
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ tasksEnabled: enabled })
      .eq('id', userId)
      .select('id, name, email, tasksEnabled, membershipStatus, membershipPlan')
      .single();

    if (updateError || !updatedUser) {
      console.error('Error updating user:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to update user'
      }, { status: 500 });
    }

    // Log the action
    await supabase.from('notifications').insert({
      title: `Tasks ${enabled ? 'Enabled' : 'Disabled'}`,
      message: `Admin ${enabled ? 'enabled' : 'disabled'} tasks for user ${updatedUser.name || updatedUser.email}`,
      type: 'info',
      category: 'admin_action',
      role: 'admin',
      data: JSON.stringify({
        userId: updatedUser.id,
        userName: updatedUser.name || updatedUser.email,
        action: enabled ? 'enable_tasks' : 'disable_tasks',
        previousStatus: !enabled,
        newStatus: enabled
      })
    });

    return NextResponse.json({
      success: true,
      message: `Tasks ${enabled ? 'enabled' : 'disabled'} for user successfully`,
      user: updatedUser
    })

  } catch (error) {
    console.error('Error updating user task status:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update user task status'
    }, { status: 500 })
  }
}

// GET: Fetch users with their task status for admin management
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'

    const skip = (page - 1) * limit

    // Build Supabase query
    let query = supabase
      .from('users')
      .select('id, name, email, referralCode, tasksEnabled, membershipStatus, membershipPlan, membershipStartDate, createdAt, tasksCompleted, balance, isActive', { count: 'exact' })
      .order('membershipStatus', { ascending: false })
      .order('createdAt', { ascending: false })
      .range(skip, skip + limit - 1);

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,referralCode.ilike.%${search}%`);
    }

    if (status === 'enabled') {
      query = query.eq('tasksEnabled', true);
    } else if (status === 'disabled') {
      query = query.eq('tasksEnabled', false);
    } else if (status === 'active') {
      query = query.eq('membershipStatus', 'ACTIVE');
    } else if (status === 'inactive') {
      query = query.eq('membershipStatus', 'INACTIVE');
    }

    const { data: users, error: usersError, count: totalCount } = await query;

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch users'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      filters: {
        search,
        status
      }
    })

  } catch (error) {
    console.error('Error fetching users for task management:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch users'
    }, { status: 500 })
  }
}