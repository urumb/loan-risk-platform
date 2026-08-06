export function RiskGauge({ score }: { score: number }) {
  const color = score < 35 ? "bg-ledger-green" : score <= 65 ? "bg-ledger-amber" : "bg-ledger-brick";
  return (
    <div className="min-w-32">
      <div className="mb-1 flex items-center justify-between font-mono text-xs">
        <span>{score.toFixed(1)}</span>
        <span>/100</span>
      </div>
      <div className="h-2 border border-ledger-line bg-white">
        <div className={`h-full ${color}`} style={{ width: `${Math.max(2, Math.min(100, score))}%` }} />
      </div>
    </div>
  );
}
