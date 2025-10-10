'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Eye, Upload, X, Plus, FileText, Edit, MessageSquare, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import TipTapEditor from '@/components/editor/TipTapEditor';

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  color?: string;
}

interface BlogTag {
  id: string;
  name: string;
  slug: string;
  color?: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: string;
  status: string;
  scheduledAt: string | null;
  categoryId: string;
  tags: BlogTag[];
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function EditBlogPostPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showSEO, setShowSEO] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  // Track the post's current slug (may change if title changes)
  const [currentSlug, setCurrentSlug] = useState<string>(slug);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Helpers for content stats and Quill config
  const stripHtml = (html: string) =>
    (html || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    featuredImage: '',
    status: 'DRAFT',
    scheduledAt: '',
    categoryId: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: ''
  });

  // Derived content stats (after formData is defined)
  const contentPlain = stripHtml(formData.content);
  const wordCount = contentPlain ? contentPlain.split(/\s+/).filter(Boolean).length : 0;
  const charCount = contentPlain.length;

  // Load post data, categories and tags
  useEffect(() => {
    const loadData = async () => {
      try {
        const [postRes, categoriesRes, tagsRes] = await Promise.all([
          fetch(`/api/admin/blog/posts/${slug}`),
          fetch('/api/admin/blog/categories'),
          fetch('/api/admin/blog/tags')
        ]);
        
        if (postRes.ok) {
          const post: BlogPost = await postRes.json();
          setFormData({
            title: post.title,
            content: post.content,
            excerpt: post.excerpt || '',
            featuredImage: post.featuredImage || '',
            status: post.status,
            scheduledAt: post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : '',
            categoryId: post.categoryId,
            metaTitle: post.metaTitle || '',
            metaDescription: post.metaDescription || '',
            metaKeywords: post.metaKeywords || ''
          });
          setImagePreview(post.featuredImage || '');
          setSelectedTags(post.tags.map(tag => tag.id));
          setCurrentSlug(post.slug);
        } else {
          alert('Post not found');
          router.push('/admin/blog');
        }
        
        if (categoriesRes.ok) {
          setCategories(await categoriesRes.json());
        }
        
        if (tagsRes.ok) {
          setTags(await tagsRes.json());
        }
      } catch (error) {
        console.error('Error loading data:', error);
        alert('Failed to load post data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [slug, router]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        setFormData(prev => ({
          ...prev,
          featuredImage: result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmit = async (status: string) => {
    if (!formData.title || !formData.content || !formData.categoryId) {
      alert('Please fill in all required fields');
      return;
    }

    if (status === 'SCHEDULED' && !formData.scheduledAt) {
      alert('Please select a publish date for scheduled posts');
      return;
    }

    setIsLoading(true);
    
    try {
      const submitData = {
        ...formData,
        status,
        tags: selectedTags
      };

      if (status === 'SCHEDULED') {
        submitData.scheduledAt = new Date(formData.scheduledAt).toISOString();
      }

      const response = await fetch(`/api/admin/blog/posts/${currentSlug}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        const updated = await response.json();
        // If slug changed due to title update, navigate to the new edit route
        if (updated.slug && updated.slug !== currentSlug) {
          setCurrentSlug(updated.slug);
          router.replace(`/admin/blog/edit/${updated.slug}`);
        }
        alert('Post updated successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update post');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      alert('An error occurred while updating the post');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/admin/blog/posts/${slug}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Post deleted successfully!');
        router.push('/admin/blog');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('An error occurred while deleting the post');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewPost = () => {
    window.open(`/blog/${currentSlug}`,'_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Link href="/admin/blog">
                <Button variant="ghost" size="sm" className="hover:bg-blue-50 hover:text-blue-600 transition-colors">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Posts
                </Button>
              </Link>
              <div className="hidden sm:block w-px h-8 bg-gray-200"></div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">Edit Blog Post</h1>
                <p className="text-gray-600">Update your blog post content and settings</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                onClick={handleViewPost}
                className="border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Post
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleSubmit('DRAFT')}
                disabled={isLoading}
                className="border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              <Button 
                onClick={() => handleSubmit('PUBLISHED')}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
              >
                <Save className="w-4 h-4 mr-2" />
                {formData.status === 'PUBLISHED' ? 'Update' : 'Publish'}
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
                className="ml-2"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Post Content */}
            <Card className="shadow-xl border-0 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50">
              <CardHeader className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                  <FileText className="w-6 h-6" />
                  Post Content
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Edit your blog post content
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-8 p-8">
                {/* Title Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">T</span>
                    </div>
                    <Label htmlFor="title" className="text-lg font-bold text-gray-800">
                      Post Title *
                    </Label>
                  </div>
                  <div className="relative">
                    <Input
                      id="title"
                      placeholder="✨ Enter an engaging and compelling post title..."
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="h-28 text-2xl border-2 border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl bg-white/70 backdrop-blur-sm pl-6 pr-12 font-medium placeholder:text-gray-400 transition-all duration-300"
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{formData.title.length}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                    Aim for 50-60 characters for optimal SEO
                  </p>
                </div>
                
                {/* Content Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <Edit className="w-4 h-4 text-white" />
                    </div>
                    <Label htmlFor="content" className="text-lg font-bold text-gray-800">
                      Post Content *
                    </Label>
                  </div>
                  <div className="relative">
                    <div className="border-2 border-indigo-200 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/20 rounded-xl bg-white/70 backdrop-blur-sm overflow-hidden">
                      <TipTapEditor
                        value={formData.content}
                        onChange={(value) => handleInputChange('content', value)}
                        placeholder="📝 Write your amazing blog post content here..."
                        className="min-h-[24rem]"
                      />
                    </div>
                    <div className="absolute bottom-4 right-4 flex items-center gap-2">
                      <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-600 border border-gray-200">
                        {charCount} characters
                      </div>
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                        {wordCount} words
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span>Minimum: 300 words</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span>Optimal: 1,000-2,000 words</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      <span>Reading time: ~{Math.ceil(wordCount / 200)} min</span>
                    </div>
                  </div>
                </div>
                
                {/* Excerpt Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                    <Label htmlFor="excerpt" className="text-lg font-bold text-gray-800">
                      Post Excerpt
                    </Label>
                  </div>
                  <div className="relative">
                    <Textarea
                      id="excerpt"
                      placeholder="💡 Write a compelling excerpt that will appear in post previews and social media shares...

This is your chance to hook readers and make them want to read more!"
                      value={formData.excerpt}
                      onChange={(e) => handleInputChange('excerpt', e.target.value)}
                      rows={6}
                      className="border-2 border-purple-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 rounded-xl bg-white/70 backdrop-blur-sm p-4 placeholder:text-gray-400 transition-all duration-300"
                    />
                    <div className="absolute bottom-3 right-3">
                      <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-600 border border-gray-200">
                        {formData.excerpt.length}/160
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                    Keep it under 160 characters for optimal social media sharing
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* SEO Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>SEO Settings</CardTitle>
                    <CardDescription>Optimize for search engines</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowSEO(!showSEO)}
                  >
                    {showSEO ? 'Hide' : 'Show'} SEO
                  </Button>
                </div>
              </CardHeader>
              {showSEO && (
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="metaTitle">Meta Title</Label>
                    <Input
                      id="metaTitle"
                      value={formData.metaTitle}
                      onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="metaDescription">Meta Description</Label>
                    <Textarea
                      id="metaDescription"
                      value={formData.metaDescription}
                      onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="metaKeywords">Meta Keywords</Label>
                    <Input
                      id="metaKeywords"
                      value={formData.metaKeywords}
                      onChange={(e) => handleInputChange('metaKeywords', e.target.value)}
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publishing Options */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg">
                <CardTitle className="text-white">Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger aria-label="Post status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                  </SelectContent>
                </Select>
                
                {formData.status === 'SCHEDULED' && (
                  <div className="space-y-2">
                    <Label htmlFor="scheduledAt">Publish Date</Label>
                    <Input
                      id="scheduledAt"
                      type="datetime-local"
                      value={formData.scheduledAt}
                      onChange={(e) => handleInputChange('scheduledAt', e.target.value)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Featured Image */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-t-lg">
                <CardTitle className="text-white">Featured Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {imagePreview ? (
                  <div className="relative h-48">
                    <Image 
                      src={imagePreview} 
                      alt="Featured image preview" 
                      fill
                      sizes="100vw"
                      className="object-cover rounded-lg"
                      priority
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setImagePreview('');
                        setFormData(prev => ({ ...prev, featuredImage: '' }));
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      aria-label="Featured image upload"
                      title="Featured image upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    >
                      Choose File
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
                <CardTitle className="text-white">Category *</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <Select value={formData.categoryId} onValueChange={(value) => handleInputChange('categoryId', value)}>
                  <SelectTrigger aria-label="Post category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={async () => {
                    const name = prompt('Enter new category name:');
                    if (name) {
                      try {
                        const res = await fetch('/api/admin/blog/categories', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ name })
                        });
                        if (res.ok) {
                          const cat = await res.json();
                          setCategories(prev => [...prev, cat]);
                          handleInputChange('categoryId', cat.id);
                        }
                      } catch (error) {
                        console.error('Error creating category:', error);
                      }
                    }
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-t-lg">
                <CardTitle className="text-white">Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleTagToggle(tag.id)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={async () => {
                    const name = prompt('Enter new tag name:');
                    if (name) {
                      try {
                        const res = await fetch('/api/admin/blog/tags', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ name })
                        });
                        if (res.ok) {
                          const tag = await res.json();
                          setTags(prev => [...prev, tag]);
                          setSelectedTags(prev => [...prev, tag.id]);
                        }
                      } catch (error) {
                        console.error('Error creating tag:', error);
                      }
                    }
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Tag
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
