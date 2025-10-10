'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  CalendarIcon, 
  ClockIcon, 
  TagIcon, 
  ArrowLeftIcon, 
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Star,
  Users,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Gift,
  Award,
  Target,
  Globe,
  Smartphone,
  Facebook,
  Instagram,
  Twitter,
  ThumbsUp,
  X
} from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    bio: string;
    verified: boolean;
    level: number;
  };
  category: {
    id?: string;
    name: string;
    slug: string;
    color: string;
  };
  tags: { id: string; name: string; slug: string }[];
  publishedAt: string | Date;
  readTime: number;
  views: number;
  likes: number;
  comments: number;
  bookmarks: number;
  isLiked: boolean;
  isBookmarked: boolean;
  featured: boolean;
  type: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  author: {
    id: string;
    name: string;
    image?: string | null;
  };
  replies?: Comment[];
}

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [related, setRelated] = useState<BlogPost[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  useEffect(() => {
    const slug = params.slug as string;
    setLoading(true);
    fetch(`/api/blog/posts/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        setPost(data);
        // Load related articles by same category
        if (data?.category?.id) {
          fetch(`/api/blog/posts?status=PUBLISHED&category=${data.category.id}&limit=4`)
            .then(r => r.json())
            .then(payload => {
              const items = (payload?.posts || []).filter((p: any) => p.slug !== data.slug).map((p: any) => ({
                id: p.id,
                title: p.title,
                slug: p.slug,
                excerpt: p.excerpt || p.content?.substring(0, 160) + '...',
                featuredImage: p.featuredImage || 'https://images.unsplash.com/photo-1553484771-371a605b060b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                author: {
                  id: p.author?.id || p.authorId,
                  name: p.author?.name || 'Admin',
                  avatar: p.author?.image || 'https://ui-avatars.com/api/?name=Author',
                  bio: 'Content Creator',
                  verified: true,
                  level: 5,
                },
                category: {
                  id: p.category?.id,
                  name: p.category?.name || 'Uncategorized',
                  slug: p.category?.slug || 'uncategorized',
                  color: 'bg-blue-500',
                },
                tags: (p.tags || []).map((t: any) => ({ id: t.id, name: t.name, slug: t.slug })),
                publishedAt: p.publishedAt || p.createdAt,
                readTime: Math.ceil((p.content?.length || 0) / 1000),
                views: p.views || 0,
                likes: p.likes || 0,
                comments: p._count?.comments || 0,
                bookmarks: 0,
                isLiked: false,
                isBookmarked: false,
                featured: p.featured || false,
                type: p.type || 'article',
              }));
              setRelated(items);
            })
            .catch(() => {});
        }
        setLoading(false);
      })
      .catch(() => {
        setPost(null);
        setLoading(false);
      });
  }, [params.slug]);

  // Load comments when opening modal
  useEffect(() => {
    if (!showComments || !post) return;
    const load = async () => {
      try {
        setCommentsLoading(true);
        const res = await fetch(`/api/blog/posts/${post.slug}/comments`);
        if (res.ok) {
          const items = await res.json();
          setComments(items);
        }
      } finally {
        setCommentsLoading(false);
      }
    };
    load();
  }, [showComments, post]);

  const handleLike = async () => {
    if (!post) return;
    try {
      const action = post.isLiked ? 'unlike' : 'like';
      const res = await fetch(`/api/blog/posts/${post.slug}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        const data = await res.json();
        setPost({ ...post, isLiked: !post.isLiked, likes: data.likes ?? post.likes });
      } else {
        // Fallback to optimistic update
        setPost({ ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 });
      }
    } catch {
      setPost({ ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 });
    }
  };

  const handleBookmark = async () => {
    if (!post) return;
    try {
      const res = await fetch(`/api/blog/posts/${post.slug}/bookmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: post.isBookmarked ? 'remove' : 'add' })
      });
      if (res.status === 401) {
        alert('Please log in to save this post');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setPost({ ...post, isBookmarked: data.bookmarked ?? !post.isBookmarked, bookmarks: data.bookmarks ?? post.bookmarks });
      }
    } catch {
      setPost({ ...post, isBookmarked: !post.isBookmarked });
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title,
        text: post?.excerpt,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const formatDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
            <div className="h-12 bg-gray-300 rounded w-3/4 mb-4"></div>
            <div className="h-64 bg-gray-300 rounded mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-300 rounded w-full"></div>
              <div className="h-4 bg-gray-300 rounded w-5/6"></div>
              <div className="h-4 bg-gray-300 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Post Not Found</h1>
          <p className="text-gray-600 mb-8">The blog post you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/blog')}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Blog
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 px-4">
      {/* SEO Meta Tags */}
      <head>
        <title>{post.title} | MLM-Pak Blog</title>
        <meta name="description" content={post.excerpt} />
        <meta name="keywords" content={post.tags.map(tag => tag.name).join(', ')} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:image" content={post.featuredImage} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.excerpt} />
        <meta name="twitter:image" content={post.featuredImage} />
        <link rel="canonical" href={`https://mlm-pak.com/blog/${post.slug}`} />
      </head>

      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => router.push('/blog')}
            className="flex items-center gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Blog
          </Button>
      </div>
      
        {/* Article Header */}
        <article className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Featured Image */}
          <div className="relative h-64 md:h-96">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-4 left-4">
              <Badge className={post.category.color}>
                {post.category.name}
          </Badge>
            </div>
          </div>

          {/* Article Content */}
          <div className="p-6 md:p-8">
            {/* Title and Meta */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {post.title}
          </h1>
          
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" />
                {formatDate(post.publishedAt)}
            </div>
            <div className="flex items-center gap-1">
              <ClockIcon className="h-4 w-4" />
                  {post.readTime} min read
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {post.views.toLocaleString()} views
                </div>
            </div>
            
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map(tag => (
                  <Badge key={tag.id} variant="outline" className="text-xs">
                    #{tag.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Author Info */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg mb-8">
              <Avatar className="h-12 w-12">
                <AvatarImage src={post.author.avatar} />
                <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{post.author.name}</h3>
                  {post.author.verified && (
                    <Badge className="text-xs bg-blue-100 text-blue-800">✓ Verified</Badge>
                  )}
                  <Badge className="text-xs bg-yellow-100 text-yellow-800">
                    Level {post.author.level}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{post.author.bio}</p>
          </div>
        </div>
        
            {/* Article Content */}
            <div 
              className="prose prose-lg max-w-none mb-8"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Action Buttons */}
            <div className="flex items-center justify-between py-6 border-t border-gray-200">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={handleLike}
                  className={`flex items-center gap-2 ${post.isLiked ? 'text-red-500 border-red-500' : ''}`}
                >
                  <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} />
                  {post.likes}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowComments(true)}
                  className="flex items-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  {post.comments}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleBookmark}
                  className={`flex items-center gap-2 ${post.isBookmarked ? 'text-blue-500 border-blue-500' : ''}`}
                >
                  <Bookmark className={`h-4 w-4 ${post.isBookmarked ? 'fill-current' : ''}`} />
                </Button>
              </div>
              <Button onClick={handleShare} className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>

            {/* Social Media Sharing */}
            <div className="py-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Share this article</h3>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`, '_blank')}
                  className="flex items-center gap-2"
                >
                  <Facebook className="h-4 w-4" />
                  Facebook
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://twitter.com/intent/tweet?url=${window.location.href}&text=${post.title}`, '_blank')}
                  className="flex items-center gap-2"
                >
                  <Twitter className="h-4 w-4" />
                  Twitter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://wa.me/?text=${post.title} ${window.location.href}`, '_blank')}
                  className="flex items-center gap-2"
                >
                  <Smartphone className="h-4 w-4" />
                  WhatsApp
                </Button>
              </div>
            </div>
          </div>
        </article>

        {/* Related Articles */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {related.map(item => (
              <Link key={item.id} href={`/blog/${item.slug}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <img src={item.featuredImage} alt={item.title} className="w-full h-32 object-cover" />
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.excerpt}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {related.length === 0 && (
              <p className="text-gray-600">No related articles found.</p>
            )}
          </div>
        </div>
      </div>

      {/* Comments Modal */}
      {showComments && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Comments ({post.comments})
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComments(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-6">
              {/* Add Comment Form */}
              <div className="mb-6">
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80" />
                    <AvatarFallback>You</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <textarea
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                      rows={3}
                    />
                    <div className="flex justify-end gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setNewComment('')}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={addComment}
                        disabled={!newComment.trim()}
                      >
                        Post Comment
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Comments List */}
              <div className="space-y-4">
                {commentsLoading && <p className="text-gray-500">Loading comments…</p>}
                {!commentsLoading && comments.length === 0 && (
                  <p className="text-gray-500">No comments yet. Be the first to comment!</p>
                )}
                {comments.map(c => (
                  <div key={c.id} className="p-3 border rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={c.author?.image || ''} />
                        <AvatarFallback>{c.author?.name?.charAt(0) || '?'}</AvatarFallback>
                      </Avatar>
                      <div className="text-sm">
                        <p className="font-medium">{c.author?.name || 'User'}</p>
                        <p className="text-gray-500 text-xs">{new Date(c.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <p className="text-gray-800 whitespace-pre-wrap">{c.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 