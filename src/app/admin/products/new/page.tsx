'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import TipTapEditor from '@/components/editor/TipTapEditor';

import { ArrowLeft, Save, Eye, Upload, X, Plus, Package, DollarSign, BarChart3, FileText, Edit, MessageSquare, AlertCircle, CheckCircle, Calendar, Image as ImageIcon, FolderPlus } from 'lucide-react';
import Link from 'next/link';

export default function NewProductPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [showSEO, setShowSEO] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showShipping, setShowShipping] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [notice, setNotice] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    comparePrice: '',
    costPrice: '',
    sku: '',
    barcode: '',
    trackQuantity: true,
    quantity: '',
    minQuantity: '',
    status: 'DRAFT',
    scheduledAt: '',
    categoryId: '',
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: ''
    },
    metaTitle: '',
    metaDescription: '',
    metaKeywords: ''
  });

  // Derived counts from HTML description
  const stripHtml = (html: string) =>
    (html || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  const contentPlain = stripHtml(formData.description);
  const wordCount = contentPlain ? contentPlain.split(/\s+/).filter(Boolean).length : 0;
  const charCount = contentPlain.length;

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/admin/products/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    setNotice(null);

    try {
      const uploadPromises = files.map(async (file) => {
        // Validate file type and size
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          return { 
            preview: '', 
            url: '', 
            success: false, 
            fileName: file.name, 
            error: 'Invalid file type. Only JPG, PNG, GIF, and WebP are allowed.' 
          };
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB
          return { 
            preview: '', 
            url: '', 
            success: false, 
            fileName: file.name, 
            error: 'File too large. Maximum size is 10MB.' 
          };
        }

        // Create preview immediately
        const reader = new FileReader();
        const previewPromise = new Promise<string>((resolve, reject) => {
          reader.onload = (e) => {
            const result = e.target?.result as string;
            resolve(result);
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });

        try {
          const preview = await previewPromise;

          // Upload to server
          const formData = new FormData();
          formData.append('file', file);
          formData.append('type', 'image');

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
            credentials: 'include', // Include cookies for authentication
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Image uploaded successfully:', { fileName: file.name, url: data.url });
            return { preview, url: data.url, success: true, fileName: file.name };
          } else {
            const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
            console.error('Image upload failed:', { 
              fileName: file.name, 
              status: response.status,
              error: errorData 
            });
            return { 
              preview, 
              url: '', 
              success: false, 
              fileName: file.name, 
              error: errorData.details || errorData.message || `HTTP ${response.status}: ${response.statusText}` 
            };
          }
        } catch (previewError) {
          return { 
            preview: '', 
            url: '', 
            success: false, 
            fileName: file.name, 
            error: 'Failed to process file' 
          };
        }
      });

      const results = await Promise.all(uploadPromises);
      
      // Update previews and uploaded images
      const successfulUploads = results.filter(r => r.success);
      const failedUploads = results.filter(r => !r.success);
      
      if (successfulUploads.length > 0) {
        setImagePreview(prev => [...prev, ...successfulUploads.map(r => r.preview)]);
        setUploadedImages(prev => [...prev, ...successfulUploads.map(r => r.url)]);
        setNotice({ 
          type: 'success', 
          message: `Successfully uploaded ${successfulUploads.length} image(s)` 
        });
      }
      
      if (failedUploads.length > 0) {
        const errorMessages = failedUploads.map(f => `${f.fileName}: ${f.error}`).join('; ');
        console.error('Failed uploads:', failedUploads);
        setNotice({ 
          type: 'error', 
          message: `Failed to upload ${failedUploads.length} image(s). ${errorMessages}` 
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload images. Please try again.';
      setNotice({ type: 'error', message: errorMessage });
    } finally {
      setIsUploading(false);
      // Clear the input so the same files can be selected again if needed
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    setImagePreview(prev => prev.filter((_, i) => i !== index));
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const createNewCategory = async () => {
    if (!newCategoryName.trim()) {
      setNotice({ type: 'error', message: 'Category name is required' });
      return;
    }

    setIsCreatingCategory(true);
    setNotice(null);

    try {
      const response = await fetch('/api/admin/products/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCategoryName,
          color: '#22C55E'
        })
      });

      if (response.ok) {
        const newCategory = await response.json();
        setCategories(prev => [...prev, newCategory]);
        setFormData(prev => ({ ...prev, categoryId: newCategory.id }));
        setNewCategoryName('');
        setNewCategoryDescription('');
        setShowNewCategory(false);
        setNotice({ type: 'success', message: 'Category created successfully!' });
      } else {
        const error = await response.json();
        setNotice({ type: 'error', message: error.error || 'Failed to create category' });
      }
    } catch (error) {
      console.error('Error creating category:', error);
      setNotice({ type: 'error', message: 'An error occurred while creating the category' });
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleSubmit = async (status: string) => {
    if (!formData.name || !formData.description || !formData.price || !formData.categoryId) {
      setNotice({ type: 'error', message: 'Please fill in all required fields (name, description, price, and category)' });
      return;
    }

    if (status === 'SCHEDULED' && !formData.scheduledAt) {
      setNotice({ type: 'error', message: 'Please select a publish date for scheduled products' });
      return;
    }

    setIsLoading(true);
    setNotice(null);
    
    try {
      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : null,
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : null,
        quantity: parseInt(formData.quantity) || 0,
        minQuantity: parseInt(formData.minQuantity) || 0,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        dimensions: formData.dimensions.length ? formData.dimensions : null,
        status,
        images: uploadedImages.length > 0 ? uploadedImages : [],
        tags
      };

      // Add scheduled date if status is SCHEDULED
      if (status === 'SCHEDULED') {
        submitData.scheduledAt = new Date(formData.scheduledAt).toISOString();
      }

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        const product = await response.json();
        setNotice({ type: 'success', message: 'Product created successfully!' });
        setTimeout(() => {
          router.push('/admin/products');
        }, 1500);
      } else {
        const error = await response.json();
        setNotice({ type: 'error', message: error.error || 'Failed to create product' });
      }
    } catch (error) {
      console.error('Error creating product:', error);
      setNotice({ type: 'error', message: 'An error occurred while creating the product' });
    } finally {
      setIsLoading(false);
    }
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

  // Check if user is admin
  if (!(session.user as any)?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You don&apos;t have permission to access this page.</p>
          <Button onClick={() => router.push('/dashboard')} className="w-full">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Alert Messages */}
        {notice && (
          <div className="mb-6">
            <Alert className={notice.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
              {notice.type === 'error' ? <AlertCircle className="w-4 h-4 text-red-600" /> : <CheckCircle className="w-4 h-4 text-green-600" />}
              <AlertDescription className={notice.type === 'error' ? 'text-red-800' : 'text-green-800'}>
                {notice.message}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Link href="/admin/products">
                <Button variant="ghost" size="sm" className="hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Products
                </Button>
              </Link>
              <div className="hidden sm:block w-px h-8 bg-gray-200"></div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">Add New Product</h1>
                <p className="text-gray-600">Create a new product for your catalog</p>
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
                className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300"
              >
                <Save className="w-4 h-4 mr-2" />
                Schedule
              </Button>
              <Button 
                onClick={() => handleSubmit('ACTIVE')}
                disabled={isLoading}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
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
            {/* Enhanced Product Information */}
            <Card className="shadow-xl border-0 bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/50 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 text-white rounded-t-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/90 to-green-600/90"></div>
                <div className="relative z-10">
                  <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    Product Information
                  </CardTitle>
                  <CardDescription className="text-emerald-100 mt-2">
                    Create compelling product details that will attract customers
                  </CardDescription>
                </div>
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full"></div>
                <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-white/5 rounded-full"></div>
              </CardHeader>
              
              <CardContent className="space-y-8 p-8">
                {/* Product Name Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">P</span>
                    </div>
                    <Label htmlFor="name" className="text-lg font-bold text-gray-800">
                      Product Name *
                    </Label>
                  </div>
                  <div className="relative">
                    <Input
                      id="name"
                      placeholder="✨ Enter a compelling and descriptive product name..."
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="h-28 text-2xl border-2 border-emerald-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 rounded-xl bg-white/70 backdrop-blur-sm pl-6 pr-12 font-medium placeholder:text-gray-400 transition-all duration-300"
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <div className="w-6 h-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{formData.name.length}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                    Aim for 50-80 characters for optimal search visibility
                  </p>
                </div>
                
                {/* Description Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-green-500 rounded-lg flex items-center justify-center">
                      <Edit className="w-4 h-4 text-white" />
                    </div>
                    <Label htmlFor="description" className="text-lg font-bold text-gray-800">
                      Product Description *
                    </Label>
                  </div>
                  <div className="relative">
                    <TipTapEditor
                      value={formData.description}
                      onChange={(value) => handleInputChange('description', value)}
                      placeholder="📝 Write a compelling product description. Highlight features, specifications, and benefits."
                      className="min-h-[24rem]"
                    />
                    <div className="absolute bottom-4 right-4 flex items-center gap-2">
                      <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-600 border border-gray-200">
                        {charCount} characters
                      </div>
                      <div className="bg-gradient-to-r from-teal-500 to-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                        {wordCount} words
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span>Minimum: 50 words</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      <span>Optimal: 150-300 words</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                      <span>Reading time: ~{Math.ceil(wordCount / 200)} min</span>
                    </div>
                  </div>
                </div>
                
                {/* Product Tips */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-6 mt-6">
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">💡</span>
                    </div>
                    Product Description Best Practices
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-2"></div>
                        <span><strong>Benefits first:</strong> Lead with how it helps customers</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-2"></div>
                        <span><strong>Use keywords:</strong> Include terms customers search for</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-2"></div>
                        <span><strong>Be specific:</strong> Include exact measurements and materials</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-teal-400 rounded-full mt-2"></div>
                        <span><strong>Address concerns:</strong> Answer common customer questions</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-teal-400 rounded-full mt-2"></div>
                        <span><strong>Use bullet points:</strong> Make key features easy to scan</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-teal-400 rounded-full mt-2"></div>
                        <span><strong>Include care instructions:</strong> Help customers maintain the product</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card className="shadow-sm border-gray-100 hover:shadow-md transition-shadow">
              <CardHeader className="bg-gradient-to-r from-green-50 to-lime-50 rounded-t-lg">
                <CardTitle className="text-xl text-gray-900">Pricing</CardTitle>
                <CardDescription className="text-gray-600">Set your product pricing</CardDescription>
              </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (PKR) *</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="comparePrice">Compare at Price (PKR)</Label>
                  <Input
                    id="comparePrice"
                    type="number"
                    placeholder="0.00"
                    value={formData.comparePrice}
                    onChange={(e) => handleInputChange('comparePrice', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="costPrice">Cost Price (PKR)</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    placeholder="0.00"
                    value={formData.costPrice}
                    onChange={(e) => handleInputChange('costPrice', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Inventory</CardTitle>
                  <CardDescription>Track and manage your product inventory</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowInventory(!showInventory)}
                >
                  {showInventory ? 'Hide' : 'Show'} Inventory
                </Button>
              </div>
            </CardHeader>
            {showInventory && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      placeholder="Product SKU"
                      value={formData.sku}
                      onChange={(e) => handleInputChange('sku', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="barcode">Barcode</Label>
                    <Input
                      id="barcode"
                      placeholder="Product barcode"
                      value={formData.barcode}
                      onChange={(e) => handleInputChange('barcode', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="trackQuantity"
                    checked={formData.trackQuantity}
                    onCheckedChange={(checked) => handleInputChange('trackQuantity', checked)}
                  />
                  <Label htmlFor="trackQuantity">Track quantity</Label>
                </div>
                
                {formData.trackQuantity && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        placeholder="0"
                        value={formData.quantity}
                        onChange={(e) => handleInputChange('quantity', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="minQuantity">Low stock threshold</Label>
                      <Input
                        id="minQuantity"
                        type="number"
                        placeholder="0"
                        value={formData.minQuantity}
                        onChange={(e) => handleInputChange('minQuantity', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {/* Shipping */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Shipping</CardTitle>
                  <CardDescription>Physical properties for shipping</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowShipping(!showShipping)}
                >
                  {showShipping ? 'Hide' : 'Show'} Shipping
                </Button>
              </div>
            </CardHeader>
            {showShipping && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="0.0"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Dimensions (cm)</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Length"
                      value={formData.dimensions.length}
                      onChange={(e) => handleInputChange('dimensions.length', e.target.value)}
                    />
                    <Input
                      placeholder="Width"
                      value={formData.dimensions.width}
                      onChange={(e) => handleInputChange('dimensions.width', e.target.value)}
                    />
                    <Input
                      placeholder="Height"
                      value={formData.dimensions.height}
                      onChange={(e) => handleInputChange('dimensions.height', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>SEO</CardTitle>
                  <CardDescription>Search engine optimization</CardDescription>
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
                    placeholder="SEO title"
                    value={formData.metaTitle}
                    onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    placeholder="SEO description"
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
            <Card className="shadow-lg border border-emerald-100 bg-gradient-to-b from-white to-emerald-50/30">
              <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-t-lg">
                <CardTitle className="text-lg text-white">Publishing Options</CardTitle>
                <CardDescription className="text-emerald-100">Choose how to publish your product</CardDescription>
              </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
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
                    Product will automatically become active on this date
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

            {/* Product Images */}
            <Card className="shadow-lg border border-blue-100 bg-gradient-to-b from-white to-blue-50/30">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg">
                <CardTitle className="text-lg text-white">Product Images</CardTitle>
                <CardDescription className="text-blue-100">Upload product images</CardDescription>
              </CardHeader>
            <CardContent className="space-y-4">
              {/* Image Thumbnails Grid */}
              {imagePreview.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  {imagePreview.map((image, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors">
                        <img 
                          src={image} 
                          alt={`Product image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                        title="Remove image"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Upload Area */}
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
                  isUploading 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer'
                }`}
                onClick={() => !isUploading && document.getElementById('image-upload')?.click()}
              >
                <div className="flex flex-col items-center space-y-3">
                  {isUploading ? (
                    <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  )}
                  
                  <div>
                    <p className="text-lg font-medium text-gray-700 mb-1">
                      {isUploading ? 'Uploading images...' : 'Upload Product Images'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {isUploading 
                        ? 'Please wait while we process your images' 
                        : 'Click here or drag and drop images'
                      }
                    </p>
                  </div>
                  
                  <div className="text-xs text-gray-400 space-y-1">
                    <p>Supported formats: JPG, PNG, GIF, WebP</p>
                    <p>Maximum size: 10MB per image</p>
                    <p>Recommended: 800x800px or higher</p>
                  </div>
                  
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                    aria-label="Upload product images"
                    title="Upload product images"
                    disabled={isUploading}
                  />
                  
                  {!isUploading && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2 pointer-events-none"
                      type="button"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose Files
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

            {/* Category */}
            <Card className="shadow-lg border border-orange-100 bg-gradient-to-b from-white to-orange-50/30">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-t-lg">
                <CardTitle className="text-lg text-white">Category</CardTitle>
                <CardDescription className="text-orange-100">Product category</CardDescription>
              </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Select value={formData.categoryId} onValueChange={(value) => handleInputChange('categoryId', value)}>
                  <SelectTrigger>
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
                
                <div className="flex items-center gap-2">
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowNewCategory(!showNewCategory)}
                    className="flex items-center gap-2"
                  >
                    <FolderPlus className="w-4 h-4" />
                    {showNewCategory ? 'Cancel' : 'Add New Category'}
                  </Button>
                </div>
                
                {showNewCategory && (
                  <div className="space-y-3 p-4 border border-orange-200 rounded-lg bg-orange-50/50">
                    <div className="space-y-2">
                      <Label htmlFor="newCategoryName">Category Name *</Label>
                      <Input
                        id="newCategoryName"
                        placeholder="Enter category name"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        type="button"
                        onClick={createNewCategory}
                        disabled={isCreatingCategory || !newCategoryName.trim()}
                        size="sm"
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        {isCreatingCategory ? 'Creating...' : 'Create Category'}
                      </Button>
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setShowNewCategory(false);
                          setNewCategoryName('');
                          setNewCategoryDescription('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

            {/* Tags */}
            <Card className="shadow-lg border border-purple-100 bg-gradient-to-b from-white to-purple-50/30">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-t-lg">
                <CardTitle className="text-lg text-white">Tags</CardTitle>
                <CardDescription className="text-purple-100">Add tags to help categorize your product</CardDescription>
              </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Add a tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <Button onClick={addTag} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="cursor-pointer">
                    {tag}
                    <X 
                      className="w-3 h-3 ml-1" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Product Status */}
          <Card>
            <CardHeader>
              <CardTitle>Product Status</CardTitle>
              <CardDescription>Set product availability</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
  );
} 