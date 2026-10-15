-- CreateTable
CREATE TABLE "MarkupRule" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "airline" TEXT,
    "origin" TEXT,
    "destination" TEXT,
    "cabinClass" TEXT,
    "markupPct" DECIMAL(65,30) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarkupRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionRule" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "airline" TEXT,
    "origin" TEXT,
    "destination" TEXT,
    "cabinClass" TEXT,
    "commissionPct" DECIMAL(65,30) NOT NULL,
    "commissionFlat" DECIMAL(65,30),
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarkupRule_agencyId_idx" ON "MarkupRule"("agencyId");

-- CreateIndex
CREATE INDEX "MarkupRule_airline_idx" ON "MarkupRule"("airline");

-- CreateIndex
CREATE INDEX "MarkupRule_active_idx" ON "MarkupRule"("active");

-- CreateIndex
CREATE INDEX "CommissionRule_agencyId_idx" ON "CommissionRule"("agencyId");

-- CreateIndex
CREATE INDEX "CommissionRule_airline_idx" ON "CommissionRule"("airline");

-- CreateIndex
CREATE INDEX "CommissionRule_active_idx" ON "CommissionRule"("active");

-- AddForeignKey
ALTER TABLE "MarkupRule" ADD CONSTRAINT "MarkupRule_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionRule" ADD CONSTRAINT "CommissionRule_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
