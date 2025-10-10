# Social Page Testing Guide
## Step-by-Step Feature Verification

## 🚀 Quick Start

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Access the Optimized Page

**Option A**: Replace existing page (recommended for testing)
```bash
# Backup original
copy src\app\social\page.tsx src\app\social\page-original.tsx

# Use optimized version
copy src\app\social\page-optimized-v2.tsx src\app\social\page.tsx
```

**Option B**: Create separate route
```bash
# Rename optimized file
move src\app\social\page-optimized-v2.tsx src\app\social-v2\page.tsx

# Access at: http://localhost:3000/social-v2
```

### 3. Login with Test Account
- Email: `admin@mcnmart.com`
- Password: `admin123`

---

## ✅ Feature Testing Checklist

### Core Functionality Tests

#### 1. **Page Load Performance**
- [ ] Open browser DevTools (F12)
- [ ] Go to Console tab
- [ ] Navigate to `http://localhost:3000/social`
- [ ] Check console for performance metrics:
  ```
  📊 Performance Metrics - Social Page (Optimized)
  ├─ First Contentful Paint: <1.5s
  ├─ Largest Contentful Paint: <2.5s
  └─ Page Load Time: <3.0s
  ```
- [ ] Verify no errors in console
- [ ] Check Network tab: Should see 1 EventSource connection

#### 2. **Post Creation**
- [ ] Click on "What's on your mind?" text area
- [ ] Type a test message: "Testing optimized social page! 🎉"
- [ ] Select post type (General, Achievement, Tip, etc.)
- [ ] Click "Post" button
- [ ] Verify:
  - [ ] Loading spinner appears
  - [ ] Post appears at top of feed
  - [ ] New post has your avatar and name
  - [ ] Post has correct timestamp

#### 3. **Image Upload**
- [ ] Click "What's on your mind?"
- [ ] Click image upload button
- [ ] Select 1-3 images from your computer
- [ ] Add caption: "Testing image upload"
- [ ] Click "Post"
- [ ] Verify:
  - [ ] Images appear in post
  - [ ] Images load properly
  - [ ] Can click to view full size (if implemented)

#### 4. **Like Functionality**
- [ ] Find any post in feed
- [ ] Click the "Like" button (heart icon)
- [ ] Verify:
  - [ ] Heart turns blue/filled
  - [ ] Like count increases by 1
  - [ ] Click again to unlike
  - [ ] Heart returns to outline
  - [ ] Like count decreases by 1
- [ ] Check Network tab: Only 1 API call per click

#### 5. **Comment Functionality**
- [ ] Click "Comment" on any post
- [ ] Type: "Great post! Testing comments."
- [ ] Press Enter or click Submit
- [ ] Verify:
  - [ ] Comment appears below post
  - [ ] Your avatar shows next to comment
  - [ ] Comment count updates
  - [ ] Timestamp is accurate

#### 6. **Share Functionality**
- [ ] Click "Share" button on any post
- [ ] **If mobile/supported browser:**
  - [ ] Native share dialog appears
  - [ ] Can share to apps
- [ ] **If desktop:**
  - [ ] Link copied to clipboard
  - [ ] Success message appears

#### 7. **Infinite Scroll**
- [ ] Scroll down the feed
- [ ] Watch for:
  - [ ] Posts load automatically before reaching bottom
  - [ ] Loading spinner appears briefly
  - [ ] 15 new posts load per batch
  - [ ] No "Load More" button needed
  - [ ] Smooth scrolling (60 FPS)
  - [ ] Discovery content (Friends/Reels) appears every 5 posts

---

### Real-Time Features Tests

#### 8. **Message Notifications**
- [ ] Open two browser windows (or tabs)
- [ ] Login to both with different accounts
- [ ] Send a message from one account to the other
- [ ] Verify in receiving account:
  - [ ] Red notification badge appears on Messages icon
  - [ ] Badge shows correct unread count
  - [ ] Badge updates without page refresh

#### 9. **EventSource Connection (Single Connection Test)**
- [ ] Open DevTools → Network tab
- [ ] Filter by "EventSource" or "stream"
- [ ] Navigate to social page
- [ ] Verify:
  - [ ] **Only 1 EventSource connection** (not 3-5)
  - [ ] Connection status: "pending" (keeps alive)
  - [ ] Messages streaming in SSE tab

#### 10. **Real-Time Post Updates**
- [ ] Open social page
- [ ] In another tab/browser, create a new post
- [ ] Return to original tab
- [ ] Verify:
  - [ ] New post appears automatically
  - [ ] No manual refresh needed
  - [ ] Happens within 5 seconds

---

### Performance Tests

#### 11. **Bundle Size Check**
```bash
# Run build and analyze
npm run build
npm run analyze:bundle
```
- [ ] Check output for bundle sizes:
  - [ ] Main bundle: < 300KB
  - [ ] Social page chunk: < 100KB
  - [ ] No warnings about large chunks

#### 12. **Network Request Reduction**
- [ ] Open DevTools → Network tab
- [ ] Clear network log
- [ ] Load social page
- [ ] **Initial Load:**
  - [ ] Count requests: Should be 10-15 (not 18+)
  - [ ] Check EventSource connections: **Should be 1** (critical!)
  
- [ ] **Wait 5 minutes on page:**
  - [ ] Count background requests
  - [ ] Should be < 15 requests (not 35+)

#### 13. **Memory Usage Test**
- [ ] Open DevTools → Memory tab
- [ ] Take heap snapshot (Baseline)
- [ ] Scroll through 50+ posts
- [ ] Like, comment, create posts
- [ ] Take another snapshot (After usage)
- [ ] Compare:
  - [ ] Memory increase should be < 50MB
  - [ ] No significant memory leaks

