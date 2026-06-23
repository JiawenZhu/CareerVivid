export type TranslationMimeType = 'text/html' | 'text/plain';

interface ProtectedTranslationText {
  content: string;
  terms: string[];
}

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const TERMS_TO_PRESERVE = [
  'Google Cloud Platform',
  'Amazon Web Services',
  'Firebase Cloud Functions',
  'Google Cloud Functions',
  'Cloud Functions',
  'Cloud Function',
  'Firebase Hosting',
  'Cloud Scheduler',
  'Secret Manager',
  'Google Secret Manager',
  'Google Workspace',
  'Microsoft Office',
  'Microsoft Excel',
  'Google Analytics',
  'Google Search Console',
  'Firebase Auth',
  'Chrome Extension',
  'iOS App Clip',
  'Chrome extension',
  'RESTful APIs',
  'RESTful API',
  'REST APIs',
  'REST API',
  'Reddit API',
  'GraphQL',
  'WebSocket',
  'WebRTC',
  'PostgreSQL',
  'MongoDB',
  'BigQuery',
  'Snowflake',
  'Databricks',
  'Tableau',
  'Power BI',
  'Looker',
  'Redis',
  'Elasticsearch',
  'Kafka',
  'RabbitMQ',
  'Firestore',
  'Firebase',
  'Supabase',
  'PlanetScale',
  'Stripe',
  'PayPal',
  'OpenAI',
  'OpenAI API key',
  'OpenAI API Key',
  'Anthropic',
  'Gemini API Key',
  'Gemini API key',
  'Gemini API',
  'Gemini',
  'Vertex AI',
  'Claude',
  'ChatGPT',
  'Tailwind CSS',
  'HTML/CSS',
  'Vite',
  'Playwright',
  'CareerVivid',
  'LinkedIn',
  'GitHub',
  'GitLab',
  'Bitbucket',
  'WordPress',
  'Shopify',
  'Webflow',
  'Notion',
  'Slack',
  'HubSpot',
  'Airtable',
  'Zapier',
  'ChromeOS',
  'TypeScript',
  'JavaScript',
  'Kubernetes',
  'ServiceNow',
  'Salesforce',
  'Next.js',
  'Node.js',
  'Express.js',
  'React Native',
  'macOS',
  'Windows',
  'Linux',
  'Android',
  'React',
  'Vue',
  'Svelte',
  'Docker',
  'Python',
  'Java',
  'C++',
  'C#',
  'Ruby',
  'Golang',
  'Swift',
  'Kotlin',
  'Figma',
  'Jira',
  'Azure',
  'AWS',
  'GCP',
  'Google Docs',
  'LLM',
  'SDK',
  'CLI',
  'SSO',
  'SAML',
  'OAuth',
  'OAuth 2.0',
  'JWT',
  'API key',
  'API Key',
  'API',
  'HTTP',
  'HTTPS',
  'URL',
  'URI',
  'JSON',
  'CSV',
  'PDF',
  'DOCX',
  'TXT',
  'Markdown',
  'Email',
  'e-mail',
  'npm',
  'npm install',
  'npm run build',
  'npm run build:vite',
  'firebase deploy',
  'firebase deploy --only hosting',
  'cv publish',
  'cv preview',
  'cv import',
  'SQL',
  'NoSQL',
  'HTML',
  'CSS',
  'WLAN',
  'LAN',
  'Wi-Fi',
  'VPN',
  'IAM',
  'CI/CD',
  'SLA',
  'SLO',
  'KPI',
  'OKR',
  'ATS',
  'UI/UX',
  'NFC',
  'NFC Tap Tags',
  'NFC Tap Tag',
  'QR code',
  'QR',
  'Tap Tag',
  'App Clip',
  'iOS',
];

const uniqueTermsToPreserve = Array.from(new Set(TERMS_TO_PRESERVE))
  .sort((a, b) => b.length - a.length || a.localeCompare(b));

const protectedTermPattern = new RegExp(
  `(^|[^A-Za-z0-9])(${uniqueTermsToPreserve.map(escapeRegExp).join('|')})(?=$|[^A-Za-z0-9])`,
  'g',
);

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const createProtectedToken = (term: string, index: number, mimeType: TranslationMimeType): string => {
  if (mimeType === 'text/html') {
    return `<span translate="no" class="notranslate" data-cv-term="${index}">${escapeHtml(term)}</span>`;
  }

  return `__CVVID_TERM_${index}__`;
};

export const protectNaturalTranslationTerms = (
  value: string,
  mimeType: TranslationMimeType,
): ProtectedTranslationText => {
  const terms: string[] = [];
  const content = value.replace(protectedTermPattern, (_match, prefix: string, matchedTerm: string) => {
    const index = terms.push(matchedTerm) - 1;
    return `${prefix}${createProtectedToken(matchedTerm, index, mimeType)}`;
  });

  return { content, terms };
};

export const restoreNaturalTranslationTerms = (
  value: string,
  protectedText: ProtectedTranslationText,
): string => {
  let output = value;

  protectedText.terms.forEach((term, index) => {
    const htmlTokenPattern = new RegExp(
      `<span\\b[^>]*data-cv-term=["']${index}["'][^>]*>.*?<\\/span>`,
      'gis',
    );
    const plainTokenPattern = new RegExp(`__\\s*CVVID[_\\s-]*TERM[_\\s-]*${index}\\s*__`, 'gi');

    output = output
      .replace(htmlTokenPattern, term)
      .replace(plainTokenPattern, term);
  });

  return output;
};
