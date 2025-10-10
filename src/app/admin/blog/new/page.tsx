'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Eye, Upload, X, Plus, FileText, Edit, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import TipTapEditor from '@/components/editor/TipTapEditor';
import Image from 'next/image';

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

export default function NewBlogPostPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showSEO, setShowSEO] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
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

  // Helpers: strip HTML for accurate counts; Quill toolbar config
  const stripHtml = (html: string) =>
    (html || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  const contentPlain = stripHtml(formData.content);
  const wordCount = contentPlain ? contentPlain.split(/\s+/).filter(Boolean).length : 0;
  const charCount = contentPlain.length;

  

  // Load categories and tags on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesRes, tagsRes] = await Promise.all([
          fetch('/api/admin/blog/categories'),
          fetch('/api/admin/blog/tags')
        ]);
        
        if (categoriesRes.ok) {
          setCategories(await categoriesRes.json());
        }
        
        if (tagsRes.ok) {
          setTags(await tagsRes.json());
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
  }, []);

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
    if (!formData.title || contentPlain.length === 0 || !formData.categoryId) {
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

      // Add scheduled date if status is SCHEDULED
      if (status === 'SCHEDULED') {
        submitData.scheduledAt = new Date(formData.scheduledAt).toISOString();
      }

      const response = await fetch('/api/admin/blog/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        const post = await response.json();
        // Redirect to edit page using slug instead of ID
        router.push(`/admin/blog/edit/${post.slug}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('An error occurred while creating the post');
    } finally {
      setIsLoading(false);
    }
  };

  if (!session?.user?.isAdmin) {
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
                <h1 className="text-3xl font-bold text-gray-900 mb-1">Create New Post</h1>
                <p className="text-gray-600">Write and publish a new blog post</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
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
                variant="outline"
                onClick={() => handleSubmit('SCHEDULED')}
                disabled={isLoading || !formData.scheduledAt}
                className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
              >
                <Save className="w-4 h-4 mr-2" />
                Schedule
              </Button>
              <Button 
                onClick={() => handleSubmit('PUBLISHED')}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
              >
                <Eye className="w-4 h-4 mr-2" />
                Publish Now
              </Button>
            </div>
          </div>
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
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    Post Content
                  </CardTitle>
                  <CardDescription className="text-blue-100 mt-2">
                    Create engaging content that will captivate your readers
                  </CardDescription>
                </div>
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full"></div>
                <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-white/5 rounded-full"></div>
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
                
                {/* Content Tips */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mt-6">
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">💡</span>
                    </div>
                    Writing Tips for Engaging Content
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2"></div>
                        <span><strong>Hook your readers:</strong> Start with a compelling question or statement</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2"></div>
                        <span><strong>Use headings:</strong> Structure your content with H2, H3 tags</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2"></div>
                        <span><strong>Include examples:</strong> Make abstract concepts concrete</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-2"></div>
                        <span><strong>Add value:</strong> Provide actionable insights and tips</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-2"></div>
                        <span><strong>Tell stories:</strong> Personal anecdotes create connection</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-2"></div>
                        <span><strong>End with CTA:</strong> Guide readers to take action</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
          </Card>

            {/* SEO Settings */}
            <Card className="shadow-sm border-gray-100 hover:shadow-md transition-shadow">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-gray-900">SEO Settings</CardTitle>
                    <CardDescription className="text-gray-600">Optimize your post for search engines</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowSEO(!showSEO)}
                    className="border-purple-200 text-purple-600 hover:bg-purple-50"
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
                    placeholder="SEO title for search engines"
                    value={formData.metaTitle}
                    onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    placeholder="Brief description for search results"
                    value={formData.metaDescription}
                    onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="metaKeywords">Meta Keywords</Label>
                  <Input
                    id="metaKeywords"
                    placeholder="Comma-separated keywords"
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
            <Card className="shadow-lg border border-blue-100 bg-gradient-to-b from-white to-blue-50/30">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg">
                <CardTitle className="text-lg text-white">Publishing Options</CardTitle>
                <CardDescription className="text-blue-100">Choose how to publish your post</CardDescription>
              </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
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
              </div>
              
              {formData.status === 'SCHEDULED' && (
                <div className="space-y-2">
                  <Label htmlFor="scheduledAt">Publish Date & Time</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => handleInputChange('scheduledAt', e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  <p className="text-sm text-gray-600">
                    Post will automatically publish on this date
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

            {/* Featured Image */}
            <Card className="shadow-lg border border-orange-100 bg-gradient-to-b from-white to-orange-50/30">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-t-lg">
                <CardTitle className="text-lg text-white">Featured Image</CardTitle>
                <CardDescription className="text-orange-100">Upload a featured image for your post</CardDescription>
              </CardHeader>
            <CardContent className="space-y-4">
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
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-600">Click to upload image</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    aria-label="Featured image upload"
                    title="Featured image upload"
                  />
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    >
                      Choose File
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

            {/* Category */}
            <Card className="shadow-lg border border-green-100 bg-gradient-to-b from-white to-green-50/30">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
                <CardTitle className="text-lg text-white">Category *</CardTitle>
                <CardDescription className="text-green-100">Select a category for this post</CardDescription>
              </CardHeader>
            <CardContent className="space-y-3">
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
                Add New Category
              </Button>
            </CardContent>
          </Card>

            {/* Tags */}
            <Card className="shadow-lg border border-purple-100 bg-gradient-to-b from-white to-purple-50/30">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-t-lg">
                <CardTitle className="text-lg text-white">Tags</CardTitle>
                <CardDescription className="text-purple-100">Add tags to categorize your post</CardDescription>
              </CardHeader>
            <CardContent className="space-y-3">
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
                Add New Tag
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
  );
} 