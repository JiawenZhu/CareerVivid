import type { ReactNode } from "react";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f1e7] text-[#211b16]">
      <header className="border-b border-[#e4d3bc] bg-[#fffaf1]/90">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" className="text-sm font-black text-[#211b16]">
            CareerVivid
          </a>
          <div className="hidden items-center gap-5 text-sm font-semibold text-[#665a4a] md:flex">
            <a href="/product">Product</a>
            <a href="/partners">Partners</a>
            <a href="/pricing">Pricing</a>
            <a href="/privacy">Privacy</a>
          </div>
          <a
            href="/signup"
            className="rounded-xl bg-[#211b16] px-4 py-2 text-sm font-bold text-[#fffaf1]"
          >
            Start free
          </a>
        </nav>
      </header>
      {children}
      <footer className="border-t border-[#e4d3bc] bg-[#fffaf1]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-[#665a4a] md:flex-row md:items-center md:justify-between">
          <p className="font-semibold text-[#211b16]">CareerVivid</p>
          <div className="flex flex-wrap gap-4">
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
            <a href="mailto:support@careervivid.app">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-black uppercase tracking-[0.22em] text-[#a97935]">
      {children}
    </p>
  );
}

export function PrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex items-center justify-center rounded-2xl bg-[#211b16] px-5 py-3 text-sm font-bold text-[#fffaf1] shadow-sm"
    >
      {children}
    </a>
  );
}
