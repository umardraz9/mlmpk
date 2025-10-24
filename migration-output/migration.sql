-- PostgreSQL Migration Script
-- Generated from SQLite database
-- Date: 2025-10-23T10:23:22.508Z
-- Tables: 50

-- Disable triggers during import
SET session_replication_role = replica;



-- Table: _prisma_migrations
DROP TABLE IF EXISTS "_prisma_migrations" CASCADE;
CREATE TABLE "_prisma_migrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "checksum" TEXT NOT NULL,
    "finished_at" TIMESTAMP,
    "migration_name" TEXT NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMP,
    "started_at" TIMESTAMP NOT NULL DEFAULT current_timestamp,
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);

-- Data for _prisma_migrations (6 rows)
INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") VALUES ('54380553-1edf-46af-94bf-57affd2ad32e', 'fe271e88015cbef415af280952f15395d27392e7d1a7b1ccc894ce79cd4bc1c2', 1757350449182, '20250802131917_add_article_tracking_fields', NULL, NULL, 1757350449000, 1);
INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") VALUES ('b8b75534-91a1-41c4-b420-1eede93246a4', '972b316fc7bf7793482f3599e12c3f9268b0c85b8ea7d168d9925a3d77de58c0', 1757350449238, '20250812113118_add_media_urls_to_social_post', NULL, NULL, 1757350449188, 1);
INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") VALUES ('1ba36a9e-3fec-4a7a-bae5-ad401bdd5996', 'b44aa1936bc9c0eabd7dd12dc767a4495f529fa50f94d2eef7a46aaadf8f3872', 1757350449284, '20250812122821_add_reel_fields', NULL, NULL, 1757350449250, 1);
INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") VALUES ('7fe78dec-6331-45c1-b6e0-61304bb7f133', '15cd03c9bf20fa3e4c2218cc9adbf2c6a4d65b5eb45eee6511c35e5e0ee4fb54', 1757350449302, '20250812135550_add_user_bio_and_social_report', NULL, NULL, 1757350449287, 1);
INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") VALUES ('189c1c10-51c4-4643-a514-81e68e0f6d04', '2549f99c2dd997fbf34b8204ef8e2285a0035eb1a996426b92e55326d7b145db', 1757350449355, '20250812144409_add_favorites_and_profile_likes', NULL, NULL, 1757350449304, 1);
INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") VALUES ('8b32c2b6-6b45-4419-836e-d7442e09ccd4', 'bf80233ec35489b743f0494001a57bf94ff1e4f94b137e588de8605b644ed7bc', 1757350449446, '20250821064248_add_password_reset', NULL, NULL, 1757350449357, 1);


-- Table: blog_categories
DROP TABLE IF EXISTS "blog_categories" CASCADE;
CREATE TABLE "blog_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL
);


-- Table: blog_tags
DROP TABLE IF EXISTS "blog_tags" CASCADE;
CREATE TABLE "blog_tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL
);


-- Table: blog_posts
DROP TABLE IF EXISTS "blog_posts" CASCADE;
CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "featuredImage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP,
    "scheduledAt" TIMESTAMP,
    "authorId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "metaKeywords" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL
);


-- Table: blog_comments
DROP TABLE IF EXISTS "blog_comments" CASCADE;
CREATE TABLE "blog_comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "parentId" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL
);


-- Table: tasks
DROP TABLE IF EXISTS "tasks" CASCADE;
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM',
    "reward" NUMERIC NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "target" INTEGER NOT NULL DEFAULT 1,
    "timeLimit" INTEGER,
    "startDate" TIMESTAMP,
    "endDate" TIMESTAMP,
    "instructions" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "completions" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "articleUrl" TEXT,
    "minDuration" INTEGER DEFAULT 45,
    "requireScrolling" BOOLEAN DEFAULT false,
    "requireMouseMovement" BOOLEAN DEFAULT false,
    "minScrollPercentage" INTEGER DEFAULT 50,
    "maxAttempts" INTEGER DEFAULT 3,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL
);


-- Table: task_completions
DROP TABLE IF EXISTS "task_completions" CASCADE;
CREATE TABLE "task_completions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "reward" NUMERIC NOT NULL DEFAULT 0,
    "notes" TEXT,
    "trackingData" TEXT,
    "startedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "completedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL
);


