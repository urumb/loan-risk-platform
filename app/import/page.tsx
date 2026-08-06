"use client";

import Papa from "papaparse";
import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { ErrorState } from "@/components/LoadingState";

const requiredColumns = ["branch", "category", "annualIncome", "existingMonthlyDebt", "repaymentScore", "loanAmount", "tenureMonths"];

export default function ImportPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  function parseFile(file: File) {
    setError("");
    setMessage("");
    setFileName(file.name);

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

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) parseFile(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) parseFile(file);
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
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-6">
      <section className="ledger-card animate-rise p-6 sm:p-8">
        <p className="eyebrow text-ledger-ink/55">CSV Batch Upload</p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-5xl font-bold leading-none sm:text-7xl">Import applicants</h1>
            <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-ledger-ink/68">Validate required columns in-browser, preview the batch, then send clean rows into the existing scoring pipeline.</p>
          </div>
          <div className="rounded-[24px] border-2 border-ledger-line bg-ledger-yellow p-5 text-center">
            <p className="eyebrow text-ledger-ink/55">Rows ready</p>
            <p className="font-display text-5xl font-bold leading-none">{rows.length}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="ledger-card p-6 sm:p-7">
          <div
            className={`grid min-h-[320px] cursor-pointer place-items-center rounded-[26px] border-2 border-dashed p-8 text-center transition ${dragging ? "border-ledger-blue bg-ledger-yellow/45" : "border-ledger-line bg-white"}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
            }}
            aria-label="Upload CSV file"
          >
            <div>
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl border-2 border-ledger-line bg-ledger-yellow shadow-[5px_5px_0_rgba(17,17,17,0.16)]">
                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3v12m0-12 4 4m-4-4-4 4M4 15v3a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-3" />
                </svg>
              </span>
              <h2 className="mt-5 font-display text-4xl font-bold">Drop CSV here</h2>
              <p className="mt-3 font-semibold text-ledger-ink/62">or click to choose a file from your machine.</p>
              {fileName ? <p className="mt-4 rounded-full border-2 border-ledger-line bg-ledger-soft px-4 py-2 font-mono text-xs font-bold">{fileName}</p> : null}
              <input ref={inputRef} className="sr-only" type="file" accept=".csv,text/csv" onChange={handleFile} />
            </div>
          </div>
        </div>

        <div className="ledger-card p-6 sm:p-7">
          <p className="eyebrow text-ledger-ink/55">Validation Contract</p>
          <h2 className="font-display text-4xl font-bold">Required schema</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {requiredColumns.map((column) => (
              <div key={column} className="rounded-2xl border-2 border-ledger-line bg-white p-4 font-mono text-sm font-bold">
                {column}
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-[22px] border-2 border-ledger-line bg-ledger-soft p-4">
            <p className="font-bold">Import flow</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-ledger-ink/65">Rows are parsed with PapaParse, checked for required columns, and inserted through the frozen applicant API where risk scores are computed server-side.</p>
          </div>
        </div>
      </section>

      {error ? <ErrorState message={error} /> : null}
      {message ? <div className="rounded-3xl border-2 border-ledger-green bg-white p-5 font-bold text-ledger-green shadow-[6px_6px_0_rgba(67,160,71,0.16)]" role="status">{message}</div> : null}

      {rows.length ? (
        <section className="ledger-card overflow-hidden p-5 sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow text-ledger-ink/55">Preview</p>
              <h2 className="font-display text-4xl font-bold">{rows.length} validated rows</h2>
            </div>
            <button className="btn-primary disabled:opacity-60" onClick={submit} disabled={busy}>
              {busy ? "Importing..." : "Insert into database"}
            </button>
          </div>
          <div className="overflow-x-auto rounded-[24px] border-2 border-ledger-line bg-white">
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead className="bg-ledger-ink text-white">
                <tr className="text-left font-mono text-xs uppercase tracking-[0.12em]">
                  {requiredColumns.map((column) => <th key={column} className="p-4">{column}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 25).map((row, index) => (
                  <tr key={`${row.branch}-${index}`} className="border-t-2 border-ledger-line/10 transition hover:bg-ledger-yellow/20">
                    {requiredColumns.map((column) => <td key={column} className="p-4 font-semibold">{row[column]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 25 ? <p className="mt-3 text-sm font-semibold text-ledger-ink/60">Showing first 25 rows.</p> : null}
        </section>
      ) : null}
    </div>
  );
}
