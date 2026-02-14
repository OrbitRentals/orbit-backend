-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phoneOtpCode" TEXT,
ADD COLUMN     "phoneOtpExpiresAt" TIMESTAMP(3),
ADD COLUMN     "ratingAverage" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "ratingCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "suspendedUntil" TIMESTAMP(3),
ADD COLUMN     "suspensionReason" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_isSuspended_idx" ON "User"("isSuspended");
