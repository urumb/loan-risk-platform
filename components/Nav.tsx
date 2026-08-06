"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Portfolio", icon: "M3 13h8V3H3v10Zm10 8h8V3h-8v18ZM3 21h8v-6H3v6Z", fill: true },
  { href: "/queue", label: "Queue", icon: "M4 6h16M4 12h16M4 18h10" },
  { href: "/log", label: "Decision Log", icon: "M7 7h10M7 12h10M7 17h6M5 3h14a2 2 0 0 1 2 2v16l-4-2-4 2-4-2-4 2V5a2 2 0 0 1 2-2Z" },
  { href: "/import", label: "Import", icon: "M12 3v12m0-12 4 4m-4-4-4 4M4 15v3a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-3" }
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b-2 border-ledger-line bg-white/88 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <Link href="/" className="group flex items-center gap-3" aria-label="LedgerLens portfolio dashboard">
          <span className="grid h-12 w-12 place-items-center rounded-2xl border-2 border-ledger-line bg-ledger-yellow font-display text-2xl font-bold shadow-[4px_4px_0_rgba(17,17,17,0.18)] transition group-hover:-translate-y-0.5">
            L
          </span>
          <span>
            <span className="eyebrow block text-ledger-ink/60">AI Credit Desk</span>
            <span className="block font-display text-3xl font-bold leading-none">LedgerLens</span>
          </span>
        </Link>
        <nav className="flex flex-wrap gap-2" aria-label="Primary navigation">
          {links.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex items-center gap-2 rounded-full border-2 border-ledger-line px-3.5 py-2 text-sm font-extrabold transition hover:-translate-y-0.5 hover:bg-ledger-yellow ${
                  active ? "bg-ledger-ink text-white shadow-[3px_3px_0_rgba(17,17,17,0.18)]" : "bg-white text-ledger-ink"
                }`}
              >
                <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill={link.fill ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={link.icon} />
                </svg>
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
