import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'
import path from 'path'
import fs from 'fs'

// Demo social posts data for fallback
const demoPosts = [
  {
    id: '1',
    content: '🎉 Welcome to MLM-Pak Social! Share your journey and connect with our amazing community. #MLMSuccess',
    type: 'general',
    mediaUrls: [],
    author: {
      id: 'user-1',
      name: 'Test User',
      username: '@testuser',
      avatar: '/api/placeholder/50/50',
      level: 1,
      verified: false,
      joinedDate: new Date().toISOString()
    },
    likes: 1,
    comments: 0,
    shares: 0,
    createdAt: new Date().toISOString(),
    status: 'ACTIVE'
  }
]

// GET - Fetch social posts with pagination and enhanced features
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

    // Build Supabase query
    const from = (page - 1) * limit
    const to = from + limit - 1

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

    // Add filters
    if (type && type !== 'all') {
      query = query.eq('type', type)
    }
    if (search) {
      query = query.ilike('content', `%${search}%`)
    }

    const { data: postsData, error: postsError, count: total } = await query

    if (postsError) {
      console.error('Error fetching posts:', postsError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch posts'
      }, { status: 500 })
    }

    const posts = postsData || []
    const postIds = posts.map(p => p.id)
    
    // Get engagement counts
    const [likesData, commentsData, sharesData, userLikes, membersCount] = await Promise.all([
      supabase.from('social_likes').select('postId').in('postId', postIds),
      supabase.from('social_comments').select('postId').in('postId', postIds),
      supabase.from('social_shares').select('postId').in('postId', postIds),
      supabase.from('social_likes').select('postId').eq('userId', session.user.id).in('postId', postIds),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('isActive', true)
    ])

    const likesCount: Record<string, number> = {}
    const commentsCount: Record<string, number> = {}
    const sharesCount: Record<string, number> = {}
    const likedPosts = new Set((userLikes.data || []).map(l => l.postId))

    ;(likesData.data || []).forEach((l: any) => {
      likesCount[l.postId] = (likesCount[l.postId] || 0) + 1
    })
    ;(commentsData.data || []).forEach((c: any) => {
      commentsCount[c.postId] = (commentsCount[c.postId] || 0) + 1
    })
    ;(sharesData.data || []).forEach((s: any) => {
      sharesCount[s.postId] = (sharesCount[s.postId] || 0) + 1
    })

    const totalMembers = membersCount.count || 0

    // Format posts with comprehensive data
    const formattedPosts = posts.map((post: any) => {
      // Parse mediaUrls from JSON string
      let mediaUrls: string[] = []
      try {
        if (post.mediaUrls) {
          mediaUrls = typeof post.mediaUrls === 'string' ? JSON.parse(post.mediaUrls) : post.mediaUrls
        }
      } catch (e) {
        console.error('Failed to parse mediaUrls:', e)
      }

      // Add individual media fields for backwards compatibility
      if (post.imageUrl && !mediaUrls.includes(post.imageUrl)) {
        mediaUrls.unshift(post.imageUrl)
      }
      if (post.videoUrl && !mediaUrls.includes(post.videoUrl)) {
        mediaUrls.unshift(post.videoUrl)
      }

      const author = post.users || {}
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

    // Calculate total engagement for stats
    const totalLikes = formattedPosts.reduce((sum, post) => sum + post.likes, 0)
    const totalComments = formattedPosts.reduce((sum, post) => sum + post.comments, 0)

    return NextResponse.json({
      success: true,
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      stats: {
        totalPosts: total,
        totalLikes,
        totalComments,
        totalMembers,
        avgEngagement: formattedPosts.length > 0
          ? Math.round((totalLikes + totalComments) / formattedPosts.length)
          : 0
      }
    })
  } catch (error) {
    console.error('Error fetching social posts:', error)

    // Ensure we always return JSON, never an Error object
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch posts',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch posts'
    }, { status: 500 })
  }
}

