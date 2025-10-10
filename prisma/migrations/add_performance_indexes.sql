-- Performance Optimization Indexes for SQLite
-- Run these manually or through a migration

-- User table indexes
CREATE INDEX IF NOT EXISTS idx_user_email ON User(email);
CREATE INDEX IF NOT EXISTS idx_user_referralCode ON User(referralCode);
CREATE INDEX IF NOT EXISTS idx_user_sponsorId ON User(sponsorId);
CREATE INDEX IF NOT EXISTS idx_user_membershipStatus ON User(membershipStatus);
CREATE INDEX IF NOT EXISTS idx_user_createdAt ON User(createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_user_isAdmin ON User(isAdmin);
CREATE INDEX IF NOT EXISTS idx_user_isActive ON User(isActive);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_status_plan ON User(membershipStatus, membershipPlan);
CREATE INDEX IF NOT EXISTS idx_user_admin_active ON User(isAdmin, isActive);

-- Order table indexes
CREATE INDEX IF NOT EXISTS idx_order_userId ON Order(userId);
CREATE INDEX IF NOT EXISTS idx_order_orderNumber ON Order(orderNumber);
CREATE INDEX IF NOT EXISTS idx_order_status ON Order(status);
CREATE INDEX IF NOT EXISTS idx_order_paymentStatus ON Order(paymentStatus);
CREATE INDEX IF NOT EXISTS idx_order_createdAt ON Order(createdAt DESC);

-- Composite indexes for order queries
CREATE INDEX IF NOT EXISTS idx_order_user_status ON Order(userId, status);
CREATE INDEX IF NOT EXISTS idx_order_payment_date ON Order(paymentStatus, createdAt DESC);

-- TaskCompletion table indexes
CREATE INDEX IF NOT EXISTS idx_taskcompletion_userId ON TaskCompletion(userId);
CREATE INDEX IF NOT EXISTS idx_taskcompletion_taskId ON TaskCompletion(taskId);
CREATE INDEX IF NOT EXISTS idx_taskcompletion_completedAt ON TaskCompletion(completedAt DESC);
CREATE INDEX IF NOT EXISTS idx_taskcompletion_status ON TaskCompletion(status);

-- Composite indexes for task queries
CREATE INDEX IF NOT EXISTS idx_taskcompletion_user_task ON TaskCompletion(userId, taskId);
CREATE INDEX IF NOT EXISTS idx_taskcompletion_user_date ON TaskCompletion(userId, completedAt DESC);

-- WithdrawalRequest table indexes
CREATE INDEX IF NOT EXISTS idx_withdrawal_userId ON WithdrawalRequest(userId);
CREATE INDEX IF NOT EXISTS idx_withdrawal_status ON WithdrawalRequest(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_createdAt ON WithdrawalRequest(createdAt DESC);

-- Notification table indexes
CREATE INDEX IF NOT EXISTS idx_notification_userId ON Notification(userId);
CREATE INDEX IF NOT EXISTS idx_notification_read ON Notification(read);
CREATE INDEX IF NOT EXISTS idx_notification_createdAt ON Notification(createdAt DESC);

-- Composite index for unread notifications
CREATE INDEX IF NOT EXISTS idx_notification_user_read ON Notification(userId, read, createdAt DESC);

-- ManualPayment table indexes
CREATE INDEX IF NOT EXISTS idx_manualpayment_userId ON ManualPayment(userId);
CREATE INDEX IF NOT EXISTS idx_manualpayment_status ON ManualPayment(status);
CREATE INDEX IF NOT EXISTS idx_manualpayment_orderId ON ManualPayment(orderId);
CREATE INDEX IF NOT EXISTS idx_manualpayment_createdAt ON ManualPayment(createdAt DESC);

-- Product table indexes
CREATE INDEX IF NOT EXISTS idx_product_categoryId ON Product(categoryId);
CREATE INDEX IF NOT EXISTS idx_product_status ON Product(status);
CREATE INDEX IF NOT EXISTS idx_product_featured ON Product(featured);
CREATE INDEX IF NOT EXISTS idx_product_createdAt ON Product(createdAt DESC);

-- BlogPost table indexes
CREATE INDEX IF NOT EXISTS idx_blogpost_authorId ON BlogPost(authorId);
CREATE INDEX IF NOT EXISTS idx_blogpost_published ON BlogPost(published);
CREATE INDEX IF NOT EXISTS idx_blogpost_publishedAt ON BlogPost(publishedAt DESC);
CREATE INDEX IF NOT EXISTS idx_blogpost_slug ON BlogPost(slug);

-- Cart and CartItem indexes
CREATE INDEX IF NOT EXISTS idx_cart_userId ON Cart(userId);
CREATE INDEX IF NOT EXISTS idx_cartitem_cartId ON CartItem(cartId);
CREATE INDEX IF NOT EXISTS idx_cartitem_productId ON CartItem(productId);

-- Session management indexes (if using database sessions)
CREATE INDEX IF NOT EXISTS idx_session_sessionToken ON Session(sessionToken);
CREATE INDEX IF NOT EXISTS idx_session_userId ON Session(userId);
CREATE INDEX IF NOT EXISTS idx_session_expires ON Session(expires);

-- Analyze tables for query optimization
ANALYZE;
