import { NextResponse } from "next/server";
import { getErrorMessage, jsonError, logApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const cached = await prisma.aiExplanation.findUnique({ where: { applicantId: params.id } });
    if (cached) {
      return NextResponse.json(cached);
    }

    const applicant = await prisma.applicant.findUnique({ where: { id: params.id } });
    if (!applicant) {
      return jsonError("Applicant not found", 404);
    }
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.includes("your_groq")) {
      return jsonError("GROQ_API_KEY is not configured.", 503);
    }

    const prompt = `Explain this bank loan default risk in plain language for a credit officer.
Applicant branch: ${applicant.branch}
Loan category: ${applicant.category}
Annual income: ${applicant.annualIncome}
Existing monthly debt: ${applicant.existingMonthlyDebt}
Debt-to-income ratio: ${(applicant.dti * 100).toFixed(1)}%
Repayment score: ${applicant.repaymentScore}/100
Loan amount: ${applicant.loanAmount}
Tenure months: ${applicant.tenureMonths}
Stored risk score: ${applicant.riskScore}/100
Risk tier: ${applicant.riskTier}
Use 4 concise sentences and mention the main drivers.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 220
      })
    });

    if (!response.ok) {
      const details = await response.text();
      return jsonError("Groq explanation request failed.", 502, details.slice(0, 500));
    }

    const payload = await response.json();
    const text = payload?.choices?.[0]?.message?.content;
    if (!text) {
      return jsonError("Groq returned an empty explanation.", 502);
    }
    const explanation = await prisma.aiExplanation.create({ data: { applicantId: params.id, text } });
    return NextResponse.json(explanation, { status: 201 });
  } catch (error) {
    logApiError("POST /api/applicants/[id]/explain", error);
    return jsonError("Unable to generate explanation.", 500, getErrorMessage(error));
  }
}
