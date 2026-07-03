/**
 * Scrapes interview guides from techinterview.org and stores structured JSON per company.
 * Output: data/interview-guides/{slug}.json
 *
 * Usage: node scripts/scrape-interview-guides.mjs [--company slug] [--all] [--resume]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'interview-guides');
const INDEX_FILE = path.join(OUTPUT_DIR, '_index.json');
const DELAY_MS = 1500; // be respectful — 1.5s between requests

// All 323 companies mapped: display name -> slug
const COMPANIES = {
  // Big Tech
  'Adobe': 'adobe',
  'Amazon': 'amazon',
  'Apple': 'apple',
  'Cisco': 'cisco',
  'Google': 'google',
  'Meta': 'meta-facebook',
  'Microsoft': 'microsoft',
  'Netflix': 'netflix',
  'Oracle': 'oracle-interview',
  'Salesforce': 'salesforce',
  'SAP': 'sap',
  'ServiceNow': 'servicenow',

  // AI Labs
  'Anthropic': 'anthropic',
  'Anyscale': 'anyscale-interview-guide',
  'Black Forest Labs': 'black-forest-labs-interview-guide',
  'Character.AI': 'character-ai-interview-guide',
  'Cohere': 'cohere',
  'Cursor': 'cursor',
  'Decagon': 'decagon-interview-guide',
  'Deepgram': 'deepgram-interview-guide',
  'ElevenLabs': 'elevenlabs-interview-guide',
  'Fireworks AI': 'fireworks-ai',
  'Glean': 'glean-interview-guide',
  'Harvey': 'harvey-interview-guide',
  'Hippocratic AI': 'hippocratic-ai-interview-guide',
  'Hugging Face': 'hugging-face-interview-guide',
  'Lambda Labs': 'lambda-labs-interview-guide',
  'LangChain': 'langchain',
  'LlamaIndex': 'llamaindex-interview-guide',
  'Mistral AI': 'mistral-ai-interview-guide',
  'Modal': 'modal',
  'MotherDuck': 'motherduck',
  'OpenAI': 'openai',
  'Perplexity': 'perplexity',
  'Pika Labs': 'pika-labs-interview-guide',
  'Pinecone': 'pinecone-interview-guide',
  'Qdrant': 'qdrant-interview-guide',
  'Reka AI': 'reka-ai-interview-guide',
  'Replicate': 'replicate',
  'Runway': 'runway-interview-guide',
  'Sakana AI': 'sakana-ai-interview-guide',
  'Scale AI': 'scale-ai',
  'Sierra': 'sierra-interview-guide',
  'Stability AI': 'stability-ai-interview-guide',
  'Suno': 'suno-interview-guide',
  'Tempus AI': 'tempus-ai-interview-guide',
  'Together AI': 'together-ai',
  'Turso': 'turso',
  'Weaviate': 'weaviate-interview-guide',
  'xAI': 'xai',

  // Fintech
  'Adyen': 'adyen-interview-guide',
  'Affirm': 'affirm-interview-guide',
  'Akuna Capital': 'akuna-capital-interview-guide',
  'American Express': 'american-express-interview-guide',
  'AQR Capital Management': 'aqr-capital-management-interview-guide',
  'Bank of America': 'bank-of-america-bofa-securities-interview-guide',
  'BlackRock': 'blackrock-interview-guide',
  'Block': 'block',
  'Bloomberg': 'bloomberg',
  'Brex': 'brex',
  'Bridgewater Associates': 'bridgewater-associates-interview-guide',
  'Capital One': 'capital-one-interview-guide',
  'Carta': 'carta-interview-guide',
  'Chime': 'chime',
  'Circle/Ripple/Chainalysis': 'crypto-trio-circle-ripple-chainalysis-interview-guide',
  'Citadel Hedge Fund': 'citadel-hedge-fund-interview-guide',
  'Citadel Securities': 'citadel-securities',
  'Citi': 'citi-interview-guide',
  'Coinbase': 'coinbase',
  'D. E. Shaw': 'de-shaw',
  'Deel': 'deel',
  'Deutsche Bank': 'deutsche-bank-interview-guide',
  'DRW': 'drw-interview-guide',
  'Evercore': 'evercore-interview-guide',
  'Fidelity Investments': 'fidelity-investments-interview-guide',
  'Flow Traders': 'flow-traders-interview-guide',
  'Galaxy Digital': 'galaxy-digital-interview-guide',
  'Goldman Sachs': 'goldman-sachs-strats-engineering-interview-guide',
  'Gusto': 'gusto-interview-guide',
  'Hudson River Trading': 'hudson-river-trading',
  'IMC Trading': 'imc-trading-interview-guide',
  'Jane Street': 'jane-street',
  'JPMorgan Chase': 'jpmorgan-tech-quant-interview-guide',
  'Jump Trading': 'jump-trading',
  'Klarna': 'klarna-interview-guide',
  'Kraken': 'kraken-interview-guide',
  'Lazard': 'lazard-interview-guide',
  'Man Group': 'man-group-interview-guide',
  'Marqeta': 'marqeta-interview-guide',
  'Mercury': 'mercury',
  'Millennium Management': 'millennium-management-interview-guide',
  'Morgan Stanley': 'morgan-stanley-tech-quant-interview-guide',
  'Optiver': 'optiver-interview-guide',
  'PayPal': 'paypal',
  'Plaid': 'plaid',
  'Point72': 'point72-interview-guide',
  'Ramp': 'ramp',
  'Renaissance Technologies': 'renaissance-technologies-interview-guide',
  'Robinhood': 'robinhood',
  'SIG Susquehanna': 'sig-susquehanna-interview-guide',
  'SoFi': 'sofi-interview-guide',
  'State Street': 'state-street-interview-guide',
  'Stripe': 'stripe',
  'Tower Research Capital': 'tower-research-capital-interview-guide',
  'Two Sigma': 'two-sigma',
  'UBS': 'ubs-interview-guide',
  'Vanguard': 'vanguard-interview-guide',
  'Virtu Financial': 'virtu-financial-interview-guide',
  'Wealthfront': 'wealthfront',
  'Wells Fargo': 'wells-fargo-interview-guide',
  'Wintermute': 'wintermute-interview-guide',
  'Wise': 'wise-interview-guide',
  'XTX Markets': 'xtx-markets-interview-guide',

  // Hardware
  'AMD': 'amd-interview-guide',
  'Anduril': 'anduril-interview-guide',
  'Apple Silicon': 'apple-silicon-team-interview-guide',
  'Blue Origin': 'blue-origin-interview-guide',
  'Broadcom': 'broadcom-interview-guide',
  'Defense Primes': 'defense-primes-lockheed-northrop-raytheon-interview-guide',
  'Intel': 'intel-interview-guide',
  'Nvidia': 'nvidia',
  'Qualcomm': 'qualcomm-interview-guide',
  'Samsung': 'samsung-electronics-interview-guide',
  'Sony': 'sony-interview-guide',
  'SpaceX': 'spacex-interview-guide',
  'Tesla': 'tesla',

  // Mid-tier
  '1Password': '1password-interview-guide',
  '23andMe': '23andme-interview-guide',
  'Airbnb': 'airbnb',
  'Airbyte': 'airbyte-interview-guide',
  'Airtable': 'airtable-interview-guide',
  'Akamai': 'akamai-interview-guide',
  'Algolia': 'algolia-interview-guide',
  'Alibaba': 'alibaba-interview-guide',
  'Amplitude': 'amplitude-interview-guide',
  'Apollo.io': 'apollo-io-interview-guide',
  'AppLovin': 'applovin-interview-guide',
  'Asana': 'asana',
  'Astronomer': 'astronomer-interview-guide',
  'Atlassian': 'atlassian',
  'Beehiiv': 'beehiiv-interview-guide',
  'BigCommerce': 'bigcommerce-interview-guide',
  'Blizzard/Activision': 'blizzard-activision-interview-guide',
  'Bluesky': 'bluesky-interview-guide',
  'Booking.com': 'booking-com-interview-guide',
  'Box': 'box-interview-guide',
  'Braze': 'braze-interview-guide',
  'Bumble': 'bumble-interview-guide',
  'ByteDance/TikTok': 'bytedance-tiktok-interview-guide',
  'Calm': 'calm-interview-guide',
  'Canva': 'canva',
  'CarGurus': 'cargurus-interview-guide',
  'Carvana': 'carvana-interview-guide',
  'Chronosphere': 'chronosphere-interview-guide',
  'CircleCI': 'circleci-interview-guide',
  'Clerk': 'clerk-interview-guide',
  'ClickHouse': 'clickhouse-interview-guide',
  'ClickUp': 'clickup-interview-guide',
  'Cloudera': 'cloudera-interview-guide',
  'Cloudflare': 'cloudflare',
  'Cockroach Labs': 'cockroach-labs-interview-guide',
  'Coda': 'coda-interview-guide',
  'Codecademy': 'codecademy-interview-guide',
  'CodeSandbox': 'codesandbox-interview-guide',
  'Confluent': 'confluent-interview-guide',
  'ConvertKit': 'convertkit-interview-guide',
  'CoreWeave': 'coreweave-interview-guide',
  'Coursera': 'coursera-interview-guide',
  'Credit Karma': 'credit-karma-interview-guide',
  'Cribl': 'cribl-interview-guide',
  'CrowdStrike': 'crowdstrike-interview-guide',
  'Databricks': 'databricks',
  'Datadog': 'datadog',
  'DataStax': 'datastax-interview-guide',
  'dbt Labs': 'dbt-labs-interview-guide',
  'Discord': 'discord',
  'DocuSign': 'docusign',
  'Doppler': 'doppler-interview-guide',
  'Drata': 'drata-interview-guide',
  'Dropbox': 'dropbox-interview-guide',
  'DuckDB Labs': 'duckdb-labs-interview-guide',
  'Duolingo': 'duolingo-interview-guide',
  'Elastic': 'elastic-interview-guide',
  'Electronic Arts': 'electronic-arts-ea-interview-guide',
  'Epic Games': 'epic-games-interview-guide',
  'Epic Systems': 'epic-systems-interview-guide',
  'Etsy': 'etsy-interview-guide',
  'Eventbrite': 'eventbrite-interview-guide',
  'Faire': 'faire-interview-guide',
  'Fastly': 'fastly-interview-guide',
  'Figma': 'figma',
  'Five9': 'five9-interview-guide',
  'Fivetran': 'fivetran-interview-guide',
  'Fly.io': 'fly-io-interview-guide',
  'Framer': 'framer-interview-guide',
  'Gainsight': 'gainsight-interview-guide',
  'GitLab': 'gitlab',
  'Glassdoor': 'glassdoor-interview-guide',
  'Gong': 'gong-interview-guide',
  'Grab': 'grab-interview-guide',
  'Grafana Labs': 'grafana-labs-interview-guide',
  'Greenhouse': 'greenhouse-interview-guide',
  'Grubhub': 'grubhub-interview-guide',
  'HackerRank': 'hackerrank-interview-guide',
  'HashiCorp': 'hashicorp',
  'Headspace': 'headspace-interview-guide',
  'Heroku': 'heroku-interview-guide',
  'Hex': 'hex',
  'Hightouch': 'hightouch-interview-guide',
  'Honeycomb': 'honeycomb-interview-guide',
  'Hopper': 'hopper-interview-guide',
  'HubSpot': 'hubspot',
  'Indeed': 'indeed-interview-guide',
  'Instacart': 'instacart-interview-guide',
  'Intercom': 'intercom-interview-guide',
  'Iterable': 'iterable-interview-guide',
  'JetBrains': 'jetbrains-interview-guide',
  'Klaviyo': 'klaviyo-interview-guide',
  'Lattice': 'lattice-interview-guide',
  'LaunchDarkly': 'launchdarkly-interview-guide',
  'LeetCode': 'leetcode-interview-guide',
  'Lightspeed Commerce': 'lightspeed-interview-guide',
  'Linear': 'linear',
  'LinkedIn': 'linkedin',
  'Lyft': 'lyft-interview-guide',
  'Mailchimp': 'mailchimp-interview-guide',
  'Match Group': 'match-group-interview-guide',
  'Materialize': 'materialize-interview-guide',
  'Medium': 'medium-interview-guide',
  'Mixpanel': 'mixpanel-interview-guide',
  'Monday.com': 'monday-com-interview-guide',
  'MongoDB': 'mongodb',
  'Neon': 'neon',
  'New Relic': 'new-relic-interview-guide',
  'Niantic': 'niantic-interview-guide',
  'Notion': 'notion',
  'Okta': 'okta-interview-guide',
  'Opendoor': 'opendoor-interview-guide',
  'Orca Security': 'orca-security-interview-guide',
  'Outreach': 'outreach-interview-guide',
  'PagerDuty': 'pagerduty-interview-guide',
  'Palantir': 'palantir',
  'Palo Alto Networks': 'palo-alto-networks-interview-guide',
  'Patreon': 'patreon-interview-guide',
  'Peloton': 'peloton-interview-guide',
  'Pendo': 'pendo-interview-guide',
  'Pinterest': 'pinterest-interview',
  'PlanetScale': 'planetscale',
  'PostHog': 'posthog-interview-guide',
  'Postman': 'postman',
  'Procore': 'procore-interview-guide',
  'Pulumi': 'pulumi-interview-guide',
  'Quora': 'quora-interview-guide',
  'Rapid7': 'rapid7-interview-guide',
  'Reddit': 'reddit-interview',
  'Redfin': 'redfin-interview-guide',
  'Render': 'render-interview-guide',
  'Replit': 'replit-interview-guide',
  'Resend': 'resend-interview-guide',
  'Retool': 'retool',
  'RingCentral': 'ringcentral-interview-guide',
  'Riot Games': 'riot-games-interview-guide',
  'Rippling': 'rippling',
  'Roblox': 'roblox',
  'Rubrik': 'rubrik-interview-guide',
  'RunPod': 'runpod-interview-guide',
  'Salesloft': 'salesloft-interview-guide',
  'SentinelOne': 'sentinelone-interview-guide',
  'Sentry': 'sentry-interview-guide',
  'Shopify': 'shopify',
  'SingleStore': 'singlestore-interview-guide',
  'Skyscanner': 'skyscanner-interview-guide',
  'Smartsheet': 'smartsheet-interview-guide',
  'Snap': 'snap',
  'Snowflake': 'snowflake',
  'Snyk': 'snyk-interview-guide',
  'SoundCloud': 'soundcloud-interview-guide',
  'Sourcegraph': 'sourcegraph',
  'Splunk': 'splunk-interview-guide',
  'Spotify': 'spotify',
  'Squarespace': 'squarespace-interview-guide',
  'Substack': 'substack-interview-guide',
  'Supabase': 'supabase',
  'Sysdig': 'sysdig-interview-guide',
  'Tailscale': 'tailscale',
  'Temporal': 'temporal-interview-guide',
  'Toast': 'toast-interview-guide',
  'Twilio': 'twilio-interview-guide',
  'Uber': 'uber',
  'Unity': 'unity-interview-guide',
  'Vercel': 'vercel',
  'Veeva Systems': 'veeva-systems-interview-guide',
  'Webflow': 'webflow-interview-guide',
  'WorkOS': 'workos-interview-guide',
  'Workday': 'workday',
  'Yelp': 'yelp-interview-guide',
  'Zendesk': 'zendesk-interview-guide',
  'Zillow': 'zillow-interview-guide',
  'Zoom': 'zoom',
  'ZoomInfo': 'zoominfo-interview-guide',
  'Zscaler': 'zscaler-interview-guide',
};

const BASE_URL = 'https://www.techinterview.org/companies';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Classify a heading line into a section type.
 */
