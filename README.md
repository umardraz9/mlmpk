# MLM-Pak Platform

A comprehensive MLM (Multi-Level Marketing) platform with e-commerce integration, specifically designed for the Pakistani market.

/**
 * @overview
 *   MLM-Pak Platform is a modern web application that combines network marketing with e-commerce functionality, offering:
 *     - Single Investment Plan: PKR 1,000 with PKR 500 product voucher
 *     - 5-Level Commission Structure: Earn up to PKR 3,000 maximum
 *     - E-commerce Integration: Buy and sell products with commission earning
 *     - Task System: Complete tasks to earn additional PKR 100 per 10 tasks
 *     - Pakistani Payment Methods: JazzCash, EasyPaisa, bank transfers
 *     - Blog & Knowledge Base: Success stories, guides, and earning strategies
 *     - Legal Compliance: SECP registered, FBR compliant
 * @author Muhammad Umer <m.umer@hotmail.com>
 * @license MIT
 */

## 🚀 Project Overview

**MLM-Pak Platform** is a modern web application that combines network marketing with e-commerce functionality, offering:

- **Single Investment Plan**: PKR 1,000 with PKR 500 product voucher
- **5-Level Commission Structure**: Earn up to PKR 3,000 maximum
- **E-commerce Integration**: Buy and sell products with commission earning
- **Task System**: Complete tasks to earn additional PKR 100 per 10 tasks
- **Pakistani Payment Methods**: JazzCash, EasyPaisa, bank transfers
- **Blog & Knowledge Base**: Success stories, guides, and earning strategies
- **Legal Compliance**: SECP registered, FBR compliant

## 💰 Business Model

### Investment Structure
- **Entry Fee**: PKR 1,000 (one-time payment)
- **Product Voucher**: PKR 500 (50% of investment)
- **Maximum Earning**: PKR 3,000 (3x return)
- **Commission Levels**: 5 levels with transparent rates

### Commission Breakdown
| Level | Rate | Amount | Description |
|-------|------|--------|-------------|
| 1 | 20% | PKR 200 | Direct Referral |
| 2 | 15% | PKR 150 | Level 2 |
| 3 | 10% | PKR 100 | Level 3 |
| 4 | 8% | PKR 80 | Level 4 |
| 5 | 7% | PKR 70 | Level 5 |

**Total Commission Potential**: PKR 600 per referral line

### Additional Earning Streams
- **Task Completion**: PKR 100 per 10 tasks
- **E-commerce Sales**: 5% commission on product sales
- **Product Cashback**: 10% on own purchases
- **Team Sales Bonus**: 8% on direct referral purchases

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Rich Text Editor**: TipTap for blog content

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js + JWT
- **File Upload**: Cloudinary integration
- **SEO**: Next.js metadata API + structured data

### Pakistani Integrations
- **Payment Gateways**: JazzCash, EasyPaisa
- **Banking**: NIFT/1LINK integration
- **SMS**: Pakistani SMS APIs for OTP
- **Compliance**: SECP and FBR requirements

## 📁 Project Structure

```
mlm-pak-platform/
├── src/
│   ├── app/                 # Next.js 14 App Router
│   │   ├── page.tsx         # Landing page
│   │   ├── auth/            # Authentication pages
│   │   ├── dashboard/       # User dashboard
│   │   ├── admin/           # Admin panel
│   │   ├── blog/            # Blog pages
│   │   └── api/             # API routes
│   ├── components/          # Reusable UI components
│   │   ├── ui/              # Base UI components
│   │   ├── forms/           # Form components
│   │   ├── blog/            # Blog components
│   │   └── layout/          # Layout components
│   ├── lib/                 # Utility functions
│   │   ├── prisma.ts        # Database client
│   │   └── utils.ts         # Helper functions
│   └── config/              # Configuration files
├── prisma/
│   └── schema.prisma        # Database schema
├── config/
│   └── environment.ts       # Environment configuration
├── PRD.md                   # Product Requirements Document
├── TASK_LIST.md             # Development task list
└── .corsrules               # CORS configuration
```

## 🗄️ Database Schema

The platform uses PostgreSQL with the following main entities:

- **Users**: MLM participants with investment tracking
- **Products**: E-commerce catalog with commission rates
- **Orders**: Purchase history with voucher usage
- **Commissions**: MLM and e-commerce earnings
- **Tasks**: Task management and completion tracking
- **Withdrawals**: Earnings withdrawal requests
- **Blog Posts**: Articles with categories and tags
- **Comments**: User interactions on blog content

## 🚦 Development Progress

### ✅ Completed (Week 1)
- [x] Next.js 14 project setup with TypeScript
- [x] Tailwind CSS configuration
- [x] Prisma ORM setup with PostgreSQL schema
- [x] Environment configuration
- [x] Landing page with Pakistani branding
- [x] Basic utility functions
- [x] Project documentation (PRD, Task List, CORS rules)

### 🔄 In Progress (Week 2)
- [ ] Authentication system (NextAuth.js)
- [ ] User registration with Pakistani validation
- [ ] Database migrations and seeding
- [ ] Basic dashboard layout

