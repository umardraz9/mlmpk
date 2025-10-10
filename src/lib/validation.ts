/**
 * Input Validation Schemas for Partnership Program
 * Using Zod for type-safe validation
 */

import { z } from 'zod';

// Base validation helpers
const pakistaniPhone = z.string().regex(
  /^(\+92|0)?[0-9]{10}$/,
  'Invalid Pakistani phone number format'
);

// Removed unused pakistaniCNIC validation

const strongPassword = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Authentication schemas
export const authSchemas = {
  login: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),

  register: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: strongPassword,
    confirmPassword: z.string(),
    phone: pakistaniPhone.optional(),
    referralCode: z.string().optional(),
  }).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }),

  forgotPassword: z.object({
    email: z.string().email('Invalid email address'),
  }),

  resetPassword: z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: strongPassword,
    confirmPassword: z.string(),
  }).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }),
};

// User profile schemas
export const profileSchemas = {
  updateProfile: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
    phone: pakistaniPhone.optional(),
    location: z.string().max(100, 'Location must be less than 100 characters').optional(),
    website: z.string().url('Invalid website URL').optional().or(z.literal('')),
    birthdate: z.string().datetime().optional(),
  }),

  updateSettings: z.object({
    emailNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
    profileVisibility: z.enum(['public', 'private', 'friends']).optional(),
    showEmail: z.boolean().optional(),
    showPhone: z.boolean().optional(),
  }),
};

// Social platform schemas
export const socialSchemas = {
  createPost: z.object({
    content: z.string().min(1, 'Content is required').max(2000, 'Content too long'),
    type: z.enum(['text', 'image', 'video', 'reel']).default('text'),
    mediaUrl: z.string().url().optional(),
    tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').optional(),
  }),

  createComment: z.object({
    content: z.string().min(1, 'Comment cannot be empty').max(500, 'Comment too long'),
    postId: z.string().cuid('Invalid post ID'),
  }),

  sendMessage: z.object({
    content: z.string().min(1, 'Message cannot be empty').max(1000, 'Message too long'),
    recipientId: z.string().cuid('Invalid recipient ID'),
    type: z.enum(['text', 'image', 'file']).default('text'),
    mediaUrl: z.string().url().optional(),
  }),
};

// MLM schemas
export const mlmSchemas = {
  referral: z.object({
    email: z.string().email('Invalid email address'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: pakistaniPhone.optional(),
  }),

  withdrawal: z.object({
    amount: z.number().min(100, 'Minimum withdrawal is PKR 100').max(50000, 'Maximum withdrawal is PKR 50,000'),
    method: z.enum(['bank', 'easypaisa', 'jazzcash']),
    accountDetails: z.object({
      accountNumber: z.string().min(1, 'Account number is required'),
      accountTitle: z.string().min(1, 'Account title is required'),
      bankName: z.string().optional(),
    }),
  }),
};

// E-commerce schemas
export const ecommerceSchemas = {
  addToCart: z.object({
    productId: z.string().cuid('Invalid product ID'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1').max(10, 'Maximum quantity is 10'),
    variant: z.string().optional(),
  }),

  checkout: z.object({
    items: z.array(z.object({
      productId: z.string().cuid(),
      quantity: z.number().int().min(1),
      price: z.number().min(0),
    })).min(1, 'Cart cannot be empty'),
    shippingAddress: z.object({
      fullName: z.string().min(2, 'Full name is required'),
      phone: pakistaniPhone,
      address: z.string().min(10, 'Complete address is required'),
      city: z.string().min(2, 'City is required'),
      postalCode: z.string().regex(/^[0-9]{5}$/, 'Invalid postal code'),
    }),
    paymentMethod: z.enum(['cod', 'bank', 'easypaisa', 'jazzcash']),
  }),

  createProduct: z.object({
    name: z.string().min(2, 'Product name must be at least 2 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    price: z.number().min(1, 'Price must be greater than 0'),
    category: z.string().min(1, 'Category is required'),
    images: z.array(z.string().url()).min(1, 'At least one image is required'),
    stock: z.number().int().min(0, 'Stock cannot be negative'),
    isActive: z.boolean().default(true),
  }),
};

// Blog schemas
export const blogSchemas = {
  createPost: z.object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title too long'),
    content: z.string().min(50, 'Content must be at least 50 characters'),
    excerpt: z.string().max(300, 'Excerpt too long').optional(),
    slug: z.string().regex(/^[a-z0-9-]+$/, 'Invalid slug format').optional(),
    categoryId: z.string().cuid('Invalid category ID'),
    tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').optional(),
    featuredImage: z.string().url().optional(),
    isPublished: z.boolean().default(false),
  }),

  createComment: z.object({
    content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment too long'),
    postId: z.string().cuid('Invalid post ID'),
  }),
};

// Admin schemas
export const adminSchemas = {
  createUser: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: strongPassword,
    role: z.enum(['USER', 'ADMIN']).default('USER'),
    isActive: z.boolean().default(true),
  }),

  updateCommissionSettings: z.object({
    level: z.number().int().min(1).max(5),
    rate: z.number().min(0).max(1, 'Rate must be between 0 and 1'),
    description: z.string().optional(),
    isActive: z.boolean().default(true),
  }),

  createNotification: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    message: z.string().min(1, 'Message is required').max(1000, 'Message too long'),
    type: z.enum(['info', 'success', 'warning', 'error']).default('info'),
    audience: z.enum(['all', 'users', 'admins', 'specific']).default('all'),
    recipientId: z.string().cuid().optional(),
    scheduledFor: z.string().datetime().optional(),
    expiresAt: z.string().datetime().optional(),
  }),
};

// Generic validation helpers
export const validateRequest = async <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<{ success: true; data: T } | { success: false; errors: string[] }> => {
  try {
    const validData = await schema.parseAsync(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
};

// Middleware helper for API routes
export const withValidation = <T>(schema: z.ZodSchema<T>) => {
  return async (data: unknown) => {
    const result = await validateRequest(schema, data);
    if (!result.success) {
      const errors = 'errors' in result ? result.errors : ['Validation failed'];
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    return result.data;
  };
};
