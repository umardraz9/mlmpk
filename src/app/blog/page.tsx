'use client';

import { useState, useEffect } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { getBlogPosts } from '@/lib/blog';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import BackToDashboard from '@/components/BackToDashboard';
import { useTheme } from '@/contexts/ThemeContext';
import {
  BookOpen,
  Calendar,
  Clock,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Search,
  Filter,
  Star,
  TrendingUp,
  Users,
  Tag,
  ArrowRight,
  ThumbsUp,
  Pencil,
  Plus,
  Globe,
  Award,
  Target,
  Lightbulb,
  Zap,
  Trophy,
  Image as ImageIcon,
  Video,
  PlayCircle,
  LayoutGrid,
  List,
  X
} from 'lucide-react';

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  _count?: { posts: number };
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
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
    name: string;
    slug: string;
    color: string;
  };
  tags: string[];
  publishedAt: Date;
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

export default function BlogPage() {
  const { isDark } = useTheme();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tagsCloud, setTagsCloud] = useState<{ id: string; name: string; slug: string; _count?: { posts: number } }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPostForComments, setSelectedPostForComments] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch blog posts from API
  useEffect(() => {
    fetchBlogPosts();
    // Still use mock categories for now
    const mockCategories: BlogCategory[] = [
      {
        id: '1',
        name: 'MLM Success Stories',
        slug: 'success-stories',
        description: 'Real success stories from our community',
        color: 'bg-green-100 text-green-800',
        postCount: 45,
        icon: '🏆'
      },
      {
        id: '2',
        name: 'Business Tips',
        slug: 'business-tips',
        description: 'Tips and strategies for growing your MLM business',
        color: 'bg-blue-100 text-blue-800',
        postCount: 67,
        icon: '💡'
      },
      {
        id: '3',
        name: 'Product Reviews',
        slug: 'product-reviews',
        description: 'Honest reviews of our latest products',
        color: 'bg-purple-100 text-purple-800',
        postCount: 89,
        icon: '⭐'
      },
      {
        id: '4',
        name: 'Training Guides',
        slug: 'training-guides',
        description: 'Step-by-step guides for new members',
        color: 'bg-orange-100 text-orange-800',
        postCount: 34,
        icon: '📚'
      },
      {
        id: '5',
        name: 'Market Updates',
        slug: 'market-updates',
        description: 'Latest trends and market analysis',
        color: 'bg-red-100 text-red-800',
        postCount: 23,
        icon: '📈'
      }
    ];

    const mockPosts: BlogPost[] = [
      {
        id: '1',
        title: 'How I Earned PKR 50,000 in My First Month with MLM-Pak',
        slug: 'first-month-success-story',
        excerpt: 'Join me as I share my incredible journey from joining MLM-Pak to earning my first major commission. Learn the strategies that worked for me and how you can replicate this success.',
        featuredImage: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
        author: {
          id: '1',
          name: 'Ahmed Khan',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
          bio: 'Diamond Level MLM-Pak member and business mentor',
          verified: true,
          level: 5
        },
        category: {
          name: 'MLM Success Stories',
          slug: 'success-stories',
          color: 'bg-green-100 text-green-800'
        },
        tags: ['success', 'earning', 'beginner', 'motivation'],
        publishedAt: new Date('2024-01-30T10:00:00'),
        readTime: 8,
        views: 2456,
        likes: 189,
        comments: 34,
        bookmarks: 67,
        isLiked: false,
        isBookmarked: false,
        featured: true,
        type: 'success-story'
      },
      {
        id: '2',
        title: 'Top 10 Marketing Strategies for MLM Success in Pakistan',
        slug: 'top-marketing-strategies-pakistan',
        excerpt: 'Discover the most effective marketing strategies specifically tailored for the Pakistani market. From social media to local networking, learn what really works.',
        featuredImage: 'https://images.unsplash.com/photo-1553484771-371a605b060b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
        author: {
          id: '2',
          name: 'Fatima Ali',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b647?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
          bio: 'Marketing expert and Gold Level member',
          verified: true,
          level: 4
        },
        category: {
          name: 'Business Tips',
          slug: 'business-tips',
          color: 'bg-blue-100 text-blue-800'
        },
        tags: ['marketing', 'strategy', 'pakistan', 'social-media'],
        publishedAt: new Date('2024-01-29T14:30:00'),
        readTime: 12,
        views: 1834,
        likes: 156,
        comments: 34,
        bookmarks: 45,
        isLiked: true,
        isBookmarked: false,
        featured: false,
        type: 'guide'
      },
      {
        id: '3',
        title: 'Product Review: Premium Electronics Collection 2024',
        slug: 'electronics-collection-review-2024',
        excerpt: 'An in-depth review of our latest electronics collection. See why these products are flying off the shelves and how they can boost your sales.',
        featuredImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
        author: {
          id: '3',
          name: 'Hassan Malik',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
          bio: 'Tech enthusiast and product reviewer',
          verified: false,
          level: 3
        },
        category: {
          name: 'Product Reviews',
          slug: 'product-reviews',
          color: 'bg-purple-100 text-purple-800'
        },
        tags: ['review', 'electronics', '2024', 'quality'],
        publishedAt: new Date('2024-01-28T09:15:00'),
        readTime: 6,
        views: 1567,
        likes: 98,
        comments: 19,
        bookmarks: 32,
        isLiked: false,
        isBookmarked: true,
        featured: false,
        type: 'article'
      },
      {
        id: '4',
        title: 'Building Your Dream Team: A Complete Guide to MLM Recruitment',
        slug: 'mlm-recruitment-guide',
        excerpt: 'Learn the art and science of building a successful MLM team. From finding the right people to training them effectively, this guide covers it all.',
        featuredImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
        author: {
          id: '4',
          name: 'Sara Ahmed',
          avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
          bio: 'Team building expert and Platinum member',
          verified: true,
          level: 6
        },
        category: {
          name: 'Training Guides',
          slug: 'training-guides',
          color: 'bg-orange-100 text-orange-800'
        },
        tags: ['recruitment', 'team-building', 'training', 'leadership'],
        publishedAt: new Date('2024-01-27T16:45:00'),
        readTime: 15,
        views: 2109,
        likes: 234,
        comments: 45,
        bookmarks: 89,
        isLiked: false,
        isBookmarked: false,
        featured: true,
        type: 'guide'
      },
      {
        id: '5',
        title: 'Market Trends 2024: What to Expect in Pakistani E-commerce',
        slug: 'pakistan-ecommerce-trends-2024',
        excerpt: 'Stay ahead of the curve with our comprehensive analysis of emerging trends in Pakistani e-commerce and how they affect your MLM business.',
        featuredImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
        author: {
          id: '5',
          name: 'Ali Raza',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
          bio: 'Market analyst and business strategist',
          verified: true,
          level: 4
        },
        category: {
          name: 'Market Updates',
          slug: 'market-updates',
          color: 'bg-red-100 text-red-800'
        },
        tags: ['trends', 'ecommerce', 'pakistan', '2024'],
        publishedAt: new Date('2024-01-26T11:20:00'),
        readTime: 10,
        views: 1345,
        likes: 87,
        comments: 16,
        bookmarks: 25,
        isLiked: false,
        isBookmarked: false,
        featured: false,
        type: 'article'
      }
    ];

    setCategories(mockCategories);
    // Don't set mock posts anymore, they will come from API
  }, []);

  // Fetch blog posts from API
  const fetchBlogPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/blog/posts?status=PUBLISHED');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch posts');
      }

      // Transform the API data to match our BlogPost interface
      const transformedPosts = data.posts.map((post: any) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || post.content?.substring(0, 200) + '...',
        featuredImage: post.featuredImage || 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        author: {
          id: post.author?.id || post.authorId,
          name: post.author?.name || 'Admin',
          avatar: post.author?.image || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
          bio: post.author?.bio || 'MCNmart Admin',
          verified: true,
          level: 5
        },
        category: {
          name: post.category?.name || 'Business',
          slug: post.category?.slug || 'business',
          color: post.category?.color || 'bg-blue-100 text-blue-800'
        },
        tags: post.tags?.map((tag: any) => tag.name) || [],
        publishedAt: new Date(post.publishedAt || post.createdAt),
        readTime: Math.ceil((post.content?.length || 0) / 200),
        views: post.views || 0,
        likes: post.likes || 0,
        comments: post.comments || 0,
        bookmarks: post.bookmarks || 0,
        isLiked: false,
        isBookmarked: false,
        featured: post.featured || false,
        type: post.type || 'article'
      }));

      setPosts(transformedPosts);
    } catch (err: any) {
      console.error('Error fetching blog posts:', err);
      setError(err.message);
      // Fallback to mock data if API fails
      const mockPosts: BlogPost[] = [
        {
          id: '1',
          title: 'How I Earned PKR 50,000 in My First Month with MLM-Pak',
          slug: 'first-month-success-story',
          excerpt: 'Join me as I share my incredible journey from joining MLM-Pak to earning my first major commission. Learn the strategies that worked for me and how you can replicate this success.',
          featuredImage: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
          author: {
            id: '1',
            name: 'Ahmed Khan',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
            bio: 'Diamond Level MLM-Pak member and business mentor',
            verified: true,
            level: 5
          },
          category: {
            name: 'MLM Success Stories',
            slug: 'success-stories',
            color: 'bg-green-100 text-green-800'
          },
          tags: ['success', 'earning', 'beginner', 'motivation'],
          publishedAt: new Date('2024-01-30T10:00:00'),
          readTime: 8,
          views: 2456,
          likes: 189,
          comments: 34,
          bookmarks: 67,
          isLiked: false,
          isBookmarked: false,
          featured: true,
          type: 'success-story'
        },
        {
          id: '2',
          title: 'Top 10 Marketing Strategies for MLM Success in Pakistan',
          slug: 'top-marketing-strategies-pakistan',
          excerpt: 'Discover the most effective marketing strategies specifically tailored for the Pakistani market. From social media to local networking, learn what really works.',
          featuredImage: 'https://images.unsplash.com/photo-1553484771-371a605b060b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
          author: {
            id: '2',
            name: 'Fatima Ali',
            avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b647?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
            bio: 'Marketing expert and Gold Level member',
            verified: true,
            level: 4
          },
          category: {
            name: 'Business Tips',
            slug: 'business-tips',
            color: 'bg-blue-100 text-blue-800'
          },
          tags: ['marketing', 'strategy', 'pakistan', 'social-media'],
          publishedAt: new Date('2024-01-29T14:30:00'),
          readTime: 12,
          views: 1834,
          likes: 156,
          comments: 34,
          bookmarks: 45,
          isLiked: true,
          isBookmarked: false,
          featured: false,
          type: 'guide'
        },
        {
          id: '3',
          title: 'Product Review: Premium Electronics Collection 2024',
          slug: 'electronics-collection-review-2024',
          excerpt: 'An in-depth review of our latest electronics collection. See why these products are flying off the shelves and how they can boost your sales.',
          featuredImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
          author: {
            id: '3',
            name: 'Hassan Malik',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
            bio: 'Tech enthusiast and product reviewer',
            verified: false,
            level: 3
          },
          category: {
            name: 'Product Reviews',
            slug: 'product-reviews',
            color: 'bg-purple-100 text-purple-800'
          },
          tags: ['review', 'electronics', '2024', 'quality'],
          publishedAt: new Date('2024-01-28T09:15:00'),
          readTime: 6,
          views: 1567,
          likes: 98,
          comments: 19,
          bookmarks: 32,
          isLiked: false,
          isBookmarked: true,
          featured: false,
          type: 'article'
        },
        {
          id: '4',
          title: 'Building Your Dream Team: A Complete Guide to MLM Recruitment',
          slug: 'mlm-recruitment-guide',
          excerpt: 'Learn the art and science of building a successful MLM team. From finding the right people to training them effectively, this guide covers it all.',
          featuredImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
          author: {
            id: '4',
            name: 'Sara Ahmed',
            avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
            bio: 'Team building expert and Platinum member',
            verified: true,
            level: 6
          },
          category: {
            name: 'Training Guides',
            slug: 'training-guides',
            color: 'bg-orange-100 text-orange-800'
          },
          tags: ['recruitment', 'team-building', 'training', 'leadership'],
          publishedAt: new Date('2024-01-27T16:45:00'),
          readTime: 15,
          views: 2109,
          likes: 234,
          comments: 45,
          bookmarks: 89,
          isLiked: false,
          isBookmarked: false,
          featured: true,
          type: 'guide'
        },
        {
          id: '5',
          title: 'Market Trends 2024: What to Expect in Pakistani E-commerce',
          slug: 'pakistan-ecommerce-trends-2024',
          excerpt: 'Stay ahead of the curve with our comprehensive analysis of emerging trends in Pakistani e-commerce and how they affect your MLM business.',
          featuredImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
          author: {
            id: '5',
            name: 'Ali Raza',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
            bio: 'Market analyst and business strategist',
            verified: true,
            level: 4
          },
          category: {
            name: 'Market Updates',
            slug: 'market-updates',
            color: 'bg-red-100 text-red-800'
          },
          tags: ['trends', 'ecommerce', 'pakistan', '2024'],
          publishedAt: new Date('2024-01-26T11:20:00'),
          readTime: 10,
          views: 1345,
          likes: 87,
          comments: 16,
          bookmarks: 25,
          isLiked: false,
          isBookmarked: false,
          featured: false,
          type: 'article'
        }
      ];
      setPosts(mockPosts);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1
          }
        : post
    ));
  };

  const handleBookmark = (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, isBookmarked: !post.isBookmarked }
        : post
    ));
  };

  const handleViewComments = (postId: string) => {
    setSelectedPostForComments(postId);
    setShowCommentModal(true);
  };

  const handleAddComment = (postId: string) => {
    if (!newComment.trim()) return;
    
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, comments: post.comments + 1 }
        : post
    ));
    setNewComment('');
  };

  const mockComments = [
    {
      id: '1',
      content: 'This is absolutely amazing! I just joined MLM-Pak last week and your story is so inspiring. Can you share more about how you approached your first prospects?',
      author: {
        name: 'Ali Hassan',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'
      },
      timestamp: '2 hours ago',
      likes: 12
    },
    {
      id: '2',
      content: 'Wow! PKR 50,000 in just one month? That\'s incredible. I\'ve been struggling to make my first PKR 5,000. What was your biggest challenge in the beginning?',
      author: {
        name: 'Fatima Sheikh',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'
      },
      timestamp: '4 hours ago',
      likes: 8
    },
    {
      id: '3',
      content: 'This gives me so much hope! I\'m also a university student and was worried about balancing studies with MLM. How did you manage your time?',
      author: {
        name: 'Ahmed Ali',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'
      },
      timestamp: '6 hours ago',
      likes: 15
    }
  ];

  const getSelectedPost = () => {
    return posts.find(post => post.id === selectedPostForComments);
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !selectedCategory || post.category.slug === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.likes - a.likes;
      case 'trending':
        return b.views - a.views;
      case 'latest':
      default:
        return b.publishedAt.getTime() - a.publishedAt.getTime();
    }
  });

  const featuredPosts = sortedPosts.filter(post => post.featured);
  const regularPosts = sortedPosts.filter(post => !post.featured);

  const getPostIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'guide': return <BookOpen className="h-4 w-4" />;
      case 'success-story': return <Trophy className="h-4 w-4" />;
      default: return <Pencil className="h-4 w-4" />;
    }
  };

  return (
    <div className={`min-h-screen py-8 px-4 transition-colors ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-green-50 to-blue-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Back to Dashboard Button */}
        <BackToDashboard />
        
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className={`text-4xl font-bold mb-4 flex items-center justify-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <BookOpen className="h-10 w-10 text-green-600" />
            MLM-Pak Blog
          </h1>
          <p className={`text-xl max-w-2xl mx-auto ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Your hub for success stories, business tips, product reviews, and everything MLM. 
            Learn from experts and grow your business!
          </p>
        </div>

        {/* Blog Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className={`text-center p-4 ${isDark ? 'bg-gray-800 border-gray-700' : ''}`}>
            <div className="text-2xl font-bold text-green-600">{posts.length}</div>
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Posts</div>
          </Card>
          <Card className={`text-center p-4 ${isDark ? 'bg-gray-800 border-gray-700' : ''}`}>
            <div className="text-2xl font-bold text-blue-600">{categories.length}</div>
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Categories</div>
          </Card>
          <Card className={`text-center p-4 ${isDark ? 'bg-gray-800 border-gray-700' : ''}`}>
            <div className="text-2xl font-bold text-purple-600">
              {posts.reduce((sum, post) => sum + post.views, 0).toLocaleString()}
            </div>
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Views</div>
          </Card>
          <Card className={`text-center p-4 ${isDark ? 'bg-gray-800 border-gray-700' : ''}`}>
            <div className="text-2xl font-bold text-orange-600">
              {posts.reduce((sum, post) => sum + post.likes, 0).toLocaleString()}
            </div>
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Likes</div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className={`mb-8 p-6 ${isDark ? 'bg-gray-800 border-gray-700' : ''}`}>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search posts, tags, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'}`}
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              aria-label="Sort posts"
              className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
            >
              <option value="latest">Latest</option>
              <option value="popular">Most Popular</option>
              <option value="trending">Trending</option>
            </select>

            {/* View Mode */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 text-sm font-medium transition-colors focus:outline-none ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white shadow-md'
                    : isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <LayoutGrid className="h-4 w-4 mr-2 inline" />
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-sm font-medium transition-colors focus:outline-none border-l border-gray-300 ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white shadow-md'
                    : isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <List className="h-4 w-4 mr-2 inline" />
                List
              </button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Categories */}
            <Card className={isDark ? 'bg-gray-800 border-gray-700' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-purple-600" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={selectedCategory === null ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                  className="w-full justify-between"
                >
                  All Posts
                  <span className="text-xs">{posts.length}</span>
                </Button>
                {categories.map(category => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.slug ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedCategory(category.slug)}
                    className="w-full justify-between"
                  >
                    <span className="flex items-center gap-2">
                      {category.name}
                    </span>
                    <span className="text-xs">{category._count?.posts ?? ''}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Popular Tags */}
            <Card className={isDark ? 'bg-gray-800 border-gray-700' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-orange-600" />
                  Popular Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {tagsCloud.map(tag => (
                    <Badge key={tag.id} variant="secondary" className="cursor-pointer hover:bg-gray-200">
                      #{tag.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Authors */}
            <Card className={isDark ? 'bg-gray-800 border-gray-700' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Top Authors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {posts.slice(0, 3).map(post => (
                  <div key={post.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={post.author.avatar} />
                      <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-medium">{post.author.name}</p>
                        {post.author.verified && (
                          <Badge className="text-xs bg-blue-100 text-blue-800">✓</Badge>
                        )}
                      </div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Level {post.author.level}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Write Article CTA */}
            <Card className="bg-gradient-to-r from-green-100 to-blue-100 border-green-200">
              <CardContent className="p-6 text-center">
                <div className="mb-4">
                  <Pencil className="h-8 w-8 text-green-600 mx-auto" />
                </div>
                <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Share Your Story</h3>
                <p className={`text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Have a success story or valuable tip? Share it with the community!
                </p>
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Write Article
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Featured Posts */}
            {featuredPosts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Star className="h-6 w-6 text-yellow-500" />
                  <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Featured Posts</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {featuredPosts.map(post => (
                    <Card key={post.id} className={`overflow-hidden hover:shadow-lg transition-shadow duration-300 ${isDark ? 'bg-gray-800 border-gray-700' : ''}`}>
                      <div className="relative">
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-yellow-500 text-white">
                            <Star className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                        </div>
                        <div className="absolute top-3 right-3">
                          <Badge className={post.category.color}>
                            {post.category.name}
                          </Badge>
                        </div>
                      </div>
                      
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                          {getPostIcon(post.type)}
                          <span className={`text-sm capitalize ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{post.type.replace('-', ' ')}</span>
                        </div>
                        
                        <h3 className={`text-xl font-bold mb-3 line-clamp-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          <Link href={`/blog/${post.slug}`} className="hover:text-green-600">
                            {post.title}
                          </Link>
                        </h3>
                        
                        <p className={`mb-4 line-clamp-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{post.excerpt}</p>
                        
                        {/* Author */}
                        <div className="flex items-center gap-3 mb-4">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={post.author.avatar} />
                            <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-1">
                              <p className="text-sm font-medium">{post.author.name}</p>
                              {post.author.verified && (
                                <Badge className="text-xs bg-blue-100 text-blue-800">✓</Badge>
                              )}
                            </div>
                            <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              <span>{post.publishedAt.toLocaleDateString()}</span>
                              <span>•</span>
                              <span>{post.readTime} min read</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Stats and Actions */}
                        <div className="flex items-center justify-between">
                          <div className={`flex items-center gap-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            <span className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {post.views.toLocaleString()}
                            </span>
                            <button 
                              onClick={() => handleViewComments(post.id)}
                              className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                            >
                              <MessageCircle className="h-4 w-4" />
                              {post.comments}
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleLike(post.id)}
                              className={post.isLiked ? 'text-red-500' : ''}
                            >
                              <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} />
                              {post.likes}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleBookmark(post.id)}
                              className={post.isBookmarked ? 'text-blue-500' : ''}
                            >
                              <Bookmark className={`h-4 w-4 ${post.isBookmarked ? 'fill-current' : ''}`} />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Regular Posts */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Latest Posts</h2>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''} found
                </span>
              </div>
              
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {regularPosts.map(post => (
                    <Card key={post.id} className={`overflow-hidden hover:shadow-lg transition-shadow duration-300 ${isDark ? 'bg-gray-800 border-gray-700' : ''}`}>
                      <div className="relative">
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="w-full h-40 object-cover"
                        />
                        <div className="absolute top-3 right-3">
                          <Badge className={post.category.color}>
                            {post.category.name}
                          </Badge>
                        </div>
                      </div>
                      
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          {getPostIcon(post.type)}
                          <span className={`text-xs capitalize ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{post.type.replace('-', ' ')}</span>
                        </div>
                        
                        <h3 className={`text-lg font-bold mb-2 line-clamp-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          <Link href={`/blog/${post.slug}`} className="hover:text-green-600">
                            {post.title}
                          </Link>
                        </h3>
                        
                        <p className={`text-sm mb-3 line-clamp-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{post.excerpt}</p>
                        
                        {/* Author */}
                        <div className="flex items-center gap-2 mb-3">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={post.author.avatar} />
                            <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-1">
                              <p className={`text-xs font-medium ${isDark ? 'text-white' : ''}`}>{post.author.name}</p>
                              {post.author.verified && (
                                <Badge className="text-xs bg-blue-100 text-blue-800">✓</Badge>
                              )}
                            </div>
                            <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              <span>{post.publishedAt.toLocaleDateString()}</span>
                              <span>•</span>
                              <span>{post.readTime} min</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Stats and Actions */}
                        <div className="flex items-center justify-between">
                          <div className={`flex items-center gap-3 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {post.views.toLocaleString()}
                            </span>
                            <button 
                              onClick={() => handleViewComments(post.id)}
                              className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                            >
                              <MessageCircle className="h-3 w-3" />
                              {post.comments}
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleLike(post.id)}
                              className={`p-1 h-6 ${post.isLiked ? 'text-red-500' : ''}`}
                            >
                              <Heart className={`h-3 w-3 ${post.isLiked ? 'fill-current' : ''}`} />
                            </Button>
                            <span className="text-xs">{post.likes}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleBookmark(post.id)}
                              className={`p-1 h-6 w-6 ml-2 ${post.isBookmarked ? 'text-blue-500' : ''}`}
                            >
                              <Bookmark className={`h-3 w-3 ${post.isBookmarked ? 'fill-current' : ''}`} />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {regularPosts.map(post => (
                    <Card key={post.id} className={`overflow-hidden hover:shadow-lg transition-shadow duration-300 ${isDark ? 'bg-gray-800 border-gray-700' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <img
                            src={post.featuredImage}
                            alt={post.title}
                            className="w-32 h-24 object-cover rounded-lg flex-shrink-0"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={post.category.color}>
                                {post.category.name}
                              </Badge>
                              {getPostIcon(post.type)}
                              <span className={`text-xs capitalize ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{post.type.replace('-', ' ')}</span>
                            </div>
                            
                            <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              <Link href={`/blog/${post.slug}`} className="hover:text-green-600">
                                {post.title}
                              </Link>
                            </h3>
                            
                            <p className={`text-sm mb-3 line-clamp-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{post.excerpt}</p>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={post.author.avatar} />
                                  <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex items-center gap-1">
                                  <p className={`text-xs font-medium ${isDark ? 'text-white' : ''}`}>{post.author.name}</p>
                                  {post.author.verified && (
                                    <Badge className="text-xs bg-blue-100 text-blue-800">✓</Badge>
                                  )}
                                </div>
                                <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  <span>•</span>
                                  <span>{post.publishedAt.toLocaleDateString()}</span>
                                  <span>•</span>
                                  <span>{post.readTime} min read</span>
                                </div>
                              </div>
                              
                              <div className={`flex items-center gap-3 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {post.views.toLocaleString()}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleLike(post.id)}
                                  className={`p-1 h-6 ${post.isLiked ? 'text-red-500' : ''}`}
                                >
                                  <Heart className={`h-3 w-3 ${post.isLiked ? 'fill-current' : ''}`} />
                                  {post.likes}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleBookmark(post.id)}
                                  className={`p-1 h-6 ${post.isBookmarked ? 'text-blue-500' : ''}`}
                                >
                                  <Bookmark className={`h-3 w-3 ${post.isBookmarked ? 'fill-current' : ''}`} />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              {filteredPosts.length === 0 && (
                <Card className="text-center py-12">
                  <CardContent>
                    <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts found</h3>
                    <p className="text-gray-600 mb-6">
                      {searchQuery ? 'Try adjusting your search terms' : 'No posts match your current filters'}
                    </p>
                    <Button onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory(null);
                    }}>
                      Clear Filters
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Newsletter Section */}
        <Card className="mt-12 bg-gradient-to-r from-green-100 to-blue-100 border-green-200">
          <CardContent className="p-8 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Never Miss an Update</h2>
              <p className="text-gray-700 mb-6">
                Subscribe to our newsletter and get the latest success stories, tips, and updates 
                delivered straight to your inbox.
              </p>
              <div className="flex gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <Button className="bg-green-600 hover:bg-green-700">
                  Subscribe
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-3">
                Join 2,500+ subscribers. No spam, unsubscribe at any time.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comment Modal */}
      {showCommentModal && selectedPostForComments && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Comments ({getSelectedPost()?.comments || 0})
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCommentModal(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-6">
              {/* Post Preview */}
              {getSelectedPost() && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {getSelectedPost()?.title}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {getSelectedPost()?.excerpt}
                  </p>
                </div>
              )}
              
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
                        onClick={() => handleAddComment(selectedPostForComments)}
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
                {mockComments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 p-4 bg-gray-50 rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.author.avatar} />
                      <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{comment.author.name}</span>
                        <span className="text-sm text-gray-500">{comment.timestamp}</span>
                      </div>
                      <p className="text-gray-700 mb-3">{comment.content}</p>
                      <div className="flex items-center gap-4">
                        <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600">
                          <ThumbsUp className="h-4 w-4" />
                          {comment.likes}
                        </button>
                        <button className="text-sm text-gray-500 hover:text-blue-600">
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Empty State */}
              {mockComments.length === 0 && (
                <div className="text-center py-8">
                  <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No comments yet</h3>
                  <p className="text-gray-600">Be the first to comment on this post!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 