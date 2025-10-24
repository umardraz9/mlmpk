# Admin Pages Testing & Fixing Plan

**Date**: October 23, 2025  
**Status**: IN PROGRESS  
**Objective**: Test all admin pages and fix database connectivity issues

---

## Pages to Test & Fix

### 1. ✅ /admin/payments
- **Status**: API exists but using Prisma/NextAuth
- **Issue**: Still using old authentication
- **Fix**: Update to use Supabase + custom session

### 2. ✅ /admin/withdrawals
- **Status**: API exists but using Prisma/NextAuth
- **Issue**: Still using old authentication
- **Fix**: Update to use Supabase + custom session

### 3. ✅ /admin/finance
- **Status**: Need to check
- **Issue**: Unknown
- **Fix**: TBD

### 4. ✅ /admin/analytics/users
- **Status**: Need to check
- **Issue**: Unknown
- **Fix**: TBD

### 5. ✅ /admin/analytics/products
- **Status**: Need to check
- **Issue**: Unknown
- **Fix**: TBD

### 6. ✅ /admin/more
- **Status**: Need to check
- **Issue**: Unknown
- **Fix**: TBD

---

## API Migration Status

### Already Fixed ✅
- `/api/admin/orders` - Supabase + custom session
- `/api/admin/orders/[id]` - Supabase + custom session
- `/api/admin/dashboard-stats` - Supabase + custom session

### Need to Fix ⏳
- `/api/admin/payments` - Still using Prisma/NextAuth
- `/api/admin/withdrawals` - Still using Prisma/NextAuth
- `/api/admin/finance/*` - Unknown status
- `/api/admin/analytics/*` - Unknown status

---

## Common Issues Found

1. **Authentication**: Using `getServerSession(authOptions)` instead of `getSession()`
2. **Database**: Using Prisma instead of Supabase
3. **Session Check**: Using `session?.user?.isAdmin` but should be consistent

---

## Fix Template

### Before (Old)
```typescript
import { getServerSession } from 'next-auth'
import { db as prisma } from '@/lib/db'

const session = await getServerSession(authOptions)
if (!session?.user?.isAdmin) return 401

const data = await prisma.table.findMany({...})
```

### After (New)
```typescript
import { getSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'

const session = await getSession()
if (!session?.user?.isAdmin) return 401

const { data } = await supabase.from('table').select('*')
```

---

## Testing Checklist

- [ ] /admin/payments - Load page
- [ ] /admin/payments - View payments list
- [ ] /admin/payments - Search functionality
- [ ] /admin/payments - Filter by status
- [ ] /admin/payments - Approve payment button
- [ ] /admin/payments - Reject payment button

- [ ] /admin/withdrawals - Load page
- [ ] /admin/withdrawals - View withdrawals list
- [ ] /admin/withdrawals - Search functionality
- [ ] /admin/withdrawals - Filter by status
- [ ] /admin/withdrawals - Approve withdrawal button
- [ ] /admin/withdrawals - Reject withdrawal button

- [ ] /admin/finance - Load page
- [ ] /admin/finance - View financial data
- [ ] /admin/finance - All buttons working

- [ ] /admin/analytics/users - Load page
- [ ] /admin/analytics/users - View user analytics
- [ ] /admin/analytics/users - All filters working

- [ ] /admin/analytics/products - Load page
- [ ] /admin/analytics/products - View product analytics
- [ ] /admin/analytics/products - All filters working

- [ ] /admin/more - Load page
- [ ] /admin/more - All sections loading
- [ ] /admin/more - All buttons working

---

## Database Verification

- [ ] Supabase connection working
- [ ] All tables accessible
- [ ] No RLS policy issues
- [ ] Data loading correctly

---

## Next Steps

1. Fix all remaining APIs to use Supabase
2. Update authentication to use custom session
3. Test each page thoroughly
4. Verify database connectivity
5. Document any remaining issues

---

**Priority**: HIGH  
**Timeline**: Immediate  
**Owner**: Development Team
