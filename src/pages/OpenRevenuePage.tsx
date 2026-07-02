import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
    ArrowUpRight,
    BadgeCheck,
    BarChart3,
    CreditCard,
    Eye,
    FileText,
    Lock,
    RefreshCw,
    ShieldCheck,
    Sparkles,
    Users,
} from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';

type RevenueSummary = {
    grossRevenueCents: number;
    netRevenueCents: number;
    stripeFeesCents: number;
    refundedCents: number;
    chargeCount: number;
};

type RevenuePoint = {
    label: string;
    date: string;
    grossRevenueCents: number;
    netRevenueCents: number;
    chargeCount: number;
};

type OpenRevenueStats = {
    ok: boolean;
    verified: boolean;
    source: string;
    sourceMode?: 'balance_transactions' | 'charges';
    currency: string;
    lastUpdated: string;
    activeSubscriptions: number;
    allTime: RevenueSummary;
    last30Days: RevenueSummary;
    previous30Days: RevenueSummary;
    monthToDate: RevenueSummary;
    dailyRevenue: RevenuePoint[];
    monthlyRevenue: RevenuePoint[];
    inspectedTransactionCount: number;
    isLimitedByPageCap: boolean;
    netRevenueIncludesStripeFees?: boolean;
    privacy: {
        customerDataIncluded: boolean;
        paymentDataIncluded: boolean;
        aggregateOnly: boolean;
    };
};

const emptySummary: RevenueSummary = {
    grossRevenueCents: 0,
    netRevenueCents: 0,
    stripeFeesCents: 0,
    refundedCents: 0,
    chargeCount: 0,
};

const buildFallbackPoints = (count: number, unit: 'day' | 'month'): RevenuePoint[] => {
    const now = new Date();

    return Array.from({ length: count }, (_, index) => {
        const date = new Date(now);
        if (unit === 'day') {
            date.setUTCDate(now.getUTCDate() - (count - 1 - index));
        } else {
            date.setUTCMonth(now.getUTCMonth() - (count - 1 - index), 1);
        }

        return {
            label: new Intl.DateTimeFormat('en-US', unit === 'day'
                ? { month: 'short', day: 'numeric', timeZone: 'UTC' }
                : { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date),
            date: date.toISOString().slice(0, 10),
            grossRevenueCents: 0,
            netRevenueCents: 0,
            chargeCount: 0,
        };
    });
};

const fallbackStats: OpenRevenueStats = {
    ok: true,
    verified: false,
    source: 'not configured',
    sourceMode: 'charges',
    currency: 'USD',
    lastUpdated: new Date().toISOString(),
    activeSubscriptions: 0,
    allTime: emptySummary,
    last30Days: emptySummary,
    previous30Days: emptySummary,
    monthToDate: emptySummary,
    dailyRevenue: buildFallbackPoints(30, 'day'),
    monthlyRevenue: buildFallbackPoints(12, 'month'),
    inspectedTransactionCount: 0,
    isLimitedByPageCap: false,
    netRevenueIncludesStripeFees: false,
    privacy: {
        customerDataIncluded: false,
        paymentDataIncluded: false,
        aggregateOnly: true,
    },
};

const formatMoney = (cents: number, currency: string, compact = false) => {
    const amount = cents / 100;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: compact ? 1 : 0,
        notation: compact ? 'compact' : 'standard',
    }).format(amount);
};

const formatDateTime = (isoDate: string) => {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
    }).format(new Date(isoDate));
};

const calculateChange = (current: number, previous: number) => {
    if (previous <= 0 && current > 0) return '+100%';
    if (previous <= 0) return '0%';
    const change = ((current - previous) / previous) * 100;
    const prefix = change > 0 ? '+' : '';
    return `${prefix}${change.toFixed(1)}%`;
};

