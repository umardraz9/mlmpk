import { supabase } from './supabase';

// Product type definition
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number | null;
  costPrice?: number | null;
  sku?: string | null;
  barcode?: string | null;
  trackQuantity: boolean;
  quantity: number;
  minQuantity: number;
  status: string;
  scheduledAt?: string | null;
  images: string;
  weight?: number | null;
  dimensions?: string | null;
  categoryId?: string | null;
  tags?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  views: number;
  sales: number;
  rating?: number | null;
  reviewCount: number;
  trending: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  color?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Get all products with filtering and pagination
export async function getProducts(options: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  categoryId?: string;
}) {
  const { page = 1, limit = 10, status, search, categoryId } = options;
  
  let query = supabase
    .from('products')
    .select('*', { count: 'exact' });

  // Apply filters
  if (status) {
    query = query.eq('status', status);
  }
  if (categoryId) {
    query = query.eq('categoryId', categoryId);
  }
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`);
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to).order('createdAt', { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching products:', error);
    throw new Error('Failed to fetch products');
  }

  return {
    products: data || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit)
  };
}

// Get single product by ID
export async function getProduct(id: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching product:', error);
    return null;
  }

  return data;
}

// Create new product
export async function createProduct(productData: Partial<Product>) {
  // Generate slug from name
  const slug = productData.name
    ? productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    : '';

  const { data, error } = await supabase
    .from('products')
    .insert([{
      name: productData.name,
      slug,
      description: productData.description,
      price: productData.price,
      comparePrice: productData.comparePrice || null,
      costPrice: productData.costPrice || null,
      sku: productData.sku || null,
      barcode: productData.barcode || null,
      trackQuantity: productData.trackQuantity || false,
      quantity: productData.quantity || 0,
      minQuantity: productData.minQuantity || 0,
      status: productData.status || 'DRAFT',
      scheduledAt: productData.scheduledAt || null,
      images: JSON.stringify(productData.images || []),
      weight: productData.weight || null,
      dimensions: productData.dimensions ? JSON.stringify(productData.dimensions) : null,
      categoryId: productData.categoryId || null,
      tags: productData.tags ? JSON.stringify(productData.tags) : null,
      metaTitle: productData.metaTitle || null,
      metaDescription: productData.metaDescription || null,
      metaKeywords: productData.metaKeywords || null,
      views: 0,
      sales: 0,
      rating: 0,
      reviewCount: 0,
      trending: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating product:', error);
    throw new Error('Failed to create product');
  }

  return data;
}

// Update product
export async function updateProduct(id: string, updates: Partial<Product>) {
  const { data, error } = await supabase
    .from('products')
    .update({
      ...updates,
      updatedAt: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating product:', error);
    throw new Error('Failed to update product');
  }

  return data;
}

// Delete product
export async function deleteProduct(id: string) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting product:', error);
    throw new Error('Failed to delete product');
  }

  return true;
}

// Get all product categories
export async function getProductCategories() {
  const { data, error } = await supabase
    .from('product_categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    throw new Error('Failed to fetch categories');
  }

  return data || [];
}

// Create product category
export async function createProductCategory(categoryData: {
  name: string;
  color?: string;
}) {
  const slug = categoryData.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const { data, error } = await supabase
    .from('product_categories')
    .insert([{
      name: categoryData.name.trim(),
      slug,
      color: categoryData.color || '#3B82F6',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating category:', error);
    throw new Error('Failed to create category');
  }

  return data;
}
