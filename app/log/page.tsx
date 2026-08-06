"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { RiskBadge, StatusBadge } from "@/components/Badge";
import { ErrorState, LoadingState } from "@/components/LoadingState";

type Decision = {
  id: string;
  status: string;
  officerName: string;
  comment: string;
  createdAt: string;
  applicant: { id: string; branch: string; category: string; riskTier: string };
};

export default function LogPage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ officer: "", status: "", from: "", to: "" });
  const [error, setError] = useState("");
  const query = useMemo(() => new URLSearchParams(Object.entries(filters).filter(([, value]) => value)).toString(), [filters]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/decisions?${query}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setDecisions(data);
      })
      .catch((err) => setError(err.message ?? "Unable to load decision log."))
      .finally(() => setLoading(false));
  }, [query]);

  const visibleDecisions = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return decisions;
    return decisions.filter((decision) => [decision.officerName, decision.comment, decision.status, decision.applicant.branch, decision.applicant.category].some((value) => value.toLowerCase().includes(term)));
  }, [decisions, search]);

  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <section className="ledger-card animate-rise p-6 sm:p-8">
        <p className="eyebrow text-ledger-ink/55">Audit Trail</p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-5xl font-bold leading-none sm:text-7xl">Decision activity</h1>
            <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-ledger-ink/68">A GitHub-style review trail for every approval, rejection, and investigation note.</p>
          </div>
          <div className="rounded-[24px] border-2 border-ledger-line bg-ledger-yellow p-5 text-center">
            <p className="eyebrow text-ledger-ink/55">Visible events</p>
            <p className="font-display text-5xl font-bold leading-none">{visibleDecisions.length}</p>
          </div>
        </div>
      </section>

      <section className="ledger-card sticky top-[118px] z-30 p-4 sm:p-5 lg:top-[82px]">
        <div className="grid gap-3 md:grid-cols-[1.1fr_1fr_1fr_1fr_1fr]">
          <label className="block text-sm font-bold">
            <span className="eyebrow text-ledger-ink/55">Search</span>
            <input className="field mt-1" placeholder="Officer, comment, branch" value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search decision log" />
          </label>
          <label className="block text-sm font-bold">
            <span className="eyebrow text-ledger-ink/55">Officer</span>
            <input className="field mt-1" placeholder="Exact or partial name" value={filters.officer} onChange={(event) => setFilters((prev) => ({ ...prev, officer: event.target.value }))} />
          </label>
          <label className="block text-sm font-bold">
            <span className="eyebrow text-ledger-ink/55">Status</span>
            <select className="field mt-1" value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}>
              <option value="">All statuses</option>
              <option>Approved</option>
              <option>Rejected</option>
              <option>Under Investigation</option>
            </select>
          </label>
          <DateInput label="From" value={filters.from} onChange={(from) => setFilters((prev) => ({ ...prev, from }))} />
          <DateInput label="To" value={filters.to} onChange={(to) => setFilters((prev) => ({ ...prev, to }))} />
        </div>
      </section>

      {loading ? <LoadingState label="Loading activity" /> : null}

      {!loading && !visibleDecisions.length ? (
        <section className="ledger-card p-8 text-center">
          <p className="font-display text-4xl font-bold">No activity found</p>
          <p className="mt-2 font-semibold text-ledger-ink/60">Change the filters or search text to inspect more decisions.</p>
        </section>
      ) : null}

      {!loading && visibleDecisions.length ? (
        <section className="ledger-card p-5 sm:p-7">
          <div className="space-y-4">
            {visibleDecisions.map((decision) => (
              <article key={decision.id} className="grid gap-4 rounded-[24px] border-2 border-ledger-line bg-white p-4 transition hover:-translate-y-1 hover:bg-ledger-soft md:grid-cols-[auto_1fr_auto] md:items-start">
                <OfficerAvatar name={decision.officerName} />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/applicants/${decision.applicant.id}`} className="font-display text-2xl font-bold leading-none underline-offset-4 hover:underline">
                      {decision.applicant.branch} / {decision.applicant.category}
                    </Link>
                    <RiskBadge tier={decision.applicant.riskTier} />
                  </div>
                  <p className="mt-2 text-sm font-bold text-ledger-ink/58">{decision.officerName} commented on applicant {decision.applicant.id.slice(-8)}</p>
                  <p className="mt-3 rounded-2xl border-2 border-ledger-line/20 bg-ledger-soft p-4 text-sm font-semibold leading-6 text-ledger-ink/72">{decision.comment}</p>
                </div>
                <div className="flex flex-col gap-2 md:items-end">
                  <StatusBadge status={decision.status} />
                  <time className="font-mono text-xs font-bold text-ledger-ink/52">{new Date(decision.createdAt).toLocaleString()}</time>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-bold">
      <span className="eyebrow text-ledger-ink/55">{label}</span>
      <input className="field mt-1" type="date" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function OfficerAvatar({ name }: { name: string }) {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "OD";
  return <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-ledger-line bg-ledger-lilac font-mono text-sm font-bold shadow-[3px_3px_0_rgba(17,17,17,0.16)]">{initials}</span>;
}