-- Table: notifications
DROP TABLE IF EXISTS "notifications" CASCADE;
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "category" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "recipientId" TEXT,
    "role" TEXT,
    "audience" TEXT,
    "data" TEXT,
    "actionUrl" TEXT,
    "actionText" TEXT,
    "imageUrl" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isDelivered" BOOLEAN NOT NULL DEFAULT false,
    "deliveredAt" TIMESTAMP,
    "readAt" TIMESTAMP,
    "clickedAt" TIMESTAMP,
    "scheduledFor" TIMESTAMP,
    "expiresAt" TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL
);


-- Table: commission_settings
DROP TABLE IF EXISTS "commission_settings" CASCADE;
CREATE TABLE "commission_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "level" INTEGER NOT NULL,
    "rate" NUMERIC NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL,
    "updatedBy" TEXT
);


-- Table: notification_preferences
DROP TABLE IF EXISTS "notification_preferences" CASCADE;
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailNewMessages" BOOLEAN NOT NULL DEFAULT true,
    "emailCommissions" BOOLEAN NOT NULL DEFAULT true,
    "emailReferrals" BOOLEAN NOT NULL DEFAULT true,
    "emailTasks" BOOLEAN NOT NULL DEFAULT true,
    "emailOrders" BOOLEAN NOT NULL DEFAULT true,
    "emailBlog" BOOLEAN NOT NULL DEFAULT false,
    "emailPromotions" BOOLEAN NOT NULL DEFAULT false,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushNewMessages" BOOLEAN NOT NULL DEFAULT true,
    "pushCommissions" BOOLEAN NOT NULL DEFAULT true,
    "pushReferrals" BOOLEAN NOT NULL DEFAULT true,
    "pushTasks" BOOLEAN NOT NULL DEFAULT true,
    "pushOrders" BOOLEAN NOT NULL DEFAULT true,
    "pushBlog" BOOLEAN NOT NULL DEFAULT false,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "inAppSounds" BOOLEAN NOT NULL DEFAULT true,
    "inAppDesktop" BOOLEAN NOT NULL DEFAULT true,
    "digestFrequency" TEXT NOT NULL DEFAULT 'daily',
    "quietHoursStart" INTEGER,
    "quietHoursEnd" INTEGER,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Karachi',
    "groupSimilar" BOOLEAN NOT NULL DEFAULT true,
    "maxDailyNotifications" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL
);


-- Table: withdrawal_requests
DROP TABLE IF EXISTS "withdrawal_requests" CASCADE;
CREATE TABLE "withdrawal_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "amount" NUMERIC NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "paymentDetails" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "processedAt" TIMESTAMP,
    "processedBy" TEXT,
    "rejectionReason" TEXT,
    "transactionId" TEXT,
    "notes" TEXT
);


-- Table: notification_templates
DROP TABLE IF EXISTS "notification_templates" CASCADE;
CREATE TABLE "notification_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "category" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "variables" TEXT,
    "defaultData" TEXT,
    "actionUrl" TEXT,
    "actionText" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL
);


-- Table: testimonials
DROP TABLE IF EXISTS "testimonials" CASCADE;
CREATE TABLE "testimonials" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL
);


-- Table: _BlogPostToBlogTag
DROP TABLE IF EXISTS "_BlogPostToBlogTag" CASCADE;
CREATE TABLE "_BlogPostToBlogTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);


-- Table: social_posts
DROP TABLE IF EXISTS "social_posts" CASCADE;
CREATE TABLE "social_posts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "mediaUrls" TEXT,
    "type" TEXT NOT NULL DEFAULT 'general',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL,
    "coverUrl" TEXT,
    "reelMeta" TEXT
);


-- Table: social_likes
DROP TABLE IF EXISTS "social_likes" CASCADE;
CREATE TABLE "social_likes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);


-- Table: social_comments
DROP TABLE IF EXISTS "social_comments" CASCADE;
CREATE TABLE "social_comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL
);


-- Table: social_shares
DROP TABLE IF EXISTS "social_shares" CASCADE;
CREATE TABLE "social_shares" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);


