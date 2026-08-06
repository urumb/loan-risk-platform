"use client";

import { useEffect, useState } from "react";
import { ExposureChart } from "@/components/ExposureChart";
import { ErrorState, LoadingState } from "@/components/LoadingState";
import { categories } from "@/lib/types";

type Summary = {
  kpis: { totalApplicants: number; highRiskPercent: number; avgScore: number; totalExposure: number };
  exposure: Array<{ category: string; Low: number; Medium: number; High: number }>;
  alert: { active: boolean; message: string };
};

type Rate = { id: string; branch: string; category: string; rate: number };

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rates, setRates] = useState<Rate[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([fetch("/api/portfolio/summary").then((res) => res.json()), fetch("/api/historical-rates").then((res) => res.json())])
      .then(([summaryData, rateData]) => {
        if (summaryData.error) throw new Error(summaryData.error);
        setSummary(summaryData);
        setRates(rateData);
      })
      .catch((err) => setError(err.message ?? "Unable to load dashboard."));
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!summary) return <LoadingState />;

  const branches = Array.from(new Set(rates.map((rate) => rate.branch)));

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        <Kpi label="Applicants" value={summary.kpis.totalApplicants.toLocaleString("en-IN")} />
        <Kpi label="High Risk" value={`${summary.kpis.highRiskPercent}%`} />
        <Kpi label="Avg Score" value={summary.kpis.avgScore.toFixed(1)} />
        <Kpi label="Exposure" value={`₹${summary.kpis.totalExposure.toLocaleString("en-IN")}`} />
      </section>

      <section className={`border p-4 ${summary.alert.active ? "border-ledger-brick bg-red-50 text-ledger-brick" : "border-ledger-green bg-green-50 text-ledger-green"}`}>
        <p className="font-mono text-sm uppercase tracking-[0.16em]">Portfolio Alert</p>
        <p className="mt-1 text-lg font-semibold">{summary.alert.message}</p>
      </section>

      <section className="ledger-card p-5">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-slate-500">Exposure</p>
            <h2 className="font-display text-2xl font-semibold">Loan amount by category and risk tier</h2>
          </div>
        </div>
        <ExposureChart data={summary.exposure} />
      </section>

      <section className="ledger-card overflow-x-auto p-5">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-slate-500">Historical Defaults</p>
        <h2 className="mb-4 font-display text-2xl font-semibold">Branch x category heatmap</h2>
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-ledger-line text-left font-mono text-xs uppercase tracking-[0.12em] text-slate-500">
              <th className="p-3">Branch</th>
              {categories.map((category) => (
                <th key={category} className="p-3">{category}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {branches.map((branch) => (
              <tr key={branch} className="border-b border-ledger-line">
                <td className="p-3 font-semibold">{branch}</td>
                {categories.map((category) => {
                  const rate = rates.find((item) => item.branch === branch && item.category === category)?.rate ?? 0;
                  const shade = rate > 0.12 ? "bg-red-100 text-ledger-brick" : rate > 0.075 ? "bg-amber-100 text-ledger-amber" : "bg-green-100 text-ledger-green";
                  return <td key={category} className={`p-3 font-mono ${shade}`}>{(rate * 100).toFixed(1)}%</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="ledger-card p-4">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
    </div>
  );
}
