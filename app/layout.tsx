import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "CrediShield",
  description: "AI-powered platform for intelligent bank loan default risk assessment, portfolio analytics, AI credit explanations, and credit decision management."
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
