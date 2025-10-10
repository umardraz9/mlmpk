# 🔄 Renewal System - Quick Start Guide

## What Happens After 60 Days?

### Current Behavior (Before Renewal System)
❌ Membership expires but status stays "ACTIVE"  
❌ No automatic expiration handling  
❌ No renewal option  

### New Behavior (With Renewal System)
✅ Automatic status change to "EXPIRED"  
✅ Tasks disabled on expiration  
✅ Renewal option with loyalty discounts  
✅ Upgrade capability during renewal  

---

## 💰 Renewal Pricing (Tiered System)

### Basic Plan - Rs.1,000
- **1st Renewal**: Rs.1,000 (0% discount)
- **2nd Renewal**: Rs.900 (10% discount)
- **3rd+ Renewal**: Rs.800 (20% discount)

### Standard Plan - Rs.3,000
- **1st Renewal**: Rs.3,000 (0% discount)
- **2nd Renewal**: Rs.2,700 (10% discount)
- **3rd+ Renewal**: Rs.2,400 (20% discount)

### Premium Plan - Rs.8,000
- **1st Renewal**: Rs.8,000 (0% discount)
- **2nd Renewal**: Rs.7,200 (10% discount)
- **3rd+ Renewal**: Rs.6,400 (20% discount)

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Apply Database Migration
```bash
npx prisma db push
```

### Step 2: Set Environment Variable
Add to `.env` or `.env.local`:
```env
CRON_SECRET=your-secure-random-key-here
```

### Step 3: Setup Cron Job

**Option A - Vercel (Easiest):**
Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/check-membership-expiration",
    "schedule": "0 0 * * *"
  }]
}
```

**Option B - External Cron Service:**
```bash
# Daily at midnight
curl -X GET https://your-domain.com/api/cron/check-membership-expiration \
  -H "Authorization: Bearer your-secret-key"
```

---

## 📱 User Experience

### Timeline

**14 Days Before Expiration:**
- 🟡 Yellow warning banner on dashboard
- 📧 Notification: "Renew early and save!"

**7 Days Before Expiration:**
- 🟠 Orange urgent banner
- 📧 Notification: "Membership expiring soon"
- 💎 Loyalty discount highlighted

**3 Days Before Expiration:**
- 🔴 Red critical alert
- 📧 Urgent notification

**On Expiration:**
- ❌ Status → EXPIRED
- 🚫 Tasks disabled
- 📧 Expiration notification
- 🔄 "Renew Now" button prominent

---

## 🎯 Key Features

### 1. Tiered Loyalty Discounts
- Progressive discounts reward loyal users
- Up to 20% off on 3rd+ renewal

### 2. Upgrade During Renewal
- Switch to higher plan anytime
- Renewal count resets on upgrade
- Immediate access to new benefits

### 3. Smart Notifications
- Multi-stage warning system
- Personalized renewal pricing
- Clear call-to-action

### 4. Seamless UI
- Premium renewal page at `/membership/renew`
- Dashboard integration with alerts
- One-click renewal process

---

## 📊 What's Included

### Files Created:
1. ✅ `prisma/schema.prisma` - Updated with renewal fields
2. ✅ `src/app/api/user/membership/renew/route.ts` - Renewal API
3. ✅ `src/app/api/cron/check-membership-expiration/route.ts` - Cron job
4. ✅ `src/app/membership/renew/page.tsx` - Renewal UI
5. ✅ `src/app/dashboard/page.tsx` - Updated with alerts
6. ✅ `scripts/add-renewal-fields.js` - Migration helper
7. ✅ `RENEWAL_SYSTEM_GUIDE.md` - Full documentation

### Database Fields Added:
```prisma
renewalCount            Int       @default(0)
lastRenewalDate         DateTime?
expirationNotified      Boolean   @default(false)
```

---

## 🧪 Testing

### Test Renewal Flow:
1. Navigate to `/membership/renew`
2. Select a plan
3. Click "Renew Now"
4. Verify membership extended

### Test Expiration:
```bash
# Run cron manually
curl -X GET http://localhost:3000/api/cron/check-membership-expiration \
  -H "Authorization: Bearer your-secret-key"
```

### Test Upgrade:
1. Go to renewal page
2. Select higher tier plan
3. Verify renewalCount resets to 0

---

## 💡 Pro Tips

1. **Encourage Early Renewal**: Show loyalty discount 14 days before expiration
2. **Highlight Upgrades**: Mark upgrade options with special badges
3. **Track Metrics**: Monitor renewal rate and upgrade percentage
4. **A/B Test Discounts**: Experiment with discount percentages

---

## 🔗 Quick Links

- **Renewal Page**: `/membership/renew`
- **API Docs**: `RENEWAL_SYSTEM_GUIDE.md`
- **Cron Endpoint**: `/api/cron/check-membership-expiration`
- **Renewal API**: `/api/user/membership/renew`

---

## ✅ Deployment Checklist

- [ ] Run `npx prisma db push`
- [ ] Add `CRON_SECRET` to environment
- [ ] Configure cron job (Vercel/External)
- [ ] Test renewal flow
- [ ] Test expiration handling
- [ ] Verify notifications working
- [ ] Monitor first renewals

---

**🎉 You're all set! The renewal system is ready to use.**

For detailed documentation, see `RENEWAL_SYSTEM_GUIDE.md`
