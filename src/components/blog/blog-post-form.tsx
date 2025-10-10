'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  Eye, 
  Calendar, 
  Upload, 
  X, 
  Edit, 
  FileText, 
  Hash, 
  Globe, 
  Clock,
  Star,
  TrendingUp,
  MessageSquare,
  ArrowLeft
} from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  status: string;
  publishedAt?: string;
  scheduledAt?: string;
  categoryId?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  tags?: { id: string; name: string }[];
}

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

interface BlogPostFormProps {
  post?: BlogPost | null;
  categories: BlogCategory[];
  tags: BlogTag[];
  selectedTagIds?: string[];
}

export default function BlogPostForm({ post, categories, tags, selectedTagIds = [] }: BlogPostFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: post?.title || '',
    slug: post?.slug || '',
    content: post?.content || '',
    excerpt: post?.excerpt || '',
    featuredImage: post?.featuredImage || '',
    status: post?.status || 'DRAFT',
    publishedAt: post?.publishedAt || '',
    scheduledAt: post?.scheduledAt || '',
    categoryId: post?.categoryId || '',
    metaTitle: post?.metaTitle || '',
    metaDescription: post?.metaDescription || '',
    metaKeywords: post?.metaKeywords || '',
    tagIds: selectedTagIds || []
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate slug from title
    if (field === 'title' && !post) {
      const slug = value.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        handleInputChange('featuredImage', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (status: string) => {
    setLoading(true);
    
    try {
      const submitData = {
        ...formData,
        status,
        tagIds: formData.tagIds
      };
      
      const url = post ? `/api/admin/blog/posts/${post.id}` : '/api/admin/blog/posts';
      const method = post ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });
      
      if (response.ok) {
        const result = await response.json();
        router.push('/admin/blog');
      } else {
        throw new Error('Failed to save post');
      }
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Error saving post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTagToggle = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId) 
        ? prev.tagIds.filter(id => id !== tagId)
        : [...prev.tagIds, tagId]
    }));
  };

  // Calculate character counts and reading time
  const titleCharCount = formData.title.length;
  const contentWordCount = formData.content.trim().split(/\s+/).filter(word => word.length > 0).length;
  const contentCharCount = formData.content.length;
  const readingTime = Math.ceil(contentWordCount / 200);
  const excerptCharCount = formData.excerpt.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/blog')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Posts
            </Button>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {post ? 'Edit Blog Post' : 'Create New Blog Post'}
          </h1>
          <p className="text-gray-600 text-lg">
            {post ? 'Update your blog post content and settings' : 'Create engaging content for your audience'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Enhanced Post Content */}
            <Card className="shadow-xl border-0 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-t-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-purple-600/90"></div>
                <div className="relative z-10">
                  <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <Edit className="w-5 h-5 text-white" />
                    </div>
                    Post Content
                  </CardTitle>
                  <CardDescription className="text-blue-100 mt-2">
                    Create compelling content that engages your readers
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-8 p-8">
                {/* Title */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="title" className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      Title *
                    </Label>
                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                      {titleCharCount}/80 optimal
                    </Badge>
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
                        <span className="text-white text-xs font-bold">{titleCharCount}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    SEO tip: Keep titles between 50-80 characters for best search results
                  </p>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="content" className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-indigo-600" />
                      Content *
                    </Label>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200">
                        {contentWordCount} words
                      </Badge>
                      <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                        {readingTime} min read
                      </Badge>
                    </div>
                  </div>
                  <div className="relative">
                    <Textarea
                      id="content"
                      placeholder="📝 Write your amazing blog post content here...\n\n• Share your unique insights and experiences\n• Use headings to structure your content\n• Include examples and actionable tips\n• Tell a compelling story\n\nRemember: Great content educates, entertains, or inspires your readers!"
                      value={formData.content}
                      onChange={(e) => handleInputChange('content', e.target.value)}
                      rows={32}
                      className="border-2 border-indigo-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 rounded-xl resize-none bg-white/70 backdrop-blur-sm p-6 text-base leading-relaxed placeholder:text-gray-400 transition-all duration-300"
                    />
                    <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md">
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Hash className="w-4 h-4" />
                          {contentCharCount} chars
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {readingTime} min
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 font-medium mb-2 flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      Writing Guidelines
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${contentWordCount >= 300 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        Minimum: 300 words
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${contentWordCount >= 1000 && contentWordCount <= 2000 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        Optimal: 1,000-2,000 words
                      </div>
                    </div>
                  </div>
                </div>

                {/* Excerpt */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="excerpt" className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-600" />
                      Excerpt
                    </Label>
                                         <Badge variant="outline" className={`${excerptCharCount > 160 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-purple-50 text-purple-600 border-purple-200'}`}>
                       {excerptCharCount}/160 chars
                     </Badge>
                  </div>
                  <div className="relative">
                    <Textarea
                      id="excerpt"
                      placeholder="💡 Write a compelling excerpt that will appear in post previews and social media shares...\n\nThis is your chance to hook readers and make them want to read more!"
                      value={formData.excerpt}
                      onChange={(e) => handleInputChange('excerpt', e.target.value)}
                      rows={6}
                      className="border-2 border-purple-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 rounded-xl bg-white/70 backdrop-blur-sm p-4 placeholder:text-gray-400 transition-all duration-300"
                    />
                  </div>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Great for social media, search results, and post previews
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Featured Image */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-orange-50/50 to-red-50/30">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
                <CardTitle className="text-xl font-bold flex items-center gap-3">
                  <Upload className="w-5 h-5" />
                  Featured Image
                </CardTitle>
                <CardDescription className="text-orange-100">
                  Upload an eye-catching image for your blog post
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-full">
                    <label htmlFor="featuredImage" className="flex flex-col items-center justify-center w-full h-64 border-2 border-orange-300 border-dashed rounded-lg cursor-pointer bg-orange-50 hover:bg-orange-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-orange-500" />
                        <p className="mb-2 text-sm text-orange-700"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-orange-500">PNG, JPG, GIF up to 10MB</p>
                      </div>
                      <input id="featuredImage" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                  </div>
                  
                  {formData.featuredImage && (
                    <div className="relative">
                      <img 
                        src={formData.featuredImage} 
                        alt="Featured image preview" 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2"
                        onClick={() => handleInputChange('featuredImage', '')}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publishing Options */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50/50 to-emerald-50/30">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Publishing
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                    Status
                  </Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.status === 'SCHEDULED' && (
                  <div className="space-y-2">
                    <Label htmlFor="scheduledAt" className="text-sm font-medium text-gray-700">
                      Scheduled Date
                    </Label>
                    <Input
                      id="scheduledAt"
                      type="datetime-local"
                      value={formData.scheduledAt}
                      onChange={(e) => handleInputChange('scheduledAt', e.target.value)}
                      className="w-full"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-sm font-medium text-gray-700">
                    URL Slug
                  </Label>
                  <Input
                    id="slug"
                    placeholder="post-url-slug"
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                  />
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={() => handleSubmit('DRAFT')}
                    disabled={loading}
                    className="w-full bg-gray-600 hover:bg-gray-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Draft'}
                  </Button>
                  
                  <Button
                    onClick={() => handleSubmit('PUBLISHED')}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {loading ? 'Publishing...' : 'Publish'}
                  </Button>
                  
                  {post && (
                    <Button
                      variant="outline"
                      asChild
                      className="w-full"
                    >
                      <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                        <Eye className="w-4 h-4 mr-2" />
                        View Post
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Category Selection */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Hash className="w-5 h-5" />
                  Category
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Select value={formData.categoryId} onValueChange={(value) => handleInputChange('categoryId', value)}>
                  <SelectTrigger className="w-full">
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
              </CardContent>
            </Card>

            {/* Tags */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Hash className="w-5 h-5" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={formData.tagIds.includes(tag.id) ? "default" : "outline"}
                      className={`cursor-pointer transition-all ${
                        formData.tagIds.includes(tag.id) 
                          ? 'bg-purple-600 hover:bg-purple-700' 
                          : 'hover:bg-purple-50 hover:border-purple-300'
                      }`}
                      onClick={() => handleTagToggle(tag.id)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* SEO Settings */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-t-lg">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  SEO Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="metaTitle" className="text-sm font-medium text-gray-700">
                    Meta Title
                  </Label>
                  <Input
                    id="metaTitle"
                    placeholder="SEO title for search engines"
                    value={formData.metaTitle}
                    onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="metaDescription" className="text-sm font-medium text-gray-700">
                    Meta Description
                  </Label>
                  <Textarea
                    id="metaDescription"
                    placeholder="Brief description for search results"
                    value={formData.metaDescription}
                    onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="metaKeywords" className="text-sm font-medium text-gray-700">
                    Meta Keywords
                  </Label>
                  <Input
                    id="metaKeywords"
                    placeholder="keyword1, keyword2, keyword3"
                    value={formData.metaKeywords}
                    onChange={(e) => handleInputChange('metaKeywords', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 