-- Table: social_follows
DROP TABLE IF EXISTS "social_follows" CASCADE;
CREATE TABLE "social_follows" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);


-- Table: user_achievements
DROP TABLE IF EXISTS "user_achievements" CASCADE;
CREATE TABLE "user_achievements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);


-- Table: team_members
DROP TABLE IF EXISTS "team_members" CASCADE;
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leaderId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "status" TEXT NOT NULL DEFAULT 'active',
    "commission" NUMERIC NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "joinedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);


-- Table: social_reports
DROP TABLE IF EXISTS "social_reports" CASCADE;
CREATE TABLE "social_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);


-- Table: favorites
DROP TABLE IF EXISTS "favorites" CASCADE;
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);


-- Table: profile_likes
DROP TABLE IF EXISTS "profile_likes" CASCADE;
CREATE TABLE "profile_likes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);


-- Table: password_resets
DROP TABLE IF EXISTS "password_resets" CASCADE;
CREATE TABLE "password_resets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);


-- Table: direct_messages
DROP TABLE IF EXISTS "direct_messages" CASCADE;
CREATE TABLE "direct_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'text',
    "attachments" TEXT,
    "images" TEXT,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "replyToId" TEXT,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" TIMESTAMP,
    "deletedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL
);


-- Table: user_blocks
DROP TABLE IF EXISTS "user_blocks" CASCADE;
CREATE TABLE "user_blocks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);


-- Table: message_reactions
DROP TABLE IF EXISTS "message_reactions" CASCADE;
CREATE TABLE "message_reactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reaction" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);


-- Table: carts
DROP TABLE IF EXISTS "carts" CASCADE;
CREATE TABLE "carts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL
);


-- Table: cart_items
DROP TABLE IF EXISTS "cart_items" CASCADE;
CREATE TABLE "cart_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" NUMERIC NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL
);


-- Table: order_items
DROP TABLE IF EXISTS "order_items" CASCADE;
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" NUMERIC NOT NULL,
    "totalPrice" NUMERIC NOT NULL
);


-- Table: product_categories
DROP TABLE IF EXISTS "product_categories" CASCADE;
CREATE TABLE "product_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT DEFAULT '#3B82F6',
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL
);


-- Table: return_requests
DROP TABLE IF EXISTS "return_requests" CASCADE;
CREATE TABLE "return_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "returnNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requestedAmount" NUMERIC NOT NULL,
    "refundAmount" NUMERIC,
    "returnType" TEXT NOT NULL DEFAULT 'REFUND',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "refundMethod" TEXT,
    "processedBy" TEXT,
    "processedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL
);


-- Table: membership_plans
DROP TABLE IF EXISTS "membership_plans" CASCADE;
CREATE TABLE "membership_plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "price" NUMERIC NOT NULL,
    "dailyTaskEarning" NUMERIC NOT NULL,
    "maxEarningDays" INTEGER NOT NULL DEFAULT 30,
    "extendedEarningDays" INTEGER NOT NULL DEFAULT 60,
    "minimumWithdrawal" NUMERIC NOT NULL,
    "voucherAmount" NUMERIC NOT NULL DEFAULT 500,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "features" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL
);


-- Table: referral_commissions
DROP TABLE IF EXISTS "referral_commissions" CASCADE;
CREATE TABLE "referral_commissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "membershipPlanId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "amount" NUMERIC NOT NULL,
    "percentage" NUMERIC,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL
);


-- Table: task_earning_history
DROP TABLE IF EXISTS "task_earning_history" CASCADE;
CREATE TABLE "task_earning_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "membershipPlan" TEXT NOT NULL,
    "dailyEarning" NUMERIC NOT NULL,
    "tasksCompleted" INTEGER NOT NULL,
    "earningDate" TIMESTAMP NOT NULL,
    "isExtendedPeriod" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);


-- Table: referral_earning_history
DROP TABLE IF EXISTS "referral_earning_history" CASCADE;
CREATE TABLE "referral_earning_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "referredUserId" TEXT NOT NULL,
    "membershipPlan" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "amount" NUMERIC NOT NULL,
    "earningDate" TIMESTAMP NOT NULL DEFAULT NOW(),
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);