function classifyHeading(heading) {
  const h = heading.toLowerCase().replace(/:$/, '').trim();
  if (h.match(/interview process|interview structure|what to expect|hiring process|interview stage|interview loop|interview format|interview overview|the process|how it works|process overview|interview rounds?|interview flow/)) return 'stages';
  if (h.match(/coding|algorithm|data structure|technical round|oa$|online assessment|leet|focus area|technical focus|technical skill|technical requirement|knowledge|programming/)) return 'coding';
  if (h.match(/system design|architecture|scalab|design interview|infrastructure/)) return 'systemDesign';
  if (h.match(/behavioral|leadership|culture|values?|culture fit|soft skill|amazon lp|bar raiser|people|team|collaboration/)) return 'behavioral';
  if (h.match(/tip|preparation|how to prepare|key to success|study|advice|strategy|recommendation|prepare|success|cheat|hack/)) return 'tips';
  if (h.match(/compensation|salary|pay|total comp|equity|bonus|offer|tc |level|band/)) return 'compensation';
  if (h.match(/common question|sample question|example question|practice question|question example|types? of question/)) return 'questions';
  return null;
}

/**
 * Classify a question string into a question type.
 */
function classifyQuestion(q, currentSection) {
  const lower = q.toLowerCase();
  // Must actually be question-form text to classify as question
  if (lower.match(/design a|design an|how would you design|build a system|architect a|how do you scale/)) return 'systemDesign';
  if (lower.match(/tell me about|describe a time|walk me through|give me an example|what did you do when|how did you handle|talk about a time|share an example/)) return 'behavioral';
  if (lower.match(/^(implement|write a function|code|find the|return the|given an? array|given an? string|given an? list)/)) return 'coding';
  if (lower.match(/value|mission|why do you want|what do you think about|how do you feel|what concerns|safety|ethics|why anthropic|why openai/)) return 'values';
  if (currentSection === 'systemDesign') return 'systemDesign';
  if (currentSection === 'behavioral') return 'behavioral';
  if (currentSection === 'coding') return 'coding';
  return 'other';
}

