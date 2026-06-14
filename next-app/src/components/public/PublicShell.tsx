import type { ReactNode } from "react";
import { PublicFooter } from "./PublicFooter";
import { PublicHeader } from "./PublicHeader";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f1e7] text-[#211b16] dark:bg-[#1f1f1d] dark:text-[#f4f1e9]">
      <PublicHeader />
      <div className="pt-20">{children}</div>
      <PublicFooter />
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