-- Table: payment_settings
DROP TABLE IF EXISTS "payment_settings" CASCADE;
CREATE TABLE "payment_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "accountTitle" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "bankName" TEXT,
    "branchCode" TEXT,
    "iban" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "instructions" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL
);


-- Table: payment_confirmations
DROP TABLE IF EXISTS "payment_confirmations" CASCADE;
CREATE TABLE "payment_confirmations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "membershipPlan" TEXT NOT NULL,
    "amount" NUMERIC NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "paymentDetails" TEXT NOT NULL,
    "paymentProof" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL
);


-- Table: plan_extension_settings
DROP TABLE IF EXISTS "plan_extension_settings" CASCADE;
CREATE TABLE "plan_extension_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "membershipPlan" TEXT NOT NULL,
    "baseDays" INTEGER NOT NULL DEFAULT 30,
    "extendedDays" INTEGER NOT NULL DEFAULT 60,
    "maxExtensionDays" INTEGER NOT NULL DEFAULT 90,
    "extensionRules" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL
);


-- Table: error_logs
DROP TABLE IF EXISTS "error_logs" CASCADE;
CREATE TABLE "error_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "url" TEXT,
    "userAgent" TEXT,
    "userId" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'error',
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL
);


-- Table: payment_methods
DROP TABLE IF EXISTS "payment_methods" CASCADE;
CREATE TABLE "payment_methods" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "accountTitle" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "bankName" TEXT,
    "branchCode" TEXT,
    "iban" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "instructions" TEXT,
    "minAmount" NUMERIC,
    "maxAmount" NUMERIC,
    "processingFee" NUMERIC NOT NULL DEFAULT 0,
    "processingTime" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL
);


-- Table: manual_payments
DROP TABLE IF EXISTS "manual_payments" CASCADE;
CREATE TABLE "manual_payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "paymentMethodId" TEXT NOT NULL,
    "amount" NUMERIC NOT NULL,
    "transactionId" TEXT,
    "paymentProof" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL
);


-- Table: reviews
DROP TABLE IF EXISTS "reviews" CASCADE;
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "orderId" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "images" TEXT,
    "isVerifiedPurchase" BOOLEAN NOT NULL DEFAULT false,
    "isHelpful" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL
);


-- Table: delivery_reviews
DROP TABLE IF EXISTS "delivery_reviews" CASCADE;
CREATE TABLE "delivery_reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "deliverySpeed" INTEGER,
    "packagingQuality" INTEGER,
    "courierBehavior" INTEGER,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL
);


-- Table: _UserMembershipPlans
DROP TABLE IF EXISTS "_UserMembershipPlans" CASCADE;
CREATE TABLE "_UserMembershipPlans" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);


-- Table: orders
DROP TABLE IF EXISTS "orders" CASCADE;
CREATE TABLE "orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "subtotalPkr" NUMERIC NOT NULL,
    "voucherUsedPkr" NUMERIC NOT NULL DEFAULT 0,
    "shippingPkr" NUMERIC NOT NULL DEFAULT 0,
    "totalPkr" NUMERIC NOT NULL,
    "paidAmountPkr" NUMERIC NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "shippingAddress" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT,
    "postalCode" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "trackingNumber" TEXT,
    "notes" TEXT,
    "adminNotified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL
);


-- Table: products
DROP TABLE IF EXISTS "products" CASCADE;
CREATE TABLE "products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" NUMERIC NOT NULL,
    "comparePrice" NUMERIC,
    "costPrice" NUMERIC,
    "sku" TEXT,
    "barcode" TEXT,
    "trackQuantity" BOOLEAN NOT NULL DEFAULT true,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "minQuantity" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP,
    "images" TEXT NOT NULL,
    "weight" NUMERIC,
    "dimensions" TEXT,
    "categoryId" TEXT,
    "tags" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "metaKeywords" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "sales" INTEGER NOT NULL DEFAULT 0,
    "rating" NUMERIC DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "trending" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL
);


-- Table: transactions
DROP TABLE IF EXISTS "transactions" CASCADE;
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" NUMERIC NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reference" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL
);


