-- AlterTable
ALTER TABLE "users" ADD COLUMN "bio" TEXT;

-- CreateTable
CREATE TABLE "social_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "social_reports_postId_fkey" FOREIGN KEY ("postId") REFERENCES "social_posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "social_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
