# 🔄 API Routes Migration - Complete Summary

## 📊 Migration Strategy

**Original Setup**:
- Using Prisma ORM
- SQLite database (local)
- Callback-based async operations

**New Setup**:
- Using Supabase Client
- PostgreSQL database (cloud)
- Promise-based async operations

---

## 🎯 What Needs to Change

### **1. Imports**
```typescript
// Before (Prisma)
import { prisma } from '@/lib/prisma';

// After (Supabase)
import { supabase } from '@/lib/supabase';
```

### **2. Query Syntax**
```typescript
// Before (Prisma)
const user = await prisma.user.findUnique({
  where: { id: userId }
});

// After (Supabase)
const { data: user, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();
```

### **3. Error Handling**
```typescript
// Before (Prisma)
if (!user) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

// After (Supabase)
if (error || !user) {
  console.error('Error:', error);
  return NextResponse.json({ error: error?.message || 'Not found' }, { status: 404 });
}
```

---

## 📋 API Routes to Update

### **Priority 1: Critical Routes** (Update First)

**Auth Routes** (Already using Supabase ✅):
```
✅ src/app/api/auth/login/route.ts
✅ src/app/api/auth/register/route.ts
✅ src/app/api/auth/logout/route.ts
```

**Product Routes** (Partially done):
```
✅ src/app/api/products/[id]/route.ts (Already updated)
❌ src/app/api/products/route.ts (Needs update)
✅ src/app/api/products/categories/route.ts (Already updated)
```

**Cart & Order Routes**:
```
✅ src/app/api/cart/route.ts (Mock - needs Supabase)
✅ src/app/api/orders/route.ts (Mock - needs Supabase)
✅ src/app/api/favorites/route.ts (Mock - needs Supabase)
```

---

### **Priority 2: Admin Routes**

**Admin Product Management**:
```
❌ src/app/api/admin/products/route.ts
❌ src/app/api/admin/products/[id]/route.ts
✅ src/app/api/admin/products/categories/route.ts
```

**Admin Order Management**:
```
❌ src/app/api/admin/orders/route.ts
❌ src/app/api/admin/orders/[id]/route.ts
```

**Admin User Management**:
```
❌ src/app/api/admin/users/route.ts
❌ src/app/api/admin/users/[id]/route.ts
```

**Admin Dashboard**:
```
❌ src/app/api/admin/dashboard-stats/route.ts
```

---

### **Priority 3: User Routes**

**User Profile**:
```
❌ src/app/api/user/profile/route.ts
❌ src/app/api/user/stats/route.ts
❌ src/app/api/user/wallet/route.ts
```

**User Tasks**:
```
❌ src/app/api/tasks/route.ts
❌ src/app/api/tasks/[id]/route.ts
```

**User Referrals**:
```
❌ src/app/api/referrals/route.ts
❌ src/app/api/commissions/route.ts
```

---

### **Priority 4: Other Routes**

**Blog Routes**:
```
❌ src/app/api/blog/posts/route.ts
❌ src/app/api/blog/categories/route.ts
❌ src/app/api/blog/comments/route.ts
```

**Social Routes**:
```
❌ src/app/api/social/posts/route.ts
❌ src/app/api/social/comments/route.ts
❌ src/app/api/social/likes/route.ts
```

**Payment Routes**:
```
❌ src/app/api/payment/manual-payment/route.ts
❌ src/app/api/payment/methods/route.ts
```

---

## 🔧 Update Pattern

### **Step-by-Step for Each Route**:

1. **Find the file**
2. **Replace import statement**
3. **Update all database queries**
4. **Fix error handling**
5. **Test the endpoint**

### **Example Transformation**:

#### **Before (Prisma)**:
```typescript
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const products = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      include: { category: true }
    });

    return NextResponse.json({ products });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
```

#### **After (Supabase)**:
```typescript
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        category:product_categories(*)
      `)
      .eq('status', 'ACTIVE');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ products: products || [] });
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products', details: error?.message },
      { status: 500 }
    );
  }
}
```

---

## 📊 Estimated Time

| Priority | Routes | Time per Route | Total |
|----------|--------|----------------|-------|
| 1 | 10 routes | 2 min | 20 min |
| 2 | 10 routes | 2 min | 20 min |
| 3 | 10 routes | 2 min | 20 min |
| 4 | 15 routes | 2 min | 30 min |
| **Total** | **~45 routes** | **2 min** | **~90 min** |

**Optimized**: میں patterns استعمال کروں گا، so actual time: **~30-40 minutes**

---

## ✅ Success Criteria

**Each route should**:
- ✅ Import supabase correctly
- ✅ Use proper Supabase query syntax
- ✅ Handle errors properly
- ✅ Return correct response format
- ✅ Work with existing frontend code

---

## 🚀 Start Order

1. ✅ Products routes (high priority)
2. ✅ Cart/Orders routes (e-commerce critical)
3. ✅ Admin routes (management critical)
4. ✅ User routes (user experience)
5. ✅ Blog/Social routes (content)
6. ✅ Payment routes (transactions)

---

**Status**: Ready to start updating! 🚀
**Current**: Starting with Priority 1 routes...