const MetricCard: React.FC<{
    label: string;
    value: string;
    detail: string;
    icon: React.ReactNode;
    tone?: 'dark' | 'default' | 'green' | 'blue';
}> = ({ label, value, detail, icon, tone = 'default' }) => {
    const toneClasses = {
        dark: 'border-[#211b16] bg-[#211b16] text-[#fffaf1] shadow-[#211b16]/10 dark:border-[#f3ead9] dark:bg-[#f3ead9] dark:text-[#211b16]',
        default: 'border-[#e4d3bc] bg-[#fffaf1] text-[#211b16] dark:border-[#37332d] dark:bg-[#262522] dark:text-[#f4f1e9]',
        green: 'border-[#b9dec7] bg-[#effaf1] text-[#16351f] dark:border-[#2b5c39] dark:bg-[#18251c] dark:text-[#dbf4df]',
        blue: 'border-[#c9d8f4] bg-[#f1f5ff] text-[#17284a] dark:border-[#31466a] dark:bg-[#1b2231] dark:text-[#dfe9ff]',
    }[tone];

    return (
        <div className={`rounded-[28px] border p-5 shadow-sm ${toneClasses}`}>
            <div className="flex items-start justify-between gap-4">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] opacity-70">{label}</p>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-current/10 bg-white/45">
                    {icon}
                </div>
            </div>
            <p className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">{value}</p>
            <p className="mt-3 text-sm font-semibold leading-relaxed opacity-75">{detail}</p>
        </div>
    );
};