// POST - Create new social post
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    console.log('[SOCIAL POST] Session check:', { hasSession: !!session, userId: session?.user?.id })

    if (!session?.user?.id) {
      console.error('[SOCIAL POST] No session or user ID found')
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - Please log in to create posts'
      }, { status: 401 })
    }

    // Parse request
    const contentType = request.headers.get('content-type') || ''
    let content: string
    let type: string = 'general'
    let uploadedMediaUrls: string[] = []

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      content = formData.get('content') as string
      type = (formData.get('type') as string) || 'general'

      // Extract files
      const files: File[] = []
      let fileIndex = 0
      while (true) {
        const file = formData.get(`media-${fileIndex}`) as File | null
        if (file && file instanceof File) {
          files.push(file)
          fileIndex++
        } else {
          break
        }
      }

      // Upload files
      if (files.length > 0) {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads')
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true })
        }

        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          const fileName = `${Date.now()}-${i}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
          const filePath = path.join(uploadDir, fileName)
          const bytes = await file.arrayBuffer()
          const buffer = Buffer.from(bytes)
          fs.writeFileSync(filePath, buffer)
          uploadedMediaUrls.push(`/uploads/${fileName}`)
        }
      }
    } else {
      const body = await request.json()
      content = body.content
      type = body.type || 'general'
    }

    // Validation
    if (!content || content.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Content is required'
      }, { status: 400 })
    }

    if (content.length > 2000) {
      return NextResponse.json({
        success: false,
        error: 'Content too long (max 2000 characters)'
      }, { status: 400 })
    }

    const validTypes = ['general', 'achievement', 'tip', 'announcement', 'success', 'reel']
    if (!validTypes.includes(type)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid post type'
      }, { status: 400 })
    }

    if (type === 'reel' && uploadedMediaUrls.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Reel requires a video file'
      }, { status: 400 })
    }

    // Generate unique ID for post
    const postId = `post-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`

    console.log('[SOCIAL POST] Creating post:', {
      id: postId,
      content: content.substring(0, 50),
      type,
      authorId: session.user.id
    })

    // Save post to Supabase
    const { data: newPost, error: insertError } = await supabase
      .from('social_posts')
      .insert({
        id: postId,
        content: content.trim(),
        type,
        authorId: session.user.id,
        status: 'ACTIVE',
        mediaUrls: uploadedMediaUrls.length > 0 ? JSON.stringify(uploadedMediaUrls) : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('[SOCIAL POST] Supabase insert error:', insertError)
      return NextResponse.json({
        success: false,
        error: 'Failed to save post to database',
        details: insertError.message
      }, { status: 500 })
    }

    if (!newPost) {
      console.error('[SOCIAL POST] No post returned from insert')
      return NextResponse.json({
        success: false,
        error: 'Failed to create post'
      }, { status: 500 })
    }

    console.log('[SOCIAL POST] Post saved to database successfully:', postId)

    // Format response with author data
    const formattedPost = {
      id: newPost.id,
      content: newPost.content,
      type: newPost.type,
      mediaUrls: newPost.mediaUrls ? JSON.parse(newPost.mediaUrls) : [],
      author: {
        id: session.user.id,
        name: session.user.name || 'User',
        username: `@user${session.user.id.slice(-4)}`,
        avatar: session.user.image || '/api/placeholder/50/50',
        level: 1,
        verified: false,
        joinedDate: new Date().toISOString()
      },
      createdAt: newPost.createdAt,
      updatedAt: newPost.updatedAt,
      likes: 0,
      comments: 0,
      shares: 0,
      isLiked: false,
      recentLikes: [],
      recentComments: [],
      engagementScore: 0,
      status: newPost.status
    }

    return NextResponse.json({
      success: true,
      post: formattedPost,
      message: 'Post created successfully!'
    })
  } catch (error) {
    console.error('Error creating social post:', error)

    // Ensure we always return JSON, never an Error object
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create post',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create post'
    }, { status: 500 })
  }
}
