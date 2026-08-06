"use client";

import { FormEvent, useEffect, useState } from "react";
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

export default function ApplicantPage({ params }: { params: { id: string } }) {
  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const [explanation, setExplanation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ status: "Under Investigation", officerName: "", comment: "" });

  const loadApplicant = () => {
    fetch(`/api/applicants/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setApplicant(data);
        setExplanation(data.aiExplanation?.text ?? "");
      })
      .catch((err) => setError(err.message ?? "Unable to load applicant."));
  };

  useEffect(loadApplicant, [params.id]);

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
  if (!applicant) return <LoadingState />;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="space-y-6">
        {error ? <ErrorState message={error} /> : null}
        <div className="ledger-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-slate-500">Applicant {applicant.id.slice(-8)}</p>
              <h2 className="font-display text-3xl font-semibold">{applicant.branch} / {applicant.category}</h2>
            </div>
            <RiskBadge tier={applicant.riskTier} />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Metric label="Annual Income" value={`₹${applicant.annualIncome.toLocaleString("en-IN")}`} />
            <Metric label="Monthly Debt" value={`₹${applicant.existingMonthlyDebt.toLocaleString("en-IN")}`} />
            <Metric label="Repayment Score" value={`${applicant.repaymentScore}/100`} />
            <Metric label="Loan Amount" value={`₹${applicant.loanAmount.toLocaleString("en-IN")}`} />
            <Metric label="Tenure" value={`${applicant.tenureMonths} months`} />
            <Metric label="Submitted" value={new Date(applicant.submittedAt).toLocaleDateString()} />
          </div>
        </div>

        <div className="ledger-card p-5">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-slate-500">Score Breakdown</p>
          <h3 className="mb-4 font-display text-2xl font-semibold">Stored default risk score</h3>
          <RiskGauge score={applicant.riskScore} />
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Metric label="DTI" value={`${(applicant.dti * 100).toFixed(1)}%`} />
            <Metric label="Formula" value="55% DTI + 45% repayment gap" />
            <Metric label="Risk Score" value={applicant.riskScore.toFixed(2)} />
          </div>
        </div>

        <div className="ledger-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-slate-500">AI Explanation</p>
              <h3 className="font-display text-2xl font-semibold">Plain-language credit summary</h3>
            </div>
            <button className="border border-ledger-navy bg-ledger-navy px-4 py-2 text-sm text-white disabled:opacity-60" onClick={generateExplanation} disabled={busy}>
              {explanation ? "Reload Cached" : "Generate"}
            </button>
          </div>
          <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-700">{explanation || "No cached explanation yet."}</p>
        </div>
      </section>

      <aside className="space-y-6">
        <form className="ledger-card p-5" onSubmit={submitDecision}>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-slate-500">Decision Workflow</p>
          <h3 className="mb-4 font-display text-2xl font-semibold">Record officer action</h3>
          <label className="block text-sm">
            Status
            <select className="mt-1 w-full border border-ledger-line bg-white px-3 py-2" value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}>
              <option>Approved</option>
              <option>Rejected</option>
              <option>Under Investigation</option>
            </select>
          </label>
          <label className="mt-3 block text-sm">
            Officer
            <input className="mt-1 w-full border border-ledger-line bg-white px-3 py-2" value={form.officerName} onChange={(event) => setForm((prev) => ({ ...prev, officerName: event.target.value }))} required />
          </label>
          <label className="mt-3 block text-sm">
            Comment
            <textarea className="mt-1 min-h-28 w-full border border-ledger-line bg-white px-3 py-2" value={form.comment} onChange={(event) => setForm((prev) => ({ ...prev, comment: event.target.value }))} required />
          </label>
          <button className="mt-4 w-full border border-ledger-navy bg-ledger-navy px-4 py-2 text-white disabled:opacity-60" disabled={busy}>Save Decision</button>
        </form>

        <section className="ledger-card p-5">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-slate-500">History</p>
          <h3 className="mb-4 font-display text-2xl font-semibold">Decision log</h3>
          <div className="space-y-3">
            {applicant.decisions.length ? applicant.decisions.map((decision) => (
              <div key={decision.id} className="border border-ledger-line bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <StatusBadge status={decision.status} />
                  <span className="font-mono text-xs text-slate-500">{new Date(decision.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-2 text-sm font-semibold">{decision.officerName}</p>
                <p className="text-sm text-slate-700">{decision.comment}</p>
              </div>
            )) : <p className="text-sm text-slate-500">No decisions recorded.</p>}
          </div>
        </section>
      </aside>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-ledger-line bg-white p-3">
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 font-semibold">{displayStatus(value)}</p>
    </div>
  );
}
