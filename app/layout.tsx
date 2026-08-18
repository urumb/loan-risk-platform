import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: {
    default: "CrediShield — AI Loan Default Risk & Credit Intelligence Platform",
    template: "%s | CrediShield"
  },
  description: "Bank loan default risk platform combining deterministic DTI scoring, Groq AI credit intelligence memos, portfolio risk alerts, and auditable officer decision logging.",
  openGraph: {
    title: "CrediShield — AI Loan Default Risk Platform",
    description: "Enterprise credit intelligence platform with deterministic risk formula, Groq explanations, and full officer audit logs.",
    type: "website"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <Nav />
        <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">{children}</main>
      </body>
    </html>
  );
}
