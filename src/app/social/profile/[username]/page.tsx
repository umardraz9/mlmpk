import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import ProfessionalProfile from './ProfessionalProfile'
import { notFound } from 'next/navigation'

export default async function ProfileByUsernamePage({ params }: { params: { username: string } }) {
  const { username } = params
  const session = await getServerSession(authOptions)
  const viewerId = session?.user?.id || null

  // Decode the username (remove @ symbol if present)
  const cleanUsername = username.startsWith('@') ? username.slice(1) : username

  const user = await prisma.user.findFirst({
    where: { OR: [ { username: cleanUsername }, { id: cleanUsername } ] },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      bio: true,
      coverImage: true,
      createdAt: true,
      location: true,
      website: true,
      membershipPlan: true,
    }
  })

  if (!user) {
    notFound()
  }

  const [
    followersCount,
    followingCount,
    likesCount,
    viewerLike,
    posts,
    photos,
    videos,
    friends
  ] = await Promise.all([
    prisma.socialFollow.count({ where: { followingId: user.id } }),
    prisma.socialFollow.count({ where: { followerId: user.id } }),
    prisma.profileLike.count({ where: { targetUserId: user.id } }),
    viewerId
      ? prisma.profileLike.findUnique({ where: { userId_targetUserId: { userId: viewerId, targetUserId: user.id } }, select: { id: true } })
      : Promise.resolve(null),
    // Fetch all posts (not just reels)
    prisma.socialPost.findMany({
      where: { authorId: user.id, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        imageUrl: true,
        videoUrl: true,
        mediaUrls: true,
        type: true,
        createdAt: true,
        likes: {
          select: {
            userId: true,
          }
        },
        comments: {
          select: {
            id: true,
            content: true,
            user: {
              select: {
                name: true,
                image: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 3
        },
        author: {
          select: {
            name: true,
            image: true,
            username: true,
          }
        }
      }
    }),
    // Fetch photos (posts with images)
    prisma.socialPost.findMany({
      where: {
        authorId: user.id,
        status: 'ACTIVE',
        imageUrl: { not: null }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        imageUrl: true,
        videoUrl: true,
        mediaUrls: true,
        type: true,
        createdAt: true,
        likes: {
          select: {
            userId: true,
          }
        },
        comments: {
          select: {
            id: true,
            content: true,
            user: {
              select: {
                name: true,
                image: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 3
        },
        author: {
          select: {
            name: true,
            image: true,
            username: true,
          }
        }
      }
    }),
    // Fetch videos (posts with videos)
    prisma.socialPost.findMany({
      where: {
        authorId: user.id,
        status: 'ACTIVE',
        videoUrl: { not: null }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        imageUrl: true,
        videoUrl: true,
        coverUrl: true,
        mediaUrls: true,
        type: true,
        createdAt: true,
        likes: {
          select: {
            userId: true,
          }
        },
        comments: {
          select: {
            id: true,
            content: true,
            user: {
              select: {
                name: true,
                image: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 3
        },
        author: {
          select: {
            name: true,
            image: true,
            username: true,
          }
        }
      }
    }),
    // Fetch friends (mutual follows)
    prisma.socialFollow.findMany({
      where: {
        followerId: user.id,
        following: {
          followersRelation: {
            some: {
              followerId: user.id
            }
          }
        }
      },
      select: {
        id: true,
        following: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            createdAt: true,
          }
        }
      },
      take: 12
    })
  ])

  // Transform friends data
  const transformedFriends = friends.map(f => f.following)

  return (
    <ProfessionalProfile
      user={user}
      followersCount={followersCount}
      followingCount={followingCount}
      likesCount={likesCount}
      viewerLike={viewerLike}
      posts={posts}
      friends={transformedFriends}
      photos={photos}
      videos={videos}
      viewerId={viewerId}
      isOwnProfile={viewerId === user.id}
    />
  )
}
