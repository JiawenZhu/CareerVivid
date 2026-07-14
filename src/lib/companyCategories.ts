/**
 * Company category taxonomy for quest interview tailoring.
 *
 * Every company guide is assigned to exactly one interview-STYLE category
 * (not just an industry label — the category captures how the loop *feels*:
 * what screeners probe, which values come up, and how the final round lands).
 *
 * The quest engine layers questions: company-specific sampleQuestions first,
 * then the category bank (for the rounds guides rarely carry — screening,
 * values, final), then a generic company-name fallback last.
 *
 * DATA SOURCE: the slug->category map, the tailored question banks, and the
 * per-category system-design ordering all live in
 * `data/quest-category-banks.json` — a single source of truth that the
 * twice-weekly research task edits and the quest-question tracker spreadsheet
 * reads. This module only adds types, metadata, and lookup logic on top.
 *
 * This file deliberately imports no other app modules to keep the dependency
 * one-directional (companyQuests -> companyCategories).
 */
import categoryData from '../../data/quest-category-banks.json';

export type CompanyCategory =
  | 'big-tech'
  | 'quant-trading'
  | 'finance'
  | 'fintech'
  | 'crypto'
  | 'ai-lab'
  | 'dev-infra'
  | 'enterprise-saas'
  | 'cybersecurity'
  | 'consumer'
  | 'marketplace'
  | 'gaming'
  | 'hardware'
  | 'deep-tech'
  | 'healthcare';

/** The category rounds that carry a tailored, difficulty-tiered bank. */
export type CategoryStageKind = 'screening' | 'behavioral' | 'values' | 'final';

/** Difficulty tiers, mirroring the coding round's easy/medium/hard. */
export type QuestDifficulty = 'easy' | 'medium' | 'hard';

/** A stage bank split into difficulty tiers. */
export type CategoryStageBank = Record<QuestDifficulty, string[]>;

export interface CompanyCategoryMeta {
  id: CompanyCategory;
  label: string;
  /** One-line description of the interview flavor for this category. */
  blurb: string;
}

export const COMPANY_CATEGORY_META: Record<CompanyCategory, CompanyCategoryMeta> = {
  'big-tech': { id: 'big-tech', label: 'Big Tech', blurb: 'Large public tech giants — structured loops, scale, and leadership signals.' },
  'quant-trading': { id: 'quant-trading', label: 'Quant & Trading', blurb: 'HFT, prop shops, and hedge funds — probability, precision, and speed.' },
  finance: { id: 'finance', label: 'Finance & Banking', blurb: 'Banks and asset managers — markets fluency, rigor, and composure.' },
  fintech: { id: 'fintech', label: 'Fintech & Payments', blurb: 'Payments, lending, and money movement — correctness, trust, and compliance.' },
  crypto: { id: 'crypto', label: 'Crypto & Web3', blurb: 'Exchanges and on-chain products — security, volatility, and 24/7 operations.' },
  'ai-lab': { id: 'ai-lab', label: 'AI Labs', blurb: 'Frontier and applied AI — research depth, ML systems, and mission.' },
  'dev-infra': { id: 'dev-infra', label: 'Dev Tools & Infra', blurb: 'Developer tools, databases, and cloud infra — deep systems and reliability.' },
  'enterprise-saas': { id: 'enterprise-saas', label: 'Enterprise SaaS', blurb: 'B2B software — customer focus, product sense, and cross-functional work.' },
  cybersecurity: { id: 'cybersecurity', label: 'Cybersecurity', blurb: 'Security vendors — adversarial thinking and threat modeling.' },
  consumer: { id: 'consumer', label: 'Consumer & Media', blurb: 'Consumer apps and media — product intuition, growth, and user empathy.' },
  marketplace: { id: 'marketplace', label: 'Marketplace & Commerce', blurb: 'Marketplaces, gig, travel, and commerce — two-sided dynamics and ops.' },
  gaming: { id: 'gaming', label: 'Gaming', blurb: 'Game studios and engines — real-time performance and player craft.' },
  hardware: { id: 'hardware', label: 'Hardware & Semiconductors', blurb: 'Chips and devices — first-principles systems at the HW/SW boundary.' },
  'deep-tech': { id: 'deep-tech', label: 'Deep Tech & Defense', blurb: 'Aerospace, defense, and gov — mission, first-principles, and hard reliability.' },
  healthcare: { id: 'healthcare', label: 'Healthcare & Bio', blurb: 'Clinical and health tech — human stakes, privacy, and correctness.' },
};

