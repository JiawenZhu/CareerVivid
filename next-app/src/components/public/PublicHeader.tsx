"use client";

import {
  Briefcase,
  ChevronDown,
  AppWindow,
  FileText,
  Globe,
  LayoutDashboard,
  Link as LinkIcon,
  Menu,
  Mic,
  Moon,
  Sun,
  Terminal,
  Users,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

const logoLight =
  "https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/public%2Flogo_assets%2Flogo_light_mode.png?alt=media&token=627ec9de-a950-41f7-9138-dd7a33518c55";
const logoDark =
  "https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/public%2Flogo_assets%2Flogo_dark_mode.png?alt=media";

const productLinks = [
  {
    href: "/newresume",
    icon: FileText,
    title: "Resume Builder",
    description: "AI-powered resume creation",
  },
  {
    href: "/portfolio",
    icon: Briefcase,
    title: "Portfolio Builder",
    description: "Showcase your work",
  },
  {
    href: "/job-tracker",
    icon: Zap,
    title: "Job Tracker",
    description: "Organize applications",
  },
  {
    href: "/bio-links",
    icon: LinkIcon,
    title: "Bio Links",
    description: "One link for everything",
  },
];

const resourceLinks = [
  {
    href: "/blog",
    icon: FileText,
    title: "Career Blog",
    description: "Guides for a clearer search",
  },
  {
    href: "/developers/api",
    icon: Terminal,
    title: "Professional API",
    description: "Developer documentation",
  },
  {
    href: "/community",
    icon: Users,
    title: "Community",
    description: "Join the discussion",
  },
];

function Dropdown({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative flex h-full items-center">
      <button className="flex items-center gap-1 py-2 text-sm font-semibold text-[#665a4a] transition-colors group-hover:text-[#211b16] dark:text-[#aaa39a] dark:group-hover:text-[#f4f1e9]">
        {label}
        <ChevronDown size={14} className="transition-transform duration-200 group-hover:rotate-180" />
      </button>
      <div className="absolute left-0 top-full z-50 hidden w-72 pt-4 group-hover:block">
        <div className="rounded-xl border border-[#e2d4c2] bg-[#fffaf1] p-2 shadow-xl shadow-[#6b4b1f]/10 dark:border-[#37332d] dark:bg-[#262522] dark:shadow-black/30">
          {children}
        </div>
      </div>
    </div>
  );
}

function DropdownItem({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: typeof FileText;
  title: string;
  description: string;
}) {
  return (
    <a
      href={href}
      className="group/item flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-[#f6ecd9] dark:hover:bg-[#302e2a]"
    >
      <div className="rounded-md bg-[#f4ead8] p-2 text-[#9a651f] group-hover/item:bg-[#eadbc5] dark:bg-[#333029] dark:text-[#caa26c] dark:group-hover/item:bg-[#3b372f]">
        <Icon size={18} />
      </div>
      <div>
        <div className="text-sm font-bold text-[#211b16] dark:text-[#f4f1e9]">{title}</div>
        <p className="text-xs text-[#665a4a] dark:text-[#aaa39a]">{description}</p>
      </div>
    </a>
  );
}

export function PublicHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("careervivid-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme = storedTheme === "dark" || (!storedTheme && prefersDark) ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    window.localStorage.setItem("careervivid-theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-40 border-b border-[#e4d8c5] bg-[#f7f1e7]/90 backdrop-blur-xl transition-colors duration-300 dark:border-[#33312d] dark:bg-[#1f1f1d]/92">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <a href="/" className="group flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-full bg-[#625bd5]/20 opacity-0 blur-lg transition-opacity group-hover:opacity-100" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={theme === "dark" ? logoDark : logoLight}
                alt="CareerVivid Logo"
                className="relative z-10 h-8 w-auto object-contain"
              />
            </div>
            <span className="hidden text-lg font-black tracking-tight text-[#8b5a16] dark:text-[#caa26c] lg:inline">
              CareerVivid
            </span>
          </a>

          <nav className="hidden h-full items-center gap-8 md:flex">
            <Dropdown label="Product">
              {productLinks.map((item) => (
                <DropdownItem key={item.href} {...item} />
              ))}
            </Dropdown>
            <a className="py-2 text-sm font-semibold text-[#665a4a] transition-colors hover:text-[#211b16] dark:text-[#aaa39a] dark:hover:text-[#f4f1e9]" href="/job-tracker">
              Job Tracker
            </a>
            <a className="py-2 text-sm font-semibold text-[#665a4a] transition-colors hover:text-[#211b16] dark:text-[#aaa39a] dark:hover:text-[#f4f1e9]" href="/interview-studio">
              Interview Coach
            </a>
            <Dropdown label="Pricing">
              <DropdownItem href="/pricing" icon={Zap} title="App Subscription" description="Pro and business plans" />
            </Dropdown>
            <Dropdown label="Resources">
              {resourceLinks.map((item) => (
                <DropdownItem key={item.href} {...item} />
              ))}
            </Dropdown>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="rounded-full p-2.5 text-[#8b6a3f] transition-colors hover:bg-[#efe2cf] dark:text-[#aaa39a] dark:hover:bg-[#302e2a]"
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <div className="hidden items-center gap-2 rounded-full px-2 py-1 text-sm font-semibold text-[#665a4a] dark:text-[#aaa39a] sm:flex">
              <Globe size={16} />
              English
            </div>
            <div className="hidden items-center gap-3 md:flex">
              <a
                href="/signin"
                className="px-3 py-2 text-sm font-semibold text-[#665a4a] transition-colors hover:text-[#211b16] dark:text-[#aaa39a] dark:hover:text-[#f4f1e9]"
              >
                Log in
              </a>
              <a
                href="/signup"
                className="rounded-full bg-[#211b16] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#6b4b1f]/15 transition hover:scale-105 hover:bg-[#3a2b20] dark:bg-[#f4f1e9] dark:text-[#1f1f1d] dark:hover:bg-white"
              >
                Sign up free
              </a>
            </div>
            <button
              onClick={() => setIsMenuOpen((value) => !value)}
              className="rounded-md p-2 text-[#665a4a] dark:text-[#aaa39a] md:hidden"
              aria-label="Toggle mobile menu"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen ? (
        <div className="absolute left-0 right-0 top-20 z-40 border-b border-[#e4d3bc] bg-[#fffaf1] shadow-2xl shadow-[#6b4b1f]/10 dark:border-[#37332d] dark:bg-[#262522] dark:shadow-black/30 md:hidden">
          <div className="flex flex-col gap-4 px-4 py-6">
            <div className="flex flex-col gap-3 border-b border-[#e4d3bc] pb-4 dark:border-[#37332d]">
              <a
                href="/signup"
                className="w-full rounded-lg bg-[#211b16] py-3 text-center font-bold text-white shadow-lg shadow-[#6b4b1f]/15 dark:bg-[#f4f1e9] dark:text-[#1f1f1d]"
              >
                Sign up free
              </a>
              <a
                href="/signin"
                className="w-full rounded-lg border border-[#d9c7ad] bg-[#fffaf1] py-3 text-center font-semibold text-[#211b16] dark:border-[#37332d] dark:bg-[#262522] dark:text-[#f1eee7]"
              >
                Log in
              </a>
            </div>
            <div className="space-y-5">
              <div className="space-y-3 border-l-2 border-[#e4d3bc] pl-4 dark:border-[#37332d]">
                <p className="text-xs font-black uppercase tracking-wider text-[#9a651f] dark:text-[#caa26c]">Product</p>
                <a href="/job-tracker" className="block text-sm font-semibold text-[#665a4a] dark:text-[#aaa39a]">Job Tracker</a>
                <a href="/newresume" className="block text-sm font-semibold text-[#665a4a] dark:text-[#aaa39a]">AI Resume Builder</a>
                <a href="/interview-studio" className="block text-sm font-semibold text-[#665a4a] dark:text-[#aaa39a]">Interview Coach</a>
                <a href="/extension-welcome" className="block text-sm font-semibold text-[#665a4a] dark:text-[#aaa39a]">Chrome Extension</a>
              </div>
              <div className="space-y-3 border-l-2 border-[#e4d3bc] pl-4 dark:border-[#37332d]">
                <p className="text-xs font-black uppercase tracking-wider text-[#9a651f] dark:text-[#caa26c]">Resources</p>
                <a href="/pricing" className="block text-sm font-semibold text-[#665a4a] dark:text-[#aaa39a]">Pricing</a>
                <a href="/blog" className="block text-sm font-semibold text-[#665a4a] dark:text-[#aaa39a]">Blog</a>
                <a href="/contact" className="block text-sm font-semibold text-[#665a4a] dark:text-[#aaa39a]">Contact</a>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
