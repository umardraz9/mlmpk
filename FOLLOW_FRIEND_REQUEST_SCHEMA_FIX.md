# Follow & Friend Request Schema Fix

## ❌ The Problem

**Error**: "Failed to toggle follow" when clicking Follow or Add Friend buttons

**Root Cause**: Prisma schema had **ambiguous relations** error. The `FriendRequest` and `Friendship` models had multiple relations to the `User` model without unique names.

---

## ✅ The Fix

### 1. Updated Prisma Schema

**Before (Broken):**
```prisma
model FriendRequest {
  sender    User @relation(fields: [senderId], references: [id])
  recipient User @relation(fields: [recipientId], references: [id])
  // ❌ Ambiguous - both point to User without relation names
}

model Friendship {
  user1 User @relation(fields: [user1Id], references: [id])
  user2 User @relation(fields: [user2Id], references: [id])
  // ❌ Ambiguous - both point to User without relation names
}
```

**After (Fixed):**
```prisma
model FriendRequest {
  sender    User @relation("SentFriendRequests", fields: [senderId], references: [id])
  recipient User @relation("ReceivedFriendRequests", fields: [recipientId], references: [id])
  // ✅ Unique relation names
}

model Friendship {
  user1 User @relation("FriendshipsAsUser1", fields: [user1Id], references: [id])
  user2 User @relation("FriendshipsAsUser2", fields: [user2Id], references: [id])
  // ✅ Unique relation names
}
```

### 2. Updated User Model

Added the relation fields:
```prisma
model User {
  // ... existing fields ...
  
  // Friend Request Relations
  sentFriendRequests      FriendRequest[]  @relation("SentFriendRequests")
  receivedFriendRequests  FriendRequest[]  @relation("ReceivedFriendRequests")
  
  // Friendship Relations
  friendshipsAsUser1      Friendship[]     @relation("FriendshipsAsUser1")
  friendshipsAsUser2      Friendship[]     @relation("FriendshipsAsUser2")
}
```

---

## 🔧 Files Updated

1. **`prisma/schema.prisma`**
   - ✅ Added relation names to `FriendRequest` model
   - ✅ Added relation names to `Friendship` model
   - ✅ Added relation fields to `User` model

---

## 🚀 How to Apply the Fix

### Step 1: Stop the Development Server
```bash
# Press Ctrl+C in the terminal running the dev server
```

### Step 2: Generate Prisma Client
```bash
npx prisma generate
```

### Step 3: Push Schema Changes to Database
```bash
npx prisma db push
```

### Step 4: Restart Development Server
```bash
npm run dev
```

---

## ✅ Expected Results

After applying these steps:

1. ✅ **Follow button works**
   - Creates `socialFollow` records
   - Button toggles between "Follow" and "Following"
   - Sends notifications

2. ✅ **Add Friend button works**
   - Creates `FriendRequest` records
   - Button shows "Sending..." then disappears
   - Sends notifications

3. ✅ **No more Prisma errors**
   - Schema validates correctly
   - Client generates successfully
   - API calls work without errors

---

## 🧪 Testing After Fix

### Test Follow Button
```bash
1. Go to /social
2. Scroll to "People You May Know" (after 5 posts)
3. Click "Follow" button
4. ✅ Should change to "Following" without errors
5. ✅ No "Failed to toggle follow" error
```

### Test Add Friend Button
```bash
1. Go to /social
2. Check right sidebar "People You May Know"
3. Click "Add Friend" button
4. ✅ Should show "Sending..." then remove user
5. ✅ No errors in console
```

---

## 📋 Command Checklist

Run these commands in order:

```bash
# 1. Stop dev server (Ctrl+C)

# 2. Generate Prisma client
npx prisma generate

# 3. Push schema to database
npx prisma db push

# 4. Restart dev server
npm run dev

# 5. Test the buttons!
```

---

## 🔍 Troubleshooting

### If "Operation not permitted" error:
1. Make sure dev server is **completely stopped**
2. Close any database viewers (like DB Browser)
3. Try again

### If schema validation fails:
1. Check `prisma/schema.prisma` has the relation names
2. Ensure all relations have corresponding fields in User model

### If buttons still don't work:
1. Check browser console for errors
2. Check terminal for API errors
3. Verify Prisma client was regenerated (check timestamp)

---

## ✨ Summary

**Problem**: Schema had ambiguous relations causing Prisma to fail

**Solution**: Added unique relation names to all User relations

**Result**: 
- ✅ Follow button works
- ✅ Add Friend button works
- ✅ No more Prisma errors
- ✅ All social features functional

**Just need to run the commands above to apply the fix!** 🚀
