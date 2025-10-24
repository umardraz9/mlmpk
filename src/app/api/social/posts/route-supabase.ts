import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import path from 'path'
import fs from 'fs'
import { supabase } from '@/lib/supabase'

// GET - Fetch social posts with pagination using Supabase
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') || ''
    const search = searchParams.get('search') || ''
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Build query
    let query = supabase
      .from('social_posts')
      .select(`
        id,
        content,
        imageUrl,
        videoUrl,
        mediaUrls,
        type,
        status,
        createdAt,
        updatedAt,
        authorId,
        users!inner (
          id,
          name,
          username,
          image,
          totalPoints,
          createdAt
        )
      `, { count: 'exact' })
      .eq('status', 'ACTIVE')
      .order('createdAt', { ascending: false })
      .range(from, to)

    // Add type filter
    if (type && type !== 'all') {
      query = query.eq('type', type)
    }

    // Add search filter
    if (search) {
      query = query.ilike('content', `%${search}%`)
    }

    const { data: posts, error, count } = await query

    if (error) {
      console.error('Error fetching posts:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch posts',
        details: error.message 
      }, { status: 500 })
    }

    // Get likes, comments, shares counts for each post
    const postIds = posts?.map(p => p.id) || []
    
    const [likesData, commentsData, sharesData, userLikes, totalMembers] = await Promise.all([
      supabase.from('social_likes').select('postId', { count: 'exact', head: false }).in('postId', postIds),
      supabase.from('social_comments').select('postId', { count: 'exact', head: false }).in('postId', postIds),
      supabase.from('social_shares').select('postId', { count: 'exact', head: false }).in('postIds', postIds),
      supabase.from('social_likes').select('postId').eq('userId', session.user.id).in('postId', postIds),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('isActive', true)
    ])

    // Count engagement per post
    const likesCount: Record<string, number> = {}
    const commentsCount: Record<string, number> = {}
    const sharesCount: Record<string, number> = {}
    const likedPosts = new Set(userLikes.data?.map(l => l.postId) || [])

    likesData.data?.forEach(l => {
      likesCount[l.postId] = (likesCount[l.postId] || 0) + 1
    })
    commentsData.data?.forEach(c => {
      commentsCount[c.postId] = (commentsCount[c.postId] || 0) + 1
    })
    sharesData.data?.forEach(s => {
      sharesCount[s.postId] = (sharesCount[s.postId] || 0) + 1
    })

    // Format posts
    const formattedPosts = (posts || []).map((post: any) => {
      let mediaUrls: string[] = []
      try {
        if (post.mediaUrls) {
          mediaUrls = typeof post.mediaUrls === 'string' ? JSON.parse(post.mediaUrls) : post.mediaUrls
        }
      } catch (e) {
        console.error('Failed to parse mediaUrls:', e)
      }

      if (post.imageUrl && !mediaUrls.includes(post.imageUrl)) {
        mediaUrls.unshift(post.imageUrl)
      }
      if (post.videoUrl && !mediaUrls.includes(post.videoUrl)) {
        mediaUrls.unshift(post.videoUrl)
      }

      const author = post.users
      const likes = likesCount[post.id] || 0
      const comments = commentsCount[post.id] || 0
      const shares = sharesCount[post.id] || 0

      return {
        id: post.id,
        content: post.content,
        mediaUrls,
        imageUrl: post.imageUrl,
        videoUrl: post.videoUrl,
        type: post.type,
        author: {
          id: author.id,
          name: author.name || 'Anonymous',
          username: author.username || `@user${author.id.slice(-4)}`,
          avatar: author.image || '/api/placeholder/50/50',
          level: Math.floor((author.totalPoints || 0) / 1000) + 1,
          verified: (author.totalPoints || 0) > 5000,
          joinedDate: author.createdAt
        },
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        likes,
        comments,
        shares,
        isLiked: likedPosts.has(post.id),
        recentLikes: [],
        recentComments: [],
        engagementScore: (likes * 2) + (comments * 3) + (shares * 5),
        isSaved: false,
        isPinned: false
      }
    })

    const totalLikes = formattedPosts.reduce((sum, post) => sum + post.likes, 0)
    const totalComments = formattedPosts.reduce((sum, post) => sum + post.comments, 0)

    return NextResponse.json({
      success: true,
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: page < Math.ceil((count || 0) / limit),
        hasPrev: page > 1
      },
      stats: {
        totalPosts: count || 0,
        totalLikes,
        totalComments,
        totalMembers: totalMembers.count || 0,
        avgEngagement: formattedPosts.length > 0
          ? Math.round((totalLikes + totalComments) / formattedPosts.length)
          : 0
      }
    })
  } catch (error) {
    console.error('Error fetching social posts:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch posts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST endpoint remains the same...
export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'POST endpoint temporarily unavailable - Prisma connection issue'
  }, { status: 503 })
}
