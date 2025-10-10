import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { authOptions } from '@/lib/auth'
// @ts-expect-error - NextAuth getServerSession import issue
import { getServerSession } from 'next-auth'
import fs from 'fs'
import path from 'path'

// GET - Fetch social posts with pagination and enhanced features
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') || ''
    const userId = searchParams.get('userId') || ''
    const search = searchParams.get('search') || ''
    const skip = (page - 1) * limit

    // Build where clause with advanced filtering
    const where: any = {
      status: 'ACTIVE'
    }

    if (type && type !== 'all') {
      where.type = type
    }

    if (userId) {
      where.authorId = userId
    }

    if (search) {
      where.content = {
        contains: search,
        mode: 'insensitive'
      }
    }

    // Fetch posts with comprehensive data
    const [posts, total, stats] = await Promise.all([
      prisma.socialPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { createdAt: 'desc' }
        ],
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true, // Use 'image' field instead of 'avatar'
              totalPoints: true,
              isActive: true,
              createdAt: true
            }
          },
          likes: {
            select: {
              userId: true,
              createdAt: true
            }
          },
          comments: {
            select: {
              id: true,
              content: true,
              userId: true,
              createdAt: true,
              user: {
                select: {
                  name: true,
                  username: true,
                  image: true, // Use 'image' field instead of 'avatar'
                  totalPoints: true
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 3 // Show latest 3 comments
          },
          shares: {
            select: {
              id: true,
              platform: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              likes: true,
              comments: true,
              shares: true
            }
          }
        }
      }),
      prisma.socialPost.count({ where }),
      // Get overall stats
      prisma.socialPost.aggregate({
        where: { status: 'ACTIVE' },
        _count: { id: true }
      })
    ])

    // Compute per-user favorites for saved/pinned/muted states
    const postIds = posts.map(p => p.id)
    let savedSet = new Set<string>()
    let pinnedSet = new Set<string>()
    let mutedSet = new Set<string>()
    if (postIds.length > 0) {
      const favs = await prisma.favorite.findMany({
        where: {
          userId: session.user.id,
          targetId: { in: postIds },
          type: { in: ['POST', 'POST_PIN', 'POST_MUTE'] }
        },
        select: { type: true, targetId: true }
      })
      savedSet = new Set(favs.filter(f => f.type === 'POST').map(f => f.targetId))
      pinnedSet = new Set(favs.filter(f => f.type === 'POST_PIN').map(f => f.targetId))
      mutedSet = new Set(favs.filter(f => f.type === 'POST_MUTE').map(f => f.targetId))
    }

    // Format posts with comprehensive data
    const formattedPostsRaw = posts.map(post => ({
      id: post.id,
      content: post.content,
      imageUrl: post.imageUrl,
      videoUrl: post.videoUrl,
      coverUrl: (post as any).coverUrl || null,
      reelMeta: (() => {
        const raw = (post as any).reelMeta as unknown as string | null | undefined
        if (!raw) return null as any
        try {
          const obj = JSON.parse(raw)
          return obj
        } catch {
          return null as any
        }
      })(),
      mediaUrls: (() => {
        const raw = (post as any).mediaUrls as unknown as string | null | undefined
        if (!raw) return [] as string[]
        try {
          const arr = JSON.parse(raw)
          return Array.isArray(arr) ? (arr as string[]) : []
        } catch {
          return [] as string[]
        }
      })(),
      type: post.type,
      author: {
        id: post.author.id,
        name: post.author.name || 'Anonymous',
        username: post.author.username || `@user${post.author.id.slice(-4)}`,
        avatar: post.author.image || '/api/placeholder/50/50',
        level: Math.floor((post.author.totalPoints || 0) / 1000) + 1,
        verified: (post.author.totalPoints || 0) > 5000,
        joinedDate: post.author.createdAt
      },
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      likes: post._count.likes,
      comments: post._count.comments,
      shares: post._count.shares,
      isLiked: post.likes.some(like => like.userId === session.user.id),
      recentLikes: post.likes.slice(0, 5).map(like => ({
        userId: like.userId,
        createdAt: like.createdAt
      })),
      recentComments: post.comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        user: {
          id: comment.userId,
          name: comment.user.name || 'Anonymous',
          username: comment.user.username || `@user${comment.userId.slice(-4)}`,
          avatar: comment.user.image || '/api/placeholder/30/30',
          level: Math.floor((comment.user.totalPoints || 0) / 1000) + 1,
          verified: (comment.user.totalPoints || 0) > 5000
        }
      })),
      engagementScore: post._count.likes * 2 + post._count.comments * 3 + post._count.shares * 5,
      // User-specific flags
      isSaved: savedSet.has(post.id),
      isPinned: pinnedSet.has(post.id)
    }))

    // Exclude muted posts for this user
    const formattedPosts = formattedPostsRaw.filter(p => !mutedSet.has(p.id))

    // Sort pinned posts first, then by createdAt desc (already desc in base query)
    formattedPosts.sort((a: any, b: any) => {
      const pa = a.isPinned ? 1 : 0
      const pb = b.isPinned ? 1 : 0
      if (pa !== pb) return pb - pa
      // Fallback preserve order (already desc); keep stable
      return 0
    })

    // Calculate total engagement for stats
    const totalLikes = formattedPosts.reduce((sum, post) => sum + post.likes, 0)
    const totalComments = formattedPosts.reduce((sum, post) => sum + post.comments, 0)

    // Get total members count (handle case where no users exist)
    let totalMembers = 0;
    try {
      totalMembers = await prisma.user.count({
        where: { isActive: true }
      });
    } catch (error) {
      console.warn('Error counting users:', error);
    }

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
        totalPosts: stats._count.id || 0,
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

