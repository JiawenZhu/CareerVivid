import {
    ENTERPRISE_PLAN_CREDIT_LIMIT,
    PRO_MAX_PLAN_CREDIT_LIMIT,
    PRO_PLAN_CREDIT_LIMIT,
} from './creditCosts';

const env = (name: string) => (import.meta.env[name] as string | undefined)?.trim() || '';

export const STRIPE_SUBSCRIPTION_PRICE_IDS = {
    proMonthly: env('VITE_STRIPE_PRICE_PRO_MONTHLY'),
    proAnnual: env('VITE_STRIPE_PRICE_PRO_ANNUAL'),
    maxMonthly: env('VITE_STRIPE_PRICE_MAX_MONTHLY'),
    maxAnnual: env('VITE_STRIPE_PRICE_MAX_ANNUAL'),
    enterpriseMonthly: env('VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY') || 'price_1TJoQyRJNflGxv32FQ9TxIjq',
} as const;

export const SUBSCRIPTION_CATALOG = {
    pro: {
        id: 'pro',
        name: 'Pro',
        monthlyPrice: 12,
        annualMonthlyEquivalent: 10,
        annualPrice: 120,
        creditLimit: PRO_PLAN_CREDIT_LIMIT,
        monthlyPriceId: STRIPE_SUBSCRIPTION_PRICE_IDS.proMonthly,
        annualPriceId: STRIPE_SUBSCRIPTION_PRICE_IDS.proAnnual,
    },
    max: {
        id: 'max',
        name: 'Max',
        monthlyPrice: 35,
        annualMonthlyEquivalent: 31,
        annualPrice: 372,
        creditLimit: PRO_MAX_PLAN_CREDIT_LIMIT,
        monthlyPriceId: STRIPE_SUBSCRIPTION_PRICE_IDS.maxMonthly,
        annualPriceId: STRIPE_SUBSCRIPTION_PRICE_IDS.maxAnnual,
    },
    enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        monthlyPrice: 12,
        creditLimit: ENTERPRISE_PLAN_CREDIT_LIMIT,
        monthlyPriceId: STRIPE_SUBSCRIPTION_PRICE_IDS.enterpriseMonthly,
    },
} as const;

export type StandardPlanId = keyof typeof SUBSCRIPTION_CATALOG;

export const formatCredits = (value: number) => value.toLocaleString();
