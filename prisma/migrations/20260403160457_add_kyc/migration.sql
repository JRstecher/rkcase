-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "displayName" TEXT NOT NULL DEFAULT 'Demo Player',
    "balance" INTEGER NOT NULL DEFAULT 10000,
    "kycStatus" TEXT NOT NULL DEFAULT 'NONE',
    "kycVerifiedAt" DATETIME,
    "stripeIdentitySessionId" TEXT
);
INSERT INTO "new_User" ("balance", "createdAt", "displayName", "id", "updatedAt") SELECT "balance", "createdAt", "displayName", "id", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_stripeIdentitySessionId_key" ON "User"("stripeIdentitySessionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
