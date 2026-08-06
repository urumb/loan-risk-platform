"use client";

import Papa from "papaparse";
import { ChangeEvent, useState } from "react";
import { ErrorState } from "@/components/LoadingState";

const requiredColumns = ["branch", "category", "annualIncome", "existingMonthlyDebt", "repaymentScore", "loanAmount", "tenureMonths"];

export default function ImportPage() {
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError("");
    setMessage("");
    if (!file) return;

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const fields = result.meta.fields ?? [];
        const missing = requiredColumns.filter((column) => !fields.includes(column));
        if (missing.length) {
          setError(`Missing required columns: ${missing.join(", ")}`);
          setRows([]);
          return;
        }
        if (result.errors.length) {
          setError(result.errors.map((item) => item.message).join("; "));
          setRows([]);
          return;
        }
        setRows(result.data);
      }
    });
  }

  async function submit() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/applicants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rows)
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Import failed.");
      return;
    }
    setMessage(`Imported ${data.inserted ?? 1} applicant records.`);
    setRows([]);
  }

  return (
    <div className="space-y-5">
      <section className="ledger-card p-5">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-slate-500">CSV Batch Upload</p>
        <h2 className="font-display text-2xl font-semibold">Import applicant profiles</h2>
        <div className="mt-4 border border-dashed border-ledger-line bg-white p-6">
          <input type="file" accept=".csv,text/csv" onChange={handleFile} />
          <p className="mt-3 font-mono text-xs text-slate-500">Required columns: {requiredColumns.join(", ")}</p>
        </div>
      </section>

      {error ? <ErrorState message={error} /> : null}
      {message ? <div className="border border-ledger-green bg-green-50 p-4 text-ledger-green">{message}</div> : null}

      {rows.length ? (
        <section className="ledger-card overflow-x-auto p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-2xl font-semibold">Preview {rows.length} rows</h3>
            <button className="border border-ledger-navy bg-ledger-navy px-4 py-2 text-white disabled:opacity-60" onClick={submit} disabled={busy}>
              Insert into DB
            </button>
          </div>
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead className="bg-ledger-navy text-white">
              <tr className="text-left font-mono text-xs uppercase tracking-[0.12em]">
                {requiredColumns.map((column) => <th key={column} className="p-3">{column}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 25).map((row, index) => (
                <tr key={`${row.branch}-${index}`} className="border-b border-ledger-line">
                  {requiredColumns.map((column) => <td key={column} className="p-3">{row[column]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 25 ? <p className="mt-3 text-sm text-slate-500">Showing first 25 rows.</p> : null}
        </section>
      ) : null}
    </div>
  );
}
