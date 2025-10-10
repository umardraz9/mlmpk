-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_membership_plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "dailyTaskEarning" REAL NOT NULL,
    "tasksPerDay" INTEGER NOT NULL DEFAULT 5,
    "maxEarningDays" INTEGER NOT NULL DEFAULT 30,
    "extendedEarningDays" INTEGER NOT NULL DEFAULT 60,
    "minimumWithdrawal" REAL NOT NULL,
    "voucherAmount" REAL NOT NULL DEFAULT 500,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "features" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_membership_plans" ("createdAt", "dailyTaskEarning", "description", "displayName", "extendedEarningDays", "features", "id", "isActive", "maxEarningDays", "minimumWithdrawal", "name", "price", "updatedAt", "voucherAmount") SELECT "createdAt", "dailyTaskEarning", "description", "displayName", "extendedEarningDays", "features", "id", "isActive", "maxEarningDays", "minimumWithdrawal", "name", "price", "updatedAt", "voucherAmount" FROM "membership_plans";
DROP TABLE "membership_plans";
ALTER TABLE "new_membership_plans" RENAME TO "membership_plans";
CREATE UNIQUE INDEX "membership_plans_name_key" ON "membership_plans"("name");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "bio" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "referralCode" TEXT NOT NULL,
    "referredBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tasksEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "sponsorId" TEXT,
    "balance" REAL NOT NULL DEFAULT 0,
    "totalEarnings" REAL NOT NULL DEFAULT 0,
    "pendingCommission" REAL NOT NULL DEFAULT 0,
    "availableVoucherPkr" REAL NOT NULL DEFAULT 0,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "membershipPlan" TEXT,
    "membershipStatus" TEXT NOT NULL DEFAULT 'INACTIVE',
    "membershipStartDate" DATETIME,
    "membershipEndDate" DATETIME,
    "taskEarnings" REAL NOT NULL DEFAULT 0,
    "referralEarnings" REAL NOT NULL DEFAULT 0,
    "dailyTasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "lastTaskCompletionDate" DATETIME,
    "earningsContinueUntil" DATETIME,
    "minimumWithdrawal" REAL NOT NULL DEFAULT 2000,
    "location" TEXT,
    "website" TEXT,
    "birthdate" DATETIME,
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
    "achievements_list" TEXT,
    CONSTRAINT "users_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);
INSERT INTO "new_users" ("achievements_list", "allowFollows", "allowMessages", "availableVoucherPkr", "avatar", "balance", "bio", "birthdate", "coverImage", "createdAt", "dailyTasksCompleted", "directMessages", "earningsContinueUntil", "email", "emailNotifications", "emailVerified", "firstName", "id", "image", "isActive", "isAdmin", "lastName", "lastTaskCompletionDate", "location", "membershipEndDate", "membershipPlan", "membershipStartDate", "membershipStatus", "mentorId", "minimumWithdrawal", "name", "newFollowers", "partnerLevel", "partnershipUpdates", "password", "pendingCommission", "phone", "postComments", "postLikes", "profileVisibility", "pushNotifications", "referralCode", "referralEarnings", "referredBy", "role", "showBirthdate", "showEmail", "showOnlineStatus", "showPhone", "specializations", "sponsorId", "taskEarnings", "tasksCompleted", "teamRole", "totalEarnings", "totalPoints", "updatedAt", "username", "website", "weeklyDigest") SELECT "achievements_list", "allowFollows", "allowMessages", "availableVoucherPkr", "avatar", "balance", "bio", "birthdate", "coverImage", "createdAt", "dailyTasksCompleted", "directMessages", "earningsContinueUntil", "email", "emailNotifications", "emailVerified", "firstName", "id", "image", "isActive", "isAdmin", "lastName", "lastTaskCompletionDate", "location", "membershipEndDate", "membershipPlan", "membershipStartDate", "membershipStatus", "mentorId", "minimumWithdrawal", "name", "newFollowers", "partnerLevel", "partnershipUpdates", "password", "pendingCommission", "phone", "postComments", "postLikes", "profileVisibility", "pushNotifications", "referralCode", "referralEarnings", "referredBy", "role", "showBirthdate", "showEmail", "showOnlineStatus", "showPhone", "specializations", "sponsorId", "taskEarnings", "tasksCompleted", "teamRole", "totalEarnings", "totalPoints", "updatedAt", "username", "website", "weeklyDigest" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_referralCode_key" ON "users"("referralCode");
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_referralCode_idx" ON "users"("referralCode");
CREATE INDEX "users_sponsorId_idx" ON "users"("sponsorId");
CREATE INDEX "users_membershipPlan_membershipStatus_idx" ON "users"("membershipPlan", "membershipStatus");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
