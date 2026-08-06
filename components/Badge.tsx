import { displayStatus } from "@/lib/risk";

export function RiskBadge({ tier }: { tier: string }) {
  const styles =
    tier === "Low"
      ? "border-ledger-green/30 bg-ledger-green/10 text-ledger-green"
      : tier === "Medium"
        ? "border-ledger-amber/30 bg-ledger-amber/10 text-ledger-amber"
        : "border-ledger-brick/30 bg-ledger-brick/10 text-ledger-brick";
  return <span className={`inline-flex border px-2 py-1 font-mono text-xs ${styles}`}>{tier}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  return <span className="inline-flex border border-ledger-line bg-white px-2 py-1 font-mono text-xs">{displayStatus(status)}</span>;
}
