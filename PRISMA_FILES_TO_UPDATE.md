# 🎯 Prisma Files to Update - Final List

## ✅ میں نے identify کر لیا

**Total Files**: 21 files still using Prisma
**Time Estimate**: ~40-50 minutes

---

## 📋 Files List

### **Admin Payment Routes** (7 files)
```
1. src/app/api/admin/payment-confirmations/[id]/route.ts
2. src/app/api/admin/payment-methods/[id]/route.ts
3. src/app/api/admin/payment-settings/[id]/route.ts
4. src/app/api/admin/payment-settings/route.ts
5. src/app/api/admin/payments/approve/route.ts
6. src/app/api/admin/payments/reject/route.ts
7. src/app/api/admin/payments/route.ts
```

### **Admin User Routes** (2 files)
```
8. src/app/api/admin/users/route.ts
9. src/app/api/admin/users/task-control/route.ts
```

### **Task Routes** (2 files)
```
10. src/app/api/tasks/complete/route.ts
11. src/app/api/tasks/daily-assignment/route.ts
```

### **Social Routes** (2 files)
```
12. src/app/api/social/profile/[username]/route.ts
13. src/app/api/social/users/[id]/route.ts
```

### **Payment Routes** (2 files)
```
14. src/app/api/payment-methods/route.ts
15. src/app/api/payment/manual-payment/route.ts
```

### **User Routes** (1 file)
```
16. src/app/api/user/payment-confirmation/route.ts
```

### **Message Routes** (1 file)
```
17. src/app/api/messages/read/route.ts
```

### **Notification Routes** (1 file)
```
18. src/app/api/notifications/sse/route.ts
```

### **Other Routes** (4 files)
```
19. src/app/api/contact/route.ts
20. src/app/api/errors/report/route.ts
21. src/app/api/partnership/stats/route.ts
```

---

## 🔧 Update Strategy

### **Pattern for Each File**:
1. Replace import: `import { prisma }` → `import { supabase }`
2. Update queries: `prisma.table.method()` → `supabase.from('table').method()`
3. Fix error handling
4. Test

### **Batch Update**:
- میں groups میں update کروں گا
- ہر batch کے بعد test کروں گا
- تیزی سے کروں گا

---

## ⏱️ Time Estimate

| Category | Files | Time/File | Total |
|----------|-------|-----------|-------|
| Payment | 7 | 2 min | 14 min |
| Admin/User | 2 | 2 min | 4 min |
| Tasks | 2 | 2 min | 4 min |
| Social | 2 | 2 min | 4 min |
| Other | 8 | 2 min | 16 min |
| **Total** | **21** | **2 min** | **~42 min** |

---

## 🚀 Update Order

1. ✅ Payment routes (most critical)
2. ✅ Admin/User routes
3. ✅ Task routes
4. ✅ Social routes
5. ✅ Other routes

---

**Status**: شروع کرنے کے لیے تیار!
**Next**: Payment routes سے شروع کرتا ہوں...
