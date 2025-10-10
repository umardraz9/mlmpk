# Membership Renewal System - Implementation Guide

## Overview

A comprehensive tiered renewal system has been implemented for MCNmart, allowing users to renew their membership packages with loyalty discounts and upgrade options.

---

## 🎯 Key Features

### 1. **Tiered Renewal Pricing (Option 3)**
- **First Renewal**: Full price (0% discount)
- **Second Renewal**: 10% loyalty discount
- **Third+ Renewals**: 20% loyalty discount

### 2. **Upgrade During Renewal**
- Users can upgrade to higher plans during renewal
- Upgrading resets the renewal count to 0
- Immediate access to higher tier benefits

### 3. **Automatic Expiration Management**
- Daily cron job checks for expired memberships
- Automatic status change from ACTIVE → EXPIRED
- Notification system for expiration warnings

### 4. **Multi-Stage Notifications**
- **7 Days Before**: Warning notification with renewal price
- **3 Days Before**: Urgent notification
- **On Expiration**: Expiration notification with renewal CTA

---

## 📋 Implementation Steps

### Step 1: Update Database Schema

The schema has been updated with renewal tracking fields:

```prisma
model User {
  // ... existing fields
  renewalCount            Int                     @default(0)
  lastRenewalDate         DateTime?
  expirationNotified      Boolean                 @default(false)
}
```

**Apply the migration:**

```bash
# Development
npx prisma migrate dev --name add_renewal_fields

# Production
npx prisma db push
```

### Step 2: API Endpoints Created

#### **GET /api/user/membership/renew**
Fetches renewal options with pricing for all plans.

**Response:**
```json
{
  "success": true,
  "currentPlan": "STANDARD",
  "membershipStatus": "ACTIVE",
  "renewalCount": 1,
  "daysUntilExpiration": 5,
  "canRenew": true,
  "renewalOptions": [
    {
      "planName": "BASIC",
      "displayName": "Basic Plan",
      "basePrice": 1000,
      "renewalPrice": 900,
      "discountPercentage": 10,
      "savings": 100,
      "isCurrentPlan": false,
      "isUpgrade": false,
      "isDowngrade": true,
      "dailyTaskEarning": 50,
      "features": [...]
    }
  ]
}
```

#### **POST /api/user/membership/renew**
Processes renewal or upgrade.

**Request:**
```json
{
  "planName": "PREMIUM",
  "paymentMethod": "jazzcash",
  "paymentDetails": "03001234567",
  "isUpgrade": true
}
```

**Response:**
```json
{
  "success": true,
  "membership": {
    "plan": "PREMIUM",
    "displayName": "Premium Plan",
    "renewalCount": 0,
    "membershipEndDate": "2025-11-06T...",
    "pricePaid": 8000,
    "savings": 0,
    "isUpgrade": true
  },
  "message": "Successfully upgraded to Premium Plan!"
}
```

### Step 3: Cron Job Setup

**Endpoint:** `GET /api/cron/check-membership-expiration`

**Security:** Requires Bearer token authorization

```bash
# Add to .env
CRON_SECRET=your-secure-random-secret-key
```

**Setup Options:**

#### Option A: Vercel Cron (Recommended for Vercel deployment)

Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/check-membership-expiration",
      "schedule": "0 0 * * *"
    }
  ]
}
```

#### Option B: External Cron Service (cron-job.org, EasyCron)

Set up daily cron job:
```bash
curl -X GET https://your-domain.com/api/cron/check-membership-expiration \
  -H "Authorization: Bearer your-secret-key"
```

#### Option C: GitHub Actions

Create `.github/workflows/check-expiration.yml`:
```yaml
name: Check Membership Expiration
on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight UTC
  workflow_dispatch:

jobs:
  check-expiration:
    runs-on: ubuntu-latest
    steps:
      - name: Call Expiration Check API
        run: |
          curl -X GET ${{ secrets.APP_URL }}/api/cron/check-membership-expiration \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

### Step 4: UI Components

#### **Renewal Page**
- Location: `/membership/renew`
- Features:
  - Display all plans with renewal pricing
  - Show loyalty discounts
  - Highlight current plan
  - Mark upgrade/downgrade options
  - Renewal summary with total calculation

#### **Dashboard Integration**
- Expiration warning banner (14 days before)
- Urgent alert (7 days before)
- Expired membership alert
- "Renew Now" button with visual urgency

---

## 💰 Pricing Examples

### Basic Plan (Rs.1,000)
| Renewal # | Discount | Price |
|-----------|----------|-------|
| 1st       | 0%       | Rs.1,000 |
| 2nd       | 10%      | Rs.900 |
| 3rd+      | 20%      | Rs.800 |

### Standard Plan (Rs.3,000)
| Renewal # | Discount | Price |
|-----------|----------|-------|
| 1st       | 0%       | Rs.3,000 |
| 2nd       | 10%      | Rs.2,700 |
| 3rd+      | 20%      | Rs.2,400 |

### Premium Plan (Rs.8,000)
| Renewal # | Discount | Price |
|-----------|----------|-------|
| 1st       | 0%       | Rs.8,000 |
| 2nd       | 10%      | Rs.7,200 |
| 3rd+      | 20%      | Rs.6,400 |

---

## 🔄 Renewal Flow

