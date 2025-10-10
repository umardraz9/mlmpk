-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "renewalFee" REAL NOT NULL DEFAULT 300,
    "dailyTaskLimit" INTEGER NOT NULL DEFAULT 5,
    "globalTaskAmount" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
