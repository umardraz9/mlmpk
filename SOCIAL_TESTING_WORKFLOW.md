# Social Module - Complete Testing Workflow

**Date**: October 23, 2025  
**Status**: Ready for Testing  
**All 24 APIs Fixed**: ✅

---

## 🚀 Quick Start

### Step 1: Restart Dev Server
```bash
npm run dev
```
Wait for: `✓ Compiled successfully`

### Step 2: Login as User
```
URL: http://127.0.0.1:3000/auth/login
Email: sultan@mcnmart.com
Password: 12345678
```

### Step 3: Navigate to Social
```
URL: http://127.0.0.1:3000/social
```

---

## 🧪 Test Workflow 1: Create Text Post

### Steps
1. Navigate to `/social`
2. Look for "Create Post" button/input
3. Enter text: "Testing text post from MLM-Pak social platform! 🎉"
4. Click "Post" button

### Expected Results
- ✅ Post appears in feed immediately
- ✅ Shows your avatar and name
- ✅ Shows timestamp
- ✅ Shows like/comment/share buttons
- ✅ No errors in console

### If Error Occurs
- Check console (F12) for error message
- Check Network tab for failed API call
- Verify session is active
- Report error with screenshot

---

## 🧪 Test Workflow 2: Create Image Post

### Steps
1. On social page, click "Create Post"
2. Click "Add Image" or image icon
3. Select image from device (JPG, PNG, etc.)
4. Add caption: "Beautiful product showcase! 📸"
5. Click "Post" button

### Expected Results
- ✅ Image uploads successfully
- ✅ Post appears with image in feed
- ✅ Image displays correctly
- ✅ Caption shows below image
- ✅ No upload errors

### If Error Occurs
- Check file size (should be < 5MB)
- Check file format (JPG, PNG, GIF)
- Check browser console for upload error
- Verify `/public/uploads/` directory exists

---

## 🧪 Test Workflow 3: Create Video Post

### Steps
1. On social page, click "Create Post"
2. Click "Add Video" or video icon
3. Select video from device (MP4, WebM, etc.)
4. Add caption: "Amazing team building video! 🎬"
5. Click "Post" button

### Expected Results
- ✅ Video uploads successfully
- ✅ Post appears with video player in feed
- ✅ Video plays correctly
- ✅ Caption shows below video
- ✅ No upload errors

### If Error Occurs
- Check file size (should be < 50MB)
- Check file format (MP4, WebM, MOV)
- Check browser console for upload error
- Verify video codec compatibility

---

## 🧪 Test Workflow 4: Add Comment to Post

### Steps
1. Find any post in feed
2. Click "Comments" or comment icon
3. Click "Add Comment" input
4. Type comment: "Great post! Love this content! 👍"
5. Click "Post Comment" button

### Expected Results
- ✅ Comment appears under post
- ✅ Shows your name and avatar
- ✅ Shows timestamp
- ✅ Comment count increases
- ✅ No errors in console

### If Error Occurs
- Check if post ID is valid
- Verify you're logged in
- Check console for error message
- Verify comment text is not empty

---

## 🧪 Test Workflow 5: Like/React to Post

### Steps
1. Find any post in feed
2. Click "Like" button (heart icon)
3. Try other reactions if available (love, laugh, wow, sad, angry)
4. Click like again to unlike

### Expected Results
- ✅ Like button changes color/style
- ✅ Like count increases
- ✅ Unlike removes like
- ✅ Like count decreases
- ✅ No errors in console

### If Error Occurs
- Check if post exists
- Verify post is not deleted
- Check console for error message
- Verify session is active

---

## 🧪 Test Workflow 6: Send Friend Request

### Steps
1. Look for "Suggestions" or "Users" section
2. Find another user to add
3. Click "Add Friend" button
4. Confirm friend request

### Expected Results
- ✅ Friend request sent successfully
- ✅ Button changes to "Request Sent" or similar
- ✅ Notification appears (if enabled)
- ✅ No errors in console

### If Error Occurs
- Check if user exists
- Verify you're not already friends
- Check console for error message
- Verify user ID is valid

---

## 🧪 Test Workflow 7: View Profile

### Steps
1. Click on any user's avatar or name
2. View their profile page
3. Check their posts, followers, following
4. Check their stats (posts count, followers, etc.)

### Expected Results
- ✅ Profile page loads
- ✅ User info displays correctly
- ✅ User's posts appear
- ✅ Follower/following counts show
- ✅ Profile stats accurate
- ✅ No errors in console

### If Error Occurs
- Check if user exists
- Verify username is correct
- Check console for error message
- Verify user has posts

---

## 🧪 Test Workflow 8: Notifications

### Steps
1. Look for notification bell icon
2. Click to open notifications
3. Check for friend requests, likes, comments
4. Click on notification to view

### Expected Results
- ✅ Notifications load
- ✅ Shows recent activity
- ✅ Notifications are readable
- ✅ Clicking opens related content
- ✅ No errors in console

