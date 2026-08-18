"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { RiskBadge, StatusBadge } from "@/components/Badge";
import { ErrorState, LoadingState } from "@/components/LoadingState";
import { RiskGauge } from "@/components/RiskGauge";
import { displayStatus } from "@/lib/risk";

type Decision = { id: string; status: string; officerName: string; comment: string; createdAt: string };
type Applicant = {
  id: string;
  branch: string;
  category: string;
  annualIncome: number;
  existingMonthlyDebt: number;
  repaymentScore: number;
  loanAmount: number;
  tenureMonths: number;
  submittedAt: string;
  dti: number;
  riskScore: number;
  riskTier: string;
  decisions: Decision[];
  aiExplanation?: { text: string; generatedAt: string } | null;
};

const currency = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export default function ApplicantPage({ params }: { params: { id: string } }) {
  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const [explanation, setExplanation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ status: "Under Investigation", officerName: "", comment: "" });

  const loadApplicant = useCallback(() => {
    fetch(`/api/applicants/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setApplicant(data);
        setExplanation(data.aiExplanation?.text ?? "");
      })
      .catch((err) => setError(err.message ?? "Unable to load applicant."));
  }, [params.id]);

  useEffect(() => {
    loadApplicant();
  }, [loadApplicant]);

  const monthlyPaymentHint = useMemo(() => applicant ? applicant.loanAmount / Math.max(1, applicant.tenureMonths) : 0, [applicant]);

  async function generateExplanation() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/applicants/${params.id}/explain`, { method: "POST" });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Unable to generate explanation.");
      return;
    }
    setExplanation(data.text);
  }

  async function submitDecision(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch(`/api/applicants/${params.id}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Unable to save decision.");
      return;
    }
    setForm({ status: "Under Investigation", officerName: form.officerName, comment: "" });
    loadApplicant();
  }

  if (error && !applicant) return <ErrorState message={error} />;
  if (!applicant) return <LoadingState label="Opening applicant profile" />;

  return (
    <div className="space-y-6">
      {error ? <ErrorState message={error} /> : null}

      {/* 1. Applicant Overview */}
      <section className="ledger-card animate-rise p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase text-ledger-ink/50">Applicant ID: {applicant.id}</span>
              <span className="rounded-md border border-ledger-line/30 bg-ledger-soft px-2.5 py-0.5 font-mono text-xs font-bold uppercase">{applicant.category}</span>
            </div>
            <h1 className="mt-2 font-display text-5xl font-bold leading-none sm:text-7xl">{applicant.branch} Branch</h1>
            <p className="mt-3 text-base font-semibold text-ledger-ink/65">
              Submitted on {new Date(applicant.submittedAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <RiskBadge tier={applicant.riskTier} />
            <StatusBadge status={applicant.decisions[0]?.status ?? "Under_Investigation"} />
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="space-y-6">
          {/* 2. Deterministic Risk Assessment */}
          <div className="ledger-card p-6 sm:p-7">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="eyebrow text-ledger-ink/55">Deterministic Engine</p>
                <h2 className="font-display text-4xl font-bold">Risk Assessment</h2>
              </div>
              <span className="rounded-full border-2 border-ledger-line bg-ledger-yellow px-3 py-1 font-mono text-xs font-bold">
                Source of Truth
              </span>
            </div>
            <div className="rounded-[22px] border-2 border-ledger-line bg-ledger-soft p-5">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-mono text-xs font-bold uppercase text-ledger-ink/60">Formulaic Default Score</p>
                  <p className="mt-1 text-sm font-semibold text-ledger-ink/75">
                    Calculated on server insert: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-ledger-line/20">55% DTI + 45% Repayment Gap</code>
                  </p>
                </div>
                <div className="min-w-[210px]">
                  <RiskGauge score={applicant.riskScore} />
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Metric label="Calculated DTI" value={`${(applicant.dti * 100).toFixed(1)}%`} />
                <Metric label="Repayment Score" value={`${applicant.repaymentScore}/100`} />
                <Metric label="Final Score" value={applicant.riskScore.toFixed(2)} />
              </div>
            </div>
          </div>

          {/* 3. Financial Profile */}
          <div className="ledger-card p-6 sm:p-7">
            <p className="eyebrow text-ledger-ink/55">Financial Profile</p>
            <h2 className="font-display text-4xl font-bold">Underwriting Metrics</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Metric label="Annual Income" value={`INR ${currency.format(applicant.annualIncome)}`} />
              <Metric label="Existing Monthly Debt" value={`INR ${currency.format(applicant.existingMonthlyDebt)}`} />
              <Metric label="Repayment Score" value={`${applicant.repaymentScore}/100`} />
              <Metric label="Requested Loan" value={`INR ${currency.format(applicant.loanAmount)}`} />
              <Metric label="Tenure" value={`${applicant.tenureMonths} Months`} />
              <Metric label="Est. Principal/Mo" value={`INR ${currency.format(monthlyPaymentHint)}`} />
            </div>
          </div>

          {/* 4. AI Credit Intelligence Memo */}
          <div className="ledger-card p-6 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow text-ledger-ink/55">Groq Credit Intelligence</p>
                <h2 className="font-display text-4xl font-bold">AI Decision Support</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border-2 border-ledger-line bg-white px-3 py-1 font-mono text-xs font-bold text-ledger-ink/70">
                  {explanation ? "Cached Memo" : "No Cache"}
                </span>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-ledger-line/30 bg-blue-50/70 p-3 text-xs font-bold text-blue-900">
              ℹ️ <strong>Notice:</strong> This AI explanation is a decision-support interpretation generated by Groq (LLaMA 3.3). It does NOT calculate or alter the deterministic server risk score.
            </div>

            <div className="mt-4 rounded-[24px] border-2 border-ledger-line bg-white p-5 shadow-[4px_4px_0_rgba(17,17,17,0.08)]">
              <div className="mb-4 flex items-center gap-3">
                <SparkleIcon />
                <div>
                  <p className="font-bold text-base">Executive Credit Memo</p>
                  <p className="font-mono text-[11px] text-ledger-ink/55">Powered by Groq LLaMA-3.3-70B</p>
                </div>
              </div>
              {busy && !explanation ? <div className="mb-4 h-3 w-48 rounded-full bg-ledger-yellow animate-pulse-soft" /> : null}
              <p className="whitespace-pre-line text-sm font-semibold leading-7 text-ledger-ink/80">
                {explanation || "No cached explanation yet. Click below to generate an AI credit officer memo summarizing risk drivers."}
              </p>
            </div>

            <button className="btn-primary mt-5 disabled:opacity-60" onClick={generateExplanation} disabled={busy} aria-label="Generate AI credit intelligence explanation">
              {busy ? "Processing with Groq..." : explanation ? "Refresh AI Memo" : "Generate AI Credit Memo"}
            </button>
          </div>
        </section>

        {/* 5. Decision Workflow Panel */}
        <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <form className="ledger-card p-6 sm:p-7" onSubmit={submitDecision}>
            <p className="eyebrow text-ledger-ink/55">Officer Workflow</p>
            <h2 className="font-display text-4xl font-bold">Record Decision</h2>
            <label className="mt-5 block text-sm font-bold">
              Action Status
              <select className="field mt-2" value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Under Investigation">Under Investigation</option>
              </select>
            </label>
            <label className="mt-4 block text-sm font-bold">
              Credit Officer Name
              <input className="field mt-2" value={form.officerName} onChange={(event) => setForm((prev) => ({ ...prev, officerName: event.target.value }))} required placeholder="e.g. Sarah Jenkins" />
            </label>
            <label className="mt-4 block text-sm font-bold">
              Underwriting Rationale / Comment
              <textarea className="field mt-2 min-h-32 resize-y" value={form.comment} onChange={(event) => setForm((prev) => ({ ...prev, comment: event.target.value }))} required placeholder="Detail the risk assessment rationale and verification steps..." />
            </label>
            <button className="btn-secondary mt-5 w-full disabled:opacity-60" disabled={busy}>
              {busy ? "Saving Decision..." : "Submit Officer Decision"}
            </button>
          </form>

          <section className="ledger-card p-6 sm:p-7">
            <p className="eyebrow text-ledger-ink/55">Audit Log</p>
            <h2 className="font-display text-4xl font-bold">Decision History</h2>
            <div className="mt-5 space-y-4">
              {applicant.decisions.length ? applicant.decisions.map((decision) => (
                <div key={decision.id} className="relative rounded-[22px] border-2 border-ledger-line bg-white p-4 pl-5">
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge status={decision.status} />
                    <span className="font-mono text-xs font-bold text-ledger-ink/52">{new Date(decision.createdAt).toLocaleString("en-IN")}</span>
                  </div>
                  <p className="mt-3 font-bold text-base">{decision.officerName}</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-ledger-ink/75">{displayStatus(decision.comment)}</p>
                </div>
              )) : <p className="rounded-[22px] border-2 border-dashed border-ledger-line p-4 text-sm font-semibold text-ledger-ink/60">No officer decisions recorded yet.</p>}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="soft-card p-4">
      <p className="eyebrow text-ledger-ink/50">{label}</p>
      <p className="mt-2 break-words font-mono text-lg font-bold leading-tight">{value}</p>
    </div>
  );
}

function SparkleIcon() {
  return (
    <span className="grid h-10 w-10 place-items-center rounded-2xl border-2 border-ledger-line bg-ledger-yellow" aria-hidden="true">
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" />
        <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />
      </svg>
    </span>
  );
}
