export function RiskGauge({ score }: { score: number }) {
  const color = score < 35 ? "#43A047" : score <= 65 ? "#F9A825" : "#E53935";
  const tier = score < 35 ? "Low" : score <= 65 ? "Medium" : "High";
  const width = Math.max(3, Math.min(100, score));
  return (
    <div className="min-w-36" aria-label={`Risk score ${score.toFixed(1)} out of 100, ${tier} risk`}>
      <div className="mb-2 flex items-end justify-between gap-3">
        <span className="font-mono text-lg font-bold leading-none">{score.toFixed(1)}</span>
        <span className="rounded-full border border-ledger-line/20 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-ledger-ink/60">{tier}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full border-2 border-ledger-line bg-white">
        <div className="h-full rounded-r-full transition-all duration-500" style={{ width: `${width}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
