# MLM-Pak Task System Documentation

## Overview

The MLM-Pak platform now includes a comprehensive, policy-compliant task system that allows users to earn rewards by engaging with quality content on a secondary website. This system is designed to be Google AdSense policy-compliant while providing genuine value to users.

## System Components

### 1. Content Engagement Tasks
- **Policy-Compliant**: Focuses on content engagement rather than ad interaction
- **Quality Content**: High-quality articles on technology, business, and lifestyle topics
- **Verification**: Multi-layer verification including time spent, scroll depth, mouse movement, and quiz completion
- **Daily Limits**: Maximum 5 tasks per day to prevent abuse

### 2. Task Types

#### Content Engagement Tasks
- **Technology Articles**: AI, innovation, future trends
- **Business Insights**: Digital marketing, entrepreneurship, strategy
- **Lifestyle Content**: Work-life balance, productivity, wellness

#### Verification Requirements
- **Minimum Time**: 2-3 minutes of genuine engagement
- **Scroll Depth**: 70-80% of content viewed
- **Mouse Movement**: Active user interaction detected
- **Quiz Completion**: Simple comprehension quiz
- **Anti-Cheat**: Multiple detection mechanisms

### 3. Reward Structure
- **Technology Tasks**: PKR 25-40 points
- **Business Tasks**: PKR 30-35 points
- **Lifestyle Tasks**: PKR 20-25 points
- **Bonus Multipliers**: Higher rewards for deeper engagement

## Technical Implementation

### Database Schema
```prisma
model Task {
  id          String   @id @default(cuid())
  title       String
  description String
  type        String   // CONTENT_ENGAGEMENT, DAILY, WEEKLY, etc.
  category    String   // technology, business, lifestyle
  difficulty  String
  reward      Float
  timeLimit   Int?     // in minutes
  status      String   @default("ACTIVE")
}

model TaskCompletion {
  id          String   @id @default(cuid())
  userId      String
  taskId      String
  status      String   // PENDING, IN_PROGRESS, COMPLETED, FAILED
  progress    Int      @default(0)
  startedAt   DateTime?
  completedAt DateTime?
}
```

### API Endpoints

#### Task Management
- `GET /api/tasks` - Fetch available tasks
- `POST /api/tasks` - Start a task
- `POST /api/tasks/:id/complete` - Complete a task
- `POST /api/tasks/verify-completion` - Verify content engagement

#### Content Site Integration
- `GET /api/tasks/content-redirect` - Redirect to content site
- `POST /api/content/verify` - Verify engagement metrics

### Verification System

#### Engagement Tracking
```typescript
interface TaskVerificationData {
  scrollDepth: number      // 0.0 to 1.0
  timeSpent: number        // milliseconds
  mouseMovement: boolean   // active interaction
  contentEngagement: boolean // genuine reading
  quizCompleted: boolean   // comprehension check
}
```

#### Security Measures
- **Token Validation**: Secure tokens with expiration
- **Referrer Check**: Only allow traffic from MLM site
- **Rate Limiting**: Daily task limits
- **Behavior Analysis**: Detect bot-like behavior
- **IP Tracking**: Monitor for suspicious patterns

## Usage Instructions

### For Users
1. **Login** to MLM-Pak platform
2. **Navigate** to Tasks section
3. **Select** a content engagement task
4. **Read** the article for required time
5. **Complete** the verification quiz
6. **Return** to MLM site for reward

### For Admins
1. **Monitor** task completion rates
2. **Review** suspicious activities
3. **Adjust** reward amounts
4. **Add** new content articles
5. **Analyze** user engagement metrics

## Content Site Setup

### Environment Variables
```bash
# MLM Site
CONTENT_SITE_URL=http://localhost:3002

# Content Site
MLM_SITE_URL=http://localhost:3000
```

### Content Articles
- **Technology**: AI, innovation, future trends
- **Business**: Digital marketing, entrepreneurship
- **Lifestyle**: Work-life balance, productivity

### Ad Placement
- **Natural Integration**: Ads within content flow
- **Policy Compliance**: No forced ad interaction
- **User Experience**: Focus on content value

## Google AdSense Compliance

### ✅ Safe Practices
- **Content Focus**: Reward content engagement, not ad interaction
- **Natural Flow**: Ads appear naturally within content
- **User Choice**: No forced ad viewing or clicking
- **Quality Metrics**: Time spent, scroll depth, genuine engagement

### ❌ Avoid These
- **Direct Instructions**: "Click this ad"
- **Forced Viewing**: "Watch this ad for 30 seconds"
- **Artificial Traffic**: Bot-generated engagement
- **Misleading Rewards**: Rewards tied to ad interactions

## Monitoring & Analytics

### User Metrics
- **Engagement Time**: Average time spent on content
- **Scroll Depth**: How much content users view
- **Quiz Performance**: Comprehension verification
- **Return Rate**: Users returning for more tasks

### Content Performance
- **Article Popularity**: Most-read topics
- **Completion Rates**: Task success percentages
- **User Feedback**: Ratings and comments
- **Revenue Impact**: Overall platform earnings

## Fraud Detection

### Automated Checks
- **Behavior Analysis**: Detect bot-like patterns
- **Time Verification**: Ensure realistic engagement times
- **Mouse Tracking**: Verify human interaction
- **IP Analysis**: Monitor for suspicious traffic

### Manual Review
- **Flagged Activities**: Review suspicious completions
- **User Reports**: Investigate complaints
- **Quality Assurance**: Regular content audits

## Future Enhancements

### Planned Features
- **AI-Powered Content**: Personalized article recommendations
- **Gamification**: Achievement systems and badges
- **Social Features**: User reviews and ratings
- **Advanced Analytics**: Detailed engagement insights

### Integration Possibilities
- **Mobile App**: Native mobile experience
- **Browser Extension**: Seamless task integration
- **API Partners**: Third-party content providers
- **Social Media**: Cross-platform engagement

## Support & Troubleshooting

### Common Issues
- **Token Expired**: Refresh and retry task
- **Verification Failed**: Ensure genuine engagement
- **Content Loading**: Check internet connection
- **Reward Not Received**: Contact support team

### Contact Information
- **Email**: support@mlmpak.com
- **Live Chat**: Available during business hours
- **Documentation**: Updated regularly online

## Development Notes

### Tech Stack
- **Frontend**: Next.js, React, TypeScript
- **Backend**: Next.js API routes, Prisma ORM
- **Database**: SQLite (development), PostgreSQL (production)
- **Content**: Static generation with dynamic updates

### Development Commands
```bash
# Start development
npm run dev

# Database migrations
npx prisma migrate dev

# Seed content tasks
npx ts-node scripts/seed-content-tasks.ts

# Run content site
npm run dev:content
```

This system provides a sustainable, policy-compliant way to engage users with quality content while generating revenue through organic ad placement and genuine user engagement.
