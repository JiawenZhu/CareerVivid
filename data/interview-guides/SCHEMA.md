# Interview Guides — Firestore Schema

## Collections

### `interviewGuides/{slug}`

One document per company. `slug` matches the filename (e.g., `google`, `amazon`).

```
{
  company: string,          // Display name, e.g. "Google"
  slug: string,             // URL slug, e.g. "google"
  url: string,              // Source URL
  scrapedAt: string,        // ISO timestamp of last scrape
  updatedAt: Timestamp,     // Firestore server timestamp
  difficulty: number | null, // 1–10 difficulty rating when available

  interviewStages: string[],    // e.g. ["Phone Screen (45 min)", "Onsite (4–5 rounds)"]
  codingTopics: string[],        // e.g. ["Arrays and Strings: two-pointer, sliding window"]
  systemDesignTopics: string[], // e.g. ["Design a URL shortener"]
  behavioralTopics: string[],   // e.g. ["Leadership Principles", "STAR stories"]
  tips: string[],                // Preparation tips from the guide
  compensation: string[] | null, // Compensation notes when available
}
```

### `interviewGuides/{slug}/questions/{auto-id}`

Individual questions as a subcollection. Enables efficient querying by type/company.

```
{
  text: string,      // The question text
  type: string,      // "coding" | "behavioral" | "system_design" | "values" | "other"
  company: string,   // Display name
  slug: string,      // Company slug (redundant but useful for cross-collection queries)
  difficulty: number | null,
  source: string,    // Source URL
  createdAt: Timestamp,
}
```

## Indexes needed (firestore.indexes.json additions)

```json
{
  "collectionGroup": "questions",
  "queryScope": "COLLECTION_GROUP",
  "fields": [
    { "fieldPath": "slug", "order": "ASCENDING" },
    { "fieldPath": "type", "order": "ASCENDING" }
  ]
}
```

## Usage in Mock Interview Agent

```typescript
// Get a company guide
const guide = await db.collection('interviewGuides').doc(slug).get();

// Get N random questions of a given type for a company
const questions = await db
  .collection('interviewGuides')
  .doc(slug)
  .collection('questions')
  .where('type', '==', 'behavioral')
  .limit(5)
  .get();

// Cross-company question search (requires collection group index)
const codingQs = await db
  .collectionGroup('questions')
  .where('type', '==', 'coding')
  .limit(10)
  .get();
```

## Agent Context Format

When the mock interview agent generates a session for a company,
it receives a context object like:

```json
{
  "company": "Amazon",
  "slug": "amazon",
  "difficulty": 7.5,
  "interviewStages": ["OA (90 min)", "Phone Screen", "Onsite (5–6 rounds)"],
  "codingTopics": ["Arrays/Strings", "Trees", "Graphs", "DP"],
  "behavioralTopics": ["16 Leadership Principles", "Bar Raiser"],
  "systemDesignTopics": ["E-commerce systems", "Recommendation engines"],
  "sampleQuestions": {
    "behavioral": ["Tell me about a time you disagreed with your manager..."],
    "systemDesign": ["Design Amazon's inventory management system..."]
  },
  "tips": ["Prepare 15-20 STAR stories", "Map each to an LP"]
}
```
