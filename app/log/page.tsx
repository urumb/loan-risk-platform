"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/components/Badge";
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
  const [filters, setFilters] = useState({ officer: "", status: "", from: "", to: "" });
  const [error, setError] = useState("");
  const query = useMemo(() => new URLSearchParams(Object.entries(filters).filter(([, value]) => value)).toString(), [filters]);

  useEffect(() => {
    fetch(`/api/decisions?${query}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setDecisions(data);
      })
      .catch((err) => setError(err.message ?? "Unable to load decision log."));
  }, [query]);

  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-5">
      <section className="ledger-card p-5">
        <h2 className="font-display text-2xl font-semibold">Full Decision Log</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <input className="border border-ledger-line bg-white px-3 py-2" placeholder="Officer" value={filters.officer} onChange={(event) => setFilters((prev) => ({ ...prev, officer: event.target.value }))} />
          <select className="border border-ledger-line bg-white px-3 py-2" value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}>
            <option value="">All statuses</option>
            <option>Approved</option>
            <option>Rejected</option>
            <option>Under Investigation</option>
          </select>
          <input className="border border-ledger-line bg-white px-3 py-2" type="date" value={filters.from} onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))} />
          <input className="border border-ledger-line bg-white px-3 py-2" type="date" value={filters.to} onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))} />
        </div>
      </section>

      {!decisions ? <LoadingState /> : (
        <section className="ledger-card overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead className="bg-ledger-navy text-white">
              <tr className="text-left font-mono text-xs uppercase tracking-[0.12em]">
                <th className="p-3">Time</th>
                <th className="p-3">Applicant</th>
                <th className="p-3">Officer</th>
                <th className="p-3">Status</th>
                <th className="p-3">Comment</th>
              </tr>
            </thead>
            <tbody>
              {decisions.map((decision) => (
                <tr key={decision.id} className="border-b border-ledger-line">
                  <td className="p-3 font-mono text-xs">{new Date(decision.createdAt).toLocaleString()}</td>
                  <td className="p-3">
                    <Link href={`/applicants/${decision.applicant.id}`} className="font-semibold underline-offset-4 hover:underline">
                      {decision.applicant.branch} / {decision.applicant.category}
                    </Link>
                  </td>
                  <td className="p-3">{decision.officerName}</td>
                  <td className="p-3"><StatusBadge status={decision.status} /></td>
                  <td className="p-3">{decision.comment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
