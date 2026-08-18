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

    const systemPrompt = `You are an executive credit analyst at CrediShield. Your task is to provide a concise, structured credit memo explaining the default risk for a credit officer.
Rules:
- Rely strictly and exclusively on the provided financial metrics. Do not assume or invent unstated background facts, employment details, or external collateral.
- The default risk score was calculated deterministically by server formula (55% DTI weight + 45% repayment gap weight). Your explanation is a decision-support interpretation, NOT the scoring engine itself.
- Structure your response into exactly 3 bullet points:
  * Key Risk Drivers: Direct evaluation of DTI (${(applicant.dti * 100).toFixed(1)}%) and Repayment Score (${applicant.repaymentScore}/100).
  * Affordability & Exposure: Commentary on loan amount (INR ${applicant.loanAmount.toLocaleString("en-IN")}) vs annual income (INR ${applicant.annualIncome.toLocaleString("en-IN")}) across ${applicant.tenureMonths} months.
  * Underwriting Recommendation: Clear credit officer guidance corresponding to the ${applicant.riskTier} risk tier (${applicant.riskScore.toFixed(1)}/100).`;

    const userPrompt = `Applicant Profile:
Branch: ${applicant.branch}
Category: ${applicant.category}
Annual Income: INR ${applicant.annualIncome.toLocaleString("en-IN")}
Existing Monthly Debt: INR ${applicant.existingMonthlyDebt.toLocaleString("en-IN")}
DTI Ratio: ${(applicant.dti * 100).toFixed(1)}%
Repayment Score: ${applicant.repaymentScore}/100
Requested Loan: INR ${applicant.loanAmount.toLocaleString("en-IN")}
Tenure: ${applicant.tenureMonths} months
Deterministic Risk Score: ${applicant.riskScore.toFixed(1)}/100 (${applicant.riskTier} Risk)`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 300
      })
    });

    if (response.status === 429) {
      return jsonError("AI credit intelligence rate limit reached. Please try again shortly.", 429);
    }

    if (!response.ok) {
      const details = await response.text();
      return jsonError("AI credit explanation service is temporarily unavailable.", 502, details.slice(0, 300));
    }

    const payload = await response.json();
    const text = payload?.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return jsonError("AI credit explanation returned an empty response.", 502);
    }
    const explanation = await prisma.aiExplanation.create({ data: { applicantId: params.id, text } });
    return NextResponse.json(explanation, { status: 201 });
  } catch (error) {
    logApiError("POST /api/applicants/[id]/explain", error);
    return jsonError("Unable to generate explanation.", 500, getErrorMessage(error));
  }
}