### User Journey

1. **14 Days Before Expiration**
   - Dashboard shows yellow warning banner
   - "Renew Early & Save" button appears
   - Notification sent with renewal price

2. **7 Days Before Expiration**
   - Warning notification sent
   - Days remaining shown in red
   - Loyalty discount highlighted

3. **3 Days Before Expiration**
   - Urgent notification sent
   - Dashboard alert becomes more prominent

4. **On Expiration Day**
   - Status changes to EXPIRED
   - Tasks disabled
   - Expiration notification sent
   - Red alert banner on dashboard

5. **Renewal Process**
   - User clicks "Renew Now"
   - Redirected to `/membership/renew`
   - Selects plan (same or upgrade)
   - Sees renewal price with discount
   - Completes payment
   - Membership reactivated for 30-60 days

### Upgrade During Renewal

```javascript
// Example: User on Basic Plan (renewalCount: 2)
// Wants to upgrade to Premium

Current: Basic Plan
- Base Price: Rs.1,000
- Renewal Price: Rs.800 (20% discount, 3rd renewal)

Upgrade to: Premium Plan
- Base Price: Rs.8,000
- Renewal Price: Rs.8,000 (0% discount, count resets to 0)
- isUpgrade: true
- renewalCount: 0 (reset)
```

---

## 🧪 Testing

### Manual Testing

1. **Test Renewal Pricing:**
```bash
# Login as user
# Navigate to /membership/renew
# Verify pricing calculations
```

2. **Test Expiration:**
```bash
# Manually update user's membershipEndDate to past date
# Run cron job manually:
curl -X GET http://localhost:3000/api/cron/check-membership-expiration \
  -H "Authorization: Bearer your-secret-key"
```

3. **Test Upgrade:**
```bash
# On renewal page, select higher tier plan
# Verify renewalCount resets to 0
# Verify new plan benefits applied
```

### Database Queries

```sql
-- Check users with expiring memberships
SELECT id, email, membershipPlan, membershipEndDate, renewalCount
FROM users
WHERE membershipStatus = 'ACTIVE'
  AND membershipEndDate <= datetime('now', '+7 days');

-- Check renewal history
SELECT id, email, renewalCount, lastRenewalDate
FROM users
WHERE renewalCount > 0
ORDER BY renewalCount DESC;
```

---

## 📊 Admin Monitoring

### Key Metrics to Track

1. **Renewal Rate**: % of users who renew vs let expire
2. **Upgrade Rate**: % of renewals that are upgrades
3. **Loyalty Retention**: Average renewalCount per user
4. **Revenue Impact**: Total savings given vs revenue from renewals

### Recommended Dashboard Widgets

```javascript
// Renewal Statistics
{
  totalRenewals: 150,
  upgradesDuringRenewal: 45,
  averageRenewalCount: 2.3,
  totalLoyaltyDiscounts: 125000, // PKR
  expiringIn7Days: 23,
  expiredToday: 5
}
```

---

## 🚀 Deployment Checklist

- [ ] Apply database migration
- [ ] Set `CRON_SECRET` in environment variables
- [ ] Configure cron job (Vercel/GitHub Actions/External)
- [ ] Test renewal flow end-to-end
- [ ] Test expiration notifications
- [ ] Verify pricing calculations
- [ ] Test upgrade during renewal
- [ ] Monitor first week of renewals
- [ ] Set up admin monitoring dashboard

---

## 🔧 Configuration

### Environment Variables

```env
# Required
DATABASE_URL=file:./prisma/dev.db
CRON_SECRET=your-secure-random-secret-key

# Optional (for payment integration)
JAZZCASH_API_KEY=...
EASYPAISA_API_KEY=...
```

### Customization Options

**Adjust Discount Tiers:**
Edit `/src/app/api/user/membership/renew/route.ts`:

```typescript
function calculateRenewalPrice(basePrice: number, renewalCount: number): number {
  if (renewalCount === 0) {
    return basePrice; // First renewal: Full price
  } else if (renewalCount === 1) {
    return Math.round(basePrice * 0.9); // 10% discount
  } else {
    return Math.round(basePrice * 0.8); // 20% discount
  }
}
```

**Adjust Notification Timing:**
Edit `/src/app/api/cron/check-membership-expiration/route.ts`:

```typescript
// Change from 7 days to 10 days
const sevenDaysFromNow = new Date(now);
sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 10); // Changed from 7
```

---

## 📝 Notes

- Renewal count resets to 0 when upgrading to a higher plan
- Downgrading maintains the current renewal count
- Voucher amounts are additive on renewal
- Task earnings reset on renewal (dailyTasksCompleted = 0)
- Expiration notifications are sent only once (expirationNotified flag)

---

## 🆘 Troubleshooting

### Issue: Cron job not running
**Solution:** Verify CRON_SECRET matches in both .env and cron configuration

### Issue: Renewal price incorrect
**Solution:** Check renewalCount field in database, verify calculation logic

### Issue: Notifications not sent
**Solution:** Check notification table, verify user has valid email/phone

### Issue: Status not changing to EXPIRED
**Solution:** Ensure cron job is running daily, check membershipEndDate values

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review API response errors
3. Check database logs
4. Contact development team

---

**Last Updated:** 2025-10-07
**Version:** 1.0.0