export const COMPANY_CATEGORIES: CompanyCategory[] = Object.keys(COMPANY_CATEGORY_META) as CompanyCategory[];

/**
 * Slug -> category. Covers all bundled interview guides (each mapped exactly
 * once). Sourced from data/quest-category-banks.json. Unmapped slugs fall
 * through to inferCategoryFromText().
 */
export const COMPANY_CATEGORY: Record<string, CompanyCategory> =
  categoryData.companyCategory as Record<string, CompanyCategory>;

/**
 * Category-tailored question banks for the rounds guides rarely carry: the
 * recruiter screen, the values round, and the final round. Each stage is split
 * into easy/medium/hard tiers; `{company}` is replaced at read time. Screening
 * is intentionally light across all tiers (rapport, not deep technical).
 * Sourced from JSON.
 */
const CATEGORY_QUESTION_BANKS =
  categoryData.questionBanks as Record<CompanyCategory, Record<CategoryStageKind, CategoryStageBank>>;

/**
 * Map a company's 1-10 difficulty rating to a tier, mirroring the coding round
 * (>=8 hard, >=6 medium, else easy). Unrated companies default to easy.
 */
export const resolveQuestDifficulty = (rating: number | null | undefined): QuestDifficulty => {
  const r = rating ?? 5;
  return r >= 8 ? 'hard' : r >= 6 ? 'medium' : 'easy';
};

/**
 * Preferred system-design pattern ids per category, most-relevant first.
 * Ids match SYSTEM_DESIGN_PATTERNS in companyQuests.ts. Sourced from JSON.
 */
export const CATEGORY_SYSTEM_DESIGN_ORDER =
  categoryData.systemDesignOrder as Record<CompanyCategory, string[]>;

/** Default when a slug isn't mapped and no keyword hint matches. */
export const DEFAULT_COMPANY_CATEGORY: CompanyCategory = 'enterprise-saas';

/**
 * Keyword -> category rules for guides not present in COMPANY_CATEGORY (new
 * companies added after this map was generated). Ordered by specificity:
 * the first rule whose keyword appears in the search text wins.
 */
