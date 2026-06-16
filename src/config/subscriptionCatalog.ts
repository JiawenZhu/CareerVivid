import {
    FREE_PLAN_CREDIT_LIMIT,
    ENTERPRISE_PLAN_CREDIT_LIMIT,
    ENTERPRISE_MINIMUM_SEATS,
    PRO_MAX_PLAN_CREDIT_LIMIT,
    PRO_PLAN_CREDIT_LIMIT,
} from './creditCosts';

const env = (name: string) => (import.meta.env[name] as string | undefined)?.trim() || '';

export const STRIPE_SUBSCRIPTION_PRICE_IDS = {
    proMonthly: env('VITE_STRIPE_PRICE_PRO_MONTHLY') || 'price_1TfQaqRJNflGxv32GIVnEOKu',
    proAnnual: env('VITE_STRIPE_PRICE_PRO_ANNUAL') || 'price_1TfQaqRJNflGxv32OZ73C04t',
    maxMonthly: env('VITE_STRIPE_PRICE_MAX_MONTHLY') || 'price_1TfQarRJNflGxv32CC7MqVnt',
    maxAnnual: env('VITE_STRIPE_PRICE_MAX_ANNUAL') || 'price_1TfQarRJNflGxv323VMZLt0U',
    enterpriseMonthly: env('VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY') || 'price_1TfQauRJNflGxv32cDBdjco9',
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
        minimumSeats: ENTERPRISE_MINIMUM_SEATS,
        monthlyPriceId: STRIPE_SUBSCRIPTION_PRICE_IDS.enterpriseMonthly,
    },
} as const;

export type StandardPlanId = keyof typeof SUBSCRIPTION_CATALOG;

export const formatCredits = (value: number) => value.toLocaleString();

export type NormalizedPlanId = StandardPlanId | 'free';

export const normalizePlanId = (plan?: string | null): NormalizedPlanId => {
    if (plan === 'enterprise') return 'enterprise';
    if (plan === 'max' || plan === 'pro_max') return 'max';
    if (plan === 'pro' || plan === 'premium' || plan === 'pro_monthly' || plan === 'pro_sprint') return 'pro';
    return 'free';
};

export const isLegacyPlan = (plan?: string | null) => (
    plan === 'premium' || plan === 'pro_monthly' || plan === 'pro_sprint'
);

export const getPlanDisplayName = (plan?: string | null) => {
    const normalizedPlan = normalizePlanId(plan);
    if (normalizedPlan === 'free') return 'Free';
    return SUBSCRIPTION_CATALOG[normalizedPlan].name;
};

export const getPlanCreditLimit = (plan?: string | null, seats = 1) => {
    const normalizedPlan = normalizePlanId(plan);
    if (normalizedPlan === 'free') return FREE_PLAN_CREDIT_LIMIT;
    if (normalizedPlan === 'enterprise') {
        return Math.max(ENTERPRISE_MINIMUM_SEATS, seats) * ENTERPRISE_PLAN_CREDIT_LIMIT;
    }
    return SUBSCRIPTION_CATALOG[normalizedPlan].creditLimit;
};
