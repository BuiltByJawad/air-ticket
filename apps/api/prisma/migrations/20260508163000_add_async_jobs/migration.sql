-- CreateEnum
CREATE TYPE "AsyncJobStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- CreateTable
CREATE TABLE "AsyncJob" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "dedupeKey" TEXT,
    "status" "AsyncJobStatus" NOT NULL DEFAULT 'pending',
    "payload" JSONB NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "runAfter" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AsyncJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AsyncJob_dedupeKey_key" ON "AsyncJob"("dedupeKey");

-- CreateIndex
CREATE INDEX "AsyncJob_status_runAfter_idx" ON "AsyncJob"("status", "runAfter");

-- CreateIndex
CREATE INDEX "AsyncJob_type_idx" ON "AsyncJob"("type");
