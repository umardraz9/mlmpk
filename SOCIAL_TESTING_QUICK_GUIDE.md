# 🚀 Social Platform - Quick Testing Guide

## Quick Start

1. **Server Running:** `npm run dev` → http://localhost:3000
2. **Login:** sultan@mcnmart.com / 12345678
3. **Go to:** http://localhost:3000/social

---

## ✅ What Was Fixed

### Before
- ❌ Demo data (hardcoded posts array)
- ❌ No database connection
- ❌ Stats returning zeros
- ❌ Suggestions using fake users

### After
- ✅ Real Supabase database
- ✅ 7+ posts with engagement
- ✅ 10+ likes, 7+ comments
- ✅ Live stats and suggestions
- ✅ Full CRUD operations

---

## 🎯 Quick Test Actions

### 1. View Feed (2 min)
```
1. Open /social page
2. Should see posts with images/text
3. Check like/comment counts show numbers
4. Verify user avatars and names display
```
**Expected:** Posts load instantly with real data

---

### 2. Create Post (3 min)
```
1. Click "What's on your mind?"
2. Type: "Testing the social platform! 🚀"
3. Select type: "General"
4. (Optional) Upload image
5. Click "Post"
```
**Expected:** Post appears at top of feed immediately

---

### 3. Like Post (1 min)
```
1. Click heart icon on any post
2. Count should increase
3. Heart turns red
4. Click again to unlike
```
**Expected:** Instant toggle, count updates

---

### 4. Comment (2 min)
```
1. Click comment icon
2. Type: "Great post! 👏"
3. Press Enter or Submit
4. Comment appears below post
```
**Expected:** Comment shows with your name/avatar

---

### 5. Share Post (1 min)
```
1. Click share button
2. Select platform (Facebook/Twitter/WhatsApp)
3. Share count increases
```
**Expected:** Share recorded, count updates

---

## 🔍 What to Check

### Visual Checks
- [ ] Posts display properly
- [ ] Images load correctly
- [ ] User avatars show
- [ ] Like/comment counts visible
- [ ] Buttons are clickable
- [ ] Responsive on mobile

### Functional Checks
- [ ] Create post works
- [ ] Like toggles properly
- [ ] Comments save and display
- [ ] Share records correctly
- [ ] Edit post (menu → Edit)
- [ ] Delete post (menu → Delete)

### Data Checks
- [ ] Posts from database (not demo data)
- [ ] Real user names show
- [ ] Timestamps are recent
- [ ] Engagement counts accurate

---

## 🐛 Common Issues

### Posts Not Loading
**Check:** Browser console (F12) for errors
**Fix:** Refresh page, check database connection

### Can't Create Post
**Check:** Network tab shows 401/403 error
**Fix:** Log out and log back in

### Images Not Displaying
**Check:** Image URLs in database
**Fix:** Ensure /public/uploads/ folder exists

---

## 📊 Expected Results

### Database Counts
```
Posts: 7+
Likes: 10+
Comments: 7+
Users: 6+
```

### API Response Times
```
GET /posts: < 100ms
POST /posts: < 200ms
POST /like: < 50ms
POST /comment: < 100ms
```

---

## 🎉 Success Indicators

- ✅ Feed loads with real posts
- ✅ Can create new posts
- ✅ Like/comment/share all work
- ✅ No console errors
- ✅ Data persists after refresh
- ✅ Mobile responsive

---

## 📝 Test Credentials

```
User Account:
Email: sultan@mcnmart.com
Password: 12345678

Admin Account:
Email: admin@mlmpk.com
Password: admin123
```

---

## 🔗 Important Links

- **Social Page:** http://localhost:3000/social
- **Supabase Dashboard:** https://supabase.com/dashboard/project/sfmeemhtjxwseuvzcjyd
- **API Docs:** See SOCIAL_MODULE_COMPLETE_MIGRATION.md

---

## 💡 Tips

1. **Test with Multiple Users:** Login as different users to test interactions
2. **Check Supabase:** Verify data in Supabase dashboard
3. **Mobile Testing:** Use browser DevTools responsive mode
4. **Performance:** Check Network tab for slow requests

---

**Quick Win:** If feed shows posts with real data → ✅ Migration successful!

**Need Help?** Check:
1. Browser console for errors
2. Network tab for API failures  
3. SOCIAL_PLATFORM_TEST_RESULTS.md for detailed docs
