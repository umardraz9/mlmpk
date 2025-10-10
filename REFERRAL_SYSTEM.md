# MCNmart Referral System

## Overview
The MCNmart platform uses a referral-based MLM (Multi-Level Marketing) system where every user must have a referrer to maintain the network structure.

## Admin Referral Code

**Admin Referral Code:** `admin123`

The admin account serves as the root of the referral tree and has a fixed referral code of `admin123`.

### Admin Account Details
- **Email:** admin@mcnmart.com
- **Password:** admin123
- **Referral Code:** admin123
- **Role:** ADMIN

## How the Referral System Works

### 1. User Registration with Referral Code
When a user registers with a referral code:
- The system validates the referral code exists
- The new user is linked to the referrer via the `referredBy` field
- The referrer can earn commissions from the new user's activities

### 2. User Registration WITHOUT Referral Code (Default Behavior)
When a user registers **without** entering a referral code:
- The system automatically assigns them to the admin's referral
- The user's `referredBy` field is set to `admin123`
- This ensures every user has a referrer in the MLM structure

### 3. Benefits of Default Admin Referral
- **No orphaned users:** Every user is part of the referral network
- **Simple onboarding:** Users don't need a referral code to join
- **Admin oversight:** Admin can track all direct referrals
- **Network integrity:** Maintains the MLM tree structure

## Implementation Details

### Backend (Registration API)
File: `src/app/api/auth/register/route.ts`

```typescript
// If no referral code provided, default to admin
if (!referralCode || referralCode.trim().length === 0) {
  const adminUser = await prisma.user.findUnique({ 
    where: { referralCode: 'admin123' } 
  });
  if (adminUser) {
    referrerCodeToApply = adminUser.referralCode; // 'admin123'
  }
}
```

### Frontend (Registration Form)
File: `src/app/auth/register/page.tsx`

The registration form includes:
- Optional referral code input field
- Helper text explaining the default admin referral
- No validation required for empty referral code

### Database Schema
```prisma
model User {
  id           String   @id @default(cuid())
  referralCode String   @unique  // User's own referral code
  referredBy   String?           // Referrer's code (defaults to 'admin123')
  // ... other fields
}
```

## Testing the Referral System

### 1. Update Admin Referral Code
```bash
node scripts/create-admin-user.js
```

### 2. Verify Admin Setup
```bash
node scripts/verify-admin-referral.js
```

### 3. Test Referral System
```bash
node scripts/test-referral-system.js
```

## User Referral Codes

Each user gets a unique referral code in the format:
- **Format:** `[First 3 letters of name]-[Last 4 digits of phone]`
- **Example:** `ALI-8743` (for Ali with phone ending in 8743)
- **Uniqueness:** System adds a 2-digit suffix if collision occurs

## Referral Hierarchy

```
Admin (admin123)
├── User1 (ALI-8743)
│   ├── User2 (FAT-2341)
│   └── User3 (HAS-9876)
├── User4 (SAR-5432)
└── User5 (RAV-1234)
```

## Commission Structure

Users earn commissions based on their referral network:
- **Level 1:** Direct referrals
- **Level 2:** Referrals of referrals
- **Level 3-5:** Extended network

The admin receives commissions from all users who register without a referral code.

## API Endpoints

### Register User
```
POST /api/auth/register
Body: {
  name: string,
  email: string,
  phone: string,
  password: string,
  referralCode?: string  // Optional - defaults to 'admin123'
}
```

### Get User Stats
```
GET /api/user/stats
Returns: {
  referralCode: string,
  totalReferrals: number,
  // ... other stats
}
```

## Best Practices

1. **Always keep admin account secure** - It's the root of the referral tree
2. **Don't change admin referral code** after users have registered
3. **Monitor admin's direct referrals** - These are users without a referrer
4. **Encourage users to share their referral codes** for organic growth

## Troubleshooting

### Issue: Users not being assigned to admin
**Solution:** Verify admin account exists with referral code 'admin123'
```bash
node scripts/verify-admin-referral.js
```

### Issue: Invalid referral code error
**Solution:** Check if the referral code exists in the database
```sql
SELECT * FROM User WHERE referralCode = 'YOUR_CODE';
```

### Issue: Admin referral code changed
**Solution:** Run the admin setup script to restore it
```bash
node scripts/create-admin-user.js
```

## Future Enhancements

- [ ] Admin dashboard to view all direct referrals
- [ ] Bulk referral code validation
- [ ] Referral analytics and reports
- [ ] Custom admin referral code configuration
- [ ] Multi-admin support with different referral codes

---

**Last Updated:** 2025-09-30
**Version:** 1.0.0
