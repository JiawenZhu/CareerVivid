import * as admin from "firebase-admin";

export const PLAN_CREDIT_LIMITS = {
  free: 100,
  pro: 1000,
  proSprint: 300,
  max: 4500,
  enterprisePerSeat: 1500,
} as const;

export function getPlanMonthlyLimit(plan?: string, seats = 1): number {
  if (plan === "enterprise") {
    return Math.max(1, seats) * PLAN_CREDIT_LIMITS.enterprisePerSeat;
  }
  if (plan === "max" || plan === "pro_max") return PLAN_CREDIT_LIMITS.max;
  if (plan === "pro_monthly" || plan === "pro" || plan === "premium") return PLAN_CREDIT_LIMITS.pro;
  if (plan === "pro_sprint") return PLAN_CREDIT_LIMITS.proSprint;
  return PLAN_CREDIT_LIMITS.free;
}

export function getTokenCredits(data: admin.firestore.DocumentData): number {
  return Number(data.promotions?.tokenCredits || 0);
}

export function getPlanMonthlyLimitForUser(data: admin.firestore.DocumentData): number {
  return getPlanMonthlyLimit(data.plan, Number(data.seats || 1)) + getTokenCredits(data);
}
