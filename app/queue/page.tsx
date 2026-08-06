"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { RiskBadge, StatusBadge } from "@/components/Badge";
import { ErrorState, LoadingState } from "@/components/LoadingState";
import { RiskGauge } from "@/components/RiskGauge";
import { branches, categories, tiers } from "@/lib/types";

type Applicant = {
  id: string;
  branch: string;
  category: string;
  annualIncome: number;
  loanAmount: number;
  riskScore: number;
  riskTier: string;
  decisions: Array<{ status: string }>;
};

export default function QueuePage() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [filters, setFilters] = useState({ tier: "", category: "", branch: "", sort: "desc" });
  const [error, setError] = useState("");
  const query = useMemo(() => new URLSearchParams(Object.entries(filters).filter(([, value]) => value)).toString(), [filters]);

  useEffect(() => {
    fetch(`/api/applicants?${query}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setApplicants(data);
      })
      .catch((err) => setError(err.message ?? "Unable to load applicant queue."));
  }, [query]);

  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-5">
      <section className="ledger-card p-5">
        <h2 className="font-display text-2xl font-semibold">Officer Review Queue</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <Select label="Tier" value={filters.tier} options={tiers} onChange={(tier) => setFilters((prev) => ({ ...prev, tier }))} />
          <Select label="Category" value={filters.category} options={categories} onChange={(category) => setFilters((prev) => ({ ...prev, category }))} />
          <Select label="Branch" value={filters.branch} options={branches} onChange={(branch) => setFilters((prev) => ({ ...prev, branch }))} />
          <Select label="Sort" value={filters.sort} options={["desc", "asc"]} onChange={(sort) => setFilters((prev) => ({ ...prev, sort }))} />
        </div>
      </section>

      {!applicants.length ? (
        <LoadingState label="No matching applicant records" />
      ) : (
        <section className="ledger-card overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-sm">
            <thead className="bg-ledger-navy text-white">
              <tr className="text-left font-mono text-xs uppercase tracking-[0.12em]">
                <th className="p-3">Applicant</th>
                <th className="p-3">Branch</th>
                <th className="p-3">Category</th>
                <th className="p-3">Loan</th>
                <th className="p-3">Risk</th>
                <th className="p-3">Tier</th>
                <th className="p-3">Last Decision</th>
              </tr>
            </thead>
            <tbody>
              {applicants.map((applicant) => (
                <tr key={applicant.id} className="border-b border-ledger-line hover:bg-white/70">
                  <td className="p-3 font-mono text-xs">
                    <Link href={`/applicants/${applicant.id}`} className="font-semibold text-ledger-navy underline-offset-4 hover:underline">
                      {applicant.id.slice(-8)}
                    </Link>
                  </td>
                  <td className="p-3">{applicant.branch}</td>
                  <td className="p-3">{applicant.category}</td>
                  <td className="p-3 font-mono">₹{applicant.loanAmount.toLocaleString("en-IN")}</td>
                  <td className="p-3"><RiskGauge score={applicant.riskScore} /></td>
                  <td className="p-3"><RiskBadge tier={applicant.riskTier} /></td>
                  <td className="p-3">{applicant.decisions[0] ? <StatusBadge status={applicant.decisions[0].status} /> : <span className="text-slate-500">Pending</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm">
      <span className="font-mono text-xs uppercase tracking-[0.12em] text-slate-500">{label}</span>
      <select className="mt-1 w-full border border-ledger-line bg-white px-3 py-2" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">All</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}
