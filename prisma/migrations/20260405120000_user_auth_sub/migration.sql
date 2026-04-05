-- AlterTable
ALTER TABLE "User" ADD COLUMN "authSub" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_authSub_key" ON "User"("authSub");