### If Error Occurs
- Check if you have any notifications
- Verify notification system is enabled
- Check console for error message
- Try refreshing page

---

## 🧪 Test Workflow 9: Send Messages (Text)

### Steps
1. Look for "Messages" or chat icon
2. Click to open messages
3. Select a user or start new conversation
4. Type message: "Hello! How are you doing?"
5. Click "Send" button

### Expected Results
- ✅ Message sends successfully
- ✅ Message appears in chat
- ✅ Shows timestamp
- ✅ Shows "Sent" status
- ✅ No errors in console

### If Error Occurs
- Check if user exists
- Verify message is not empty
- Check console for error message
- Verify chat feature is enabled

---

## 🧪 Test Workflow 10: Send Messages (Image)

### Steps
1. Open message conversation
2. Look for "Add Image" or attachment icon
3. Select image from device
4. Add optional caption
5. Click "Send" button

### Expected Results
- ✅ Image uploads
- ✅ Image appears in chat
- ✅ Shows as image message
- ✅ Can click to view full size
- ✅ No upload errors

### If Error Occurs
- Check file size
- Check file format
- Check console for upload error
- Verify upload directory exists

---

## 🧪 Test Workflow 11: Send Messages (Video)

### Steps
1. Open message conversation
2. Look for "Add Video" or attachment icon
3. Select video from device
4. Add optional caption
5. Click "Send" button

### Expected Results
- ✅ Video uploads
- ✅ Video appears in chat
- ✅ Shows video player
- ✅ Video plays correctly
- ✅ No upload errors

### If Error Occurs
- Check file size
- Check file format
- Check console for upload error
- Verify codec compatibility

---

## 🧪 Test Workflow 12: Send Messages (Audio)

### Steps
1. Open message conversation
2. Look for "Add Audio" or microphone icon
3. Either record audio or select audio file
4. Click "Send" button

### Expected Results
- ✅ Audio uploads/records
- ✅ Audio appears in chat
- ✅ Shows audio player
- ✅ Audio plays correctly
- ✅ No errors

### If Error Occurs
- Check microphone permissions
- Check file format (MP3, WAV, etc.)
- Check console for error message
- Verify browser supports audio

---

## 📊 Testing Checklist

### Core Features
- [ ] Create text post
- [ ] Create image post
- [ ] Create video post
- [ ] Add comment
- [ ] Like post
- [ ] React to post
- [ ] Send friend request
- [ ] View profile

### Messaging Features
- [ ] Send text message
- [ ] Send image message
- [ ] Send video message
- [ ] Send audio message
- [ ] View message history
- [ ] Delete message

### Social Features
- [ ] View notifications
- [ ] Follow user
- [ ] Unfollow user
- [ ] Block user
- [ ] Report post
- [ ] Report user
- [ ] View suggestions
- [ ] Search users

---

## 🐛 Error Tracking

### If You Find an Error

**Document the following:**
1. Which test workflow failed
2. What error message appeared
3. Browser console error (F12 → Console)
4. Network error (F12 → Network)
5. Steps to reproduce
6. Screenshot if possible

**Example Report:**
```
Test: Create Image Post
Error: "Failed to upload image"
Console Error: POST /api/upload 500 Internal Server Error
Steps:
1. Click Create Post
2. Select image.jpg (2MB)
3. Click Post
Expected: Image uploads
Actual: Error message appears
```

---

## 🔧 Debugging Tips

### Browser Console (F12)
```javascript
// Check current session
console.log(document.cookie)

// Check API response
// Go to Network tab → Click API call → Response tab
```

### Network Tab (F12)
1. Open Network tab
2. Perform action
3. Look for failed requests (red)
4. Click request to see details
5. Check Response tab for error message

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Session expired | Login again |
| 404 Not Found | API endpoint missing | Check URL |
| 500 Server Error | Backend error | Check server logs |
| Network Error | Connection issue | Check internet |
| CORS Error | Cross-origin issue | Check headers |

---

## 📝 Notes

- All 24 social APIs have been fixed
- Authentication changed from NextAuth to custom session
- Session uses `mlmpk-session` cookie
- Supabase is the database backend
- Media uploads go to `/public/uploads/`
- Real-time features may need WebSocket setup

---

## 🎯 Success Criteria

✅ All 12 workflows complete without errors  
✅ All media uploads work  
✅ All messages send and receive  
✅ All notifications display  
✅ No console errors  
✅ No network errors  

---

## 📞 Support

If you encounter issues:

1. Check browser console (F12)
2. Check Network tab (F12)
3. Verify Supabase tables exist
4. Verify session cookie is set
5. Restart dev server
6. Clear browser cache
7. Try incognito mode

---

**Ready to Test**: ✅  
**All APIs Fixed**: ✅  
**Documentation Complete**: ✅  

**Start Testing Now!** 🚀