/**
 * Returns true if a bullet item looks like a topic descriptor, not a question.
 * e.g. "Arrays and Strings: Two-pointer techniques, sliding window"
 */
function isTopicDescriptor(text) {
  // Colon-separated "Topic: subtopics" pattern, not ending with ?
  return /^[A-Z][^.?!]+:\s+[A-Za-z]/.test(text) && !text.endsWith('?');
}

/**
 * Parse the raw text content from a company page into structured data.
 */
function parsePageContent(companyName, slug, rawText) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  const data = {
    company: companyName,
    slug,
    url: `${BASE_URL}/${slug}`,
    scrapedAt: new Date().toISOString(),
    interviewStages: [],
    codingTopics: [],
    systemDesignTopics: [],
    behavioralTopics: [],
    sampleQuestions: {
      coding: [],
      behavioral: [],
      systemDesign: [],
      values: [],
      other: [],
    },
    difficulty: null,
    tips: [],
    compensation: null,
    rawSummary: rawText.slice(0, 5000),
  };

  let currentSection = null;
  let questionMode = false;

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Detect difficulty rating anywhere in text
    const diffMatch = line.match(/(\d+(?:\.\d+)?)\s*\/\s*10/);
    if (diffMatch && (lower.includes('difficult') || lower.includes('rating') || lower.includes('hard'))) {
      data.difficulty = parseFloat(diffMatch[1]);
    }

    // Numbered section headers like "1. Networking Knowledge (Critical)" or "2. Algorithms"
    const numberedSection = line.match(/^\d+\.\s+([A-Z][^.?!]+)(?:\s*\([^)]*\))?$/);
    if (numberedSection) {
      const sectionType = classifyHeading(numberedSection[1]);
      if (sectionType) {
        currentSection = sectionType;
        questionMode = sectionType === 'questions';
        continue;
      }
    }

    // Bullet items (dash/number prefix) — processed separately below
    const isBullet = line.startsWith('- ') || line.startsWith('• ') || /^\d+\.\s/.test(line);

    // Heading lines: standalone short lines that don't start with bullet prefix
    const isHeading = !isBullet && line.length < 140 && !line.endsWith('?') && (
      classifyHeading(line) !== null
    );

    if (isHeading) {
      const sectionType = classifyHeading(line);
      if (sectionType) {
        currentSection = sectionType;
        questionMode = sectionType === 'questions';
        continue;
      }
    }

    // Verbatim questions (end with ?, or quoted) — but not topic descriptors
    const rawQ = line.replace(/^["*'`–-]+\s*/, '').replace(/["*'`]+$/, '').trim();
    const isQuestion = (line.endsWith('?') || (line.startsWith('"') && line.includes('?')))
      && rawQ.length > 15 && rawQ.length < 600
      && !isTopicDescriptor(rawQ);

    if (isQuestion) {
      const qType = classifyQuestion(rawQ, currentSection);
      if (!data.sampleQuestions[qType].includes(rawQ)) {
        data.sampleQuestions[qType].push(rawQ);
      }
      continue;
    }

    // Non-bullet stage lines like "Phone Screen (45 minutes):" or "Onsite (4-5 hours):"
    if (!isBullet && !isHeading && line.endsWith(':') && line.length < 120) {
      const stageMatch = line.match(/^(phone screen|onsite|virtual onsite|take.home|technical screen|coding round|system design|behavioral|bar raiser|recruiter|hiring manager|final round|round \d)/i);
      if (stageMatch) {
        const stageText = line.replace(/:$/, '');
        if (!data.interviewStages.includes(stageText)) data.interviewStages.push(stageText);
        currentSection = 'stages';
      }
    }

    // Bullet-point content
    if (isBullet) {
      const content = line.replace(/^[-•\d.]+\s*/, '').trim();
      if (!content || content.length < 5) continue;

      // If the bullet itself is a question, classify it
      if (content.endsWith('?') && content.length > 15) {
        const qType = classifyQuestion(content, currentSection);
        if (!data.sampleQuestions[qType].includes(content)) {
          data.sampleQuestions[qType].push(content);
        }
        continue;
      }

      switch (currentSection) {
        case 'stages':
          // Stage bullets often look like "Phone Screen (45 min): ..."
          if (content.length > 5 && !data.interviewStages.includes(content)) {
            data.interviewStages.push(content);
          }
          break;
        case 'coding':
          if (!data.codingTopics.includes(content)) data.codingTopics.push(content);
          break;
        case 'systemDesign':
          if (!data.systemDesignTopics.includes(content)) data.systemDesignTopics.push(content);
          break;
        case 'behavioral':
          if (!data.behavioralTopics.includes(content)) data.behavioralTopics.push(content);
          break;
        case 'tips':
          if (!data.tips.includes(content)) data.tips.push(content);
          break;
        case 'compensation':
          if (!data.compensation) data.compensation = [];
          if (!data.compensation.includes(content)) data.compensation.push(content);
          break;
        case 'questions':
          // Topic descriptor bullets under "common questions" → coding topics
          if (isTopicDescriptor(content)) {
            if (!data.codingTopics.includes(content)) data.codingTopics.push(content);
          } else {
            const qType = classifyQuestion(content, 'other');
            if (!data.sampleQuestions[qType].includes(content)) {
              data.sampleQuestions[qType].push(content);
            }
          }
          break;
        default:
          // Paragraph content that matches stage-like patterns
          if (content.match(/^(phone screen|onsite|virtual|technical|coding round|system design round|behavioral|bar raiser|take.home|hiring manager|recruiter screen|final round|interview round)/i)) {
            if (!data.interviewStages.includes(content)) data.interviewStages.push(content);
          }
      }
    }
  }

  return data;
}

