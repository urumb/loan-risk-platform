"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { RiskBadge, StatusBadge } from "@/components/Badge";
import { ExposureChart } from "@/components/ExposureChart";
import { ErrorState, LoadingState } from "@/components/LoadingState";
import { categories } from "@/lib/types";

type Summary = {
  kpis: { totalApplicants: number; highRiskPercent: number; avgScore: number; totalExposure: number };
  exposure: Array<{ category: string; Low: number; Medium: number; High: number }>;
  alert: { active: boolean; message: string };
};

type Rate = { id: string; branch: string; category: string; rate: number };
type Decision = {
  id: string;
  status: string;
  officerName: string;
  comment: string;
  createdAt: string;
  applicant: { id: string; branch: string; category: string; riskTier: string };
};

const currency = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rates, setRates] = useState<Rate[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/portfolio/summary").then((res) => res.json()),
      fetch("/api/historical-rates").then((res) => res.json()),
      fetch("/api/decisions").then((res) => res.json())
    ])
      .then(([summaryData, rateData, decisionData]) => {
        if (summaryData.error) throw new Error(summaryData.error);
        if (rateData.error) throw new Error(rateData.error);
        if (decisionData.error) throw new Error(decisionData.error);
        setSummary(summaryData);
        setRates(rateData);
        setDecisions(decisionData.slice(0, 5));
      })
      .catch((err) => setError(err.message ?? "Unable to load dashboard."));
  }, []);

  const branches = useMemo(() => Array.from(new Set(rates.map((rate) => rate.branch))), [rates]);

  if (error) return <ErrorState message={error} />;
  if (!summary) return <LoadingState label="Loading portfolio intelligence" />;

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="ledger-card animate-rise overflow-hidden p-7 sm:p-9">
          <div className="mb-8 flex flex-wrap items-center gap-3">
            <span className="rounded-full border-2 border-ledger-line bg-ledger-yellow px-4 py-2 font-mono text-xs font-bold uppercase">Live portfolio</span>
            <span className="rounded-full border-2 border-ledger-line bg-white px-4 py-2 font-mono text-xs font-bold uppercase">Groq-ready</span>
          </div>
          <h1 className="max-w-4xl font-display text-5xl font-bold leading-[0.92] sm:text-7xl lg:text-8xl">
            Credit risk, scored before it slows the desk.
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-ledger-ink/72">
            Monitor exposure, prioritize applicant reviews, explain risk with AI, and keep every officer decision auditable from one focused workspace.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/queue" className="btn-primary">Review queue</Link>
            <Link href="/import" className="btn-secondary">Import applicants</Link>
          </div>
        </div>

        <aside className={`ledger-card animate-rise p-6 ${summary.alert.active ? "bg-red-50" : "bg-green-50"}`} style={{ animationDelay: "80ms" }}>
          <p className="eyebrow text-ledger-ink/60">Risk Alert</p>
          <h2 className="mt-3 font-display text-4xl font-bold leading-none">{summary.alert.active ? "Action needed" : "Within guardrails"}</h2>
          <p className="mt-4 text-base font-semibold leading-7 text-ledger-ink/75">{summary.alert.message}</p>
          <div className="mt-8 rounded-[22px] border-2 border-ledger-line bg-white p-4">
            <div className="mb-2 flex justify-between font-mono text-xs font-bold uppercase">
              <span>High risk mix</span>
              <span>{summary.kpis.highRiskPercent}%</span>
            </div>
            <div className="h-4 overflow-hidden rounded-full border-2 border-ledger-line bg-ledger-soft">
              <div className="h-full rounded-r-full bg-ledger-brick transition-all duration-700" style={{ width: `${Math.min(100, summary.kpis.highRiskPercent)}%` }} />
            </div>
          </div>
        </aside>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Applicants" value={summary.kpis.totalApplicants.toLocaleString("en-IN")} tone="bg-white" />
        <Kpi label="High Risk" value={`${summary.kpis.highRiskPercent}%`} tone="bg-red-50" />
        <Kpi label="Avg Score" value={summary.kpis.avgScore.toFixed(1)} tone="bg-ledger-yellow" />
        <Kpi label="Exposure" value={`INR ${currency.format(summary.kpis.totalExposure)}`} tone="bg-white" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.42fr]">
        <div className="ledger-card p-6 sm:p-7">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-ledger-ink/55">Exposure Analytics</p>
              <h2 className="font-display text-4xl font-bold">Loan amount by category and risk tier</h2>
            </div>
            <span className="rounded-full border-2 border-ledger-line bg-ledger-soft px-4 py-2 font-mono text-xs font-bold">Stacked exposure</span>
          </div>
          <ExposureChart data={summary.exposure} />
        </div>

        <div className="ledger-card p-6 sm:p-7">
          <p className="eyebrow text-ledger-ink/55">Recent decisions</p>
          <h2 className="font-display text-4xl font-bold">Officer activity</h2>
          <div className="mt-5 space-y-4">
            {decisions.length ? decisions.map((decision) => (
              <Link key={decision.id} href={`/applicants/${decision.applicant.id}`} className="block rounded-[22px] border-2 border-ledger-line bg-white p-4 transition hover:-translate-y-1 hover:bg-ledger-yellow/30">
                <div className="flex items-center justify-between gap-3">
                  <OfficerAvatar name={decision.officerName} />
                  <StatusBadge status={decision.status} />
                </div>
                <p className="mt-3 font-bold">{decision.applicant.branch} / {decision.applicant.category}</p>
                <p className="mt-1 line-clamp-2 text-sm font-semibold text-ledger-ink/60">{decision.comment}</p>
              </Link>
            )) : <p className="rounded-[22px] border-2 border-dashed border-ledger-line p-4 text-sm font-semibold text-ledger-ink/60">No decisions recorded yet.</p>}
          </div>
        </div>
      </section>

      <section className="ledger-card overflow-hidden p-6 sm:p-7">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-ledger-ink/55">Historical Defaults</p>
            <h2 className="font-display text-4xl font-bold">Branch by category heatmap</h2>
          </div>
          <span className="rounded-full border-2 border-ledger-line bg-white px-4 py-2 font-mono text-xs font-bold">Hover cells for rates</span>
        </div>
        <div className="overflow-x-auto pb-2">
          <div className="grid min-w-[780px] gap-3" style={{ gridTemplateColumns: `190px repeat(${categories.length}, minmax(110px, 1fr))` }}>
            <div className="eyebrow text-ledger-ink/55">Branch</div>
            {categories.map((category) => <div key={category} className="eyebrow text-ledger-ink/55">{category}</div>)}
            {branches.map((branch) => (
              <HeatmapRow key={branch} branch={branch} rates={rates} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={`ledger-card lift animate-rise p-5 ${tone}`}>
      <p className="eyebrow text-ledger-ink/55">{label}</p>
      <p className="mt-4 break-words font-display text-4xl font-bold leading-none sm:text-5xl">{value}</p>
    </div>
  );
}

function HeatmapRow({ branch, rates }: { branch: string; rates: Rate[] }) {
  return (
    <>
      <div className="rounded-2xl border-2 border-ledger-line bg-ledger-ink px-4 py-3 font-bold text-white">{branch}</div>
      {categories.map((category) => {
        const rate = rates.find((item) => item.branch === branch && item.category === category)?.rate ?? 0;
        const tone = rate > 0.12 ? "bg-ledger-brick text-white" : rate > 0.075 ? "bg-ledger-yellow text-ledger-ink" : "bg-ledger-green text-white";
        return (
          <div key={category} title={`${branch} ${category}: ${(rate * 100).toFixed(1)}%`} className={`rounded-2xl border-2 border-ledger-line px-4 py-3 text-center font-mono text-sm font-bold transition hover:-translate-y-1 ${tone}`}>
            {(rate * 100).toFixed(1)}%
          </div>
        );
      })}
    </>
  );
}

function OfficerAvatar({ name }: { name: string }) {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "OD";
  return <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-ledger-line bg-ledger-lilac font-mono text-xs font-bold">{initials}</span>;
}
