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

      <section className="ledger-card animate-rise p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow text-ledger-ink/55">Applicant {applicant.id.slice(-8)}</p>
            <h1 className="mt-2 font-display text-5xl font-bold leading-none sm:text-7xl">{applicant.branch} borrower</h1>
            <p className="mt-4 text-lg font-semibold text-ledger-ink/65">{applicant.category} credit request submitted {new Date(applicant.submittedAt).toLocaleDateString()}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <RiskBadge tier={applicant.riskTier} />
            <StatusBadge status={applicant.decisions[0]?.status ?? "Under Investigation"} />
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="space-y-6">
          <div className="ledger-card p-6 sm:p-7">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="eyebrow text-ledger-ink/55">Risk Gauge</p>
                <h2 className="font-display text-4xl font-bold">Stored default risk score</h2>
              </div>
              <div className="min-w-[220px]"><RiskGauge score={applicant.riskScore} /></div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Metric label="DTI" value={`${(applicant.dti * 100).toFixed(1)}%`} />
              <Metric label="Formula" value="55% DTI + 45% repayment gap" />
              <Metric label="Risk score" value={applicant.riskScore.toFixed(2)} />
            </div>
          </div>

          <div className="ledger-card p-6 sm:p-7">
            <p className="eyebrow text-ledger-ink/55">Financial Summary</p>
            <h2 className="font-display text-4xl font-bold">Affordability snapshot</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Metric label="Annual income" value={`INR ${currency.format(applicant.annualIncome)}`} />
              <Metric label="Monthly debt" value={`INR ${currency.format(applicant.existingMonthlyDebt)}`} />
              <Metric label="Repayment score" value={`${applicant.repaymentScore}/100`} />
              <Metric label="Loan amount" value={`INR ${currency.format(applicant.loanAmount)}`} />
              <Metric label="Tenure" value={`${applicant.tenureMonths} months`} />
              <Metric label="Monthly exposure" value={`INR ${currency.format(monthlyPaymentHint)}`} />
            </div>
          </div>

          <div className="ledger-card p-6 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow text-ledger-ink/55">AI Credit Intelligence</p>
                <h2 className="font-display text-4xl font-bold">Explainability memo</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border-2 border-ledger-line bg-ledger-yellow px-3 py-1 font-mono text-xs font-bold">AI ready</span>
                <span className="rounded-full border-2 border-ledger-line bg-white px-3 py-1 font-mono text-xs font-bold">{explanation ? "Cached" : "No cache"}</span>
              </div>
            </div>
            <div className="mt-5 rounded-[24px] border-2 border-ledger-line bg-ledger-soft p-5">
              <div className="mb-4 flex items-center gap-3">
                <SparkleIcon />
                <p className="font-bold">AI Credit Intelligence</p>
              </div>
              {busy && !explanation ? <div className="mb-4 h-3 w-44 rounded-full bg-ledger-yellow animate-pulse-soft" /> : null}
              <p className="whitespace-pre-line text-sm font-semibold leading-7 text-ledger-ink/72">{explanation || "No cached explanation yet. Generate one to summarize repayment pressure, DTI, and risk drivers in plain language."}</p>
            </div>
            <button className="btn-primary mt-5 disabled:opacity-60" onClick={generateExplanation} disabled={busy} aria-label="Generate AI credit intelligence explanation">
              {busy ? "Working..." : explanation ? "Refresh intelligence" : "Generate intelligence"}
            </button>
          </div>
        </section>

        <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <form className="ledger-card p-6 sm:p-7" onSubmit={submitDecision}>
            <p className="eyebrow text-ledger-ink/55">Decision Workflow</p>
            <h2 className="font-display text-4xl font-bold">Record officer action</h2>
            <label className="mt-5 block text-sm font-bold">
              Status
              <select className="field mt-2" value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}>
                <option>Approved</option>
                <option>Rejected</option>
                <option>Under Investigation</option>
              </select>
            </label>
            <label className="mt-4 block text-sm font-bold">
              Officer
              <input className="field mt-2" value={form.officerName} onChange={(event) => setForm((prev) => ({ ...prev, officerName: event.target.value }))} required placeholder="Officer name" />
            </label>
            <label className="mt-4 block text-sm font-bold">
              Comment
              <textarea className="field mt-2 min-h-32 resize-y" value={form.comment} onChange={(event) => setForm((prev) => ({ ...prev, comment: event.target.value }))} required placeholder="Decision rationale" />
            </label>
            <button className="btn-secondary mt-5 w-full disabled:opacity-60" disabled={busy}>Save decision</button>
          </form>

          <section className="ledger-card p-6 sm:p-7">
            <p className="eyebrow text-ledger-ink/55">Timeline</p>
            <h2 className="font-display text-4xl font-bold">Decision history</h2>
            <div className="mt-5 space-y-4">
              {applicant.decisions.length ? applicant.decisions.map((decision) => (
                <div key={decision.id} className="relative rounded-[22px] border-2 border-ledger-line bg-white p-4 pl-5">
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge status={decision.status} />
                    <span className="font-mono text-xs font-bold text-ledger-ink/52">{new Date(decision.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-3 font-bold">{decision.officerName}</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-ledger-ink/65">{displayStatus(decision.comment)}</p>
                </div>
              )) : <p className="rounded-[22px] border-2 border-dashed border-ledger-line p-4 text-sm font-semibold text-ledger-ink/60">No decisions recorded.</p>}
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
