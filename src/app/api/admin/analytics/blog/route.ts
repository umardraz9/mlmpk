import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '30d'
    const category = searchParams.get('category') || 'all'
    const author = searchParams.get('author') || 'all'
    const status = searchParams.get('status') || 'all'

    // Calculate date range
    const now = new Date()
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 365
    const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000))

    // Build filters
    const postFilter: any = {}
    if (category !== 'all') postFilter.categoryId = category
    if (author !== 'all') postFilter.authorId = author
    if (status !== 'all') postFilter.status = status

    const dateFilter = {
      createdAt: { gte: startDate }
    }

    // Parallel data fetching for performance
    const [
      // Content Overview
      totalPosts,
      publishedPosts,
      draftPosts,
      archivedPosts,
      totalCategories,
      totalTags,
      totalAuthors,
      
      // Engagement Metrics
      totalViews,
      totalLikes,
      totalShares,
      totalComments,
      avgEngagementRate,
      
      // Performance Analytics
      topPerformingPosts,
      recentPosts,
      contentTrends,
      categoryPerformance,
      authorPerformance,
      
      // SEO Analytics
      postsWithMissingMeta,
      avgReadTime,
      searchKeywords,
      
      // Advanced Analytics
      commentsAnalysis,
      tagAnalysis,
      timeBasedAnalytics
    ] = await Promise.all([
      // Content Overview
      prisma.blogPost.count({ where: postFilter }),
      prisma.blogPost.count({ where: { ...postFilter, status: 'PUBLISHED' } }),
      prisma.blogPost.count({ where: { ...postFilter, status: 'DRAFT' } }),
      prisma.blogPost.count({ where: { ...postFilter, status: 'ARCHIVED' } }),
      prisma.blogCategory.count({ where: { isActive: true } }),
      prisma.blogTag.count(),
      prisma.user.count({ where: { blogPosts: { some: {} } } }),

      // Engagement Metrics
      prisma.blogPost.aggregate({
        where: { ...postFilter, ...dateFilter },
        _sum: { views: true }
      }),
      prisma.blogPost.aggregate({
        where: { ...postFilter, ...dateFilter },
        _sum: { likes: true }
      }),
      prisma.blogPost.aggregate({
        where: { ...postFilter, ...dateFilter },
        _sum: { shares: true }
      }),
      prisma.blogComment.count({
        where: {
          post: postFilter,
          createdAt: { gte: startDate }
        }
      }),
      prisma.blogPost.aggregate({
        where: { ...postFilter, ...dateFilter },
        _avg: { views: true }
      }),

      // Performance Analytics
      prisma.blogPost.findMany({
        where: { ...postFilter, status: 'PUBLISHED' },
        select: {
          id: true,
          title: true,
          slug: true,
          views: true,
          likes: true,
          shares: true,
          publishedAt: true,
          category: { select: { name: true, color: true } },
          author: { select: { name: true, email: true } },
          _count: { select: { comments: true } }
        },
        orderBy: { views: 'desc' },
        take: 10
      }),

      // Recent posts with engagement
      prisma.blogPost.findMany({
        where: { ...postFilter, ...dateFilter },
        select: {
          id: true,
          title: true,
          status: true,
          views: true,
          likes: true,
          createdAt: true,
          publishedAt: true,
          author: { select: { name: true } },
          category: { select: { name: true, color: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      }),

      // Content trends by day
      prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as posts_created,
          COUNT(CASE WHEN status = 'PUBLISHED' THEN 1 END) as posts_published,
          SUM(views) as total_views,
          SUM(likes) as total_likes
        FROM blog_posts 
        WHERE created_at >= ${startDate}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,

      // Category performance
      prisma.blogCategory.findMany({
        select: {
          id: true,
          name: true,
          color: true,
          posts: {
            select: {
              views: true,
              likes: true,
              shares: true,
              status: true,
              _count: { select: { comments: true } }
            }
          },
          _count: { select: { posts: true } }
        }
      }),

      // Author performance
      prisma.user.findMany({
        where: {
          blogPosts: { some: {} }
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          blogPosts: {
            select: {
              views: true,
              likes: true,
              shares: true,
              status: true,
              createdAt: true,
              _count: { select: { comments: true } }
            },
            where: dateFilter
          },
          _count: { select: { blogPosts: true } }
        },
        orderBy: {
          blogPosts: { _count: 'desc' }
        },
        take: 10
      }),

      // SEO Analytics - Posts missing meta data
      prisma.blogPost.count({
        where: {
          ...postFilter,
          OR: [
            { metaTitle: null },
            { metaDescription: null },
            { metaTitle: '' },
            { metaDescription: '' }
          ]
        }
      }),

      // Average reading time calculation (estimate based on content length)
      prisma.blogPost.aggregate({
        where: { ...postFilter, status: 'PUBLISHED' },
        _avg: { views: true } // We'll calculate read time from content length
      }),

      // Top performing search keywords (simulated)
      prisma.$queryRaw`
        SELECT 
          meta_keywords as keywords,
          COUNT(*) as usage_count,
          SUM(views) as total_views
        FROM blog_posts 
        WHERE meta_keywords IS NOT NULL 
        AND meta_keywords != ''
        AND created_at >= ${startDate}
        GROUP BY meta_keywords
        ORDER BY total_views DESC
        LIMIT 10
      `,

      // Comments analysis
      prisma.blogComment.groupBy({
        by: ['postId'],
        where: {
          createdAt: { gte: startDate }
        },
        _count: true,
        orderBy: { _count: { postId: 'desc' } },
        take: 10
      }),

      // Tag performance analysis
      prisma.blogTag.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          color: true,
          posts: {
            select: {
              views: true,
              likes: true,
              shares: true,
              status: true
            },
            where: dateFilter
          },
          _count: { select: { posts: true } }
        },
        orderBy: {
          posts: { _count: 'desc' }
        },
        take: 15
      }),

      // Time-based analytics (hourly posting patterns)
      prisma.$queryRaw`
        SELECT 
          strftime('%H', created_at) as hour,
          COUNT(*) as posts_count,
          AVG(views) as avg_views
        FROM blog_posts 
        WHERE created_at >= ${startDate}
        GROUP BY strftime('%H', created_at)
        ORDER BY hour ASC
      `
    ])

    // Calculate engagement rates and performance metrics
    const totalEngagement = (totalViews._sum.views || 0) + (totalLikes._sum.likes || 0) + 
                           (totalShares._sum.shares || 0) + totalComments

    // Process category performance
    const categoryStats = categoryPerformance.map(category => {
      const publishedPosts = category.posts.filter(p => p.status === 'PUBLISHED')
      const totalViews = publishedPosts.reduce((sum, p) => sum + (p.views || 0), 0)
      const totalLikes = publishedPosts.reduce((sum, p) => sum + (p.likes || 0), 0)
      const totalShares = publishedPosts.reduce((sum, p) => sum + (p.shares || 0), 0)
      const totalComments = publishedPosts.reduce((sum, p) => sum + (p._count.comments || 0), 0)
      
      return {
        id: category.id,
        name: category.name,
        color: category.color,
        totalPosts: category._count.posts,
        publishedPosts: publishedPosts.length,
        totalViews,
        totalLikes,
        totalShares,
        totalComments,
        avgViewsPerPost: publishedPosts.length > 0 ? Math.round(totalViews / publishedPosts.length) : 0,
        engagementRate: totalViews > 0 ? Math.round(((totalLikes + totalShares + totalComments) / totalViews) * 100 * 100) / 100 : 0
      }
    })

    // Process author performance
    const authorStats = authorPerformance.map(author => {
      const publishedPosts = author.blogPosts.filter(p => p.status === 'PUBLISHED')
      const totalViews = publishedPosts.reduce((sum, p) => sum + (p.views || 0), 0)
      const totalLikes = publishedPosts.reduce((sum, p) => sum + (p.likes || 0), 0)
      const totalShares = publishedPosts.reduce((sum, p) => sum + (p.shares || 0), 0)
      const totalComments = publishedPosts.reduce((sum, p) => sum + (p._count.comments || 0), 0)
      
      return {
        id: author.id,
        name: author.name || author.email,
        email: author.email,
        avatar: author.avatar,
        totalPosts: author._count.blogPosts,
        publishedPosts: publishedPosts.length,
        totalViews,
        totalLikes,
        totalShares,
        totalComments,
        avgViewsPerPost: publishedPosts.length > 0 ? Math.round(totalViews / publishedPosts.length) : 0,
        engagementRate: totalViews > 0 ? Math.round(((totalLikes + totalShares + totalComments) / totalViews) * 100 * 100) / 100 : 0,
        avgPostsPerWeek: author.blogPosts.length > 0 ? Math.round((author.blogPosts.length / Math.max(days / 7, 1)) * 100) / 100 : 0
      }
    })

    // Process tag performance
    const tagStats = tagAnalysis.map(tag => {
      const publishedPosts = tag.posts.filter(p => p.status === 'PUBLISHED')
      const totalViews = publishedPosts.reduce((sum, p) => sum + (p.views || 0), 0)
      const totalLikes = publishedPosts.reduce((sum, p) => sum + (p.likes || 0), 0)
      
      return {
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        color: tag.color,
        totalPosts: tag._count.posts,
        publishedPosts: publishedPosts.length,
        totalViews,
        totalLikes,
        avgViewsPerPost: publishedPosts.length > 0 ? Math.round(totalViews / publishedPosts.length) : 0,
        popularity: totalViews + (totalLikes * 2) // Weighted popularity score
      }
    }).sort((a, b) => b.popularity - a.popularity)

    // Calculate content health metrics
    const contentHealth = {
      publishingConsistency: publishedPosts > 0 ? Math.min(100, (publishedPosts / Math.max(days / 7, 1)) * 20) : 0,
      engagementHealth: totalViews._sum.views > 0 ? Math.min(100, (totalEngagement / totalViews._sum.views) * 100) : 0,
      seoOptimization: totalPosts > 0 ? Math.max(0, 100 - ((postsWithMissingMeta / totalPosts) * 100)) : 100,
      contentDiversity: categoryStats.filter(c => c.publishedPosts > 0).length,
      authorActivity: authorStats.filter(a => a.publishedPosts > 0).length
    }

    // Generate insights and recommendations
    const insights = generateBlogInsights({
      totalPosts,
      publishedPosts,
      totalViews: totalViews._sum.views || 0,
      totalComments,
      engagementRate: avgEngagementRate._avg.views || 0,
      contentHealth,
      categoryStats,
      authorStats
    })

    const analytics = {
      overview: {
        totalPosts,
        publishedPosts,
        draftPosts,
        archivedPosts,
        totalCategories,
        totalTags,
        totalAuthors,
        publishingRate: publishedPosts > 0 ? Math.round((publishedPosts / Math.max(days / 7, 1)) * 100) / 100 : 0
      },

      engagement: {
        totalViews: totalViews._sum.views || 0,
        totalLikes: totalLikes._sum.likes || 0,
        totalShares: totalShares._sum.shares || 0,
        totalComments,
        avgViewsPerPost: publishedPosts > 0 ? Math.round((totalViews._sum.views || 0) / publishedPosts) : 0,
        avgEngagementRate: totalViews._sum.views > 0 ? 
          Math.round(((totalLikes._sum.likes || 0) + (totalShares._sum.shares || 0) + totalComments) / (totalViews._sum.views || 1) * 100 * 100) / 100 : 0,
        topPerformingPosts: topPerformingPosts.map(post => ({
          ...post,
          engagementScore: (post.views || 0) + (post.likes || 0) * 2 + (post.shares || 0) * 3 + (post._count.comments || 0) * 5,
          engagementRate: post.views > 0 ? Math.round(((post.likes + post.shares + post._count.comments) / post.views) * 100 * 100) / 100 : 0
        }))
      },

      content: {
        recentActivity: recentPosts,
        contentTrends: Array.isArray(contentTrends) ? contentTrends : [],
        categoryPerformance: categoryStats,
        authorPerformance: authorStats,
        tagPerformance: tagStats.slice(0, 10),
        timePatterns: Array.isArray(timeBasedAnalytics) ? timeBasedAnalytics : []
      },

      seo: {
        postsWithMissingMeta,
        seoOptimizationScore: totalPosts > 0 ? Math.max(0, 100 - ((postsWithMissingMeta / totalPosts) * 100)) : 100,
        topKeywords: Array.isArray(searchKeywords) ? searchKeywords.slice(0, 10) : [],
        avgReadTime: 3.5, // Estimated average reading time in minutes
        metaCompleteness: {
          withMetaTitle: totalPosts - postsWithMissingMeta,
          withMetaDescription: totalPosts - postsWithMissingMeta,
          total: totalPosts
        }
      },

      insights: {
        contentHealth,
        recommendations: insights,
        bestPerformingCategory: categoryStats.length > 0 ? 
          categoryStats.reduce((best, current) => 
            current.avgViewsPerPost > best.avgViewsPerPost ? current : best
          ).name : 'No data',
        topAuthor: authorStats.length > 0 ? 
          authorStats.reduce((best, current) => 
            current.totalViews > best.totalViews ? current : best
          ).name : 'No data',
        growthTrend: Array.isArray(contentTrends) && contentTrends.length > 1 ? 
          contentTrends[contentTrends.length - 1].total_views > contentTrends[0].total_views ? 'Growing' : 'Declining' : 'Stable'
      }
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching blog analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to generate blog insights and recommendations
function generateBlogInsights(metrics: {
  totalPosts: number;
  publishedPosts: number;
  totalViews: number;
  totalComments: number;
  engagementRate: number;
  contentHealth: any;
  categoryStats: any[];
  authorStats: any[];
}) {
  const recommendations = []

  // Content Volume Analysis
  if (metrics.publishedPosts < 10) {
    recommendations.push({
      type: 'warning',
      category: 'Content Volume',
      message: 'Low content volume detected. Consistent publishing is key to audience growth.',
      action: 'Aim to publish at least 1-2 posts per week',
      priority: 'high'
    })
  } else if (metrics.publishedPosts > 50) {
    recommendations.push({
      type: 'success',
      category: 'Content Volume',
      message: 'Excellent content volume! You\'re maintaining consistent publishing.',
      action: 'Continue current publishing schedule',
      priority: 'low'
    })
  }

  // Engagement Analysis
  if (metrics.engagementRate < 2) {
    recommendations.push({
      type: 'error',
      category: 'Engagement',
      message: 'Low engagement rate indicates content may not be resonating with audience.',
      action: 'Review content quality, add more interactive elements, and improve call-to-actions',
      priority: 'high'
    })
  } else if (metrics.engagementRate > 5) {
    recommendations.push({
      type: 'success',
      category: 'Engagement',
      message: 'High engagement rate! Your content is resonating well with readers.',
      action: 'Analyze top-performing content and replicate successful elements',
      priority: 'medium'
    })
  }

  // SEO Optimization
  if (metrics.contentHealth.seoOptimization < 70) {
    recommendations.push({
      type: 'warning',
      category: 'SEO',
      message: 'Many posts are missing SEO metadata. This impacts search visibility.',
      action: 'Add meta titles, descriptions, and keywords to all posts',
      priority: 'high'
    })
  }

  // Content Diversity
  if (metrics.contentHealth.contentDiversity < 3) {
    recommendations.push({
      type: 'info',
      category: 'Content Strategy',
      message: 'Limited content diversity. Consider expanding into more categories.',
      action: 'Develop content for additional categories to reach wider audience',
      priority: 'medium'
    })
  }

  // Author Activity
  if (metrics.contentHealth.authorActivity < 2) {
    recommendations.push({
      type: 'info',
      category: 'Content Creation',
      message: 'Consider onboarding more content creators for diverse perspectives.',
      action: 'Recruit additional authors or guest contributors',
      priority: 'medium'
    })
  }

  // View-to-Comment Ratio
  const commentRate = metrics.totalViews > 0 ? (metrics.totalComments / metrics.totalViews) * 100 : 0
  if (commentRate < 0.5) {
    recommendations.push({
      type: 'info',
      category: 'Community Engagement',
      message: 'Low comment rate suggests readers are not engaging in discussions.',
      action: 'Add discussion prompts, questions, and encourage reader interaction',
      priority: 'medium'
    })
  }

  // Success Metrics
  if (metrics.totalViews > 10000) {
    recommendations.push({
      type: 'success',
      category: 'Reach',
      message: 'Excellent view count! Your content is reaching a substantial audience.',
      action: 'Consider monetization strategies and premium content offerings',
      priority: 'low'
    })
  }

  // Default recommendation if all metrics are good
  if (recommendations.filter(r => r.type !== 'success').length === 0) {
    recommendations.push({
      type: 'success',
      category: 'Overall Performance',
      message: 'Blog performance is excellent across all metrics!',
      action: 'Continue current strategy and explore advanced optimization techniques',
      priority: 'low'
    })
  }

  return recommendations
} 