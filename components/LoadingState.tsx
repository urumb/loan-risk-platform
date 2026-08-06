export function LoadingState({ label = "Loading ledger records" }: { label?: string }) {
  return <div className="ledger-card p-6 font-mono text-sm text-slate-600">{label}...</div>;
}

export function ErrorState({ message }: { message: string }) {
  return <div className="border border-ledger-brick bg-red-50 p-4 text-sm text-ledger-brick">{message}</div>;
}
