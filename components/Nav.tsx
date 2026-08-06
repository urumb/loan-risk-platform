import Link from "next/link";

const links = [
  { href: "/", label: "Portfolio" },
  { href: "/queue", label: "Queue" },
  { href: "/log", label: "Decision Log" },
  { href: "/import", label: "Import" }
];

export function Nav() {
  return (
    <header className="border-b border-ledger-line bg-ledger-navy text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-end md:justify-between lg:px-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-slate-300">Credit Intelligence Desk</p>
          <h1 className="font-display text-3xl font-semibold">Bank Loan Default Risk</h1>
        </div>
        <nav className="flex flex-wrap gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="border border-white/20 px-3 py-2 text-sm text-slate-100 transition hover:bg-white hover:text-ledger-navy"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