### 📋 Upcoming (Weeks 3-24)
- [ ] MLM commission calculation engine
- [ ] E-commerce product catalog
- [ ] Pakistani payment gateway integration
- [ ] Task management system
- [ ] Admin dashboard
- [ ] Blog system implementation
- [ ] Mobile responsiveness
- [ ] Testing and deployment

## 🏃 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Pakistani payment gateway credentials

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd mlm-pak-platform
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Fill in your configuration values
```

4. **Set up the database**
```bash
npx prisma migrate dev
npx prisma generate
```

5. **Run the development server**
```bash
npm run dev
```

6. **Open in browser**
```
http://localhost:3000
```

## 🔧 Environment Variables

Key environment variables needed:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/mlmpak_db"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
JWT_SECRET="your-jwt-secret"

# Pakistani Payment Gateways
JAZZCASH_MERCHANT_ID="your-jazzcash-merchant-id"
EASYPAISA_STORE_ID="your-easypaisa-store-id"

# File Upload
CLOUDINARY_CLOUD_NAME="your-cloudinary-name"

# Email & SMS
SMTP_USER="your-email@gmail.com"
SMS_API_KEY="your-sms-api-key"
```

## 📊 Pakistani Market Features

### Payment Methods
- **JazzCash**: Mobile wallet integration
- **EasyPaisa**: Digital payment solution
- **Bank Transfer**: All major Pakistani banks
- **Credit/Debit Cards**: Local and international

### Localization
- **Currency**: Pakistani Rupee (PKR)
- **Language**: English with Urdu support
- **Timezone**: Asia/Karachi
- **Business Hours**: 9 AM - 6 PM (excluding Friday/Saturday)

### Compliance
- **SECP Registration**: Securities & Exchange Commission
- **FBR Compliance**: Federal Board of Revenue
- **Consumer Protection**: Pakistani consumer laws
- **Data Privacy**: 7-year data retention

## 🎯 Key Features

### For Users
- **Easy Registration**: Simple signup with referral code
- **Investment Tracking**: Real-time earning dashboard
- **Product Shopping**: Use vouchers on quality products
- **Task Completion**: Earn through various activities
- **Referral Management**: Track your network growth
- **Withdrawal Requests**: Multiple payout methods
- **Knowledge Center**: Blog with success stories and guides

### For Admins
- **User Management**: View and manage all users
- **Commission Control**: Adjust rates and limits
- **Product Management**: Add/edit product catalog
- **Task Management**: Create and approve tasks
- **Financial Dashboard**: Revenue and payout tracking
- **Reports & Analytics**: Comprehensive business insights
- **Content Management**: Blog posts creation and publishing

## 🔒 Security Features

- **JWT Authentication**: Secure user sessions
- **Password Hashing**: bcrypt with 12 rounds
- **Rate Limiting**: API protection
- **CORS Configuration**: Cross-origin security
- **Input Validation**: Zod schema validation
- **SQL Injection Protection**: Prisma ORM safety
- **Content Moderation**: Blog comment filtering

## 📱 Mobile Support

- **Responsive Design**: Mobile-first approach
- **Touch Optimization**: Mobile-friendly interactions
- **PWA Ready**: Offline functionality planned
- **Push Notifications**: Task and commission alerts

## 🚀 Deployment

### Production Setup
1. **Database**: Managed PostgreSQL (Railway/Supabase)
2. **Frontend**: Vercel deployment
3. **Backend**: Railway/Render hosting
4. **CDN**: Cloudflare integration
5. **Monitoring**: Sentry error tracking

### Environment-Specific Configs
- **Development**: Local development setup
- **Staging**: Testing environment
- **Production**: Live platform with monitoring

## 📈 Business Metrics

### Target KPIs
- **User Acquisition**: 10,000 users in 6 months
- **Revenue Target**: PKR 10M in first year
- **Conversion Rate**: 15% from landing page
- **User Retention**: 70% monthly active users
- **Blog Engagement**: 5,000 monthly pageviews

### Success Metrics
- **Average User Earnings**: PKR 2,500 lifetime value
- **Commission Payout Ratio**: 60% of revenue
- **E-commerce Conversion**: 40% voucher utilization
- **Task Completion Rate**: 70% of active users
- **Blog Content Performance**: 2-minute average read time

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow coding standards (ESLint + Prettier)
4. Write tests for new features
5. Submit a pull request

## 📄 Legal & Compliance

- **Terms of Service**: Clear user agreements
- **Privacy Policy**: Data protection compliance
- **Refund Policy**: 7-day cooling period
- **Commission Transparency**: Open rate structure
- **Content Guidelines**: Blog publishing standards

## 📞 Support

- **Email**: support@mlmpak.com
- **Phone**: +92-21-1234567
- **Address**: Karachi, Pakistan
- **Business Hours**: 9 AM - 6 PM (Mon-Thu)

## 📝 License

This project is proprietary software developed for MLM-Pak Platform.

---

**Built with ❤️ for the Pakistani market**

*Start your journey with just PKR 1,000 and earn up to PKR 3,000!* 