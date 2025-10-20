-- Create Social Feature Tables in Supabase
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/sfmeemhtjxwseuvzcjyd/sql

-- Create SocialPost table
CREATE TABLE IF NOT EXISTS "SocialPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "type" TEXT NOT NULL DEFAULT 'general',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "SocialPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create SocialComment table
CREATE TABLE IF NOT EXISTS "SocialComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "SocialComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SocialComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create SocialLike table
CREATE TABLE IF NOT EXISTS "SocialLike" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "SocialLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SocialLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SocialLike_postId_userId_key" UNIQUE ("postId", "userId")
);

-- Create SocialShare table
CREATE TABLE IF NOT EXISTS "SocialShare" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "SocialShare_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SocialShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "SocialPost_authorId_idx" ON "SocialPost"("authorId");
CREATE INDEX IF NOT EXISTS "SocialPost_createdAt_idx" ON "SocialPost"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "SocialPost_type_idx" ON "SocialPost"("type");
CREATE INDEX IF NOT EXISTS "SocialPost_status_idx" ON "SocialPost"("status");

CREATE INDEX IF NOT EXISTS "SocialComment_postId_idx" ON "SocialComment"("postId");
CREATE INDEX IF NOT EXISTS "SocialComment_userId_idx" ON "SocialComment"("userId");
CREATE INDEX IF NOT EXISTS "SocialComment_createdAt_idx" ON "SocialComment"("createdAt" DESC);

CREATE INDEX IF NOT EXISTS "SocialLike_postId_idx" ON "SocialLike"("postId");
CREATE INDEX IF NOT EXISTS "SocialLike_userId_idx" ON "SocialLike"("userId");

CREATE INDEX IF NOT EXISTS "SocialShare_postId_idx" ON "SocialShare"("postId");
CREATE INDEX IF NOT EXISTS "SocialShare_userId_idx" ON "SocialShare"("userId");

-- Success message
SELECT 'Social tables created successfully!' as message;
