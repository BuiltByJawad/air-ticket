/*
  Warnings:

  - Added the required column `updatedAt` to the `Agency` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'payment';

-- AlterTable
ALTER TABLE "Agency" ADD COLUMN     "markupPercentage" DECIMAL(65,30) NOT NULL DEFAULT 0.0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now();

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "duffelOrderId" TEXT,
ADD COLUMN     "duffelPnr" TEXT,
ADD COLUMN     "duffelTicketNumbers" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "passengers" JSONB,
ALTER COLUMN "status" SET DEFAULT 'draft';
