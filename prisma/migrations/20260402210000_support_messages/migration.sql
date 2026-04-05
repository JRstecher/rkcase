-- CreateTable
CREATE TABLE "SupportMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "SupportMessage_createdAt_idx" ON "SupportMessage"("createdAt");
