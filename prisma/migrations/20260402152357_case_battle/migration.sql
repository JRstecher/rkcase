-- CreateTable
CREATE TABLE "CaseBattle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "caseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slots" INTEGER NOT NULL,
    "serverSeed" TEXT NOT NULL,
    "clientSeed" TEXT NOT NULL,
    "totalPaid" INTEGER NOT NULL,
    "winnerSlot" INTEGER NOT NULL,
    CONSTRAINT "CaseBattle_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CaseBattle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CaseBattleRoll" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "battleId" TEXT NOT NULL,
    "slotIndex" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "nonce" INTEGER NOT NULL,
    CONSTRAINT "CaseBattleRoll_battleId_fkey" FOREIGN KEY ("battleId") REFERENCES "CaseBattle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CaseBattleRoll_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CaseBattle_userId_createdAt_idx" ON "CaseBattle"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CaseBattle_caseId_createdAt_idx" ON "CaseBattle"("caseId", "createdAt");

-- CreateIndex
CREATE INDEX "CaseBattleRoll_battleId_idx" ON "CaseBattleRoll"("battleId");
