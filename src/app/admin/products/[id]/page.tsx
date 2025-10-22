'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
// import { RichTextEditor } from '@/components/ui/rich-text-editor';

import { ArrowLeft, Save, Eye, X, Plus, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number;
  costPrice?: number;
  sku?: string;
  barcode?: string;
  trackQuantity: boolean;
  quantity: number;
  minQuantity: number;
  status: string;
  images: string;
  weight?: number;
  dimensions?: string;
  category?: string;
  tags?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  trending: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminProductEditPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Check admin authentication
  useEffect(() => {
    if (session && !(session.user as any)?.isAdmin) {
      router.push('/admin/login');
    }
  }, [session, router]);

  // Load product data
  useEffect(() => {
    if (!productId) return;
    if (productId === 'new') {
      // Redirect to dedicated new product page to avoid duplicate flows
      router.replace('/admin/products/new');
      return;
    }
    loadProduct();
  }, [productId, router]);

  // Helpers
  const isValidUrl = (u: unknown) => typeof u === 'string'
    && u.trim().length > 0
    && (u.startsWith('/') || u.startsWith('http://') || u.startsWith('https://'))
    && u !== '[]'
    && u !== '"[]"';

  // Parse images when product loads
  useEffect(() => {
    if (!product?.images) { setImageUrls([]); return; }
    const src = product.images;
    try {
      if (src.trim().startsWith('[')) {
        const parsed = JSON.parse(src);
        const arr = Array.isArray(parsed) ? parsed : [];
        setImageUrls(arr.filter(isValidUrl as (u: unknown) => u is string));
        return;
      }
    } catch {
      // fall through to other parsing methods
    }
    if (src.includes(',')) {
      const arr = src.split(',').map(s => s.trim());
      setImageUrls(arr.filter(isValidUrl));
    } else if (isValidUrl(src)) {
      setImageUrls([src]);
    } else {
      setImageUrls([]);
    }
  }, [product?.images]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/products/${productId}`);
      
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
      } else {
        router.push('/admin/products');
      }
    } catch (error) {
      console.error('Error loading product:', error);
      router.push('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleInputChange = (field: keyof Product, value: any) => {
    if (!product) return;

    setProduct(prev => {
      if (!prev) return prev;
      
      const updated = { ...prev, [field]: value };
      
      // Auto-generate slug when name changes
      if (field === 'name' && value) {
        updated.slug = generateSlug(value);
      }
      
      return updated;
    });

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addImage = () => {
    const value = newImageUrl.trim();
    if (!value) return;
    if (!isValidUrl(value)) {
      setNotice({ type: 'error', message: 'Please enter a valid image URL (/, http://, or https://)' });
      return;
    }
    setImageUrls(prev => [...prev, value]);
    setNewImageUrl('');
  };

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!product?.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!product?.description.trim()) {
      newErrors.description = 'Product description is required';
    }

    if (!product?.price || product.price <= 0) {
      newErrors.price = 'Valid price is required';
    }

    if (product?.comparePrice && product.comparePrice <= product.price) {
      newErrors.comparePrice = 'Compare price must be higher than regular price';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (status?: string) => {
    if (!product || !validateForm()) return;

    setSaving(true);
    try {
      // Update images in product data
      const productData = {
        ...product,
        status: status || product.status,
        images: JSON.stringify(imageUrls)
      };

      const url = productId === 'new' 
        ? '/api/admin/products'
        : `/api/admin/products/${productId}`;
      
      const method = productId === 'new' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      });

      if (response.ok) {
        router.push('/admin/products');
      } else {
        const errorData = await response.json();
        setNotice({ type: 'error', message: errorData.error || 'Failed to save product' });
      }
    } catch (error) {
      console.error('Error saving product:', error);
      setNotice({ type: 'error', message: 'An error occurred while saving the product' });
    } finally {
      setSaving(false);
    }
  };

  // Upload images using the same API as New Product page
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    setNotice(null);

    try {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      const maxSize = 10 * 1024 * 1024; // 10MB

      const uploadPromises = files.map(async (file) => {
        if (!allowedTypes.includes(file.type)) {
          return { success: false, fileName: file.name, error: 'Invalid file type' };
        }
        if (file.size > maxSize) {
          return { success: false, fileName: file.name, error: 'File too large (max 10MB)' };
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'image');

        const res = await fetch('/api/upload', { method: 'POST', body: formData, credentials: 'include' });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: 'Upload failed' }));
          return { success: false, fileName: file.name, error: err.message || 'Upload failed' };
        }
        const data = await res.json();
        return { success: true, url: data.url, fileName: file.name };
      });

      const results = await Promise.all(uploadPromises);
      const successes = results.filter(r => r.success) as Array<{ success: true; url: string; fileName: string }>;
      const failures = results.filter(r => !r.success) as Array<{ success: false; fileName: string; error: string }>;

      if (successes.length > 0) {
        setImageUrls(prev => [...prev, ...successes.map(s => s.url)]);
        setNotice({ type: 'success', message: `Uploaded ${successes.length} image(s) successfully.` });
      }
      if (failures.length > 0) {
        const msg = failures.map(f => `${f.fileName}: ${f.error}`).join('; ');
        setNotice({ type: 'error', message: `Failed to upload ${failures.length} image(s). ${msg}` });
      }
    } catch (err) {
      console.error('Upload error:', err);
      setNotice({ type: 'error', message: 'Failed to upload images. Please try again.' });
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-4">The product you are looking for does not exist.</p>
          <Link href="/admin/products">
            <Button>Back to Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Notice Messages */}
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
                <h1 className="text-3xl font-bold text-gray-900 mb-1">Edit Product</h1>
                {productId !== 'new' && (
                  <p className="text-gray-600">Product ID: {product.id}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {product.slug && (
                <Link href={`/products/${product.slug}`} target="_blank">
                  <Button variant="outline" className="border-gray-200 hover:border-gray-300 hover:bg-gray-50">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                </Link>
              )}
              <Button 
                variant="outline" 
                onClick={() => handleSave('DRAFT')}
                disabled={saving}
                className="border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              <Button 
                onClick={() => handleSave('ACTIVE')}
                disabled={saving}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the basic details for your product
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={product.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter product name"
                />
                {errors.name && (
                  <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={product.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  placeholder="product-url-slug"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={product.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter product description"
                  rows={4}
                />
                {errors.description && (
                  <p className="text-sm text-red-600 mt-1">{errors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={product.category || ''}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    placeholder="Product category"
                  />
                </div>

                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    value={product.tags || ''}
                    onChange={(e) => handleInputChange('tags', e.target.value)}
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
              <CardDescription>
                Set your product pricing information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price">Regular Price (PKR) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={product.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                  {errors.price && (
                    <p className="text-sm text-red-600 mt-1">{errors.price}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="comparePrice">Compare Price (PKR)</Label>
                  <Input
                    id="comparePrice"
                    type="number"
                    value={product.comparePrice || ''}
                    onChange={(e) => handleInputChange('comparePrice', parseFloat(e.target.value) || undefined)}
                    placeholder="0.00"
                  />
                  {errors.comparePrice && (
                    <p className="text-sm text-red-600 mt-1">{errors.comparePrice}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="costPrice">Cost Price (PKR)</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    value={product.costPrice || ''}
                    onChange={(e) => handleInputChange('costPrice', parseFloat(e.target.value) || undefined)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
              <CardDescription>
                Manage your product inventory and tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="trackQuantity"
                  checked={product.trackQuantity}
                  onCheckedChange={(checked) => handleInputChange('trackQuantity', checked)}
                />
                <Label htmlFor="trackQuantity">Track quantity</Label>
              </div>

              {product.trackQuantity && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="quantity">Current Stock</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={product.quantity}
                      onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="minQuantity">Minimum Stock</Label>
                    <Input
                      id="minQuantity"
                      type="number"
                      value={product.minQuantity}
                      onChange={(e) => handleInputChange('minQuantity', parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={product.sku || ''}
                      onChange={(e) => handleInputChange('sku', e.target.value)}
                      placeholder="PRODUCT-SKU"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Images */}
          <Card className="shadow-sm border-gray-100 hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-green-50 to-lime-50 rounded-t-lg">
              <CardTitle className="text-xl text-gray-900">Product Images</CardTitle>
              <CardDescription className="text-gray-600">Upload or paste URLs for your product images</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                <div className="flex flex-col">
                  <Label htmlFor="imageUpload">Upload images</Label>
                  <input
                    id="imageUpload"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                    aria-label="Upload product images"
                    title="Upload product images"
                  />
                </div>
                <div className="flex-1 flex gap-2">
                  <Input
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Paste image URL"
                    className="flex-1"
                  />
                  <Button onClick={addImage} type="button" disabled={!newImageUrl.trim()} aria-label="Add image by URL" title="Add image by URL">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {isUploading && (
                <p className="text-sm text-gray-600">Uploading images...</p>
              )}

              {imageUrls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {imageUrls.filter(isValidUrl).map((url, index) => (
                    <div key={index} className="relative group">
                      <div className="relative w-full h-32 rounded border overflow-hidden">
                        <Image
                          src={url || 'https://placehold.co/600x600?text=No+Image'}
                          alt={`Product image ${index + 1}`}
                          fill
                          sizes="(max-width: 768px) 50vw, 33vw"
                          className="object-cover"
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                        aria-label={`Remove image ${index + 1}`}
                        title={`Remove image ${index + 1}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Visibility */}
          <Card>
            <CardHeader>
              <CardTitle>Status & Visibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={product.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="trending"
                  checked={product.trending}
                  onCheckedChange={(checked) => handleInputChange('trending', checked)}
                />
                <Label htmlFor="trending">Featured/Trending</Label>
              </div>
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={product.metaTitle || ''}
                  onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                  placeholder="SEO title"
                />
              </div>

              <div>
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={product.metaDescription || ''}
                  onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                  placeholder="SEO description"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Product Details */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  value={product.weight || ''}
                  onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || undefined)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="dimensions">Dimensions</Label>
                <Input
                  id="dimensions"
                  value={product.dimensions || ''}
                  onChange={(e) => handleInputChange('dimensions', e.target.value)}
                  placeholder="L x W x H"
                />
              </div>

              <div>
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  value={product.barcode || ''}
                  onChange={(e) => handleInputChange('barcode', e.target.value)}
                  placeholder="Product barcode"
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
