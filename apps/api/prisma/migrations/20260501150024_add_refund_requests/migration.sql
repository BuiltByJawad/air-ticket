-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('pending', 'approved', 'rejected', 'processed');

-- CreateTable
CREATE TABLE "RefundRequest" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "refundAmount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'pending',
    "reviewedBy" TEXT,
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefundRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RefundRequest_bookingId_idx" ON "RefundRequest"("bookingId");

-- CreateIndex
CREATE INDEX "RefundRequest_agencyId_idx" ON "RefundRequest"("agencyId");

-- CreateIndex
CREATE INDEX "RefundRequest_status_idx" ON "RefundRequest"("status");

-- CreateIndex
CREATE INDEX "RefundRequest_createdAt_idx" ON "RefundRequest"("createdAt");

-- AddForeignKey
ALTER TABLE "RefundRequest" ADD CONSTRAINT "RefundRequest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundRequest" ADD CONSTRAINT "RefundRequest_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
