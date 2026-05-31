import { execFileSync } from 'node:child_process';

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'jastalk-firebase';
const databaseId = process.env.FIRESTORE_DATABASE_ID || '(default)';
const monthKey = new Date().toISOString().slice(0, 7);

const keyCollections = [
  'users',
  'feedback',
  'error_reports',
  'usage_logs',
  'jobApplications',
  'interviewSessions',
  'contact_messages',
  'community_posts',
  'public_portfolios',
  'whiteboards',
];

function getAccessToken() {
  if (process.env.GOOGLE_OAUTH_ACCESS_TOKEN) {
    return process.env.GOOGLE_OAUTH_ACCESS_TOKEN;
  }

  const configName = process.env.CAREERVIVID_PM_GCLOUD_CONFIG || 'careervivid-codex';
  return execFileSync('gcloud', ['auth', 'print-access-token', '--quiet'], {
    encoding: 'utf8',
    env: {
      ...process.env,
      CLOUDSDK_ACTIVE_CONFIG_NAME: configName,
    },
  }).trim();
}

const accessToken = getAccessToken();
const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${encodeURIComponent(databaseId)}/documents`;

async function firestorePost(path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Firestore REST ${response.status}: ${text}`);
  }

  return response.json();
}

function decodeValue(value) {
  if (!value || typeof value !== 'object') return null;
  if ('nullValue' in value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('booleanValue' in value) return Boolean(value.booleanValue);
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) {
    return (value.arrayValue.values || []).map(decodeValue);
  }
  if ('mapValue' in value) {
    return decodeFields(value.mapValue.fields || {});
  }
  return null;
}

function decodeFields(fields) {
  return Object.fromEntries(
    Object.entries(fields || {}).map(([key, value]) => [key, decodeValue(value)])
  );
}

function docIdFromName(name) {
  return String(name || '').split('/').pop();
}

async function countCollection(name) {
  const data = await firestorePost(':runAggregationQuery', {
    structuredAggregationQuery: {
      structuredQuery: {
        from: [{ collectionId: name }],
      },
      aggregations: [
        {
          alias: 'total',
          count: {},
        },
      ],
    },
  });

  const result = data.find((entry) => entry.result)?.result;
  return Number(result?.aggregateFields?.total?.integerValue || 0);
}

async function runCollectionQuery(name, options = {}) {
  const structuredQuery = {
    from: [{ collectionId: name }],
  };

  if (options.select?.length) {
    structuredQuery.select = {
      fields: options.select.map((fieldPath) => ({ fieldPath })),
    };
  }

  if (options.orderBy?.length) {
    structuredQuery.orderBy = options.orderBy;
  }

  if (options.limit) {
    structuredQuery.limit = options.limit;
  }

  const data = await firestorePost(':runQuery', { structuredQuery });

  return data
    .filter((entry) => entry.document)
    .map((entry) => ({
      id: docIdFromName(entry.document.name),
      data: decodeFields(entry.document.fields || {}),
    }));
}

function timestampMillis(value) {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

async function summarizeUsers() {
  const docs = await runCollectionQuery('users', {
    select: ['plan', 'subscriptionStatus', 'createdAt', 'creditsUsed'],
  });

  const plans = {};
  const subscriptionStatuses = {};
  let createdLast30Days = 0;
  let usedCreditsThisMonth = 0;
  const now = Date.now();

  for (const { data } of docs) {
    const plan = data.plan || 'unknown';
    plans[plan] = (plans[plan] || 0) + 1;

    const status = data.subscriptionStatus || 'unknown';
    subscriptionStatuses[status] = (subscriptionStatuses[status] || 0) + 1;

    const createdAt = timestampMillis(data.createdAt);
    if (createdAt && now - createdAt < 30 * 24 * 60 * 60 * 1000) {
      createdLast30Days += 1;
    }

    if ((data.creditsUsed?.[monthKey] || 0) > 0) {
      usedCreditsThisMonth += 1;
    }
  }

  return {
    total: docs.length,
    createdLast30Days,
    usedCreditsThisMonth,
    plans,
    subscriptionStatuses,
  };
}

async function recentFeedback() {
  const docs = await runCollectionQuery('feedback', {
    orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
    limit: 10,
  });

  return docs.map(({ id, data }) => ({
    id,
    createdAt: data.createdAt || null,
    rating: data.rating ?? null,
    source: data.source ?? null,
    status: data.status ?? null,
    hasMessage: Boolean(String(data.message || data.feedback || data.text || '').trim()),
  }));
}

async function recentErrors() {
  let docs;

  try {
    docs = await runCollectionQuery('error_reports', {
      orderBy: [{ field: { fieldPath: 'timestamp' }, direction: 'DESCENDING' }],
      limit: 10,
    });
  } catch {
    docs = await runCollectionQuery('error_reports', { limit: 10 });
  }

  return docs.map(({ id, data }) => {
    const message = String(data.message || data.error || '');
    return {
      id,
      timestamp: data.timestamp || data.createdAt || null,
      route: data.route || data.url || null,
      message: message.slice(0, 220),
    };
  });
}

const collectionCounts = {};
for (const name of keyCollections) {
  collectionCounts[name] = await countCollection(name);
}

const snapshot = {
  generatedAt: new Date().toISOString(),
  projectId,
  authMode: 'gcloud-service-account-impersonation',
  serviceAccount: process.env.CAREERVIVID_PM_SERVICE_ACCOUNT || 'careervivid-codex-pm-readonly@jastalk-firebase.iam.gserviceaccount.com',
  monthKey,
  collectionCounts,
  users: await summarizeUsers(),
  recentFeedback: await recentFeedback(),
  recentErrors: await recentErrors(),
};

console.log(JSON.stringify(snapshot, null, 2));
