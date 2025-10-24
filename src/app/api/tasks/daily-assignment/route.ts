import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireSession } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession()
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 })
    }

    // Get user with membership plan
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, membershipPlan, membershipStatus, tasksEnabled, lastTaskCompletionDate, dailyTasksCompleted, earningsContinueUntil, membershipStartDate')
      .eq('id', session.user.id)
      .single();

    if (userError || !user) {
      console.error('User not found:', userError);
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Check if user has active membership
    if (user.membershipStatus !== 'ACTIVE') {
      return NextResponse.json({ 
        success: false, 
        error: 'Active membership required to receive daily tasks' 
      }, { status: 403 })
    }

    // Check if tasks are enabled for user (admin control)
    if (!user.tasksEnabled) {
      return NextResponse.json({ 
        success: false, 
        error: 'Tasks are disabled for your account. Please contact admin.' 
      }, { status: 403 })
    }

    // Get membership plan details
    const { data: plan, error: planError } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('name', user.membershipPlan!)
      .single();

    if (planError || !plan) {
      console.error('Invalid membership plan:', planError);
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid membership plan' 
      }, { status: 400 });
    }

    // Check earning continuation (30 days without referrals, then requires ≥1 referral)
    const now = new Date()
    const membershipStart = user.membershipStartDate || now
    const thirtyDaysAfterStart = new Date(membershipStart)
    thirtyDaysAfterStart.setDate(thirtyDaysAfterStart.getDate() + 30)

    // If more than 30 days have passed since membership start
    if (now > thirtyDaysAfterStart) {
      // Check if user has referrals
      const { count: referralCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('sponsorId', user.id);

      if (referralCount === 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'Your 30-day earning period has expired. You need at least 1 referral to continue earning tasks.' 
        }, { status: 403 })
      }

      // Check advanced referral rules for earning continuation
      const { data: referrals } = await supabase
        .from('users')
        .select('membershipPlan')
        .eq('sponsorId', user.id);

      let canContinue = false
      const userPlan = user.membershipPlan

      if (userPlan === 'BASIC') {
        // Basic users can continue with any referral type
        canContinue = referrals.length > 0
      } else if (userPlan === 'STANDARD') {
        // Standard users need Standard or Premium referrals
        canContinue = referrals.some(r => r.membershipPlan === 'STANDARD' || r.membershipPlan === 'PREMIUM')
      } else if (userPlan === 'PREMIUM') {
        // Premium users need Premium referrals
        canContinue = referrals.some(r => r.membershipPlan === 'PREMIUM')
      }

      if (!canContinue) {
        return NextResponse.json({ 
          success: false, 
          error: 'Your earning continuation requires specific referral types. Please check your referral requirements.' 
        }, { status: 403 })
      }
    }

    // Check if user already has tasks for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data: existingTasks } = await supabase
      .from('task_completions')
      .select(`
        *,
        task:tasks(*)
      `)
      .eq('userId', user.id)
      .gte('createdAt', today.toISOString())
      .lt('createdAt', tomorrow.toISOString());

    // If user already has 5 tasks for today, return existing tasks
    const tasksPerDay = 5 // Always 5 tasks per day
    if ((existingTasks || []).length >= tasksPerDay) {
      const perTaskReward = Math.round(plan.dailyTaskEarning / tasksPerDay)
      
      return NextResponse.json({ 
        success: true, 
        message: 'Daily tasks already assigned',
        tasks: (existingTasks || []).map((tc: any) => ({
          id: tc.task.id,
          completionId: tc.id,
          title: tc.task.title,
          description: tc.task.description,
          type: tc.task.type,
          reward: perTaskReward,
          status: tc.status,
          progress: tc.progress,
          completedAt: tc.completedAt,
          articleUrl: tc.task.articleUrl,
          minDuration: tc.task.minDuration,
          instructions: tc.task.instructions
        }))
      })
    }

    // Calculate per-task reward (Daily earning ÷ 5)
    const perTaskReward = Math.round(plan.dailyTaskEarning / tasksPerDay)

    // Get available active tasks
    const { data: availableTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', 'ACTIVE')
      .in('type', ['DAILY', 'SIMPLE', 'BASIC', 'CONTENT_ENGAGEMENT', 'VIDEO_WATCH'])
      .order('createdAt', { ascending: false })
      .limit(tasksPerDay);

    const tasksList = availableTasks || [];

    // If no tasks available, create default task templates
    if (tasksList.length === 0) {
      const defaultTasks = [
        {
          title: 'Daily Check-in Task',
          description: 'Complete your daily check-in to earn rewards',
          type: 'DAILY',
          category: 'ENGAGEMENT',
          instructions: 'Click the Complete Task button to finish this daily check-in task.'
        },
        {
          title: 'Platform Engagement Task',
          description: 'Engage with the platform to earn rewards',
          type: 'SIMPLE',
          category: 'ENGAGEMENT', 
          instructions: 'Complete this simple engagement task by clicking the Complete button.'
        },
        {
          title: 'Community Activity Task',
          description: 'Participate in community activities',
          type: 'BASIC',
          category: 'COMMUNITY',
          instructions: 'Show your community spirit by completing this basic task.'
        },
        {
          title: 'Learning Task',
          description: 'Learn something new today',
          type: 'BASIC',
          category: 'EDUCATION',
          instructions: 'Expand your knowledge by completing this learning task.'
        },
        {
          title: 'Achievement Task',
          description: 'Unlock your daily achievement',
          type: 'DAILY',
          category: 'ACHIEVEMENT',
          instructions: 'Claim your daily achievement by completing this task.'
        }
      ]

      // Create default tasks
      for (const taskData of defaultTasks) {
        const { data: task } = await supabase
          .from('tasks')
          .insert({
            ...taskData,
            difficulty: 'EASY',
            reward: perTaskReward,
            status: 'ACTIVE',
            icon: '⚡',
            color: '#10b981'
          })
          .select()
          .single();
        if (task) tasksList.push(task);
      }
    }

    // Assign 5 tasks to user
    const taskAssignments = []
    for (let i = 0; i < tasksPerDay; i++) {
      const task = tasksList[i % tasksList.length] // Cycle through available tasks
      
      const { data: taskCompletion } = await supabase
        .from('task_completions')
        .insert({
          userId: user.id,
          taskId: task.id,
          status: 'PENDING',
          progress: 0,
          reward: perTaskReward
        })
        .select()
        .single();

      taskAssignments.push({
        id: task.id,
        completionId: taskCompletion.id,
        title: task.title,
        description: task.description,
        type: task.type,
        reward: perTaskReward,
        status: 'PENDING',
        progress: 0,
        completedAt: null,
        articleUrl: task.articleUrl,
        minDuration: task.minDuration,
        instructions: task.instructions
      })
    }

    return NextResponse.json({
      success: true,
      message: `${tasksPerDay} daily tasks assigned successfully!`,
      tasks: taskAssignments,
      totalReward: perTaskReward * tasksPerDay,
      membershipPlan: plan.displayName,
      perTaskReward
    })

  } catch (error) {
    console.error('Error assigning daily tasks:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to assign daily tasks' 
    }, { status: 500 })
  }
}

