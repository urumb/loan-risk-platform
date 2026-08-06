import { PrismaClient } from "@prisma/client";
import { computeRisk } from "../lib/risk";

const prisma = new PrismaClient();

const branches = ["Central", "Riverside", "North Point", "Market Street", "Lakeside"];
const categories = ["Personal", "Auto", "Mortgage", "Business", "Education"];
const targetApplicantCount = 150;

function pick<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function between(min: number, max: number) {
  return Math.round(min + Math.random() * (max - min));
}

function buildApplicant(index: number) {
  const annualIncome = between(320000, 3600000);
  const existingMonthlyDebt = between(2000, 125000);
  const repaymentScore = between(38, 99);
  const loanAmount = between(75000, 9500000);
  const tenureMonths = pick([12, 24, 36, 48, 60, 84, 120, 180, 240]);
  const risk = computeRisk({ annualIncome, existingMonthlyDebt, repaymentScore });

  return {
    branch: pick(branches),
    category: pick(categories),
    annualIncome,
    existingMonthlyDebt,
    repaymentScore,
    loanAmount,
    tenureMonths,
    submittedAt: new Date(Date.now() - between(0, 60) * 24 * 60 * 60 * 1000 - index * 60000),
    dti: risk.dti,
    riskScore: risk.riskScore,
    riskTier: risk.riskTier
  };
}

async function main() {
  console.log("Seeding loan risk database...");

  for (const branch of branches) {
    for (const category of categories) {
      await prisma.historicalDefaultRate.upsert({
        where: { branch_category: { branch, category } },
        update: {},
        create: {
          branch,
          category,
          rate: Number((0.025 + Math.random() * 0.15).toFixed(3))
        }
      });
    }
  }

  const existingApplicants = await prisma.applicant.count();
  const applicantsToCreate = Math.max(0, targetApplicantCount - existingApplicants);

  if (applicantsToCreate > 0) {
    const applicants = Array.from({ length: applicantsToCreate }, (_, index) => buildApplicant(existingApplicants + index));
    await prisma.applicant.createMany({ data: applicants });
  }

  const [applicantCount, historicalRateCount, decisionCount, explanationCount] = await Promise.all([
    prisma.applicant.count(),
    prisma.historicalDefaultRate.count(),
    prisma.decision.count(),
    prisma.aiExplanation.count()
  ]);

  console.log(
    `Seed complete: ${applicantCount} applicants, ${historicalRateCount} historical default rates, ${decisionCount} decisions, ${explanationCount} AI explanations.`
  );
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