-- Table: users
DROP TABLE IF EXISTS "users" CASCADE;
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP,
    "image" TEXT,
    "bio" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "referralCode" TEXT NOT NULL,
    "referredBy" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "sponsorId" TEXT,
    "balance" NUMERIC NOT NULL DEFAULT 0,
    "totalEarnings" NUMERIC NOT NULL DEFAULT 0,
    "pendingCommission" NUMERIC NOT NULL DEFAULT 0,
    "availableVoucherPkr" NUMERIC NOT NULL DEFAULT 0,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "membershipPlan" TEXT,
    "membershipStatus" TEXT NOT NULL DEFAULT 'INACTIVE',
    "membershipStartDate" TIMESTAMP,
    "membershipEndDate" TIMESTAMP,
    "taskEarnings" NUMERIC NOT NULL DEFAULT 0,
    "referralEarnings" NUMERIC NOT NULL DEFAULT 0,
    "dailyTasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "lastTaskCompletionDate" TIMESTAMP,
    "earningsContinueUntil" TIMESTAMP,
    "minimumWithdrawal" NUMERIC NOT NULL DEFAULT 2000,
    "location" TEXT,
    "website" TEXT,
    "birthdate" TIMESTAMP,
    "coverImage" TEXT,
    "profileVisibility" TEXT NOT NULL DEFAULT 'public',
    "showEmail" BOOLEAN NOT NULL DEFAULT false,
    "showPhone" BOOLEAN NOT NULL DEFAULT false,
    "showBirthdate" BOOLEAN NOT NULL DEFAULT false,
    "allowMessages" BOOLEAN NOT NULL DEFAULT true,
    "allowFollows" BOOLEAN NOT NULL DEFAULT true,
    "showOnlineStatus" BOOLEAN NOT NULL DEFAULT true,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "postLikes" BOOLEAN NOT NULL DEFAULT true,
    "postComments" BOOLEAN NOT NULL DEFAULT true,
    "newFollowers" BOOLEAN NOT NULL DEFAULT true,
    "directMessages" BOOLEAN NOT NULL DEFAULT true,
    "partnershipUpdates" BOOLEAN NOT NULL DEFAULT true,
    "weeklyDigest" BOOLEAN NOT NULL DEFAULT true,
    "partnerLevel" TEXT NOT NULL DEFAULT 'Bronze',
    "teamRole" TEXT NOT NULL DEFAULT 'Member',
    "mentorId" TEXT,
    "specializations" TEXT,
    "achievements_list" TEXT
);

-- Data for users (1 rows)
INSERT INTO "users" ("id", "name", "email", "emailVerified", "image", "bio", "password", "role", "referralCode", "referredBy", "createdAt", "updatedAt", "username", "firstName", "lastName", "phone", "avatar", "isActive", "isAdmin", "sponsorId", "balance", "totalEarnings", "pendingCommission", "availableVoucherPkr", "totalPoints", "tasksCompleted", "membershipPlan", "membershipStatus", "membershipStartDate", "membershipEndDate", "taskEarnings", "referralEarnings", "dailyTasksCompleted", "lastTaskCompletionDate", "earningsContinueUntil", "minimumWithdrawal", "location", "website", "birthdate", "coverImage", "profileVisibility", "showEmail", "showPhone", "showBirthdate", "allowMessages", "allowFollows", "showOnlineStatus", "emailNotifications", "pushNotifications", "postLikes", "postComments", "newFollowers", "directMessages", "partnershipUpdates", "weeklyDigest", "partnerLevel", "teamRole", "mentorId", "specializations", "achievements_list") VALUES ('cmfbdeybs00005mz72mmn9i43', 'Test User', 'test@example.com', NULL, NULL, NULL, '$2a$12$MIyUYOrhQT/TD5hckd/iMe2vSzKmF5tz0./BKG6SkwytB8s7kAXn2', 'USER', 'TES4J7F9F', NULL, 1757351005769, 1757351005769, NULL, NULL, NULL, '+923001234567', NULL, 1, 0, NULL, 0, 0, 0, 0, 0, 0, NULL, 'INACTIVE', NULL, NULL, 0, 0, 0, NULL, NULL, 2000, NULL, NULL, NULL, NULL, 'public', 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 'Bronze', 'Member', NULL, NULL, NULL);


-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Migration complete
-- Total tables: 50
-- Generated: 2025-10-23T10:23:22.583Z