// GET: Check daily task status
export async function GET(request: NextRequest) {
  try {
    const session = await requireSession()
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 })
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, membershipPlan, membershipStatus, tasksEnabled, membershipStartDate')
      .eq('id', session.user.id)
      .single();

    if (userError || !user) {
      console.error('User not found:', userError);
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    let plan = null;
    if (user.membershipPlan) {
      const { data } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('name', user.membershipPlan)
        .single();
      plan = data;
    }

    // Get today's tasks
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data: todaysTasks } = await supabase
      .from('task_completions')
      .select(`
        *,
        task:tasks(*)
      `)
      .eq('userId', user.id)
      .gte('createdAt', today.toISOString())
      .lt('createdAt', tomorrow.toISOString())
      .order('createdAt', { ascending: true });

    const tasksPerDay = 5
    const tasksArray = todaysTasks || [];
    const completedTasks = tasksArray.filter((tc: any) => tc.status === 'COMPLETED').length
    const pendingTasks = tasksArray.filter((tc: any) => tc.status === 'PENDING').length
    const perTaskReward = plan ? Math.round(plan.dailyTaskEarning / tasksPerDay) : 0

    // Calculate active days
    const membershipStart = user.membershipStartDate || new Date()
    const now = new Date()
    const activeDays = Math.floor((now.getTime() - membershipStart.getTime()) / (1000 * 60 * 60 * 24)) + 1

    // Check earning continuation
    let canEarn = true
    let earningMessage = ''

    if (user.membershipStatus !== 'ACTIVE') {
      canEarn = false
      earningMessage = 'Active membership required'
    } else if (!user.tasksEnabled) {
      canEarn = false
      earningMessage = 'Tasks disabled by admin'
    } else {
      const thirtyDaysAfterStart = new Date(membershipStart)
      thirtyDaysAfterStart.setDate(thirtyDaysAfterStart.getDate() + 30)
      
      if (now > thirtyDaysAfterStart) {
        const { count: referralCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('sponsorId', user.id);
        
        if (referralCount === 0) {
          canEarn = false
          earningMessage = '30-day period expired. Need ≥1 referral to continue.'
        }
      }
    }

    return NextResponse.json({
      success: true,
      status: {
        canEarnToday: canEarn,
        hasTasksAssigned: tasksArray.length > 0,
        completedTasks,
        pendingTasks,
        totalTasksToday: tasksArray.length,
        dailyEarningAmount: plan?.dailyTaskEarning || 0,
        perTaskReward,
        membershipPlan: user.membershipPlan,
        membershipStatus: user.membershipStatus,
        activeDays,
        earningMessage
      },
      tasks: tasksArray.map((tc: any) => ({
        id: tc.task.id,
        completionId: tc.id,
        title: tc.task.title,
        description: tc.task.description,
        type: tc.task.type,
        reward: perTaskReward,
        status: tc.status,
        progress: tc.progress,
        completedAt: tc.completedAt,
        articleUrl: tc.task.articleUrl,
        minDuration: tc.task.minDuration,
        instructions: tc.task.instructions
      }))
    })

  } catch (error) {
    console.error('Error fetching daily task status:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch task status' 
    }, { status: 500 })
  }
}