const RevenueBars: React.FC<{
    points: RevenuePoint[];
    currency: string;
    mode: 'daily' | 'monthly';
}> = ({ points, currency, mode }) => {
    const maxValue = Math.max(...points.map((point) => Math.max(point.grossRevenueCents, 0)), 1);
    const visibleLabels = mode === 'daily'
        ? [0, 7, 14, 21, 29]
        : [0, 3, 6, 9, 11];

    return (
        <div className="rounded-[28px] border border-[#e4d3bc] bg-[#fffaf1] p-5 shadow-sm dark:border-[#37332d] dark:bg-[#262522]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.26em] text-[#9a651f] dark:text-[#caa26c]">
                        {mode === 'daily' ? 'Last 30 days' : 'Last 12 months'}
                    </p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight text-[#211b16] dark:text-[#f4f1e9]">
                        {mode === 'daily' ? 'Daily verified revenue' : 'Monthly revenue history'}
                    </h2>
                </div>
                <div className="rounded-2xl border border-[#e4d3bc] bg-white px-4 py-2 text-sm font-black text-[#211b16] dark:border-[#37332d] dark:bg-[#1f1f1d] dark:text-[#f4f1e9]">
                    Gross, after refunds
                </div>
            </div>

            <div className="mt-8 grid h-72 grid-cols-[44px_1fr] gap-4">
                <div className="flex flex-col justify-between text-right text-[11px] font-bold text-[#8a7a66] dark:text-[#aaa39a]">
                    <span>{formatMoney(maxValue, currency, true)}</span>
                    <span>{formatMoney(maxValue / 2, currency, true)}</span>
                    <span>{formatMoney(0, currency, true)}</span>
                </div>
                <div className="relative flex items-end gap-1 border-b border-l border-[#e4d3bc] bg-[linear-gradient(to_bottom,rgba(148,116,70,0.12)_1px,transparent_1px)] bg-[length:100%_33.333%] px-2 dark:border-[#37332d] dark:bg-[linear-gradient(to_bottom,rgba(202,162,108,0.13)_1px,transparent_1px)]">
                    {points.map((point, index) => {
                        const height = Math.max(4, (Math.max(point.grossRevenueCents, 0) / maxValue) * 100);
                        const showLabel = visibleLabels.includes(index);

                        return (
                            <div key={`${point.date}-${index}`} className="group relative flex h-full min-w-0 flex-1 items-end justify-center">
                                <div
                                    className="w-full max-w-[22px] rounded-t-lg bg-[#6557d2] transition-colors group-hover:bg-[#211b16] dark:bg-[#8d83f6] dark:group-hover:bg-[#f4f1e9]"
                                    style={{ height: `${height}%` }}
                                    title={`${point.label}: ${formatMoney(point.grossRevenueCents, currency)}`}
                                />
                                {showLabel && (
                                    <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-[#8a7a66] dark:text-[#aaa39a]">
                                        {point.label}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const OpenRevenuePage: React.FC = () => {
    const [stats, setStats] = useState<OpenRevenueStats>(fallbackStats);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const loadRevenue = async () => {
            setLoading(true);
            setError(null);

            const configuredApiUrl = import.meta.env.VITE_OPEN_REVENUE_API_URL as string | undefined;
            const isLocalPreview = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const apiUrl = configuredApiUrl || (isLocalPreview ? '' : '/api/open-revenue');

            if (!apiUrl) {
                setStats({ ...fallbackStats, lastUpdated: new Date().toISOString() });
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(apiUrl, {
                    headers: { Accept: 'application/json' },
                });
                const contentType = response.headers.get('content-type') || '';
                if (!response.ok || !contentType.includes('application/json')) {
                    throw new Error('Revenue endpoint is not available in this environment.');
                }

                const payload = await response.json() as OpenRevenueStats;
                if (!cancelled && payload.ok) {
                    setStats(payload);
                }
            } catch (incomingError) {
                if (!cancelled) {
                    setError(incomingError instanceof Error ? incomingError.message : 'Revenue data is not available.');
                    setStats(fallbackStats);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void loadRevenue();

        return () => {
            cancelled = true;
        };
    }, []);

    const revenueChange = useMemo(() => {
        return calculateChange(stats.last30Days.grossRevenueCents, stats.previous30Days.grossRevenueCents);
    }, [stats.last30Days.grossRevenueCents, stats.previous30Days.grossRevenueCents]);

    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        name: 'CareerVivid Open Revenue',
        description: 'A public, read-only aggregate revenue dashboard for CareerVivid.',
        url: 'https://careervivid.app/open',
        creator: {
            '@type': 'Organization',
            name: 'CareerVivid',
            url: 'https://careervivid.app/',
        },
        measurementTechnique: 'Stripe aggregate balance transaction reporting',
        isAccessibleForFree: true,
    };

    return (
        <div className="cv-public-warm-page min-h-screen bg-[#f7f1e7] text-[#211b16] selection:bg-amber-200/60 dark:bg-[#1f1f1d] dark:text-[#f4f1e9]">
            <Helmet titleTemplate="%s">
                <title>Open Revenue | CareerVivid</title>
                <meta
                    name="description"
                    content="CareerVivid shares aggregate read-only revenue metrics from Stripe so job seekers and partners can see the business being built in public."
                />
                <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
                <link rel="canonical" href="https://careervivid.app/open" />
                <meta property="og:type" content="website" />
                <meta property="og:title" content="Open Revenue | CareerVivid" />
                <meta property="og:description" content="A public read-only view of CareerVivid aggregate revenue, verified from Stripe without exposing customer data." />
                <meta property="og:url" content="https://careervivid.app/open" />
                <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
            </Helmet>

            <PublicHeader variant="editorial" />

            <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
                <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
                    <div className="rounded-[36px] border border-[#e4d3bc] bg-[#fffaf1] p-6 shadow-sm dark:border-[#37332d] dark:bg-[#262522] sm:p-8 lg:p-10">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[#d9c6ab] bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-[#9a651f] dark:border-[#37332d] dark:bg-[#1f1f1d] dark:text-[#caa26c]">
                            <Eye className="h-3.5 w-3.5" />
                            Open startup
                        </div>
                        <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[0.96] tracking-tight text-[#211b16] dark:text-[#f4f1e9] sm:text-6xl lg:text-7xl">
                            CareerVivid income, public by default.
                        </h1>
                        <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-[#665a4a] dark:text-[#aaa39a]">
                            This page shares aggregate revenue from Stripe in read-only form. It shows the business signal behind CareerVivid without exposing customers, invoices, cards, emails, or private workspace data.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <a
                                href="/signup"
                                className="inline-flex items-center gap-2 rounded-2xl bg-[#211b16] px-5 py-3 text-sm font-black text-[#fffaf1] shadow-sm transition hover:bg-[#3a3128] dark:bg-[#f4f1e9] dark:text-[#211b16]"
                            >
                                Start CareerVivid
                                <ArrowUpRight className="h-4 w-4" />
                            </a>
                            <a
                                href="/pricing"
                                className="inline-flex items-center gap-2 rounded-2xl border border-[#d8c7ad] bg-white px-5 py-3 text-sm font-black text-[#211b16] transition hover:bg-[#f6ecd9] dark:border-[#37332d] dark:bg-[#1f1f1d] dark:text-[#f4f1e9] dark:hover:bg-[#302e2a]"
                            >
                                View pricing
                            </a>
                        </div>
                        <div className="mt-8 grid gap-3 sm:grid-cols-3">
                            {[
                                ['Stripe verified', stats.verified ? 'Live aggregate feed' : 'Waiting for secret'],
                                ['Read-only', 'No write access from this page'],
                                ['Privacy first', 'No customer data shown'],
                            ].map(([title, detail]) => (
                                <div key={title} className="rounded-2xl border border-[#eadcc7] bg-white/70 p-4 dark:border-[#37332d] dark:bg-[#1f1f1d]/70">
                                    <p className="text-sm font-black text-[#211b16] dark:text-[#f4f1e9]">{title}</p>
                                    <p className="mt-1 text-xs font-semibold leading-5 text-[#7b6d5b] dark:text-[#aaa39a]">{detail}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-[36px] border border-[#211b16] bg-[#211b16] p-6 text-[#fffaf1] shadow-sm dark:border-[#f4f1e9] dark:bg-[#f4f1e9] dark:text-[#211b16] sm:p-8">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.24em] opacity-70">Read-only status</p>
                                <h2 className="mt-3 text-3xl font-black tracking-tight">Verified public numbers</h2>
                            </div>
                            <div className="rounded-2xl border border-current/20 bg-white/10 p-3">
                                <BadgeCheck className="h-6 w-6" />
                            </div>
                        </div>
                        <div className="mt-8 space-y-4">
                            <div className="rounded-3xl border border-white/15 bg-white/10 p-5">
                                <p className="text-sm font-bold opacity-75">Last 30 days</p>
                                <p className="mt-2 text-5xl font-black tracking-tight">
                                    {formatMoney(stats.last30Days.grossRevenueCents, stats.currency)}
                                </p>
                                <p className="mt-2 text-sm font-bold opacity-75">
                                    {revenueChange} vs. previous 30 days
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-3xl border border-white/15 bg-white/10 p-5">
                                    <p className="text-xs font-black uppercase tracking-[0.2em] opacity-60">All time</p>
                                    <p className="mt-3 text-2xl font-black">{formatMoney(stats.allTime.grossRevenueCents, stats.currency)}</p>
                                </div>
                                <div className="rounded-3xl border border-white/15 bg-white/10 p-5">
                                    <p className="text-xs font-black uppercase tracking-[0.2em] opacity-60">Subscribers</p>
                                    <p className="mt-3 text-2xl font-black">{stats.activeSubscriptions}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 rounded-3xl border border-white/15 bg-white/10 p-5">
                                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                                <p className="text-sm font-semibold leading-6 opacity-80">
                                    {loading
                                        ? 'Loading the latest aggregate Stripe numbers.'
                                        : stats.verified
                                            ? `Verified with Stripe. Last updated ${formatDateTime(stats.lastUpdated)}.`
                                            : 'Connect the Firebase secret to publish live Stripe-verified revenue.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {error && (
                    <div className="mt-6 rounded-3xl border border-[#e4d3bc] bg-[#fffaf1] p-4 text-sm font-bold text-[#8a5a18] dark:border-[#37332d] dark:bg-[#262522] dark:text-[#caa26c]">
                        {error}
                    </div>
                )}

                <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                        label="Month to date"
                        value={formatMoney(stats.monthToDate.grossRevenueCents, stats.currency)}
                        detail={`${stats.monthToDate.chargeCount} successful revenue transactions this month.`}
                        icon={<BarChart3 className="h-5 w-5" />}
                        tone="green"
                    />
                    <MetricCard
                        label={stats.netRevenueIncludesStripeFees ? 'Net after fees' : 'Reported net'}
                        value={formatMoney(stats.last30Days.netRevenueCents, stats.currency)}
                        detail={stats.netRevenueIncludesStripeFees
                            ? `${formatMoney(stats.last30Days.stripeFeesCents, stats.currency)} in Stripe fees over the last 30 days.`
                            : 'Current key exposes charge totals, but not Stripe fee detail.'}
                        icon={<CreditCard className="h-5 w-5" />}
                        tone="default"
                    />
                    <MetricCard
                        label="All-time revenue"
                        value={formatMoney(stats.allTime.grossRevenueCents, stats.currency)}
                        detail={`${stats.allTime.chargeCount} aggregate revenue transactions inspected.`}
                        icon={<Sparkles className="h-5 w-5" />}
                        tone="blue"
                    />
                    <MetricCard
                        label="Active subscriptions"
                        value={String(stats.activeSubscriptions)}
                        detail="Subscription count only. Subscriber identities stay private."
                        icon={<Users className="h-5 w-5" />}
                        tone="dark"
                    />
                </section>

                <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
                    <RevenueBars points={stats.dailyRevenue} currency={stats.currency} mode="daily" />

                    <div className="space-y-5">
                        <div className="rounded-[28px] border border-[#e4d3bc] bg-[#fffaf1] p-5 shadow-sm dark:border-[#37332d] dark:bg-[#262522]">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#effaf1] text-[#1d7a3f] dark:bg-[#18311f] dark:text-[#87dda4]">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-[#211b16] dark:text-[#f4f1e9]">Revenue source</p>
                                    <p className="text-xs font-semibold text-[#7b6d5b] dark:text-[#aaa39a]">
                                        {stats.sourceMode === 'balance_transactions' ? 'Stripe aggregate balance data' : 'Stripe charge and subscription data'}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-5 space-y-3 text-sm font-semibold leading-6 text-[#665a4a] dark:text-[#aaa39a]">
                                <p>This dashboard is generated from a restricted Stripe key configured on Firebase Functions.</p>
                                <p>Only totals, counts, dates, and currency are returned to the browser.</p>
                            </div>
                        </div>

                        <div className="rounded-[28px] border border-[#e4d3bc] bg-[#fffaf1] p-5 shadow-sm dark:border-[#37332d] dark:bg-[#262522]">
                            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#9a651f] dark:text-[#caa26c]">Public policy</p>
                            <div className="mt-5 space-y-4">
                                {[
                                    [Eye, 'Public', 'Revenue totals, transaction counts, active subscription count, update time.'],
                                    [Lock, 'Private', 'Customer names, emails, payment methods, invoices, receipts, workspace data.'],
                                    [FileText, 'Read-only', 'The page cannot create charges, edit products, or access private Stripe records.'],
                                ].map(([Icon, title, detail]) => {
                                    const PolicyIcon = Icon as typeof Eye;
                                    return (
                                        <div key={title as string} className="flex gap-3 rounded-2xl border border-[#eadcc7] bg-white/70 p-4 dark:border-[#37332d] dark:bg-[#1f1f1d]/70">
                                            <PolicyIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#6557d2]" />
                                            <div>
                                                <p className="text-sm font-black text-[#211b16] dark:text-[#f4f1e9]">{title as string}</p>
                                                <p className="mt-1 text-xs font-semibold leading-5 text-[#7b6d5b] dark:text-[#aaa39a]">{detail as string}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mt-8 grid gap-8 lg:grid-cols-2">
                    <RevenueBars points={stats.monthlyRevenue} currency={stats.currency} mode="monthly" />
                    <div className="rounded-[28px] border border-[#e4d3bc] bg-[#fffaf1] p-6 shadow-sm dark:border-[#37332d] dark:bg-[#262522]">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#9a651f] dark:text-[#caa26c]">Build in public</p>
                                <h2 className="mt-2 text-3xl font-black tracking-tight text-[#211b16] dark:text-[#f4f1e9]">
                                    Why share this?
                                </h2>
                            </div>
                            <RefreshCw className={`h-5 w-5 text-[#6557d2] ${loading ? 'animate-spin' : ''}`} />
                        </div>
                        <div className="mt-6 space-y-4 text-base font-semibold leading-8 text-[#665a4a] dark:text-[#aaa39a]">
                            <p>CareerVivid helps people make better job-search decisions. Sharing the business numbers keeps the company accountable to the same standard: clear context, visible progress, and fewer vague claims.</p>
                            <p>As the product grows, this page can add more open metrics such as free signups, paid conversion, extension installs, and refund rate. The principle stays the same: useful transparency without leaking private user data.</p>
                        </div>
                        <div className="mt-8 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-[#eadcc7] bg-white/70 p-4 dark:border-[#37332d] dark:bg-[#1f1f1d]/70">
                                <p className="text-sm font-black">Data inspected</p>
                                <p className="mt-2 text-3xl font-black">{stats.inspectedTransactionCount}</p>
                                <p className="mt-1 text-xs font-semibold text-[#7b6d5b] dark:text-[#aaa39a]">Aggregate Stripe balance transactions</p>
                            </div>
                            <div className="rounded-2xl border border-[#eadcc7] bg-white/70 p-4 dark:border-[#37332d] dark:bg-[#1f1f1d]/70">
                                <p className="text-sm font-black">Page cap</p>
                                <p className="mt-2 text-3xl font-black">{stats.isLimitedByPageCap ? 'On' : 'Clear'}</p>
                                <p className="mt-1 text-xs font-semibold text-[#7b6d5b] dark:text-[#aaa39a]">Shows if the backend hit its transaction page limit</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default OpenRevenuePage;
