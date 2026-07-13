import React, { useEffect } from 'react';
import { ArrowRight, CheckCircle2, Lock, Sparkles, X } from 'lucide-react';
import Logo from './Logo';

export interface AuthGateModalProps {
    /** What the user was trying to do — rendered as the headline context. */
    title?: string;
    message?: string;
    /** 'signin' asks guests to create an account; 'upgrade' asks free users to upgrade. */
    variant?: 'signin' | 'upgrade';
    onClose: () => void;
}

const BENEFITS: Record<NonNullable<AuthGateModalProps['variant']>, string[]> = {
    signin: [
        'Save your course progress and earn XP',
        'Run voice mock interviews with scored feedback',
        'Track applications and tailor resumes in one workspace',
    ],
    upgrade: [
        'Unlock all 10 courses and 60+ hands-on lessons',
        'More AI credits for interviews and resume tailoring',
        'Priority access to new company quests',
    ],
};

/**
 * Friendly gate shown when a guest (or free user) clicks something that needs
 * an account (or a paid plan). Mirrors the sign-in page's warm styling so the
 * hand-off feels intentional, not like an error.
 */
const AuthGateModal: React.FC<AuthGateModalProps> = ({
    title,
    message,
    variant = 'signin',
    onClose,
}) => {
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    const redirect = encodeURIComponent(window.location.pathname + window.location.search);
    const isUpgrade = variant === 'upgrade';

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#171411]/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={title || 'Sign in required'}>
            <div className="w-full max-w-md overflow-hidden rounded-3xl border border-[#e4d3bc] bg-[#fffaf1] shadow-[0_24px_70px_rgba(17,24,39,0.3)] dark:border-[#37332d] dark:bg-[#262522]">
                <div className="relative px-6 pb-6 pt-7 text-center sm:px-8">
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="absolute right-4 top-4 rounded-full p-2 text-[#8b6a3f] transition-colors hover:bg-[#f0e6d4] hover:text-[#211b16] dark:text-[#aaa39a] dark:hover:bg-[#302e2a]"
                    >
                        <X size={18} />
                    </button>

                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#e4d3bc] bg-white shadow-sm dark:border-[#37332d] dark:bg-[#1f1f1d]">
                        {isUpgrade ? <Sparkles size={24} className="text-[#a97935]" /> : <Logo className="h-9 w-auto" />}
                    </div>

                    <h2 className="mt-4 text-xl font-extrabold tracking-tight text-[#211b16] dark:text-[#f4f1e9] sm:text-2xl">
                        {title || (isUpgrade ? 'Unlock the full curriculum' : 'Create a free account to continue')}
                    </h2>
                    <p className="mx-auto mt-2 max-w-sm text-sm font-medium leading-6 text-[#665a4a] dark:text-[#aaa39a]">
                        {message || (isUpgrade
                            ? 'This content is part of the Pro catalog. Upgrade to keep going — your progress carries over.'
                            : 'You can keep browsing for free — an account saves your progress and unlocks the full experience.')}
                    </p>

                    <ul className="mx-auto mt-5 max-w-sm space-y-2 text-left">
                        {BENEFITS[variant].map((benefit) => (
                            <li key={benefit} className="flex items-start gap-2 text-sm font-semibold text-[#211b16] dark:text-[#f4f1e9]">
                                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#137245]" />
                                {benefit}
                            </li>
                        ))}
                    </ul>

                    <div className="mt-6 grid gap-2.5">
                        {isUpgrade ? (
                            <a
                                href="/subscription"
                                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#211b16] px-6 text-base font-bold text-white shadow-lg shadow-[#8b5a16]/10 transition hover:-translate-y-0.5 hover:bg-[#3a2b20]"
                            >
                                See plans <ArrowRight size={17} />
                            </a>
                        ) : (
                            <>
                                <a
                                    href={`/signup?redirect=${redirect}`}
                                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#211b16] px-6 text-base font-bold text-white shadow-lg shadow-[#8b5a16]/10 transition hover:-translate-y-0.5 hover:bg-[#3a2b20]"
                                >
                                    Create free account <ArrowRight size={17} />
                                </a>
                                <a
                                    href={`/signin?redirect=${redirect}`}
                                    className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-[#d8c6ad] bg-white px-6 text-base font-semibold text-[#211b16] transition hover:-translate-y-0.5 hover:border-[#bfa782] dark:border-[#37332d] dark:bg-[#1f1f1d] dark:text-[#f4f1e9]"
                                >
                                    I already have an account
                                </a>
                            </>
                        )}
                    </div>

                    <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#8b6a3f] dark:text-[#aaa39a]">
                        <Lock size={11} /> Free to start · No credit card required
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthGateModal;