async function fetchCompanyPage(slug) {
  const url = `${BASE_URL}/${slug}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  const html = await response.text();

  // Extract just the article/entry-content section to avoid nav/footer noise
  let content = html;
  const articleMatch = html.match(/<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*<\/article>/i)
    || html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
    || html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (articleMatch) content = articleMatch[0];

  // Convert HTML structure to readable text preserving hierarchy
  const text = content
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    // Headings → plain text with newline
    .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, '\n\n$1\n')
    // List items → bullet points
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n- $1')
    // Paragraphs → newlines
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    // Strip remaining tags
    .replace(/<[^>]+>/g, '')
    // Decode HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&hellip;/g, '...')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8216;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text;
}

async function scrapeCompany(companyName, slug) {
  const outputPath = path.join(OUTPUT_DIR, `${slug}.json`);

  // Skip if already scraped (resume mode)
  if (fs.existsSync(outputPath)) {
    const existing = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
    console.log(`  ⏭  ${companyName} already scraped (${existing.scrapedAt})`);
    return existing;
  }

  try {
    console.log(`  ⬇  Fetching ${companyName} (${slug})...`);
    const rawText = await fetchCompanyPage(slug);
    const data = parsePageContent(companyName, slug, rawText);

    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`  ✓  Saved ${companyName} → ${slug}.json (${data.interviewStages.length} stages, ${Object.values(data.sampleQuestions).flat().length} questions)`);
    return data;
  } catch (err) {
    console.error(`  ✗  Failed ${companyName}: ${err.message}`);
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const singleCompany = args.find((a, i) => args[i - 1] === '--company');
  const doAll = args.includes('--all') || !singleCompany;

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const toScrape = singleCompany
    ? Object.entries(COMPANIES).filter(([, slug]) => slug === singleCompany || singleCompany === slug)
    : Object.entries(COMPANIES);

  console.log(`\nScraping ${toScrape.length} companies → ${OUTPUT_DIR}\n`);

  const index = {};
  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const [companyName, slug] of toScrape) {
    const data = await scrapeCompany(companyName, slug);
    if (data) {
      index[slug] = {
        company: companyName,
        slug,
        scrapedAt: data.scrapedAt,
        stageCount: data.interviewStages.length,
        questionCount: Object.values(data.sampleQuestions).flat().length,
        difficulty: data.difficulty,
      };
      if (data.interviewStages.length > 0) success++;
      else skipped++;
    } else {
      failed++;
    }

    if (toScrape.length > 1) await sleep(DELAY_MS);
  }

  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));

  console.log(`\n✅ Done: ${success} scraped, ${skipped} skipped/empty, ${failed} failed`);
  console.log(`📁 Index written to ${INDEX_FILE}`);
}

main().catch(console.error);
