export function LoadingState({ label = "Loading credit records" }: { label?: string }) {
  return (
    <div className="ledger-card p-6" role="status" aria-live="polite">
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="font-mono text-sm font-bold text-ledger-ink/70">{label}...</p>
        <span className="h-3 w-3 rounded-full bg-ledger-yellow animate-pulse-soft" />
      </div>
      <div className="space-y-3">
        <div className="h-4 w-2/3 rounded-full bg-ledger-ink/10 animate-pulse-soft" />
        <div className="h-4 w-5/6 rounded-full bg-ledger-ink/10 animate-pulse-soft" />
        <div className="h-4 w-1/2 rounded-full bg-ledger-ink/10 animate-pulse-soft" />
      </div>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return <div className="rounded-3xl border-2 border-ledger-brick bg-white p-4 text-sm font-semibold text-ledger-brick shadow-[6px_6px_0_rgba(229,57,53,0.16)]" role="alert">{message}</div>;
}
