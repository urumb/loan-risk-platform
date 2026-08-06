import type { RiskTier } from "@prisma/client";

export type RiskInput = {
  annualIncome: number;
  existingMonthlyDebt: number;
  repaymentScore: number;
};

export function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export function computeRisk(input: RiskInput): { dti: number; riskScore: number; riskTier: RiskTier } {
  const monthlyIncome = input.annualIncome / 12;
  const dti = monthlyIncome > 0 ? input.existingMonthlyDebt / monthlyIncome : 1;
  const riskScore = clamp(0.55 * (dti * 100) + 0.45 * (100 - input.repaymentScore));
  const tier = riskScore < 35 ? "Low" : riskScore <= 65 ? "Medium" : "High";
  return {
    dti: Number(dti.toFixed(4)),
    riskScore: Number(riskScore.toFixed(2)),
    riskTier: tier as RiskTier
  };
}

export function normalizeStatus(status: string) {
  return status === "Under Investigation" ? "Under_Investigation" : status;
}

export function displayStatus(status: string) {
  return status.replace("_", " ");
}
