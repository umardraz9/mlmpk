# Database Users Summary

## Database Status
- **Type**: SQLite (Local)
- **Location**: `prisma/dev.db`
- **Status**: ✅ Active and Synchronized
- **Last Updated**: October 23, 2025

---

## Registered Users

### Total Users: 2

#### 1. Admin User
- **Email**: `admin@mlmpk.com`
- **Password**: `admin123`
- **Name**: Admin User
- **Role**: ADMIN
- **Admin Access**: ✅ YES
- **Created**: October 23, 2025
- **Status**: ✅ Active

#### 2. Test User
- **Email**: `test@example.com`
- **Password**: (Hashed - cannot be displayed)
- **Name**: Test User
- **Role**: USER
- **Admin Access**: ❌ NO
- **Created**: September 8, 2025
- **Status**: ✅ Active

---

## Login Credentials

### Admin Login
```
Email: admin@mlmpk.com
Password: admin123
Access: Admin Dashboard at /admin
```

### Test User Login
```
Email: test@example.com
Password: (Unknown - set during registration)
Access: User Dashboard at /dashboard
```

---

## Database Configuration

### Prisma Schema
- **Provider**: SQLite
- **File**: `./prisma/dev.db`
- **Connection**: Local file-based database

### Models Available
- ✅ Users (with admin support)
- ✅ Products
- ✅ Orders
- ✅ Tasks
- ✅ Cart & CartItems
- ✅ Blog Posts & Comments
- ✅ Notifications
- ✅ Withdrawals
- ✅ Social Features
- ✅ Memberships
- ✅ And 30+ more models

---

## How to Add More Users

### Option 1: Via Web Interface
1. Go to http://localhost:3000
2. Click "Register" or "Sign Up"
3. Fill in email and password
4. Account will be created automatically

### Option 2: Via Script
Create a new file `add-user.js`:
```javascript
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function addUser(email, password, name) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      referralCode: 'REF' + Math.random().toString(36).substring(7).toUpperCase(),
    }
  });
  console.log('User created:', user.email);
  await prisma.$disconnect();
}

addUser('newuser@example.com', 'password123', 'New User');
```

Then run: `node add-user.js`

---

## Important Notes

⚠️ **Security**
- Passwords are hashed using bcryptjs
- Never share passwords via email or chat
- Use strong passwords for production

⚠️ **Database**
- SQLite is suitable for development
- For production, migrate to PostgreSQL (Supabase)
- Backup `prisma/dev.db` regularly

✅ **Testing**
- Admin credentials are ready for testing
- Use admin account to access admin dashboard
- Test user registration on the website

---

## Next Steps

1. ✅ Database is configured and running
2. ✅ Admin user is created
3. 📝 Test login with admin credentials
4. 📝 Create more test users as needed
5. 📝 Configure production database when ready