// POST - Create new social post with enhanced features
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    // Check if request is multipart form data (for file uploads) or JSON
    const contentType = request.headers.get('content-type') || ''

    let content: string
    let type: string = 'general'
    let mediaFiles: File[] = []
    let mediaUrls: string[] = []
    let uploadedMediaUrls: string[] = []  // Declare at top level for transaction access

    if (contentType.includes('multipart/form-data')) {
      // Handle file uploads
      const formData = await request.formData()
      content = formData.get('content') as string
      type = (formData.get('type') as string) || 'general'

      // Extract uploaded files - handle multiple files with pattern media-{index}
      const files: File[] = [];
      let fileIndex = 0;
      while (true) {
        const file = formData.get(`media-${fileIndex}`) as File | null;
        if (file && file instanceof File) {
          files.push(file);
          fileIndex++;
        } else {
          break;
        }
      }

      console.log(`Found ${files.length} media files for upload`);
      console.log('File names:', files.map(f => f.name));
      console.log('File sizes:', files.map(f => `${f.name}: ${f.size} bytes`));

      // Upload files before transaction
      if (files.length > 0) {
        mediaFiles = files;
        console.log(`Processing ${mediaFiles.length} files:`, mediaFiles.map(f => f.name));

        // Save files to uploads directory
        const uploadDir = path.join(process.cwd(), 'public', 'uploads')

        // Ensure uploads directory exists
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true })
        }

        for (let i = 0; i < mediaFiles.length; i++) {
          const file = mediaFiles[i]
          const fileName = `${Date.now()}-${i}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
          const filePath = path.join(uploadDir, fileName)

          console.log(`Saving file ${i + 1}/${mediaFiles.length}: ${fileName}`)

          // Convert File to Buffer and save
          const bytes = await file.arrayBuffer()
          const buffer = Buffer.from(bytes)
          fs.writeFileSync(filePath, buffer)

          const fullUrl = `/uploads/${fileName}`
          uploadedMediaUrls.push(fullUrl)
          console.log(`File saved: ${fullUrl}`)
        }

        console.log(`All ${uploadedMediaUrls.length} files uploaded successfully`)
      }
    } else {
      // Handle JSON data
      const body = await request.json()
      content = body.content
      type = body.type || 'general'
      mediaUrls = body.mediaUrls || []
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

    // Validate post type
    const validTypes = ['general', 'achievement', 'tip', 'announcement', 'success', 'reel']
    if (!validTypes.includes(type)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid post type'
      }, { status: 400 })
    }

    // Reel validation: must include a video
    if (type === 'reel' && mediaFiles.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Reel requires a video file'
      }, { status: 400 })
    }

    // Check rate limiting (max 10 posts per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentPosts = await prisma.socialPost.count({
      where: {
        authorId: session.user.id,
        createdAt: {
          gte: oneHourAgo
        }
      }
    })

    if (recentPosts >= 10) {
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded. Maximum 10 posts per hour.'
      }, { status: 429 })
    }

    // Create the post with transaction for consistency
    const result = await prisma.$transaction(async (tx) => {
      // Handle file uploads if any (already uploaded above)
      const allMediaUrls = [...uploadedMediaUrls, ...mediaUrls]

      console.log(`Creating post with ${allMediaUrls.length} media URLs:`, allMediaUrls)
      console.log(`Media URLs array:`, JSON.stringify(allMediaUrls))

      // Create the post
      const createData = {
        content: content.trim(),
        type,
        authorId: session.user.id,
        ...(allMediaUrls.length > 0 && { mediaUrls: JSON.stringify(allMediaUrls) })
      }

      console.log(`Storing media URLs in database:`, JSON.stringify(allMediaUrls))

      const post = await tx.socialPost.create({
        data: createData,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true, // Use 'image' field instead of 'avatar'
              totalPoints: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              likes: true,
              comments: true,
              shares: true,
            }
          }
        }
      })

      console.log(`Post created successfully with ID: ${post.id}`)
      console.log(`Post mediaUrls from database:`, post.mediaUrls)

      // Award points for posting
      const pointsToAward = type === 'achievement' ? 50 : type === 'tip' ? 25 : 10
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          totalPoints: {
            increment: pointsToAward
          }
        }
      })

      // Create achievement if it's an achievement post
      if (type === 'achievement') {
        await tx.userAchievement.create({
          data: {
            userId: session.user.id,
            title: 'Shared Achievement',
            description: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
            icon: '🏆',
            type: 'social',
            points: pointsToAward,
            isPublic: true
          }
        })
      }

      return post
    })

    // Format response with comprehensive data
    const formattedPost = {
      id: result.id,
      content: result.content,
      imageUrl: result.imageUrl,
      videoUrl: result.videoUrl,
      coverUrl: (result as any).coverUrl || null,
      reelMeta: (() => {
        const raw = (result as any).reelMeta as unknown as string | null | undefined
        if (!raw) return null as any
        try {
          const obj = JSON.parse(raw)
          return obj
        } catch {
          return null as any
        }
      })(),
      mediaUrls: (() => {
        const raw = (result as any).mediaUrls as unknown as string | null | undefined
        if (!raw) return [] as string[]
        try {
          const arr = JSON.parse(raw)
          return Array.isArray(arr) ? (arr as string[]) : []
        } catch {
          return [] as string[]
        }
      })(),
      type: result.type,
      author: {
        id: result.author.id,
        name: result.author.name || 'Anonymous',
        username: result.author.username || `@user${result.author.id.slice(-4)}`,
        avatar: result.author.image || '/api/placeholder/50/50',
        level: Math.floor((result.author.totalPoints || 0) / 1000) + 1,
        verified: (result.author.totalPoints || 0) > 5000,
        joinedDate: result.author.createdAt
      },
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      likes: result._count.likes,
      comments: result._count.comments,
      shares: result._count.shares,
      isLiked: false,
      recentLikes: [],
      recentComments: [],
      engagementScore: 0
    }

    console.log(`Formatted post mediaUrls:`, formattedPost.mediaUrls)

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
