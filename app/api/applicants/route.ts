import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage, jsonError, logApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { computeRisk } from "@/lib/risk";

export const dynamic = "force-dynamic";

const requiredFields = ["branch", "category", "annualIncome", "existingMonthlyDebt", "repaymentScore", "loanAmount", "tenureMonths"];
const riskTiers = ["Low", "Medium", "High"];

function parseApplicant(row: Record<string, unknown>) {
  for (const field of requiredFields) {
    if (row[field] === undefined || row[field] === null || row[field] === "") {
      throw new Error(`Missing required column: ${field}`);
    }
  }

  const annualIncome = Number(row.annualIncome);
  const existingMonthlyDebt = Number(row.existingMonthlyDebt);
  const repaymentScore = Number(row.repaymentScore);
  const loanAmount = Number(row.loanAmount);
  const tenureMonths = Number(row.tenureMonths);

  if ([annualIncome, existingMonthlyDebt, repaymentScore, loanAmount, tenureMonths].some((value) => Number.isNaN(value))) {
    throw new Error("Numeric columns must contain valid numbers.");
  }
  if (annualIncome <= 0) {
    throw new Error("annualIncome must be greater than zero.");
  }
  if (existingMonthlyDebt < 0 || loanAmount <= 0 || tenureMonths <= 0) {
    throw new Error("Debt, loan amount, and tenure values must be valid positive numbers.");
  }
  if (repaymentScore < 0 || repaymentScore > 100) {
    throw new Error("repaymentScore must be between 0 and 100.");
  }

  const risk = computeRisk({ annualIncome, existingMonthlyDebt, repaymentScore });
  return {
    branch: String(row.branch).trim(),
    category: String(row.category).trim(),
    annualIncome,
    existingMonthlyDebt,
    repaymentScore: Math.round(repaymentScore),
    loanAmount,
    tenureMonths: Math.round(tenureMonths),
    ...risk
  };
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const tier = params.get("tier");
    if (tier && !riskTiers.includes(tier)) {
      return jsonError("Invalid risk tier filter.", 400);
    }
    const where = {
      ...(tier ? { riskTier: tier as "Low" | "Medium" | "High" } : {}),
      ...(params.get("category") ? { category: params.get("category")! } : {}),
      ...(params.get("branch") ? { branch: params.get("branch")! } : {})
    };
    const sort = params.get("sort") === "asc" ? "asc" : "desc";
    const applicants = await prisma.applicant.findMany({
      where,
      orderBy: { riskScore: sort },
      include: { decisions: { orderBy: { createdAt: "desc" }, take: 1 } }
    });
    return NextResponse.json(applicants);
  } catch (error) {
    logApiError("GET /api/applicants", error);
    return jsonError("Unable to list applicants.", 500, getErrorMessage(error));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rows = Array.isArray(body) ? body : [body];
    if (!rows.length) {
      return jsonError("At least one applicant row is required.", 400);
    }
    const data = rows.map(parseApplicant);
    if (data.length === 1) {
      const applicant = await prisma.applicant.create({ data: data[0] });
      return NextResponse.json(applicant, { status: 201 });
    }
    const result = await prisma.applicant.createMany({ data });
    return NextResponse.json({ inserted: result.count }, { status: 201 });
  } catch (error) {
    logApiError("POST /api/applicants", error);
    return jsonError("Unable to create applicant records.", 400, getErrorMessage(error));
  }
}
