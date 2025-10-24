# Social Module Testing & Fixing Plan

**Date**: October 23, 2025  
**Status**: IN PROGRESS  
**Objective**: Fix social module APIs and test all workflows

---

## 🔴 Current Issues Found

### Authentication Issues
- ❌ Multiple social APIs using `getServerSession` (old NextAuth)
- ❌ Should use `getSession` (custom session)
- ❌ Affects: Posts, Friend Requests, Friends, Follow, Comments, etc.

### Database Issues
- ❌ Some APIs still using Prisma
- ❌ Should use Supabase
- ❌ Missing Supabase table references

### Error Messages from Console
```
[ERROR] Error fetching profile: {}
[ERROR] 📊 Dashboard: API error response: {"error":"User not found. Please log in again.","sessionUserId":"admin-83558762dc9b4f49a6dd94eb983cf8ff","sessionUserEmail":"admin@mlmpk.com"}
[ERROR] 📊 Dashboard: Error fetching user stats: {}
[ERROR] Error fetching profile: {}
[ERROR] EventSource error: {"isTrusted":true}
[ERROR] Error fetching posts: {}
```

---

## 📋 Social APIs to Fix

### Priority 1: Core APIs (Critical)
1. ❌ `/api/social/posts` - getServerSession → getSession
2. ❌ `/api/social/posts/[id]` - getServerSession → getSession
3. ❌ `/api/social/profile/[username]` - Already using getSession ✅
4. ❌ `/api/social/friend-requests` - getServerSession → getSession
5. ❌ `/api/social/friends` - getServerSession → getSession

### Priority 2: Secondary APIs
6. ❌ `/api/social/follow` - getServerSession → getSession
7. ❌ `/api/social/posts/[id]/comments` - getServerSession → getSession
8. ❌ `/api/social/posts/[id]/like` - getServerSession → getSession
9. ❌ `/api/social/posts/[id]/favorite` - getServerSession → getSession
10. ❌ `/api/social/posts/[id]/react` - getServerSession → getSession

### Priority 3: Additional APIs
11. ❌ `/api/social/achievements` - getServerSession → getSession
12. ❌ `/api/social/groups` - getServerSession → getSession
13. ❌ `/api/social/suggestions` - getServerSession → getSession
14. ❌ `/api/social/team` - getServerSession → getSession
15. ❌ `/api/social/users` - getServerSession → getSession

---

## 🧪 Testing Workflow

### Test 1: Create Text Post
```
1. Navigate to: http://127.0.0.1:3000/social
2. Click "Create Post"
3. Enter text: "Testing text post"
4. Click "Post"
✅ Expected: Post appears in feed
```

### Test 2: Create Image Post
```
1. Click "Create Post"
2. Select image from device
3. Add caption: "Testing image post"
4. Click "Post"
✅ Expected: Post with image appears in feed
```

### Test 3: Create Video Post
```
1. Click "Create Post"
2. Select video from device
3. Add caption: "Testing video post"
4. Click "Post"
✅ Expected: Post with video appears in feed
```

### Test 4: Add Comment
```
1. Click on any post
2. Click "Add Comment"
3. Enter comment text
4. Click "Post Comment"
✅ Expected: Comment appears under post
```

### Test 5: Send Friend Request
```
1. Search for another user
2. Click "Add Friend"
3. Confirm friend request
✅ Expected: Friend request sent notification
```

### Test 6: View Profile
```
1. Click on user avatar/name
2. View profile page
✅ Expected: User profile loads with posts, followers, etc.
```

### Test 7: Notifications
```
1. Check notification bell icon
2. View all notifications
✅ Expected: Notifications load and display correctly
```

### Test 8: Send Messages
```
1. Click "Messages" or chat icon
2. Select user to message
3. Send text message
4. Send image
5. Send video
6. Send audio
✅ Expected: All messages send and display correctly
```

---

## 🔧 Fix Strategy

### Step 1: Fix Authentication (All Social APIs)
Replace all instances of:
```typescript
// OLD
import { getServerSession } from '@/lib/session'
const session = await getServerSession()

// NEW
import { getSession } from '@/lib/session'
const session = await getSession()
```

### Step 2: Verify Supabase Tables
Ensure these tables exist in Supabase:
- [ ] `social_posts`
- [ ] `social_comments`
- [ ] `social_likes`
- [ ] `social_follows`
- [ ] `social_friend_requests`
- [ ] `social_messages`
- [ ] `social_notifications`
- [ ] `users`

### Step 3: Test Each Workflow
Run through all 8 test workflows above

### Step 4: Fix Bugs Found
Document and fix any errors encountered

---

## 📊 Files to Fix

### getServerSession → getSession (24 files)
1. `src/app/api/social/friend-requests/route.ts`
2. `src/app/api/social/posts/[id]/route.ts`
3. `src/app/api/social/achievements/route.ts`
4. `src/app/api/social/follow/route.ts`
5. `src/app/api/social/friend-requests/[id]/route.ts`
6. `src/app/api/social/friends/route.ts`
7. `src/app/api/social/groups/route.ts`
8. `src/app/api/social/posts/[id]/comments/route.ts`
9. `src/app/api/social/posts/[id]/favorite/route.ts`
10. `src/app/api/social/posts/[id]/mute/route.ts`
11. `src/app/api/social/posts/[id]/pin/route.ts`
12. `src/app/api/social/posts/[id]/like/route.ts`
13. `src/app/api/social/posts/[id]/privacy/route.ts`
14. `src/app/api/social/posts/[id]/react/route.ts`
15. `src/app/api/social/posts/[id]/share/route.ts`
16. `src/app/api/social/posts/route-new.ts`
17. `src/app/api/social/suggestions/route.ts`
18. `src/app/api/social/team/route.ts`
19. `src/app/api/social/users/route.ts`
20. `src/app/api/social/posts/[id]/like/route.ts`
21. `src/app/api/social/report/route.ts`
22. `src/app/api/social/seed/route.ts`
23. `src/app/api/social/users/[id]/block/route.ts`
24. `src/app/api/social/users/[id]/report/route.ts`

---

## 🎯 Next Steps

1. ✅ Fix `/api/social/posts` - DONE
2. ⏳ Fix remaining 23 social APIs
3. ⏳ Test all workflows
4. ⏳ Fix any bugs found
5. ⏳ Verify Supabase connectivity

---

## 📝 Notes

- Social module uses demo data currently
- Need to verify Supabase tables exist
- Some APIs might need Prisma → Supabase migration
- Testing requires logged-in user
- All media uploads need proper handling

---

**Status**: Ready to proceed with fixes  
**Estimated Time**: 2-3 hours for complete fix and testing
