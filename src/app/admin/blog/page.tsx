'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/hooks/useSession';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  PenTool, 
  Archive, 
  Trash2, 
  Eye, 
  Search,
  Filter,
  RefreshCw,
  Calendar,
  MessageSquare,
  User
} from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  status: string;
  publishedAt?: string;
  createdAt: string;
  views: number;
  likes: number;
  author: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
    color?: string;
  };
  _count: {
    comments: number;
  };
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  color?: string;
}

export default function AdminBlogPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Check admin authentication
  useEffect(() => {
    if (session && !session.user?.isAdmin) {
      router.push('/admin/login');
    }
  }, [session, router]);

  // Load blog posts and categories
  useEffect(() => {
    loadData();
  }, [currentPage, selectedCategory, selectedStatus, searchTerm]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load posts
      const postsParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(searchTerm && { search: searchTerm })
      });

      const [postsResponse, categoriesResponse] = await Promise.all([
        fetch(`/api/admin/blog/posts?${postsParams}`),
        fetch('/api/admin/blog/categories')
      ]);

      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        setPosts(postsData.posts || []);
        setTotalPages(postsData.pagination?.totalPages || 1);
      }

      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData || []);
      }
    } catch (error) {
      console.error('Error loading blog data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      const response = await fetch(`/api/admin/blog/posts/${postId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadData(); // Refresh the list
      } else {
        alert('Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('An error occurred while deleting the post');
    }
  };

  const handleSelectPost = (postId: string) => {
    setSelectedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPosts.length === posts.length) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(posts.map(post => post.id));
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedPosts.length === 0) {
      alert('Please select posts and an action');
      return;
    }

    const confirmMessage = bulkAction === 'delete' 
      ? `Are you sure you want to delete ${selectedPosts.length} posts?`
      : `Are you sure you want to change status of ${selectedPosts.length} posts to ${bulkAction}?`;

    if (!confirm(confirmMessage)) return;

    setLoading(true);
    try {
      const response = await fetch('/api/admin/blog/posts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: bulkAction,
          postIds: selectedPosts
        })
      });

      if (response.ok) {
        setSelectedPosts([]);
        setBulkAction('');
        setShowBulkActions(false);
        loadData(); // Refresh the list
        alert(`Bulk operation completed successfully!`);
      } else {
        const error = await response.json();
        alert(error.error || 'Bulk operation failed');
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      alert('An error occurred while performing the bulk action');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Show loading while session is being fetched
  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show access denied if user is not admin
  if (!session.user?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog Management</h1>
          <p className="text-gray-600">
            Create and manage blog posts, categories, and tags
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/blog/categories">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Categories
            </Button>
          </Link>
          <Link href="/admin/blog/tags">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Tags
            </Button>
          </Link>
          <Button 
            variant="outline"
            onClick={() => setShowBulkActions(!showBulkActions)}
            disabled={posts.length === 0}
          >
            {showBulkActions ? 'Hide' : 'Show'} Bulk Actions
          </Button>
          <Link href="/admin/blog/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={loadData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedPosts.length === posts.length && posts.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">
                    {selectedPosts.length === posts.length && posts.length > 0 ? 'Deselect All' : 'Select All'}
                  </span>
                </div>
                
                {selectedPosts.length > 0 && (
                  <span className="text-sm text-blue-600">
                    {selectedPosts.length} post{selectedPosts.length !== 1 ? 's' : ''} selected
                  </span>
                )}
              </div>

              {selectedPosts.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Select value={bulkAction} onValueChange={setBulkAction}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Choose action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLISHED">Publish</SelectItem>
                      <SelectItem value="DRAFT">Set to Draft</SelectItem>
                      <SelectItem value="SCHEDULED">Schedule</SelectItem>
                      <SelectItem value="ARCHIVED">Archive</SelectItem>
                      <SelectItem value="delete">Delete</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    onClick={handleBulkAction}
                    disabled={!bulkAction || loading}
                    variant={bulkAction === 'delete' ? 'destructive' : 'default'}
                  >
                    {loading ? 'Processing...' : 'Apply'}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Blog Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Blog Posts</CardTitle>
          <CardDescription>
            {posts.length} {posts.length === 1 ? 'post' : 'posts'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading posts...</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto flex max-w-md flex-col items-center justify-center">
                <PenTool className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">No blog posts found</p>
                <p className="text-gray-600 mb-4">
                  Get started by creating your first blog post.
                </p>
                <Link href="/admin/blog/new">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Post
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  {showBulkActions && (
                    <div className="flex-shrink-0 mr-4">
                      <input
                        type="checkbox"
                        checked={selectedPosts.includes(post.id)}
                        onChange={() => handleSelectPost(post.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Link 
                        href={`/admin/blog/${post.id}`}
                        className="text-lg font-medium text-gray-900 hover:text-blue-600 hover:underline"
                      >
                        {post.title}
                      </Link>
                      <Badge 
                        className={`${getStatusColor(post.status)} text-xs`}
                      >
                        {post.status}
                      </Badge>
                    </div>
                    
                    {post.excerpt && (
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {post.author.name}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(post.createdAt)}
                      </div>
                      <div className="flex items-center">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        {post._count.comments} comments
                      </div>
                      <Badge variant="outline" style={{ backgroundColor: post.category.color + '20', color: post.category.color }}>
                        {post.category.name}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Link href={`/blog/${post.slug}`} target="_blank">
                      <Button size="sm" variant="ghost">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link href={`/admin/blog/${post.id}`}>
                      <Button size="sm" variant="ghost">
                        <PenTool className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleDeletePost(post.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 