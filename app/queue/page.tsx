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

const currency = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export default function QueuePage() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ tier: "", category: "", branch: "", sort: "desc" });
  const [error, setError] = useState("");
  const query = useMemo(() => new URLSearchParams(Object.entries(filters).filter(([, value]) => value)).toString(), [filters]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/applicants?${query}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setApplicants(data);
      })
      .catch((err) => setError(err.message ?? "Unable to load applicant queue."))
      .finally(() => setLoading(false));
  }, [query]);

  const visibleApplicants = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return applicants;
    return applicants.filter((applicant) => [applicant.id, applicant.branch, applicant.category, applicant.riskTier].some((value) => value.toLowerCase().includes(term)));
  }, [applicants, search]);

  const highRisk = visibleApplicants.filter((applicant) => applicant.riskTier === "High").length;

  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <section className="ledger-card animate-rise p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow text-ledger-ink/55">Officer Review Queue</p>
            <h1 className="mt-2 font-display text-5xl font-bold leading-none sm:text-7xl">Prioritize the next call.</h1>
            <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-ledger-ink/68">Filter risk tiers, inspect exposure, and open any profile without losing the review rhythm.</p>
          </div>
          <div className="grid min-w-[250px] grid-cols-2 gap-3">
            <MiniStat label="Showing" value={visibleApplicants.length.toString()} />
            <MiniStat label="High risk" value={highRisk.toString()} />
          </div>
        </div>
      </section>

      <section className="ledger-card sticky top-[118px] z-30 p-4 sm:p-5 lg:top-[82px]">
        <div className="grid gap-3 md:grid-cols-[1.2fr_repeat(4,minmax(0,1fr))]">
          <label className="block text-sm font-bold">
            <span className="eyebrow text-ledger-ink/55">Search</span>
            <input className="field mt-1" placeholder="ID, branch, category, tier" value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search applicant queue" />
          </label>
          <Select label="Tier" value={filters.tier} options={tiers} onChange={(tier) => setFilters((prev) => ({ ...prev, tier }))} />
          <Select label="Category" value={filters.category} options={categories} onChange={(category) => setFilters((prev) => ({ ...prev, category }))} />
          <Select label="Branch" value={filters.branch} options={branches} onChange={(branch) => setFilters((prev) => ({ ...prev, branch }))} />
          <Select label="Sort" value={filters.sort} options={["desc", "asc"]} optionLabels={{ desc: "Highest first", asc: "Lowest first" }} onChange={(sort) => setFilters((prev) => ({ ...prev, sort }))} />
        </div>
      </section>

      {loading ? <LoadingState label="Refreshing queue" /> : null}

      {!loading && !visibleApplicants.length ? (
        <section className="ledger-card p-8 text-center">
          <p className="font-display text-4xl font-bold">No matching records</p>
          <p className="mt-2 font-semibold text-ledger-ink/60">Adjust filters or clear search to widen the queue.</p>
        </section>
      ) : null}

      {!loading && visibleApplicants.length ? (
        <section className="grid gap-4">
          {visibleApplicants.map((applicant, index) => (
            <Link key={applicant.id} href={`/applicants/${applicant.id}`} className="ledger-card lift grid gap-4 p-5 md:grid-cols-[1.2fr_1fr_1fr_1fr_0.85fr] md:items-center" style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}>
              <div>
                <p className="font-mono text-xs font-bold uppercase text-ledger-ink/50">Applicant {applicant.id.slice(-8)}</p>
                <h2 className="mt-1 font-display text-3xl font-bold leading-none">{applicant.branch}</h2>
                <p className="mt-2 text-sm font-bold text-ledger-ink/58">{applicant.category} loan</p>
              </div>
              <Metric label="Requested" value={`INR ${currency.format(applicant.loanAmount)}`} />
              <Metric label="Annual income" value={`INR ${currency.format(applicant.annualIncome)}`} />
              <div>
                <p className="eyebrow mb-2 text-ledger-ink/55">Risk score</p>
                <RiskGauge score={applicant.riskScore} />
              </div>
              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                <RiskBadge tier={applicant.riskTier} />
                {applicant.decisions[0] ? <StatusBadge status={applicant.decisions[0].status} /> : <span className="rounded-full border-2 border-ledger-line bg-white px-3 py-1 font-mono text-xs font-bold">Pending</span>}
              </div>
            </Link>
          ))}
        </section>
      ) : null}
    </div>
  );
}

function Select({ label, value, options, optionLabels, onChange }: { label: string; value: string; options: readonly string[]; optionLabels?: Record<string, string>; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-bold">
      <span className="eyebrow text-ledger-ink/55">{label}</span>
      <select className="field mt-1" value={value} onChange={(event) => onChange(event.target.value)} aria-label={`Filter by ${label.toLowerCase()}`}>
        <option value="">All</option>
        {options.map((option) => <option key={option} value={option}>{optionLabels?.[option] ?? option}</option>)}
      </select>
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="eyebrow text-ledger-ink/55">{label}</p>
      <p className="mt-1 break-words font-mono text-lg font-bold">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border-2 border-ledger-line bg-white p-4 text-center">
      <p className="eyebrow text-ledger-ink/55">{label}</p>
      <p className="mt-2 font-display text-4xl font-bold leading-none">{value}</p>
    </div>
  );
}