const CATEGORY_KEYWORD_RULES: Array<{ category: CompanyCategory; keywords: string[] }> = [
  { category: 'quant-trading', keywords: ['trading', 'hedge fund', 'quant', 'market maker', 'market making', 'prop shop', 'proprietary trading', 'capital management'] },
  { category: 'crypto', keywords: ['crypto', 'blockchain', 'web3', 'bitcoin', 'ethereum', 'on-chain', 'exchange token', 'defi'] },
  { category: 'finance', keywords: ['bank', 'securities', 'asset management', 'investment management', 'wealth management', 'brokerage', 'insurance'] },
  { category: 'fintech', keywords: ['payments', 'payment', 'fintech', 'lending', 'neobank', 'card issuing', 'money movement', 'payroll', 'invoicing', 'billing'] },
  { category: 'cybersecurity', keywords: ['security', 'cybersecurity', 'threat', 'endpoint protection', 'siem', 'vulnerability', 'zero trust', 'antivirus'] },
  { category: 'ai-lab', keywords: ['ai lab', 'foundation model', 'frontier model', 'llm', 'generative ai', 'machine learning research', 'agi', 'inference api', 'model training'] },
  { category: 'gaming', keywords: ['game studio', 'gaming', 'video game', 'game engine', 'multiplayer', 'esports'] },
  { category: 'hardware', keywords: ['semiconductor', 'chip', 'silicon', 'gpu', 'processor', 'hardware', 'electronics', 'device manufacturer'] },
  { category: 'deep-tech', keywords: ['aerospace', 'defense', 'space', 'rocket', 'satellite', 'autonomy', 'national security', 'government contractor'] },
  { category: 'healthcare', keywords: ['healthcare', 'health tech', 'clinical', 'patient', 'medical', 'biotech', 'genomics', 'pharma', 'ehr'] },
  { category: 'marketplace', keywords: ['marketplace', 'e-commerce', 'ecommerce', 'ride-hailing', 'ride sharing', 'delivery', 'travel booking', 'real estate', 'gig'] },
  { category: 'dev-infra', keywords: ['developer tools', 'devtools', 'infrastructure', 'database', 'observability', 'cloud platform', 'open source', 'ci/cd', 'kubernetes', 'data pipeline', 'vector database'] },
  { category: 'consumer', keywords: ['social network', 'consumer app', 'streaming', 'creator', 'newsletter', 'dating', 'entertainment', 'edtech', 'wellness', 'fitness app'] },
  { category: 'enterprise-saas', keywords: ['saas', 'b2b', 'crm', 'productivity', 'collaboration', 'workflow', 'enterprise software'] },
];

const norm = (value: string): string => value.toLowerCase();

/**
 * Best-effort category for an unmapped guide, using name/slug/topic text.
 * Returns DEFAULT_COMPANY_CATEGORY when nothing matches.
 */
export const inferCategoryFromText = (text: string): CompanyCategory => {
  const haystack = norm(text);
  for (const rule of CATEGORY_KEYWORD_RULES) {
    if (rule.keywords.some((kw) => haystack.includes(kw))) return rule.category;
  }
  return DEFAULT_COMPANY_CATEGORY;
};

export interface CategoryLookupSignal {
  slug?: string;
  company?: string;
  /** Extra free text (topics, stages, tips) to help the keyword fallback. */
  hintText?: string;
}

/**
 * Resolve a company to its category. Uses the explicit slug map first, then
 * falls back to keyword inference over the company name + hint text.
 */
export const getCompanyCategory = (signal: CategoryLookupSignal): CompanyCategory => {
  if (signal.slug && COMPANY_CATEGORY[signal.slug]) return COMPANY_CATEGORY[signal.slug];
  const text = [signal.company ?? '', signal.slug ?? '', signal.hintText ?? ''].join(' ');
  return inferCategoryFromText(text);
};

/** Tier order to draw from, given a requested difficulty (chosen tier first). */
const TIER_FALLBACK: Record<QuestDifficulty, QuestDifficulty[]> = {
  easy: ['easy', 'medium', 'hard'],
  medium: ['medium', 'easy', 'hard'],
  hard: ['hard', 'medium', 'easy'],
};

/**
 * Category-tailored questions for one stage at a difficulty, with `{company}`
 * substituted. The requested tier leads; the other tiers follow as backfill so
 * callers that take the top N still get a full pool. Returns [] for stages
 * without a category bank (coding, behavioral, system_design).
 */
export const getCategoryStageQuestions = (
  company: string,
  category: CompanyCategory,
  stage: CategoryStageKind,
  difficulty: QuestDifficulty = 'easy',
): string[] => {
  const bank = CATEGORY_QUESTION_BANKS[category]?.[stage];
  if (!bank) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tier of TIER_FALLBACK[difficulty]) {
    for (const raw of bank[tier] ?? []) {
      const q = raw.replace(/\{company\}/g, company);
      if (!seen.has(q)) { seen.add(q); out.push(q); }
    }
  }
  return out;
};

/** True when a quest stage kind has a category bank. */
export const isCategoryStageKind = (stage: string): stage is CategoryStageKind =>
  stage === 'screening' || stage === 'behavioral' || stage === 'values' || stage === 'final';
