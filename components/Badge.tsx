import { displayStatus } from "@/lib/risk";

export function RiskBadge({ tier }: { tier: string }) {
  const styles =
    tier === "Low"
      ? "border-ledger-green bg-ledger-green/10 text-ledger-green"
      : tier === "Medium"
        ? "border-ledger-amber bg-ledger-yellow/40 text-ledger-ink"
        : "border-ledger-brick bg-ledger-brick/10 text-ledger-brick";
  return <span className={`inline-flex items-center rounded-full border-2 px-3 py-1 font-mono text-xs font-bold ${styles}`}>{tier}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const label = displayStatus(status);
  const styles =
    label === "Approved"
      ? "border-ledger-green bg-ledger-green/10 text-ledger-green"
      : label === "Rejected"
        ? "border-ledger-brick bg-ledger-brick/10 text-ledger-brick"
        : "border-ledger-amber bg-ledger-yellow/50 text-ledger-ink";
  return <span className={`inline-flex items-center rounded-full border-2 px-3 py-1 font-mono text-xs font-bold ${styles}`}>{label}</span>;
}
