# Manual Testing Guide for MLM-Pak Task System

## Quick Testing Steps

### 1. Start Development Server
```bash
cd mlm-pak
npm run dev
```
**Expected**: Server starts on http://localhost:3000

### 2. Access Tasks Page
- Open browser to: http://localhost:3000/tasks
- **Expected**: Tasks page loads with available tasks

### 3. Test Content Tasks
- Look for tasks with type "CONTENT_ENGAGEMENT"
- Click "Start Task" on a content task
- **Expected**: Redirect to content site with verification token

### 4. Test Content Site
- Content site should be accessible at: http://localhost:3002
- **Expected**: High-quality article with engagement tracking

### 5. Test Task Completion
- Engage with content (read, scroll, answer quiz)
- Click "Complete Task"
- **Expected**: Return to MLM site with reward

## API Testing Endpoints

### Available Endpoints:
- `GET http://localhost:3000/api/tasks` - List all tasks
- `GET http://localhost:3000/api/tasks/verify-completion` - Task verification
- `GET http://localhost:3000/api/tasks/content-redirect` - Content redirect

### Test URLs:
- Main Platform: http://localhost:3000
- Content Site: http://localhost:3002
- Tasks Page: http://localhost:3000/tasks

## Expected Behavior

### Content Tasks Flow:
1. User clicks "Start Task" on content task
2. Redirect to content site with secure token
3. User reads article (minimum 2 minutes)
4. User completes quiz
5. User clicks "Complete Task"
6. Return to MLM site with reward

### Regular Tasks Flow:
1. User clicks "Start Task" on regular task
2. Task starts immediately
3. User completes task requirements
4. User clicks "Complete Task"
5. Reward is granted

## Testing Checklist

### ✅ Registration & Login
- [ ] User can register successfully
- [ ] User can login successfully
- [ ] User can access tasks page

### ✅ Task Display
- [ ] Tasks are displayed correctly
- [ ] Content tasks are identified
- [ ] Rewards are shown clearly

### ✅ Content Tasks
- [ ] Content redirect works
- [ ] Content site loads properly
- [ ] Engagement tracking works
- [ ] Quiz appears correctly

### ✅ Task Completion
- [ ] Rewards are granted correctly
- [ ] User balance updates
- [ ] Task status updates

### ✅ Security
- [ ] Tokens are validated
- [ ] Referrer checks work
- [ ] Daily limits enforced

## Sample Test Data

### Content Tasks Available:
1. **Technology**: "The Future of AI in Digital Marketing" - 30 points
2. **Business**: "Digital Marketing Strategies for 2024" - 35 points  
3. **Lifestyle**: "Work-Life Balance in Remote Work Era" - 25 points

### Test User Credentials:
- Email: demouser@example.com
- Password: Demo@123456

## Troubleshooting

### Common Issues:
1. **Server not starting**: Check port 3000 availability
2. **Tasks not loading**: Check database connection
3. **Content redirect failing**: Check CONTENT_SITE_URL
4. **Rewards not granted**: Check task completion logic

### Debug Commands:
```bash
# Check database
npx prisma studio

# Check logs
npm run dev --verbose

# Reset database
npx prisma migrate reset
npx prisma migrate dev
```

## Production Testing

### Environment Variables:
```bash
CONTENT_SITE_URL=http://localhost:3002
MLM_SITE_URL=http://localhost:3000
```

### Testing Steps:
1. Start both servers (main + content)
2. Register test user
3. Complete content task flow
4. Verify reward system
5. Check database updates

## Success Criteria

### ✅ All tests pass:
- [ ] Server starts without errors
- [ ] Tasks load correctly
- [ ] Content redirect works
- [ ] Engagement tracking functions
- [ ] Rewards are granted properly
- [ ] User experience is smooth

**Note**: Test with both regular tasks and content engagement tasks to ensure full system functionality.