#### 14. **Mobile Performance**
- [ ] Open DevTools
- [ ] Toggle device toolbar (Ctrl+Shift+M)
- [ ] Select "iPhone 14" or similar
- [ ] Throttle network to "Fast 3G"
- [ ] Reload page
- [ ] Verify:
  - [ ] Page loads in < 3s
  - [ ] Smooth scrolling (no jank)
  - [ ] Touch interactions responsive
  - [ ] Mobile menu works

---

### Caching Tests

#### 15. **SessionStorage Caching**
- [ ] Load social page
- [ ] Open DevTools → Application → Storage → Session Storage
- [ ] Look for keys like: `social-posts-v2-{userId}`
- [ ] Verify:
  - [ ] Posts are cached
  - [ ] Timestamp is stored
  - [ ] Navigate away and back
  - [ ] Posts load instantly from cache

#### 16. **Cache Invalidation**
- [ ] Load social page (posts cached)
- [ ] Create a new post
- [ ] Verify:
  - [ ] Cache is invalidated
  - [ ] Fresh posts fetched from API
  - [ ] New post appears

---

### Navigation Tests

#### 17. **Header Navigation**
- [ ] Click each nav icon in header:
  - [ ] Home (house icon) → /social
  - [ ] People (users icon) → /social/people
  - [ ] Videos (video icon) → /social/reels
  - [ ] Store (shopping bag) → /products
  - [ ] Dashboard (grid icon) → /dashboard
- [ ] Verify all navigate correctly

#### 18. **Sidebar Navigation**
- [ ] Desktop: Verify left sidebar visible
- [ ] Click each menu item:
  - [ ] Profile → /social/profile
  - [ ] Friends → /social/people
  - [ ] Messenger → /messages
  - [ ] etc.
- [ ] Mobile: Click FAB button (bottom right)
- [ ] Verify sidebar drawer opens

---

### Error Handling Tests

#### 19. **API Error Handling**
- [ ] Disconnect internet
- [ ] Try to create a post
- [ ] Verify:
  - [ ] Error message appears
  - [ ] User can retry
  - [ ] No console errors crash app

#### 20. **Image Load Errors**
- [ ] Find post with broken image URL
- [ ] Verify:
  - [ ] Fallback image appears
  - [ ] Or graceful degradation
  - [ ] No broken image icon

---

## 📊 Performance Benchmarks

### Expected Results

| Test | Target | Pass Criteria |
|------|--------|---------------|
| **Initial Load** | < 2s | FCP < 1.5s, LCP < 2.5s |
| **EventSource Connections** | 1 | Exactly 1 connection in Network tab |
| **Initial API Calls** | < 15 | Count in Network tab |
| **Background Requests (5min)** | < 15 | Count in Network tab |
| **Bundle Size** | < 300KB | Check analyze:bundle output |
| **Memory Usage** | < 50MB increase | DevTools Memory profiler |
| **Scroll FPS** | > 55 FPS | DevTools Performance tab |

---

## 🐛 Common Issues & Solutions

### Issue: "Multiple EventSource connections"
**Symptom**: Network tab shows 2+ stream connections
**Fix**: 
1. Check if old components are still imported
2. Verify using `OptimizedSocialHeader` not `ModernSocialHeader`
3. Clear browser cache and hard reload

### Issue: "Posts not loading"
**Symptom**: Feed shows "No posts" but should have content
**Fix**:
1. Check console for API errors
2. Verify you're logged in
3. Check `/api/social/posts` endpoint works
4. Clear sessionStorage

### Issue: "Real-time updates not working"
**Symptom**: New posts don't appear automatically
**Fix**:
1. Check EventSource connection in Network tab
2. Verify `/api/notifications/stream` endpoint is accessible
3. Check browser console for connection errors

---

## ✅ Sign-Off Checklist

Before marking as "fully tested":

### Functionality
- [ ] All core features work (create, like, comment, share)
- [ ] Real-time updates functional
- [ ] Navigation works (header, sidebar, mobile)
- [ ] Error handling graceful

### Performance
- [ ] Page loads in < 2s (Fast 3G)
- [ ] Only 1 EventSource connection
- [ ] < 15 background requests in 5min
- [ ] Smooth scrolling (> 55 FPS)

### Mobile
- [ ] Responsive on all screen sizes
- [ ] Touch interactions work
- [ ] Mobile menu functional
- [ ] Performance acceptable on slow network

### Code Quality
- [ ] No console errors
- [ ] No memory leaks
- [ ] No broken features
- [ ] Proper cleanup on unmount

---

## 📝 Test Report Template

```markdown
# Social Page Optimization Test Report

**Tester**: [Your Name]
**Date**: [Date]
**Environment**: [Browser, OS, Network]

## Performance Metrics
- FCP: ___ s
- LCP: ___ s  
- TTI: ___ s
- EventSource Connections: ___
- Initial API Calls: ___

## Features Tested
- [ ] Post Creation: PASS/FAIL
- [ ] Like/Comment: PASS/FAIL
- [ ] Infinite Scroll: PASS/FAIL
- [ ] Real-time Updates: PASS/FAIL
- [ ] Mobile Responsive: PASS/FAIL

## Issues Found
1. [Issue description]
2. [Issue description]

## Overall Result
**PASS** / **FAIL** / **PASS WITH ISSUES**

## Notes
[Any additional observations]
```

---

**Ready to Test!** Follow this guide step-by-step to verify all optimizations. 🎉
