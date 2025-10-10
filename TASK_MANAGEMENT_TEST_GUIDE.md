# 🧪 MLM-Pak Task Management System - Testing Checklist

## 📋 Overview
This comprehensive testing guide covers all the new features implemented in the MLM-Pak task management system:

1. ✅ Daily task assignment system (5 tasks per user)
2. ✅ Plan-based earning calculation (Basic: Rs.10/task, Standard: Rs.30/task, Premium: Rs.80/task)
3. ✅ Active days tracking on dashboard
4. ✅ Referral-based earning continuation logic
5. ✅ Admin controls for enabling/disabling tasks per user
6. ✅ Plan-specific minimum withdrawal limits
7. ✅ Updated commission structure and voucher amounts

## 🚀 Prerequisites

### Database Setup
Before testing, ensure the membership plans are properly seeded:

```bash
# Run the membership plan seeder
node scripts/seed-membership-plans.js
```

### Test User Setup
Create test users with different membership plans:
- Basic Plan user (Rs.1,000 investment)
- Standard Plan user (Rs.3,000 investment)  
- Premium Plan user (Rs.8,000 investment)
- User without membership (for testing restrictions)

## 📝 Test Cases

### 1. Daily Task Assignment System

#### Test Case 1.1: New User Daily Task Assignment
**Steps:**
1. Login as active Basic plan user
2. Navigate to `/api/tasks/daily-assignment` (POST request)
3. Verify 5 tasks are assigned
4. Check each task reward = Rs.50 ÷ 5 = Rs.10

**Expected Results:**
- ✅ 5 tasks assigned successfully
- ✅ Each task reward = Rs.10 for Basic plan
- ✅ Tasks are PENDING status
- ✅ Total daily earning potential = Rs.50

#### Test Case 1.2: Plan-Based Task Rewards
**Steps:**
1. Test with Standard plan user (Rs.150 ÷ 5 = Rs.30 per task)
2. Test with Premium plan user (Rs.400 ÷ 5 = Rs.80 per task)

**Expected Results:**
- ✅ Standard: Rs.30 per task
- ✅ Premium: Rs.80 per task
- ✅ All users get exactly 5 tasks per day

#### Test Case 1.3: Duplicate Assignment Prevention
**Steps:**
1. User gets daily tasks in morning
2. Try to get daily tasks again same day
3. Should return existing tasks, not create new ones

**Expected Results:**
- ✅ Returns existing tasks
- ✅ Message: "Daily tasks already assigned"
- ✅ No duplicate task assignments

### 2. Active Days Tracking

#### Test Case 2.1: Dashboard Active Days Display
**Steps:**
1. Login as active user
2. Navigate to dashboard
3. Check Active Days counter in membership section

**Expected Results:**
- ✅ Shows correct number of days since membership start
- ✅ Increments daily
- ✅ Displays prominently in dashboard

#### Test Case 2.2: Active Days Calculation
**Steps:**
1. Check user with membership started 10 days ago
2. Verify active days = 11 (start date counts as day 1)

**Expected Results:**
- ✅ Accurate day calculation
- ✅ Includes start date as day 1

### 3. Referral-Based Earning Continuation

#### Test Case 3.1: 30-Day Rule Without Referrals
**Steps:**
1. Create user with membership started 31 days ago
2. User has 0 referrals
3. Try to get daily tasks or complete tasks

**Expected Results:**
- ✅ Tasks disabled after 30 days
- ✅ Error: "Your 30-day earning period has expired. You need at least 1 referral to continue earning."

#### Test Case 3.2: Referral-Based Continuation Rules
**Test Basic Plan User:**
- With any referral (Basic/Standard/Premium) → Can continue earning

**Test Standard Plan User:**
- With Standard or Premium referral → Can continue earning
- With only Basic referral → Earning stops after 30 days

**Test Premium Plan User:**
- With Premium referral → Can continue earning
- With Basic/Standard referrals → Earning stops after 30 days

**Expected Results:**
- ✅ Correct referral validation per plan
- ✅ Appropriate error messages for invalid referral combinations

### 4. Admin Task Controls

#### Test Case 4.1: Admin Disable User Tasks
**Steps:**
1. Login as admin
2. Navigate to `/admin/users/task-control`
3. Find active user and disable their tasks
4. User tries to get/complete tasks

**Expected Results:**
- ✅ Admin can toggle task status per user
- ✅ Disabled user gets error: "Tasks are disabled for your account. Please contact admin."
- ✅ Admin action logged in notifications

#### Test Case 4.2: Admin Enable User Tasks
**Steps:**
1. Enable tasks for previously disabled user
2. User should now be able to get and complete tasks

**Expected Results:**
- ✅ User can receive daily tasks again
- ✅ Can complete tasks and earn rewards

### 5. Plan-Specific Withdrawal Limits

#### Test Case 5.1: Basic Plan Withdrawal (Rs.2,000 minimum)
**Steps:**
1. Login as Basic plan user
2. Try to withdraw Rs.1,500 (below minimum)
3. Try to withdraw Rs.2,000 (at minimum)

**Expected Results:**
- ✅ Rs.1,500 withdrawal rejected: "Minimum withdrawal amount is Rs 2,000 for your plan"
- ✅ Rs.2,000 withdrawal accepted (if sufficient balance)

