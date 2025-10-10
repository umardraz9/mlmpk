# 🎯 MLM-Pak Task System - Complete Testing Guide

## 📋 Overview

The MLM-Pak platform now has a **complete end-to-end task system** where:
1. **Admins** can create tasks with rewards
2. **Users** can view, start, and complete tasks 
3. **Rewards** are automatically added to user accounts
4. **Admins** can review and approve complex task submissions

## 🚀 Quick Test Instructions

### Step 1: Start the Development Server
```bash
cd i:\Mlmpak
npm run dev
```

### Step 2: Login as Admin
1. Go to `http://localhost:3000/auth/login`
2. Login with admin credentials
3. Navigate to `/admin/tasks`

### Step 3: Create a Test Task
1. Click **"Create Task"** button
2. Fill in the form:
   - **Title**: `Test Simple Task` 
   - **Type**: `⚡ Simple Task`
   - **Reward**: `50` (PKR)
   - **Description**: `Test task for reward system`
   - **Instructions**: `Click Complete Task button to finish`
3. Click **"✨ Create Task"**

### Step 4: Test as Regular User
1. **Open new incognito tab** or logout and login as regular user
2. Go to `/tasks` 
3. You should see the task you created
4. Click **"Start Task"** button
5. Click **"Complete Task"** button  
6. You should see success message with reward amount

### Step 5: Verify Reward Added
1. Check user dashboard `/dashboard`
2. Balance should be increased by the reward amount
3. Task completion count should be incremented

### Step 6: Admin Review (Optional)
1. Go back to admin account
2. Visit `/admin/tasks/submissions`
3. Review completed task submissions
4. Approve/reject submissions for complex tasks

## 🛠️ Automated Testing

### Option 1: Use Test Script
```bash
# Create demo tasks automatically
node test-task-system.js
```

### Option 2: Manual API Testing
```bash
# Create a simple task via API
curl -X POST http://localhost:3000/api/admin/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "API Test Task",
    "type": "SIMPLE", 
    "reward": 30,
    "description": "Test task created via API"
  }'
```

## 📱 Task Types Available

| Type | Auto-Approve | Reward Range | Description |
|------|-------------|-------------|-------------|
| **SIMPLE** | ✅ Yes | 10-100 PKR | Basic one-click tasks |
| **DAILY** | ✅ Yes | 20-50 PKR | Daily check-in tasks |
| **BASIC** | ✅ Yes | 15-75 PKR | Simple engagement tasks |
| **SOCIAL_MEDIA** | ❌ Manual | 50-150 PKR | Social sharing tasks |
| **SURVEY** | ❌ Manual | 25-100 PKR | Survey completion |
| **CONTENT_CREATION** | ❌ Manual | 100-300 PKR | Content creation tasks |

## 🔄 Complete Workflow

### 1. Admin Creates Task
```
Admin Dashboard → Task Management → Create Task → Fill Form → Submit
```

### 2. User Sees Task
```
User Dashboard → Tasks → Available Tasks → Task List
```

### 3. User Completes Task
```
Select Task → Start Task → Complete Task → Receive Reward
```

### 4. System Updates
```
User Balance Updated → Task Stats Updated → Notification Sent
```

## 🧪 Testing Scenarios

### Scenario A: Simple Task (Auto-Approved)
1. Create SIMPLE/DAILY/BASIC task
2. User completes task  
3. Reward added immediately
4. ✅ **Expected**: Instant reward, success message

### Scenario B: Complex Task (Manual Review)
1. Create SOCIAL_MEDIA/CONTENT_CREATION task
2. User submits with proof
3. Admin reviews submission
4. ✅ **Expected**: Pending → Admin approval → Reward

### Scenario C: Task Rejection
1. User submits poor quality work
2. Admin rejects with reason
3. ✅ **Expected**: Rejection notification, no reward

### Scenario D: Multiple Users
1. Create one task
2. Multiple users complete it
3. ✅ **Expected**: All users get rewards individually

## 🐛 Troubleshooting

### Issue: Tasks Not Showing
**Solution**: 
- Check user is logged in
- Verify task status is 'ACTIVE'
- Check user has recent referral (7-day rule)

### Issue: Rewards Not Added
**Solution**:
- Check task completion API response
- Verify database transaction completed
- Check user balance in database

### Issue: Admin Can't Create Tasks
**Solution**:
- Verify user has isAdmin=true in database
- Check admin authentication
- Verify API endpoints are working

### Issue: Task Submissions Not Visible
**Solution**:
- Check task type (auto-approved vs manual)
- Verify submission data was saved
- Check admin submissions page

## 📊 Database Verification

### Check Task Creation
```sql
SELECT * FROM tasks ORDER BY createdAt DESC LIMIT 5;
```

### Check User Completions  
```sql
SELECT tc.*, t.title, u.name 
FROM task_completions tc
JOIN tasks t ON tc.taskId = t.id  
JOIN users u ON tc.userId = u.id
ORDER BY tc.createdAt DESC LIMIT 10;
```

### Check User Balances
```sql
SELECT name, email, balance, tasksCompleted 
FROM users 
WHERE tasksCompleted > 0;
```

## 🎯 Success Criteria

- [ ] ✅ Admin can create tasks with custom rewards
- [ ] ✅ Tasks appear in user task list  
- [ ] ✅ Users can start tasks
- [ ] ✅ Users can complete simple tasks instantly
- [ ] ✅ Rewards are added to user balance
- [ ] ✅ Task completion count increments
- [ ] ✅ Complex tasks require admin approval
- [ ] ✅ Admin can approve/reject submissions
- [ ] ✅ Users receive notifications
- [ ] ✅ Real-time updates work

## 📞 Next Steps

After testing, you can:
1. **Customize task types** for your business needs
2. **Adjust reward amounts** based on task complexity  
3. **Add more validation** for task submissions
4. **Implement file uploads** for proof submission
5. **Add task scheduling** for time-based tasks
6. **Create task templates** for common task types

## 🎉 Conclusion

The MLM-Pak task system is now **fully functional** with:
- ✅ Complete admin-to-user workflow
- ✅ Automatic reward distribution  
- ✅ Manual approval system
- ✅ Real-time notifications
- ✅ Comprehensive tracking

**The task system is ready for production use!** 🚀