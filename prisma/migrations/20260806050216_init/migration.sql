-- CreateEnum
CREATE TYPE "RiskTier" AS ENUM ('Low', 'Medium', 'High');

-- CreateEnum
CREATE TYPE "DecisionStatus" AS ENUM ('Approved', 'Rejected', 'Under_Investigation');

-- CreateTable
CREATE TABLE "Applicant" (
    "id" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "annualIncome" DOUBLE PRECISION NOT NULL,
    "existingMonthlyDebt" DOUBLE PRECISION NOT NULL,
    "repaymentScore" INTEGER NOT NULL,
    "loanAmount" DOUBLE PRECISION NOT NULL,
    "tenureMonths" INTEGER NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dti" DOUBLE PRECISION NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "riskTier" "RiskTier" NOT NULL,

    CONSTRAINT "Applicant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Decision" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "status" "DecisionStatus" NOT NULL,
    "officerName" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Decision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiExplanation" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiExplanation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricalDefaultRate" (
    "id" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "HistoricalDefaultRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Applicant_riskTier_idx" ON "Applicant"("riskTier");

-- CreateIndex
CREATE INDEX "Applicant_category_idx" ON "Applicant"("category");

-- CreateIndex
CREATE INDEX "Applicant_branch_idx" ON "Applicant"("branch");

-- CreateIndex
CREATE INDEX "Decision_status_idx" ON "Decision"("status");

-- CreateIndex
CREATE INDEX "Decision_officerName_idx" ON "Decision"("officerName");

-- CreateIndex
CREATE INDEX "Decision_createdAt_idx" ON "Decision"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AiExplanation_applicantId_key" ON "AiExplanation"("applicantId");

-- CreateIndex
CREATE UNIQUE INDEX "HistoricalDefaultRate_branch_category_key" ON "HistoricalDefaultRate"("branch", "category");

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiExplanation" ADD CONSTRAINT "AiExplanation_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
