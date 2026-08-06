import { NextResponse } from "next/server";
import { getErrorMessage, jsonError, logApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { categories, tiers } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [applicants, exposureGroups] = await Promise.all([
      prisma.applicant.findMany({ select: { riskScore: true, riskTier: true, loanAmount: true } }),
      prisma.applicant.groupBy({
        by: ["category", "riskTier"],
        _sum: { loanAmount: true }
      })
    ]);

    const totalApplicants = applicants.length;
    const highRiskCount = applicants.filter((applicant) => applicant.riskTier === "High").length;
    const highRiskPercent = totalApplicants ? (highRiskCount / totalApplicants) * 100 : 0;
    const avgScore = totalApplicants ? applicants.reduce((sum, applicant) => sum + applicant.riskScore, 0) / totalApplicants : 0;
    const totalExposure = applicants.reduce((sum, applicant) => sum + applicant.loanAmount, 0);
    const threshold = Number(process.env.HIGH_RISK_THRESHOLD_PERCENT ?? 20);

    const exposure = categories.map((category) => {
      const row: Record<string, number | string> = { category, Low: 0, Medium: 0, High: 0 };
      for (const tier of tiers) {
        const found = exposureGroups.find((group) => group.category === category && group.riskTier === tier);
        row[tier] = found?._sum.loanAmount ?? 0;
      }
      return row;
    });

    return NextResponse.json({
      kpis: {
        totalApplicants,
        highRiskPercent: Number(highRiskPercent.toFixed(1)),
        avgScore: Number(avgScore.toFixed(1)),
        totalExposure
      },
      exposure,
      alert: {
        threshold,
        active: highRiskPercent > threshold,
        message: `High-risk concentration is ${highRiskPercent.toFixed(1)}% against a ${threshold}% threshold.`
      }
    });
  } catch (error) {
    logApiError("GET /api/portfolio/summary", error);
    return jsonError("Unable to load portfolio summary.", 500, getErrorMessage(error));
  }
}