#### Test Case 5.2: Standard Plan Withdrawal (Rs.4,000 minimum)
**Steps:**
1. Test Standard plan user withdrawal limits

**Expected Results:**
- ✅ Below Rs.4,000 rejected
- ✅ Rs.4,000+ accepted

#### Test Case 5.3: Premium Plan Withdrawal (Rs.10,000 minimum)
**Steps:**
1. Test Premium plan user withdrawal limits

**Expected Results:**
- ✅ Below Rs.10,000 rejected
- ✅ Rs.10,000+ accepted

### 6. Updated Commission Structure

#### Test Case 6.1: Basic Plan Commission (Total Rs.350)
**Expected Commission Distribution:**
- Level 1: Rs.200
- Level 2: Rs.100
- Level 3: Rs.30
- Level 4: Rs.15
- Level 5: Rs.5

#### Test Case 6.2: Standard Plan Commission (Total Rs.900)
**Expected Commission Distribution:**
- Level 1: Rs.250
- Level 2: Rs.200
- Level 3: Rs.170
- Level 4: Rs.160
- Level 5: Rs.120

#### Test Case 6.3: Premium Plan Commission (Total Rs.2,500)
**Expected Commission Distribution:**
- Level 1: Rs.700
- Level 2: Rs.600
- Level 3: Rs.500
- Level 4: Rs.400
- Level 5: Rs.300

### 7. Product Voucher System

#### Test Case 7.1: Plan-Specific Voucher Amounts
**Steps:**
1. Check voucher balance after membership activation

**Expected Results:**
- ✅ Basic Plan: Rs.500 voucher
- ✅ Standard Plan: Rs.1,000 voucher
- ✅ Premium Plan: Rs.1,500 voucher

### 8. Task Completion Flow

#### Test Case 8.1: Complete Basic Daily Task
**Steps:**
1. Get daily tasks
2. Complete one DAILY/SIMPLE task
3. Check balance increase

**Expected Results:**
- ✅ Task marked as COMPLETED
- ✅ Balance increased by correct amount (Basic: Rs.10, Standard: Rs.30, Premium: Rs.80)
- ✅ Task completion count incremented

#### Test Case 8.2: All 5 Tasks Completion
**Steps:**
1. Complete all 5 daily tasks
2. Check total earning for the day

**Expected Results:**
- ✅ Total daily earning = plan's dailyTaskEarning
- ✅ All tasks marked COMPLETED
- ✅ Cannot get new tasks until next day

## 🐛 Error Scenarios to Test

### Invalid States
1. **Inactive Membership:** User with INACTIVE status tries to get tasks
2. **No Membership Plan:** User without plan tries task operations
3. **Expired Earning Period:** User past earning continuation tries tasks
4. **Tasks Disabled:** Admin-disabled user tries task operations
5. **Invalid Referral Continuation:** User with wrong referral type after 30 days

### Edge Cases
1. **Day Boundary:** Task assignment at midnight
2. **Concurrent Requests:** Multiple task completion attempts
3. **Balance Insufficient:** Withdrawal request exceeds balance
4. **Plan Change:** User upgrades plan mid-period

## 📊 Performance Testing

### Load Testing
1. **Concurrent Task Assignments:** 100 users getting daily tasks simultaneously
2. **Task Completion Load:** Multiple users completing tasks at once
3. **Dashboard Load:** Multiple users accessing dashboard with active days calculation

### Database Performance
1. **Task Query Performance:** Ensure task assignment queries are optimized
2. **Referral Count Queries:** Verify referral checking doesn't cause slowdowns
3. **Active Days Calculation:** Ensure date calculations are efficient

## ✅ Verification Checklist

After testing, verify all requirements are met:

- [ ] 5 identical tasks assigned daily to all users
- [ ] Task amounts calculated correctly: Daily limit ÷ 5
- [ ] Active days displayed on dashboard
- [ ] 30-day earning rule enforced
- [ ] Referral-based continuation working per plan rules
- [ ] Admin can enable/disable tasks per user
- [ ] Plan-specific withdrawal minimums enforced
- [ ] Commission structure matches specification
- [ ] Voucher amounts correct per plan
- [ ] All error messages are user-friendly
- [ ] All success flows work as expected

## 🚨 Critical Issues to Watch For

1. **Task Duplication:** Ensure users don't get duplicate daily tasks
2. **Reward Calculation:** Verify exact amounts match plan specifications
3. **Referral Logic:** Complex referral rules must work exactly as specified
4. **Admin Controls:** Ensure admin actions take effect immediately
5. **Withdrawal Limits:** Plan-specific limits must be enforced properly
6. **Active Days:** Calculation must be accurate and consistent

## 📞 Support Information

If any test fails or behaves unexpectedly:

1. Check server logs for detailed error messages
2. Verify database state matches expected values
3. Confirm all required data (plans, users, tasks) exists
4. Test with fresh user accounts if needed
5. Contact development team with specific test case and error details

---

**Last Updated:** [Current Date]
**Tested By:** [Tester Name]
**Test Environment:** [Development/Staging/Production]
**Status:** [Pass/Fail/In Progress]