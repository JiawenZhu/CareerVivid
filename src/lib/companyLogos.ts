/**
 * Real company logos for quest cards and showcases.
 *
 * Uses Google's public favicon service (no API key, generous limits, cached
 * by Google's CDN). Unknown companies fall back to a domain guess derived
 * from the guide slug; the <CompanyLogo> component falls back to an initial
 * letter if the image fails to load, so wrong guesses degrade gracefully.
 */

/** Companies whose domain can't be derived from the slug. Keys lowercase. */
const COMPANY_DOMAIN_OVERRIDES: Record<string, string> = {
    'meta-facebook': 'meta.com',
    'blizzard-activision': 'blizzard.com',
    'oracle-interview': 'oracle.com',
    'jane-street': 'janestreet.com',
    'scale-ai': 'scale.com',
    'character-ai': 'character.ai',
    'mistral-ai': 'mistral.ai',
    'x-ai': 'x.ai',
    'fireworks-ai': 'fireworks.ai',
    'pika-labs': 'pika.art',
    'hugging-face': 'huggingface.co',
    'lambda-labs': 'lambdalabs.com',
    'epic-games': 'epicgames.com',
    'jump-trading': 'jumptrading.com',
    'akuna-capital': 'akunacapital.com',
    'flow-traders': 'flowtraders.com',
    'imc': 'imc.com',
    'aqr': 'aqr.com',
    'black-forest-labs': 'blackforestlabs.ai',
    'grafana-labs': 'grafana.com',
    'cockroach-labs': 'cockroachlabs.com',
    'blue-origin': 'blueorigin.com',
    'capital-one': 'capitalone.com',
    'defense-primes': 'lockheedmartin.com',
    'apple-silicon-team': 'apple.com',
    '23andme': '23andme.com',
    '1password': '1password.com',
};

/** Normalize a guide slug: drop the "-interview-guide" suffix. */
const baseSlug = (slug: string): string => slug.replace(/-interview-guide$/, '');

export const getCompanyDomain = (slug: string): string => {
    const base = baseSlug(slug);
    if (COMPANY_DOMAIN_OVERRIDES[base]) return COMPANY_DOMAIN_OVERRIDES[base];
    // Most tech companies: strip hyphens → domain.com (jane-street handled above).
    return `${base.replace(/-/g, '')}.com`;
};

export const getCompanyLogoUrl = (slug: string, size: 32 | 64 | 128 = 64): string =>
    `https://www.google.com/s2/favicons?domain=${encodeURIComponent(getCompanyDomain(slug))}&sz=${size}`;
