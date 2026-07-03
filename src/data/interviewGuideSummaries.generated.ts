// Generated from data/interview-guides/*.json. Do not edit by hand.

export interface InterviewGuideSummary {
  company: string;
  slug: string;
  scrapedAt: string;
  stageCount: number;
  questionCount: number;
  tipCount: number;
  difficulty: number | null;
  topics: string[];
}

export const INTERVIEW_GUIDE_SUMMARIES: InterviewGuideSummary[] = [
  {
    "company": "1Password",
    "slug": "1password-interview-guide",
    "scrapedAt": "2026-07-02T07:19:47.982Z",
    "stageCount": 0,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "23andMe",
    "slug": "23andme-interview-guide",
    "scrapedAt": "2026-07-02T07:19:50.605Z",
    "stageCount": 12,
    "questionCount": 4,
    "tipCount": 0,
    "difficulty": null,
    "topics": [
      "Compute polygenic risk scores at scale. Given a million genotyped customers and a PRS model with thousands of weighted SNPs, compute scores efficiently. Discuss vectorization with NumPy/PyTorch, how to handle missing genotypes, and how to roll out new score versions without recomputing everything.",
      "Implement an ancestry inference pipeline. Local ancestry inference (which segments of a chromosome come from which population). Discuss reference panels, the role of statistical models like Hidden Markov Models, and the tension between resolution and confidence.",
      "Design a relative-finder. Identify likely cousins/half-siblings/etc among the user base by detecting shared chromosomal segments (IBD — identity by descent). Discuss the privacy implications and how the matching is opt-in."
    ]
  },
  {
    "company": "Adobe",
    "slug": "adobe",
    "scrapedAt": "2026-07-02T07:12:43.355Z",
    "stageCount": 2,
    "questionCount": 0,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Adyen",
    "slug": "adyen-interview-guide",
    "scrapedAt": "2026-07-02T07:16:23.502Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Affirm",
    "slug": "affirm-interview-guide",
    "scrapedAt": "2026-07-02T07:16:26.126Z",
    "stageCount": 4,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Airbnb",
    "slug": "airbnb",
    "scrapedAt": "2026-07-02T07:19:53.029Z",
    "stageCount": 5,
    "questionCount": 0,
    "tipCount": 5,
    "difficulty": null,
    "topics": [
      "Arrays/Strings: Manipulation, searching, optimization",
      "Trees: Binary trees, tree traversals, BST operations",
      "Graphs: BFS, DFS, shortest path"
    ]
  },
  {
    "company": "Airbyte",
    "slug": "airbyte-interview-guide",
    "scrapedAt": "2026-07-02T07:19:55.475Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Airtable",
    "slug": "airtable-interview-guide",
    "scrapedAt": "2026-07-02T07:19:57.963Z",
    "stageCount": 10,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": [
      "Design Airtable's flexible-schema table system.",
      "Design real-time sync for a 100K-row table edited by multiple users.",
      "Design Airtable's formula evaluation engine."
    ]
  },
  {
    "company": "Akamai",
    "slug": "akamai-interview-guide",
    "scrapedAt": "2026-07-02T07:20:00.619Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Akuna Capital",
    "slug": "akuna-capital-interview-guide",
    "scrapedAt": "2026-07-02T07:16:28.754Z",
    "stageCount": 0,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Algolia",
    "slug": "algolia-interview-guide",
    "scrapedAt": "2026-07-02T07:20:04.054Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Alibaba",
    "slug": "alibaba-interview-guide",
    "scrapedAt": "2026-07-02T07:20:06.857Z",
    "stageCount": 13,
    "questionCount": 5,
    "tipCount": 7,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Amazon",
    "slug": "amazon",
    "scrapedAt": "2026-07-02T07:32:23.517Z",
    "stageCount": 4,
    "questionCount": 0,
    "tipCount": 5,
    "difficulty": null,
    "topics": [
      "Arrays/Strings: Rotation, sliding window, substring problems",
      "Trees: Binary tree operations, BST validation, tree traversals",
      "Graphs: BFS, DFS, shortest path (Dijkstra's algorithm)"
    ]
  },
  {
    "company": "AMD",
    "slug": "amd-interview-guide",
    "scrapedAt": "2026-07-02T07:19:11.323Z",
    "stageCount": 4,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "American Express",
    "slug": "american-express-interview-guide",
    "scrapedAt": "2026-07-02T07:16:31.396Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Amplitude",
    "slug": "amplitude-interview-guide",
    "scrapedAt": "2026-07-02T07:20:09.823Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Anduril",
    "slug": "anduril-interview-guide",
    "scrapedAt": "2026-07-02T07:19:14.958Z",
    "stageCount": 4,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Anthropic",
    "slug": "anthropic",
    "scrapedAt": "2026-07-02T07:32:22.777Z",
    "stageCount": 6,
    "questionCount": 5,
    "tipCount": 10,
    "difficulty": 8.5,
    "topics": [
      "Implement a data structure with specified operations and tight complexity requirements (LRU cache, frequency counter, range tree)",
      "Parse and transform a structured stream (log lines, tokenized text, event stream)",
      "Graph / tree problems with a systems flavor (shortest path with edge weights, topological sort of dependency DAG)"
    ]
  },
  {
    "company": "Anyscale",
    "slug": "anyscale-interview-guide",
    "scrapedAt": "2026-07-02T07:13:16.738Z",
    "stageCount": 0,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Apollo.io",
    "slug": "apollo-io-interview-guide",
    "scrapedAt": "2026-07-02T07:20:12.800Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Apple Silicon",
    "slug": "apple-silicon-team-interview-guide",
    "scrapedAt": "2026-07-02T07:19:18.805Z",
    "stageCount": 12,
    "questionCount": 4,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Apple",
    "slug": "apple",
    "scrapedAt": "2026-07-02T07:12:48.547Z",
    "stageCount": 4,
    "questionCount": 1,
    "tipCount": 5,
    "difficulty": null,
    "topics": [
      "Arrays/Strings: Manipulation, searching, pattern matching",
      "Trees: Binary trees, BST operations, traversals",
      "Linked Lists: Manipulation, cycle detection, reversal"
    ]
  },
  {
    "company": "AppLovin",
    "slug": "applovin-interview-guide",
    "scrapedAt": "2026-07-02T07:20:15.733Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "AQR Capital Management",
    "slug": "aqr-capital-management-interview-guide",
    "scrapedAt": "2026-07-02T07:16:34.005Z",
    "stageCount": 5,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Asana",
    "slug": "asana",
    "scrapedAt": "2026-07-02T07:20:18.450Z",
    "stageCount": 3,
    "questionCount": 5,
    "tipCount": 11,
    "difficulty": 7.5,
    "topics": [
      "Model a state system with transitions (task with status, dependencies, rollup logic for parent / child completion)",
      "Incremental computation (given a base computation and a change to inputs, update only the minimum necessary outputs)",
      "Streaming / event processing (compute project statistics from an audit log)"
    ]
  },
  {
    "company": "Astronomer",
    "slug": "astronomer-interview-guide",
    "scrapedAt": "2026-07-02T07:20:21.042Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Atlassian",
    "slug": "atlassian",
    "scrapedAt": "2026-07-02T07:20:23.678Z",
    "stageCount": 2,
    "questionCount": 5,
    "tipCount": 11,
    "difficulty": 7,
    "topics": [
      "OO design: model a domain (e.g., booking system, permissions hierarchy, versioned document) with clean class design and tests",
      "Implement a specific data structure with Java-idiomatic API design (concurrent queue with specific semantics, LRU cache, rate limiter)",
      "Parse or transform data with correct handling of edge cases (invalid input, missing fields, unicode)"
    ]
  },
  {
    "company": "Bank of America",
    "slug": "bank-of-america-bofa-securities-interview-guide",
    "scrapedAt": "2026-07-02T07:16:36.672Z",
    "stageCount": 0,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Beehiiv",
    "slug": "beehiiv-interview-guide",
    "scrapedAt": "2026-07-02T07:20:26.255Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "BigCommerce",
    "slug": "bigcommerce-interview-guide",
    "scrapedAt": "2026-07-02T07:20:28.927Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Black Forest Labs",
    "slug": "black-forest-labs-interview-guide",
    "scrapedAt": "2026-07-02T07:13:19.293Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "BlackRock",
    "slug": "blackrock-interview-guide",
    "scrapedAt": "2026-07-02T07:16:39.414Z",
    "stageCount": 4,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Blizzard/Activision",
    "slug": "blizzard-activision-interview-guide",
    "scrapedAt": "2026-07-02T07:20:31.504Z",
    "stageCount": 17,
    "questionCount": 4,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Block",
    "slug": "block",
    "scrapedAt": "2026-07-02T07:16:41.905Z",
    "stageCount": 2,
    "questionCount": 5,
    "tipCount": 11,
    "difficulty": 7.5,
    "topics": [
      "Card authorization state machine with all failure paths (Square)",
      "Idempotent P2P transfer handler under at-least-once delivery (Cash App)",
      "Installment scheduling with customer-specific payment plans (Afterpay)"
    ]
  },
  {
    "company": "Bloomberg",
    "slug": "bloomberg",
    "scrapedAt": "2026-07-02T07:16:44.441Z",
    "stageCount": 3,
    "questionCount": 0,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Blue Origin",
    "slug": "blue-origin-interview-guide",
    "scrapedAt": "2026-07-02T07:19:23.174Z",
    "stageCount": 13,
    "questionCount": 4,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Bluesky",
    "slug": "bluesky-interview-guide",
    "scrapedAt": "2026-07-02T07:20:34.082Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Booking.com",
    "slug": "booking-com-interview-guide",
    "scrapedAt": "2026-07-02T07:20:37.421Z",
    "stageCount": 4,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Box",
    "slug": "box-interview-guide",
    "scrapedAt": "2026-07-02T07:20:40.112Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Braze",
    "slug": "braze-interview-guide",
    "scrapedAt": "2026-07-02T07:20:42.703Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Brex",
    "slug": "brex",
    "scrapedAt": "2026-07-02T07:16:47.190Z",
    "stageCount": 3,
    "questionCount": 5,
    "tipCount": 11,
    "difficulty": 7.5,
    "topics": [
      "Implement a payment-handler API endpoint with idempotency, retry safety, and transactional correctness",
      "Build a ledger-entry system that handles double-entry posting with consistency guarantees",
      "Reconciliation algorithm: match internal transactions against external feeds with fuzzy rules"
    ]
  },
  {
    "company": "Bridgewater Associates",
    "slug": "bridgewater-associates-interview-guide",
    "scrapedAt": "2026-07-02T07:16:49.731Z",
    "stageCount": 0,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Broadcom",
    "slug": "broadcom-interview-guide",
    "scrapedAt": "2026-07-02T07:19:25.550Z",
    "stageCount": 4,
    "questionCount": 4,
    "tipCount": 0,
    "difficulty": null,
    "topics": [
      "For hardware: RTL, architecture, or domain-specific rounds depending on team",
      "1 behavioral round",
      "Hiring committee review."
    ]
  },
  {
    "company": "Bumble",
    "slug": "bumble-interview-guide",
    "scrapedAt": "2026-07-02T07:20:45.136Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "ByteDance/TikTok",
    "slug": "bytedance-tiktok-interview-guide",
    "scrapedAt": "2026-07-02T07:20:47.777Z",
    "stageCount": 4,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Calm",
    "slug": "calm-interview-guide",
    "scrapedAt": "2026-07-02T07:20:50.382Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Canva",
    "slug": "canva",
    "scrapedAt": "2026-07-02T07:20:53.012Z",
    "stageCount": 2,
    "questionCount": 5,
    "tipCount": 11,
    "difficulty": 7,
    "topics": [
      "Design-document state: model a tree of design elements with operations (add, move, group, delete) and invariants",
      "Selection and transformation system: implement multi-select with bounding-box computation and constraint-based transforms",
      "Undo / redo with branching or linear history"
    ]
  },
  {
    "company": "Capital One",
    "slug": "capital-one-interview-guide",
    "scrapedAt": "2026-07-02T07:16:52.357Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "CarGurus",
    "slug": "cargurus-interview-guide",
    "scrapedAt": "2026-07-02T07:20:55.473Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Carta",
    "slug": "carta-interview-guide",
    "scrapedAt": "2026-07-02T07:16:54.995Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Carvana",
    "slug": "carvana-interview-guide",
    "scrapedAt": "2026-07-02T07:20:58.397Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Character.AI",
    "slug": "character-ai-interview-guide",
    "scrapedAt": "2026-07-02T07:13:21.773Z",
    "stageCount": 13,
    "questionCount": 4,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Chime",
    "slug": "chime",
    "scrapedAt": "2026-07-02T07:16:57.667Z",
    "stageCount": 2,
    "questionCount": 6,
    "tipCount": 10,
    "difficulty": 7,
    "topics": [
      "Idempotent transfer handler: given this API request, implement the service handler with retry safety and correct error semantics",
      "Duplicate-detection for direct deposits: identify same-deposit-across-sources without over-rejecting legitimate duplicates",
      "Notification router: given this event stream, deliver notifications with per-user preferences and deduplication"
    ]
  },
  {
    "company": "Chronosphere",
    "slug": "chronosphere-interview-guide",
    "scrapedAt": "2026-07-02T07:21:01.102Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "CircleCI",
    "slug": "circleci-interview-guide",
    "scrapedAt": "2026-07-02T07:21:03.792Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Cisco",
    "slug": "cisco",
    "scrapedAt": "2026-07-02T07:32:24.183Z",
    "stageCount": 15,
    "questionCount": 0,
    "tipCount": 9,
    "difficulty": 6.5,
    "topics": [
      "OSI model (all 7 layers)",
      "TCP/IP protocols",
      "Routing algorithms (OSPF, BGP)"
    ]
  },
  {
    "company": "Citadel Hedge Fund",
    "slug": "citadel-hedge-fund-interview-guide",
    "scrapedAt": "2026-07-02T07:17:03.444Z",
    "stageCount": 0,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Citadel Securities",
    "slug": "citadel-securities",
    "scrapedAt": "2026-07-02T07:17:06.181Z",
    "stageCount": 4,
    "questionCount": 5,
    "tipCount": 11,
    "difficulty": null,
    "topics": [
      "Implement a simple matching engine or order book primitive",
      "Process a market data feed and compute statistics (VWAP, time-weighted price, rolling volatility)",
      "Detect arbitrage opportunities given prices on multiple venues"
    ]
  },
  {
    "company": "Citi",
    "slug": "citi-interview-guide",
    "scrapedAt": "2026-07-02T07:17:09.120Z",
    "stageCount": 4,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Clerk",
    "slug": "clerk-interview-guide",
    "scrapedAt": "2026-07-02T07:21:06.311Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "ClickHouse",
    "slug": "clickhouse-interview-guide",
    "scrapedAt": "2026-07-02T07:21:08.922Z",
    "stageCount": 0,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "ClickUp",
    "slug": "clickup-interview-guide",
    "scrapedAt": "2026-07-02T07:21:11.396Z",
    "stageCount": 10,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": [
      "Design ClickUp's task management with multiple views (list, board, calendar, gantt) backed by the same data.",
      "Design a real-time collaborative workspace.",
      "Design a workflow automation engine."
    ]
  },
  {
    "company": "Cloudera",
    "slug": "cloudera-interview-guide",
    "scrapedAt": "2026-07-02T07:21:13.717Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Cloudflare",
    "slug": "cloudflare",
    "scrapedAt": "2026-07-02T07:21:16.263Z",
    "stageCount": 3,
    "questionCount": 6,
    "tipCount": 11,
    "difficulty": 7.5,
    "topics": [
      "Implement a specific protocol / format handler (tiny HTTP parser, TLV decoder, WebSocket frame reader)",
      "Rate limiter with specific semantics (fixed window, sliding window log, token bucket with burst)",
      "Connection or resource pool with fairness and timeout constraints"
    ]
  },
  {
    "company": "Cockroach Labs",
    "slug": "cockroach-labs-interview-guide",
    "scrapedAt": "2026-07-02T07:21:18.690Z",
    "stageCount": 0,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Coda",
    "slug": "coda-interview-guide",
    "scrapedAt": "2026-07-02T07:21:20.788Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Codecademy",
    "slug": "codecademy-interview-guide",
    "scrapedAt": "2026-07-02T07:21:23.373Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "CodeSandbox",
    "slug": "codesandbox-interview-guide",
    "scrapedAt": "2026-07-02T07:21:25.994Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Cohere",
    "slug": "cohere",
    "scrapedAt": "2026-07-02T07:13:24.389Z",
    "stageCount": 2,
    "questionCount": 5,
    "tipCount": 14,
    "difficulty": 7.5,
    "topics": [
      "Implement a reranker: given candidate documents and a query, produce ranked output with a scoring function",
      "Embedding pipeline: batch-encode a corpus efficiently with a given embedding model",
      "Multi-step agent loop with tool-calling and state management"
    ]
  },
  {
    "company": "Coinbase",
    "slug": "coinbase",
    "scrapedAt": "2026-07-02T07:17:11.795Z",
    "stageCount": 2,
    "questionCount": 5,
    "tipCount": 13,
    "difficulty": 7.5,
    "topics": [
      "Limit-order book implementation with matching semantics",
      "Idempotent transaction processor handling blockchain reorganizations",
      "Balance accounting with multi-currency / multi-decimal support"
    ]
  },
  {
    "company": "Confluent",
    "slug": "confluent-interview-guide",
    "scrapedAt": "2026-07-02T07:21:28.437Z",
    "stageCount": 13,
    "questionCount": 5,
    "tipCount": 6,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "ConvertKit",
    "slug": "convertkit-interview-guide",
    "scrapedAt": "2026-07-02T07:21:30.991Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "CoreWeave",
    "slug": "coreweave-interview-guide",
    "scrapedAt": "2026-07-02T07:21:33.582Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Coursera",
    "slug": "coursera-interview-guide",
    "scrapedAt": "2026-07-02T07:21:36.146Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Credit Karma",
    "slug": "credit-karma-interview-guide",
    "scrapedAt": "2026-07-02T07:21:38.852Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Cribl",
    "slug": "cribl-interview-guide",
    "scrapedAt": "2026-07-02T07:21:41.290Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "CrowdStrike",
    "slug": "crowdstrike-interview-guide",
    "scrapedAt": "2026-07-02T07:21:43.741Z",
    "stageCount": 4,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Circle/Ripple/Chainalysis",
    "slug": "crypto-trio-circle-ripple-chainalysis-interview-guide",
    "scrapedAt": "2026-07-02T07:17:00.303Z",
    "stageCount": 0,
    "questionCount": 4,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Cursor",
    "slug": "cursor",
    "scrapedAt": "2026-07-02T07:13:26.903Z",
    "stageCount": 2,
    "questionCount": 5,
    "tipCount": 11,
    "difficulty": 8,
    "topics": [
      "Implement a text-buffer primitive with efficient edit operations (rope, piece table, or similar)",
      "Context-retrieval: given a cursor position in a codebase, select most relevant code snippets for an LLM prompt",
      "Streaming edit application: handle incoming LLM tokens and apply them as real-time edits to a document"
    ]
  },
  {
    "company": "Databricks",
    "slug": "databricks",
    "scrapedAt": "2026-07-02T07:21:46.303Z",
    "stageCount": 4,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Datadog",
    "slug": "datadog",
    "scrapedAt": "2026-07-02T07:21:48.891Z",
    "stageCount": 3,
    "questionCount": 5,
    "tipCount": 13,
    "difficulty": 8,
    "topics": [
      "Streaming aggregation (compute top-K over a bounded memory budget)",
      "Log or structured-event parser with state (build a multi-line event aggregator, correlate events by ID)",
      "Windowing (find all events within a sliding N-minute window that match a predicate)"
    ]
  },
  {
    "company": "DataStax",
    "slug": "datastax-interview-guide",
    "scrapedAt": "2026-07-02T07:21:51.523Z",
    "stageCount": 0,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "dbt Labs",
    "slug": "dbt-labs-interview-guide",
    "scrapedAt": "2026-07-02T07:21:54.222Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "D. E. Shaw",
    "slug": "de-shaw",
    "scrapedAt": "2026-07-02T07:17:14.406Z",
    "stageCount": 2,
    "questionCount": 5,
    "tipCount": 11,
    "difficulty": null,
    "topics": [
      "Implement a specific data structure with tight performance requirements",
      "Algorithm problems (graphs, dynamic programming, intervals) at LeetCode hard difficulty",
      "Process structured data with bounded memory or strict latency requirements"
    ]
  },
  {
    "company": "Decagon",
    "slug": "decagon-interview-guide",
    "scrapedAt": "2026-07-02T07:13:29.410Z",
    "stageCount": 0,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Deel",
    "slug": "deel",
    "scrapedAt": "2026-07-02T07:17:17.050Z",
    "stageCount": 2,
    "questionCount": 5,
    "tipCount": 11,
    "difficulty": 7,
    "topics": [
      "Payroll calculation: given an employee and jurisdiction, compute gross-to-net with correct tax handling",
      "Multi-currency transfer orchestration with FX conversion and bank routing",
      "Contract-lifecycle state machine with jurisdiction-specific variations"
    ]
  },
  {
    "company": "Deepgram",
    "slug": "deepgram-interview-guide",
    "scrapedAt": "2026-07-02T07:13:31.980Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Defense Primes",
    "slug": "defense-primes-lockheed-northrop-raytheon-interview-guide",
    "scrapedAt": "2026-07-02T07:19:28.058Z",
    "stageCount": 12,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Deutsche Bank",
    "slug": "deutsche-bank-interview-guide",
    "scrapedAt": "2026-07-02T07:17:19.748Z",
    "stageCount": 4,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Discord",
    "slug": "discord",
    "scrapedAt": "2026-07-02T07:21:56.736Z",
    "stageCount": 2,
    "questionCount": 5,
    "tipCount": 11,
    "difficulty": 7.5,
    "topics": [
      "Implement a publish / subscribe primitive with fan-out semantics",
      "Build a connection manager handling many concurrent WebSocket-like connections",
      "Parse a streaming event log with backpressure and ordering guarantees"
    ]
  },
  {
    "company": "DocuSign",
    "slug": "docusign",
    "scrapedAt": "2026-07-02T07:21:59.195Z",
    "stageCount": 2,
    "questionCount": 7,
    "tipCount": 11,
    "difficulty": 6.5,
    "topics": [
      "Signature workflow state machine: model envelope state with signers, routing rules, reminders, expirations, and all failure paths",
      "Audit event processor: given a stream of actions, generate cryptographically-verifiable audit entries",
      "Document diff: given two versions of an agreement, compute meaningful changes (ignoring whitespace-only changes)"
    ]
  },
  {
    "company": "Doppler",
    "slug": "doppler-interview-guide",
    "scrapedAt": "2026-07-02T07:22:01.968Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Drata",
    "slug": "drata-interview-guide",
    "scrapedAt": "2026-07-02T07:22:04.574Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Dropbox",
    "slug": "dropbox-interview-guide",
    "scrapedAt": "2026-07-02T07:22:07.200Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "DRW",
    "slug": "drw-interview-guide",
    "scrapedAt": "2026-07-02T07:17:22.345Z",
    "stageCount": 0,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "DuckDB Labs",
    "slug": "duckdb-labs-interview-guide",
    "scrapedAt": "2026-07-02T07:22:09.719Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Duolingo",
    "slug": "duolingo-interview-guide",
    "scrapedAt": "2026-07-02T07:22:12.150Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Elastic",
    "slug": "elastic-interview-guide",
    "scrapedAt": "2026-07-02T07:22:14.500Z",
    "stageCount": 13,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": [
      "Implement an inverted index — accept a list of documents, build a map from term to posting list with positions. Discuss term-frequency vs document-frequency, why posting lists are stored as deltas (gap encoding), and how merge-on-read works during querying.",
      "Top-K terms in a stream — count-min sketch + heap, or HyperLogLog for cardinality. Tests whether the candidate has thought about approximate-data-structure trade-offs that show up in Elasticsearch's aggregation framework.",
      "Fuzzy matching with edit distance — implement Levenshtein, then discuss how Lucene's automaton-based fuzzy matching works in practice. Senior+ candidates should be aware that brute-force edit-distance over an inverted index is too slow at scale."
    ]
  },
  {
    "company": "Electronic Arts",
    "slug": "electronic-arts-ea-interview-guide",
    "scrapedAt": "2026-07-02T07:22:16.967Z",
    "stageCount": 16,
    "questionCount": 4,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "ElevenLabs",
    "slug": "elevenlabs-interview-guide",
    "scrapedAt": "2026-07-02T07:13:34.545Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Epic Games",
    "slug": "epic-games-interview-guide",
    "scrapedAt": "2026-07-02T07:22:19.347Z",
    "stageCount": 4,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Epic Systems",
    "slug": "epic-systems-interview-guide",
    "scrapedAt": "2026-07-02T07:22:21.780Z",
    "stageCount": 9,
    "questionCount": 4,
    "tipCount": 0,
    "difficulty": null,
    "topics": [
      "Standard data-structure questions in any language. Epic does not require MUMPS knowledge in the interview; you will learn it on the job. Expect arrays, strings, hash maps, trees, and basic graph problems at LeetCode-medium difficulty.",
      "SQL design for clinical data. Given a description of patient encounters, design tables that support fast retrieval of \"all encounters of type X for patient Y in the last 12 months.\" Discuss indexing, denormalization for read paths, and audit-log design.",
      "Logic puzzles. Epic is one of the few large tech employers that still uses logic puzzles as a filter. The puzzles tend toward Bayesian conditioning, combinatorics, and algorithmic thinking rather than the dead Microsoft brainteaser tradition. Practice on a small set before the loop."
    ]
  },
  {
    "company": "Etsy",
    "slug": "etsy-interview-guide",
    "scrapedAt": "2026-07-02T07:22:24.215Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Eventbrite",
    "slug": "eventbrite-interview-guide",
    "scrapedAt": "2026-07-02T07:22:26.721Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Evercore",
    "slug": "evercore-interview-guide",
    "scrapedAt": "2026-07-02T07:17:24.412Z",
    "stageCount": 4,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Faire",
    "slug": "faire-interview-guide",
    "scrapedAt": "2026-07-02T07:22:29.120Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Fastly",
    "slug": "fastly-interview-guide",
    "scrapedAt": "2026-07-02T07:22:31.567Z",
    "stageCount": 0,
    "questionCount": 4,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Fidelity Investments",
    "slug": "fidelity-investments-interview-guide",
    "scrapedAt": "2026-07-02T07:17:27.057Z",
    "stageCount": 4,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Figma",
    "slug": "figma",
    "scrapedAt": "2026-07-02T07:22:33.932Z",
    "stageCount": 2,
    "questionCount": 9,
    "tipCount": 11,
    "difficulty": 8,
    "topics": [
      "Implement a data structure tied to a practical operation (range tree for selection, interval map for formatting, trie for autocomplete)",
      "Parse or transform a structured stream (command log, event sequence, expression tree)",
      "Model a small state machine (undo/redo, selection state, focus state) with explicit transitions"
    ]
  },
  {
    "company": "Fireworks AI",
    "slug": "fireworks-ai",
    "scrapedAt": "2026-07-02T07:13:36.635Z",
    "stageCount": 2,
    "questionCount": 5,
    "tipCount": 11,
    "difficulty": 8.5,
    "topics": [
      "Implement a CUDA kernel for a specific operation (reduction, softmax, matrix operation)",
      "Optimize a naive kernel for memory throughput and Tensor Core utilization",
      "Design a batching scheduler matching diverse requests to GPU capacity"
    ]
  },
  {
    "company": "Five9",
    "slug": "five9-interview-guide",
    "scrapedAt": "2026-07-02T07:22:36.507Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Fivetran",
    "slug": "fivetran-interview-guide",
    "scrapedAt": "2026-07-02T07:22:38.965Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Flow Traders",
    "slug": "flow-traders-interview-guide",
    "scrapedAt": "2026-07-02T07:17:29.690Z",
    "stageCount": 5,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Fly.io",
    "slug": "fly-io-interview-guide",
    "scrapedAt": "2026-07-02T07:22:41.326Z",
    "stageCount": 0,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Framer",
    "slug": "framer-interview-guide",
    "scrapedAt": "2026-07-02T07:22:43.765Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Gainsight",
    "slug": "gainsight-interview-guide",
    "scrapedAt": "2026-07-02T07:22:46.065Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Galaxy Digital",
    "slug": "galaxy-digital-interview-guide",
    "scrapedAt": "2026-07-02T07:17:32.289Z",
    "stageCount": 4,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "GitLab",
    "slug": "gitlab",
    "scrapedAt": "2026-07-02T07:22:48.497Z",
    "stageCount": 4,
    "questionCount": 5,
    "tipCount": 11,
    "difficulty": 7,
    "topics": [
      "Extend an existing Rails controller with a new endpoint, handling edge cases and writing tests",
      "Refactor a slow ActiveRecord query to be N+1-free and properly indexed",
      "Build a small Vue component with specific reactivity semantics and accessibility constraints"
    ]
  },
  {
    "company": "Glassdoor",
    "slug": "glassdoor-interview-guide",
    "scrapedAt": "2026-07-02T07:22:50.940Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Glean",
    "slug": "glean-interview-guide",
    "scrapedAt": "2026-07-02T07:13:39.172Z",
    "stageCount": 13,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": [
      "Build a federated search index. Glean indexes content from many SaaS apps (Slack, Drive, Confluence, Jira, Salesforce, etc.). Discuss how to handle different rate limits, authentication models, schemas, and incremental update granularity per source.",
      "Implement permission-aware retrieval. Search results must respect what the user can actually access in source systems. Discuss two architectures: (1) replicate ACLs into your search index and check at query time, (2) use source-system live permission checks at retrieval time. Trade-offs of each.",
      "Design hybrid search. Combine BM25 keyword scoring with dense-embedding semantic similarity. Discuss reranking, query rewriting, and when each strategy dominates (short factual queries vs long natural-language questions)."
    ]
  },
  {
    "company": "Goldman Sachs",
    "slug": "goldman-sachs-strats-engineering-interview-guide",
    "scrapedAt": "2026-07-02T07:17:34.840Z",
    "stageCount": 0,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Gong",
    "slug": "gong-interview-guide",
    "scrapedAt": "2026-07-02T07:22:53.397Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Google",
    "slug": "google",
    "scrapedAt": "2026-07-02T07:12:53.190Z",
    "stageCount": 3,
    "questionCount": 0,
    "tipCount": 5,
    "difficulty": null,
    "topics": [
      "Arrays and Strings: Two-pointer techniques, sliding window, string manipulation",
      "Trees and Graphs: BFS, DFS, tree traversals, shortest path algorithms",
      "Dynamic Programming: Knapsack, longest common subsequence, matrix chain multiplication"
    ]
  },
  {
    "company": "Grab",
    "slug": "grab-interview-guide",
    "scrapedAt": "2026-07-02T07:22:55.948Z",
    "stageCount": 12,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": [
      "Design a high-throughput driver-rider matching service. Real-time geospatial queries (geohashing, S2 cells, R-tree), surge consideration, fairness across drivers, and what to do when supply concentrates in a few zones during demand spikes.",
      "Implement an idempotent payment authorization flow. Multi-currency consideration (Indonesian rupiah and Vietnamese dong have very different decimal handling), retry semantics, and how to compose with multiple payment providers (Visa, MasterCard, GrabPay wallet, OVO, GoPay competitors).",
      "Top-K nearest drivers query at 100K QPS. Discuss caching strategies, how to keep driver locations fresh, and what happens during a network partition between the driver app and the matching service."
    ]
  },
  {
    "company": "Grafana Labs",
    "slug": "grafana-labs-interview-guide",
    "scrapedAt": "2026-07-02T07:22:58.465Z",
    "stageCount": 0,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Greenhouse",
    "slug": "greenhouse-interview-guide",
    "scrapedAt": "2026-07-02T07:23:01.040Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Grubhub",
    "slug": "grubhub-interview-guide",
    "scrapedAt": "2026-07-02T07:23:03.616Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Gusto",
    "slug": "gusto-interview-guide",
    "scrapedAt": "2026-07-02T07:17:37.494Z",
    "stageCount": 0,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "HackerRank",
    "slug": "hackerrank-interview-guide",
    "scrapedAt": "2026-07-02T07:23:06.110Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Harvey",
    "slug": "harvey-interview-guide",
    "scrapedAt": "2026-07-02T07:13:41.831Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "HashiCorp",
    "slug": "hashicorp",
    "scrapedAt": "2026-07-02T07:23:08.752Z",
    "stageCount": 2,
    "questionCount": 8,
    "tipCount": 11,
    "difficulty": 8,
    "topics": [
      "Implement a small primitive with specific semantics (TTL cache with eviction callbacks, rate limiter with graceful refill, retry-with-jitter)",
      "Parse a structured wire format (HCL-like config, JSON with schema validation, binary TLV)",
      "Model a small distributed problem (leader election, distributed lock, gossip state convergence) &mdash; usually NOT full Raft, but a piece of it"
    ]
  },
  {
    "company": "Headspace",
    "slug": "headspace-interview-guide",
    "scrapedAt": "2026-07-02T07:23:11.204Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Heroku",
    "slug": "heroku-interview-guide",
    "scrapedAt": "2026-07-02T07:23:13.639Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Hex",
    "slug": "hex",
    "scrapedAt": "2026-07-02T07:23:15.957Z",
    "stageCount": 2,
    "questionCount": 5,
    "tipCount": 11,
    "difficulty": 7.5,
    "topics": [
      "Cell dependency graph: implement topological evaluation of cells with data-flow between them",
      "Streaming result handler: process SQL results as they arrive with proper pagination / virtualization",
      "Collaborative editing primitive: handle concurrent cell inserts / deletes / edits with conflict resolution"
    ]
  },
  {
    "company": "Hightouch",
    "slug": "hightouch-interview-guide",
    "scrapedAt": "2026-07-02T07:23:18.402Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Hippocratic AI",
    "slug": "hippocratic-ai-interview-guide",
    "scrapedAt": "2026-07-02T07:13:44.454Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Honeycomb",
    "slug": "honeycomb-interview-guide",
    "scrapedAt": "2026-07-02T07:23:20.851Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Hopper",
    "slug": "hopper-interview-guide",
    "scrapedAt": "2026-07-02T07:23:23.328Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "HubSpot",
    "slug": "hubspot",
    "scrapedAt": "2026-07-02T07:23:25.807Z",
    "stageCount": 3,
    "questionCount": 5,
    "tipCount": 11,
    "difficulty": 6.5,
    "topics": [
      "OO design: model a CRM-style domain (workflow with triggers / actions / conditions, contact list with custom fields, sequence of emails with A/B variants)",
      "Implement a rate limiter, retry client, or event aggregator with specific semantics",
      "Extend an existing codebase: add a feature to a small service, respect existing patterns, write tests"
    ]
  },
  {
    "company": "Hudson River Trading",
    "slug": "hudson-river-trading",
    "scrapedAt": "2026-07-02T07:17:40.059Z",
    "stageCount": 2,
    "questionCount": 7,
    "tipCount": 12,
    "difficulty": null,
    "topics": [
      "Graph problems with non-obvious approach (shortest path with constraints, max-flow variants, min-cost matching)",
      "Hard dynamic programming with state compression or non-obvious transitions",
      "Implement a specific data structure with tight performance requirements (custom hash map, memory-pool allocator, ring buffer with specific concurrency semantics)"
    ]
  },
  {
    "company": "Hugging Face",
    "slug": "hugging-face-interview-guide",
    "scrapedAt": "2026-07-02T07:13:47.138Z",
    "stageCount": 4,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "IMC Trading",
    "slug": "imc-trading-interview-guide",
    "scrapedAt": "2026-07-02T07:17:42.777Z",
    "stageCount": 0,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Indeed",
    "slug": "indeed-interview-guide",
    "scrapedAt": "2026-07-02T07:23:28.247Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Instacart",
    "slug": "instacart-interview-guide",
    "scrapedAt": "2026-07-02T07:23:30.712Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Intel",
    "slug": "intel-interview-guide",
    "scrapedAt": "2026-07-02T07:19:30.675Z",
    "stageCount": 4,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Intercom",
    "slug": "intercom-interview-guide",
    "scrapedAt": "2026-07-02T07:23:33.141Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Iterable",
    "slug": "iterable-interview-guide",
    "scrapedAt": "2026-07-02T07:23:35.947Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Jane Street",
    "slug": "jane-street",
    "scrapedAt": "2026-07-02T07:17:45.349Z",
    "stageCount": 2,
    "questionCount": 5,
    "tipCount": 11,
    "difficulty": null,
    "topics": [
      "Implement a simple order book with insert / cancel / match operations",
      "Compute a moving average / running statistic efficiently",
      "Parse a simple structured input (financial data feed, log format)"
    ]
  },
  {
    "company": "JetBrains",
    "slug": "jetbrains-interview-guide",
    "scrapedAt": "2026-07-02T07:23:38.787Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "JPMorgan Chase",
    "slug": "jpmorgan-tech-quant-interview-guide",
    "scrapedAt": "2026-07-02T07:17:47.916Z",
    "stageCount": 0,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Jump Trading",
    "slug": "jump-trading",
    "scrapedAt": "2026-07-02T07:17:50.559Z",
    "stageCount": 2,
    "questionCount": 6,
    "tipCount": 12,
    "difficulty": null,
    "topics": [
      "Implement a low-latency data structure (custom memory pool, lock-free queue, ring buffer with specific concurrency semantics)",
      "Hard graph or dynamic-programming problems with tight performance budgets",
      "Process market-data-like streams with strict latency / memory constraints"
    ]
  },
  {
    "company": "Klarna",
    "slug": "klarna-interview-guide",
    "scrapedAt": "2026-07-02T07:17:52.973Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Klaviyo",
    "slug": "klaviyo-interview-guide",
    "scrapedAt": "2026-07-02T07:23:41.253Z",
    "stageCount": 0,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Kraken",
    "slug": "kraken-interview-guide",
    "scrapedAt": "2026-07-02T07:17:55.523Z",
    "stageCount": 5,
    "questionCount": 5,
    "tipCount": 7,
    "difficulty": null,
    "topics": [
      "1 system design (often financial-systems flavored)",
      "1 domain knowledge round (for senior+ — crypto-specific or financial-systems-specific)",
      "1 behavioral / values round"
    ]
  },
  {
    "company": "Lambda Labs",
    "slug": "lambda-labs-interview-guide",
    "scrapedAt": "2026-07-02T07:13:49.704Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "LangChain",
    "slug": "langchain",
    "scrapedAt": "2026-07-02T07:13:52.326Z",
    "stageCount": 2,
    "questionCount": 6,
    "tipCount": 11,
    "difficulty": 7,
    "topics": [
      "Implement an agent loop: given a set of tools, an LLM, and a question, execute tool-calls and return the final answer",
      "Stream processor: handle token-level streaming output from an LLM with structured-event extraction",
      "Trace tree construction: given a stream of log events, reconstruct a hierarchical trace"
    ]
  },
  {
    "company": "Lattice",
    "slug": "lattice-interview-guide",
    "scrapedAt": "2026-07-02T07:23:43.798Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "LaunchDarkly",
    "slug": "launchdarkly-interview-guide",
    "scrapedAt": "2026-07-02T07:23:46.351Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Lazard",
    "slug": "lazard-interview-guide",
    "scrapedAt": "2026-07-02T07:17:58.106Z",
    "stageCount": 8,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "LeetCode",
    "slug": "leetcode-interview-guide",
    "scrapedAt": "2026-07-02T07:23:48.927Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Lightspeed Commerce",
    "slug": "lightspeed-interview-guide",
    "scrapedAt": "2026-07-02T07:23:51.539Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Linear",
    "slug": "linear",
    "scrapedAt": "2026-07-02T07:23:54.149Z",
    "stageCount": 2,
    "questionCount": 5,
    "tipCount": 11,
    "difficulty": 8,
    "topics": [
      "Data-model design: given a product scenario (e.g., issues with parent / child relationships and cycles), design types and operations that preserve invariants",
      "Sync-engine primitive: given a set of local edits and a set of remote edits, compute a consistent merged state",
      "Command-palette search: implement fast fuzzy search across a typed object corpus"
    ]
  },
  {
    "company": "LinkedIn",
    "slug": "linkedin",
    "scrapedAt": "2026-07-02T07:23:56.760Z",
    "stageCount": 3,
    "questionCount": 0,
    "tipCount": 5,
    "difficulty": null,
    "topics": [
      "Graphs: Social network analysis, connection recommendations, shortest path between professionals",
      "Trees: Binary trees, tree traversals, organizational hierarchies",
      "Hash Tables: Deduplication, frequency analysis, caching"
    ]
  },
  {
    "company": "LlamaIndex",
    "slug": "llamaindex-interview-guide",
    "scrapedAt": "2026-07-02T07:13:54.948Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Lyft",
    "slug": "lyft-interview-guide",
    "scrapedAt": "2026-07-02T07:23:59.339Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Mailchimp",
    "slug": "mailchimp-interview-guide",
    "scrapedAt": "2026-07-02T07:24:02.603Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Man Group",
    "slug": "man-group-interview-guide",
    "scrapedAt": "2026-07-02T07:18:01.559Z",
    "stageCount": 5,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Marqeta",
    "slug": "marqeta-interview-guide",
    "scrapedAt": "2026-07-02T07:18:04.345Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Match Group",
    "slug": "match-group-interview-guide",
    "scrapedAt": "2026-07-02T07:24:05.093Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Materialize",
    "slug": "materialize-interview-guide",
    "scrapedAt": "2026-07-02T07:24:07.693Z",
    "stageCount": 0,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Medium",
    "slug": "medium-interview-guide",
    "scrapedAt": "2026-07-02T07:24:10.943Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Mercury",
    "slug": "mercury",
    "scrapedAt": "2026-07-02T07:18:07.579Z",
    "stageCount": 2,
    "questionCount": 8,
    "tipCount": 11,
    "difficulty": 7.5,
    "topics": [
      "Model a transfer lifecycle with all failure paths (pending, authorized, settled, returned, reversed)",
      "Implement an idempotent processor for at-least-once delivery (message queue consumer handling duplicates)",
      "Build a rate limiter with fairness guarantees across customers"
    ]
  },
  {
    "company": "Meta",
    "slug": "meta-facebook",
    "scrapedAt": "2026-07-02T07:12:55.775Z",
    "stageCount": 3,
    "questionCount": 0,
    "tipCount": 5,
    "difficulty": null,
    "topics": [
      "Graphs: BFS, DFS, shortest path, friend suggestions, network analysis",
      "Trees: Binary tree traversals, BST operations, lowest common ancestor",
      "Arrays/Strings: Subarray problems, string parsing, two-pointer techniques"
    ]
  },
  {
    "company": "Microsoft",
    "slug": "microsoft",
    "scrapedAt": "2026-07-02T07:12:58.359Z",
    "stageCount": 4,
    "questionCount": 0,
    "tipCount": 5,
    "difficulty": null,
    "topics": [
      "Arrays/Strings: Two pointers, sliding window, string manipulation",
      "Trees/Graphs: BFS, DFS, binary trees, graph traversal",
      "Dynamic Programming: Classic DP problems, optimization"
    ]
  },
  {
    "company": "Millennium Management",
    "slug": "millennium-management-interview-guide",
    "scrapedAt": "2026-07-02T07:18:10.262Z",
    "stageCount": 0,
    "questionCount": 7,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Mistral AI",
    "slug": "mistral-ai-interview-guide",
    "scrapedAt": "2026-07-02T07:13:57.590Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Mixpanel",
    "slug": "mixpanel-interview-guide",
    "scrapedAt": "2026-07-02T07:24:14.571Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Modal",
    "slug": "modal",
    "scrapedAt": "2026-07-02T07:14:00.251Z",
    "stageCount": 2,
    "questionCount": 5,
    "tipCount": 12,
    "difficulty": 8,
    "topics": [
      "Scheduling primitive: implement a task queue with priority, fair-share, and preemption",
      "Resource allocator: given GPU / CPU / memory constraints, allocate to incoming tasks with acceptance / rejection logic",
      "Streaming processor with backpressure and bounded-memory constraints"
    ]
  },
  {
    "company": "Monday.com",
    "slug": "monday-com-interview-guide",
    "scrapedAt": "2026-07-02T07:24:18.318Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "MongoDB",
    "slug": "mongodb",
    "scrapedAt": "2026-07-02T07:24:21.728Z",
    "stageCount": 2,
    "questionCount": 5,
    "tipCount": 11,
    "difficulty": 8,
    "topics": [
      "Implement a database primitive (hash join, external sort with spill-to-disk, iterator with backpressure)",
      "Storage-engine adjacent: B-tree leaf page format with efficient insert / split, MVCC snapshot management",
      "Replication / consensus: implement a simple leader election with term numbers and log replication"
    ]
  },
  {
    "company": "Morgan Stanley",
    "slug": "morgan-stanley-tech-quant-interview-guide",
    "scrapedAt": "2026-07-02T07:18:13.288Z",
    "stageCount": 0,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "MotherDuck",
    "slug": "motherduck",
    "scrapedAt": "2026-07-02T07:14:02.950Z",
    "stageCount": 2,
    "questionCount": 5,
    "tipCount": 11,
    "difficulty": 7.5,
    "topics": [
      "Parse and evaluate a SQL-like expression tree with typing rules",
      "Implement a columnar operation (hash aggregation, sort, filter) with vectorization",
      "Query routing: given a query, determine optimal execution location"
    ]
  },
  {
    "company": "Neon",
    "slug": "neon",
    "scrapedAt": "2026-07-02T07:24:25.352Z",
    "stageCount": 2,
    "questionCount": 6,
    "tipCount": 11,
    "difficulty": 8,
    "topics": [
      "Implement a page-cache with LRU / LFU eviction and consistency guarantees",
      "Parse a Postgres-like binary format (page layout, WAL records)",
      "Implement a log-structured storage layer with compaction"
    ]
  },
  {
    "company": "Netflix",
    "slug": "netflix",
    "scrapedAt": "2026-07-02T07:13:00.937Z",
    "stageCount": 3,
    "questionCount": 0,
    "tipCount": 5,
    "difficulty": null,
    "topics": [
      "Distributed Systems: CAP theorem, consistency models, distributed caching",
      "Microservices: Service boundaries, API design, inter-service communication",
      "Streaming: Video encoding, adaptive bitrate, CDN strategies"
    ]
  },
  {
    "company": "New Relic",
    "slug": "new-relic-interview-guide",
    "scrapedAt": "2026-07-02T07:24:28.676Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Niantic",
    "slug": "niantic-interview-guide",
    "scrapedAt": "2026-07-02T07:24:33.257Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Notion",
    "slug": "notion",
    "scrapedAt": "2026-07-02T07:24:37.282Z",
    "stageCount": 2,
    "questionCount": 5,
    "tipCount": 11,
    "difficulty": 8,
    "topics": [
      "Data-model operations: given a tree of blocks, implement move / delete / merge with invariants preserved under concurrent edits",
      "Undo / redo system with branching history or linear stack",
      "Incremental computation: given a set of derived views on block data, update efficiently when a block changes"
    ]
  },
  {
    "company": "Nvidia",
    "slug": "nvidia",
    "scrapedAt": "2026-07-02T07:19:33.128Z",
    "stageCount": 3,
    "questionCount": 5,
    "tipCount": 11,
    "difficulty": 8.5,
    "topics": [
      "\"Design a scheduler for 10K GPUs running 1000 heterogeneous training jobs.\"",
      "\"Design an inference-serving system handling 100K QPS with strict p99 latency on H100 GPUs.\"",
      "\"Design the storage layer for a training cluster with 100TB of active datasets and checkpoint write amplification.\""
    ]
  },
  {
    "company": "Okta",
    "slug": "okta-interview-guide",
    "scrapedAt": "2026-07-02T07:24:41.238Z",
    "stageCount": 13,
    "questionCount": 5,
    "tipCount": 7,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "OpenAI",
    "slug": "openai",
    "scrapedAt": "2026-07-02T07:14:05.692Z",
    "stageCount": 3,
    "questionCount": 5,
    "tipCount": 17,
    "difficulty": 8,
    "topics": [
      "Implement a specific data structure to meet tight complexity (LRU cache, token counter, rate limiter)",
      "Streaming / parsing problems (process tokenized input with bounded memory, parse structured log lines)",
      "Graph / tree problems with a practical flavor (dependency resolution, shortest path with weights)"
    ]
  },
  {
    "company": "Opendoor",
    "slug": "opendoor-interview-guide",
    "scrapedAt": "2026-07-02T07:24:44.939Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Optiver",
    "slug": "optiver-interview-guide",
    "scrapedAt": "2026-07-02T07:18:15.833Z",
    "stageCount": 7,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Oracle",
    "slug": "oracle-interview",
    "scrapedAt": "2026-07-02T07:13:03.585Z",
    "stageCount": 1,
    "questionCount": 0,
    "tipCount": 17,
    "difficulty": 9,
    "topics": [
      "Clean, maintainable code (they love comments)",
      "Edge case handling",
      "Error handling"
    ]
  },
  {
    "company": "Orca Security",
    "slug": "orca-security-interview-guide",
    "scrapedAt": "2026-07-02T07:24:48.471Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Outreach",
    "slug": "outreach-interview-guide",
    "scrapedAt": "2026-07-02T07:24:52.065Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "PagerDuty",
    "slug": "pagerduty-interview-guide",
    "scrapedAt": "2026-07-02T07:24:55.642Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Palantir",
    "slug": "palantir",
    "scrapedAt": "2026-07-02T07:24:59.381Z",
    "stageCount": 5,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Palo Alto Networks",
    "slug": "palo-alto-networks-interview-guide",
    "scrapedAt": "2026-07-02T07:25:04.471Z",
    "stageCount": 4,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Patreon",
    "slug": "patreon-interview-guide",
    "scrapedAt": "2026-07-02T07:25:08.359Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "PayPal",
    "slug": "paypal",
    "scrapedAt": "2026-07-02T07:18:18.446Z",
    "stageCount": 4,
    "questionCount": 5,
    "tipCount": 11,
    "difficulty": 6.5,
    "topics": [
      "OO design: model a payment transaction with refund, partial-refund, chargeback, reversal states with correct invariants",
      "Idempotent transaction handler with retry safety and correct financial outcomes",
      "Currency / money handling with proper precision (BigDecimal / long-cents, not float)"
    ]
  },
  {
    "company": "Peloton",
    "slug": "peloton-interview-guide",
    "scrapedAt": "2026-07-02T07:25:11.212Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Pendo",
    "slug": "pendo-interview-guide",
    "scrapedAt": "2026-07-02T07:25:13.921Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Perplexity",
    "slug": "perplexity",
    "scrapedAt": "2026-07-02T07:14:08.533Z",
    "stageCount": 2,
    "questionCount": 5,
    "tipCount": 14,
    "difficulty": 7.5,
    "topics": [
      "Implement a small reranker: given candidate documents and a query, produce ranked output using a scoring function",
      "Stream-process LLM response tokens with structured-output parsing (extract citations as they appear)",
      "Query reformulation: given a user question, generate retrieval-optimized queries"
    ]
  },
  {
    "company": "Pika Labs",
    "slug": "pika-labs-interview-guide",
    "scrapedAt": "2026-07-02T07:14:11.154Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Pinecone",
    "slug": "pinecone-interview-guide",
    "scrapedAt": "2026-07-02T07:14:13.815Z",
    "stageCount": 14,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": [
      "Design a vector database that handles billions of vectors with millisecond query latency.",
      "Design a metadata-filtered search over a vector index.",
      "Design a hybrid search that combines vector and keyword retrieval."
    ]
  },
  {
    "company": "Pinterest",
    "slug": "pinterest-interview",
    "scrapedAt": "2026-07-02T07:25:16.791Z",
    "stageCount": 1,
    "questionCount": 1,
    "tipCount": 21,
    "difficulty": 9,
    "topics": [
      "Graph representation (Pins as nodes, similarity as edges)",
      "Connected components algorithm",
      "Time/space complexity analysis"
    ]
  },
  {
    "company": "Plaid",
    "slug": "plaid",
    "scrapedAt": "2026-07-02T07:18:20.965Z",
    "stageCount": 2,
    "questionCount": 6,
    "tipCount": 11,
    "difficulty": 7.5,
    "topics": [
      "Transaction processing with idempotency (given this stream of transactions, some duplicated, produce a correct aggregate)",
      "Fuzzy matching (given two sets of account records, find likely matches across institutions)",
      "State machine for a bank-connection flow (handle MFA, failed auth, expired token, institution-specific quirks)"
    ]
  },
  {
    "company": "PlanetScale",
    "slug": "planetscale",
    "scrapedAt": "2026-07-02T07:25:19.350Z",
    "stageCount": 2,
    "questionCount": 5,
    "tipCount": 11,
    "difficulty": 7.5,
    "topics": [
      "Implement a simple query parser / evaluator for a structured expression language",
      "Build a routing component: given a query and shard configuration, determine target shard(s)",
      "Design a connection pool with fair allocation and timeout handling"
    ]
  },
  {
    "company": "Point72",
    "slug": "point72-interview-guide",
    "scrapedAt": "2026-07-02T07:18:23.718Z",
    "stageCount": 0,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "PostHog",
    "slug": "posthog-interview-guide",
    "scrapedAt": "2026-07-02T07:25:21.832Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Postman",
    "slug": "postman",
    "scrapedAt": "2026-07-02T07:25:24.328Z",
    "stageCount": 2,
    "questionCount": 5,
    "tipCount": 11,
    "difficulty": 6.5,
    "topics": [
      "Implement a request builder with variable substitution, authentication handling, and header composition",
      "Parse / validate an OpenAPI schema and generate test cases from it",
      "Handle streaming API responses (SSE, WebSocket) with proper backpressure and error handling"
    ]
  },
  {
    "company": "Procore",
    "slug": "procore-interview-guide",
    "scrapedAt": "2026-07-02T07:25:26.946Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Pulumi",
    "slug": "pulumi-interview-guide",
    "scrapedAt": "2026-07-02T07:25:29.496Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Qdrant",
    "slug": "qdrant-interview-guide",
    "scrapedAt": "2026-07-02T07:14:16.293Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Qualcomm",
    "slug": "qualcomm-interview-guide",
    "scrapedAt": "2026-07-02T07:19:35.514Z",
    "stageCount": 4,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Quora",
    "slug": "quora-interview-guide",
    "scrapedAt": "2026-07-02T07:25:32.137Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Ramp",
    "slug": "ramp",
    "scrapedAt": "2026-07-02T07:18:26.345Z",
    "stageCount": 2,
    "questionCount": 5,
    "tipCount": 11,
    "difficulty": 7.5,
    "topics": [
      "Spend-categorization primitive: given transaction data, implement a deterministic categorization rule engine with overrides",
      "Approval workflow: model routing rules with conditional logic, escalations, and per-customer policy",
      "Idempotent handler for webhook / API requests with duplicate-detection semantics"
    ]
  },
  {
    "company": "Rapid7",
    "slug": "rapid7-interview-guide",
    "scrapedAt": "2026-07-02T07:25:34.707Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Reddit",
    "slug": "reddit-interview",
    "scrapedAt": "2026-07-02T07:25:37.397Z",
    "stageCount": 2,
    "questionCount": 1,
    "tipCount": 23,
    "difficulty": 9,
    "topics": [
      "Tree traversal algorithm",
      "Discussion of time/space complexity",
      "How to optimize for Reddit's use case (millions of comments)"
    ]
  },
  {
    "company": "Redfin",
    "slug": "redfin-interview-guide",
    "scrapedAt": "2026-07-02T07:25:39.827Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Reka AI",
    "slug": "reka-ai-interview-guide",
    "scrapedAt": "2026-07-02T07:14:18.783Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Renaissance Technologies",
    "slug": "renaissance-technologies-interview-guide",
    "scrapedAt": "2026-07-02T07:18:28.829Z",
    "stageCount": 0,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Render",
    "slug": "render-interview-guide",
    "scrapedAt": "2026-07-02T07:25:42.380Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Replicate",
    "slug": "replicate",
    "scrapedAt": "2026-07-02T07:14:21.256Z",
    "stageCount": 2,
    "questionCount": 5,
    "tipCount": 11,
    "difficulty": 7.5,
    "topics": [
      "GPU queue management: implement a scheduler matching incoming requests to available GPU capacity with fairness",
      "Cold-start optimization: implement a warm-pool manager for frequently-accessed models",
      "Streaming response handler: process a model's streaming output, format for API consumers, handle cancellation"
    ]
  },
  {
    "company": "Replit",
    "slug": "replit-interview-guide",
    "scrapedAt": "2026-07-02T07:25:45.003Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Resend",
    "slug": "resend-interview-guide",
    "scrapedAt": "2026-07-02T07:25:47.510Z",
    "stageCount": 0,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Retool",
    "slug": "retool",
    "scrapedAt": "2026-07-02T07:25:49.997Z",
    "stageCount": 2,
    "questionCount": 5,
    "tipCount": 11,
    "difficulty": 7,
    "topics": [
      "Reactive dependency evaluator: given a graph of cells with formulas, re-evaluate only affected cells when inputs change",
      "Safe-evaluator for user-provided JS snippets with timeout and resource limits",
      "Component tree with state propagation: model a simple editor document and operations"
    ]
  },
  {
    "company": "RingCentral",
    "slug": "ringcentral-interview-guide",
    "scrapedAt": "2026-07-02T07:25:52.538Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Riot Games",
    "slug": "riot-games-interview-guide",
    "scrapedAt": "2026-07-02T07:25:55.269Z",
    "stageCount": 4,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Rippling",
    "slug": "rippling",
    "scrapedAt": "2026-07-02T07:25:57.845Z",
    "stageCount": 2,
    "questionCount": 5,
    "tipCount": 11,
    "difficulty": 7,
    "topics": [
      "OO / data modeling: design entities and operations for a specific HR / IT / finance scenario (benefit plan hierarchy, approval chain, device-assignment workflow)",
      "Event-driven workflow: given an event, determine downstream actions with proper ordering and failure handling",
      "Integration-API design: build a client for a hypothetical third-party system with retries, rate limiting, webhook reliability"
    ]
  },
  {
    "company": "Robinhood",
    "slug": "robinhood",
    "scrapedAt": "2026-07-02T07:18:31.401Z",
    "stageCount": 2,
    "questionCount": 5,
    "tipCount": 12,
    "difficulty": 7.5,
    "topics": [
      "Order-state processor: given a stream of order updates from exchanges, maintain accurate order state with idempotency",
      "Tax-lot accounting (FIFO / LIFO / specific-lot) for realized gains calculation",
      "Market-data normalizer (consume from multiple feeds, produce single consistent view with timestamp ordering)"
    ]
  },
  {
    "company": "Roblox",
    "slug": "roblox",
    "scrapedAt": "2026-07-02T07:26:00.533Z",
    "stageCount": 2,
    "questionCount": 5,
    "tipCount": 13,
    "difficulty": 8,
    "topics": [
      "Implement a spatial data structure (quadtree / octree / uniform grid) with query and update operations under performance constraints",
      "State synchronization (given two peer states and a diff, produce minimal update packets)",
      "Interpolation / extrapolation (given sparse position samples, compute smooth continuous values)"
    ]
  },
  {
    "company": "Rubrik",
    "slug": "rubrik-interview-guide",
    "scrapedAt": "2026-07-02T07:26:03.273Z",
    "stageCount": 0,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "RunPod",
    "slug": "runpod-interview-guide",
    "scrapedAt": "2026-07-02T07:26:05.959Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Runway",
    "slug": "runway-interview-guide",
    "scrapedAt": "2026-07-02T07:14:24.586Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Sakana AI",
    "slug": "sakana-ai-interview-guide",
    "scrapedAt": "2026-07-02T07:14:28.493Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Salesforce",
    "slug": "salesforce",
    "scrapedAt": "2026-07-02T07:13:06.181Z",
    "stageCount": 5,
    "questionCount": 1,
    "tipCount": 5,
    "difficulty": null,
    "topics": [
      "API Design: REST, rate limiting, versioning",
      "Scalability: Handling millions of users, multi-tenancy",
      "Reliability: Error handling, monitoring, alerting"
    ]
  },
  {
    "company": "Salesloft",
    "slug": "salesloft-interview-guide",
    "scrapedAt": "2026-07-02T07:26:09.095Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Samsung",
    "slug": "samsung-electronics-interview-guide",
    "scrapedAt": "2026-07-02T07:19:38.027Z",
    "stageCount": 3,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "SAP",
    "slug": "sap",
    "scrapedAt": "2026-07-02T07:30:48.040Z",
    "stageCount": 19,
    "questionCount": 0,
    "tipCount": 22,
    "difficulty": 5.5,
    "topics": [
      "API design and implementation",
      "Database query optimization",
      "Data processing pipelines"
    ]
  },
  {
    "company": "Scale AI",
    "slug": "scale-ai",
    "scrapedAt": "2026-07-02T07:14:31.924Z",
    "stageCount": 2,
    "questionCount": 9,
    "tipCount": 11,
    "difficulty": 7.5,
    "topics": [
      "Data processing with quality constraints (given a stream of labeling tasks, route to labelers with agreement ≥ X, reject low-confidence submissions)",
      "Fuzzy matching or deduplication (cluster near-duplicate text examples, detect overlapping bounding boxes)",
      "Streaming aggregation with windowing (compute rolling inter-annotator agreement, detect drift)"
    ]
  },
  {
    "company": "SentinelOne",
    "slug": "sentinelone-interview-guide",
    "scrapedAt": "2026-07-02T07:26:11.634Z",
    "stageCount": 13,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Sentry",
    "slug": "sentry-interview-guide",
    "scrapedAt": "2026-07-02T07:26:14.182Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "ServiceNow",
    "slug": "servicenow",
    "scrapedAt": "2026-07-02T07:13:11.426Z",
    "stageCount": 2,
    "questionCount": 5,
    "tipCount": 11,
    "difficulty": 7,
    "topics": [
      "OO design: model a workflow / approval system with clean class hierarchy, extensibility, and tests",
      "Implement a small rules engine or DSL evaluator with specific semantics",
      "Extend an existing Java class hierarchy with new functionality, respecting existing patterns"
    ]
  },
  {
    "company": "Shopify",
    "slug": "shopify",
    "scrapedAt": "2026-07-02T07:26:16.758Z",
    "stageCount": 14,
    "questionCount": 0,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Sierra",
    "slug": "sierra-interview-guide",
    "scrapedAt": "2026-07-02T07:14:35.269Z",
    "stageCount": 0,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "SIG Susquehanna",
    "slug": "sig-susquehanna-interview-guide",
    "scrapedAt": "2026-07-02T07:18:34.054Z",
    "stageCount": 8,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "SingleStore",
    "slug": "singlestore-interview-guide",
    "scrapedAt": "2026-07-02T07:26:19.192Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Skyscanner",
    "slug": "skyscanner-interview-guide",
    "scrapedAt": "2026-07-02T07:26:21.728Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Smartsheet",
    "slug": "smartsheet-interview-guide",
    "scrapedAt": "2026-07-02T07:26:24.152Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Snap",
    "slug": "snap",
    "scrapedAt": "2026-07-02T07:26:26.744Z",
    "stageCount": 2,
    "questionCount": 0,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Snowflake",
    "slug": "snowflake",
    "scrapedAt": "2026-07-02T07:26:29.197Z",
    "stageCount": 2,
    "questionCount": 5,
    "tipCount": 11,
    "difficulty": 8,
    "topics": [
      "Implement a database primitive: hash-aggregate operator, sort with spill-to-disk, tournament-sort for external merge",
      "Iterator / generator with backpressure and pull-based semantics",
      "Expression evaluation: given a small expression tree, implement interpretation and then codegen"
    ]
  },
  {
    "company": "Snyk",
    "slug": "snyk-interview-guide",
    "scrapedAt": "2026-07-02T07:26:31.813Z",
    "stageCount": 11,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": [
      "Design a system that scans 1B open-source packages for vulnerabilities.",
      "Design Snyk's dependency-tree analysis (how does a vulnerability in deep dependency affect a project?).",
      "Design a developer-friendly fix-suggestion system (auto-PR creation, version-bump recommendations)."
    ]
  },
  {
    "company": "SoFi",
    "slug": "sofi-interview-guide",
    "scrapedAt": "2026-07-02T07:18:36.745Z",
    "stageCount": 4,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Sony",
    "slug": "sony-interview-guide",
    "scrapedAt": "2026-07-02T07:19:40.484Z",
    "stageCount": 4,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "SoundCloud",
    "slug": "soundcloud-interview-guide",
    "scrapedAt": "2026-07-02T07:26:34.343Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Sourcegraph",
    "slug": "sourcegraph",
    "scrapedAt": "2026-07-02T07:26:37.010Z",
    "stageCount": 2,
    "questionCount": 5,
    "tipCount": 11,
    "difficulty": 7,
    "topics": [
      "AST-walk: given a tree of language tokens, implement queries like \"find all references to this identifier\" or \"find all matches of this pattern\"",
      "Trie-based prefix search with ranking (find identifiers starting with X, ordered by relevance)",
      "Context-window management: given a set of candidate code snippets and a token budget, select the most relevant subset"
    ]
  },
  {
    "company": "SpaceX",
    "slug": "spacex-interview-guide",
    "scrapedAt": "2026-07-02T07:19:42.946Z",
    "stageCount": 13,
    "questionCount": 5,
    "tipCount": 7,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Splunk",
    "slug": "splunk-interview-guide",
    "scrapedAt": "2026-07-02T07:26:39.506Z",
    "stageCount": 13,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": [
      "Parse arbitrary log formats efficiently. Splunk's value proposition includes flexible log parsing; expect questions about regex performance, field extraction at index time vs search time, and how to handle malformed records without rejecting an entire batch.",
      "Top-K queries on a streaming time-series. Heavy hitters algorithms (Misra-Gries, count-min sketch). Discuss the trade-off between exact and approximate counts and when each matters in observability.",
      "Implement a small SPL parser. Splunk Search Processing Language has a pipeline syntax. Senior+ candidates may be asked to design a tokenizer and AST for a subset."
    ]
  },
  {
    "company": "Spotify",
    "slug": "spotify",
    "scrapedAt": "2026-07-02T07:26:41.956Z",
    "stageCount": 4,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Squarespace",
    "slug": "squarespace-interview-guide",
    "scrapedAt": "2026-07-02T07:26:44.392Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Stability AI",
    "slug": "stability-ai-interview-guide",
    "scrapedAt": "2026-07-02T07:14:39.356Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "State Street",
    "slug": "state-street-interview-guide",
    "scrapedAt": "2026-07-02T07:18:39.297Z",
    "stageCount": 4,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Stripe",
    "slug": "stripe",
    "scrapedAt": "2026-07-02T07:18:41.919Z",
    "stageCount": 4,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Substack",
    "slug": "substack-interview-guide",
    "scrapedAt": "2026-07-02T07:26:47.062Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Suno",
    "slug": "suno-interview-guide",
    "scrapedAt": "2026-07-02T07:16:07.728Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Supabase",
    "slug": "supabase",
    "scrapedAt": "2026-07-02T07:26:49.549Z",
    "stageCount": 2,
    "questionCount": 5,
    "tipCount": 11,
    "difficulty": 7,
    "topics": [
      "Implement a row-level-security rule evaluator for a given query",
      "Build a streaming change-data-capture consumer (similar to Supabase Realtime's source layer)",
      "Design an auto-retrying API client with backoff and per-endpoint rate limits"
    ]
  },
  {
    "company": "Sysdig",
    "slug": "sysdig-interview-guide",
    "scrapedAt": "2026-07-02T07:26:51.988Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Tailscale",
    "slug": "tailscale",
    "scrapedAt": "2026-07-02T07:26:54.473Z",
    "stageCount": 0,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Temporal",
    "slug": "temporal-interview-guide",
    "scrapedAt": "2026-07-02T07:26:57.112Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Tempus AI",
    "slug": "tempus-ai-interview-guide",
    "scrapedAt": "2026-07-02T07:16:10.297Z",
    "stageCount": 4,
    "questionCount": 4,
    "tipCount": 0,
    "difficulty": null,
    "topics": [
      "1 system design round (often health-data-flavored)",
      "1 domain depth round for senior+ (genomics pipelines, clinical data integration, ML for medical applications)",
      "1 behavioral round"
    ]
  },
  {
    "company": "Tesla",
    "slug": "tesla",
    "scrapedAt": "2026-07-02T07:19:45.392Z",
    "stageCount": 3,
    "questionCount": 0,
    "tipCount": 5,
    "difficulty": null,
    "topics": [
      "Embedded Systems: C/C++, memory management, real-time operating systems, device drivers",
      "Algorithms: Optimization, path planning, control systems",
      "Data Structures: Arrays, trees, graphs for autonomous driving algorithms"
    ]
  },
  {
    "company": "Toast",
    "slug": "toast-interview-guide",
    "scrapedAt": "2026-07-02T07:27:04.008Z",
    "stageCount": 0,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Together AI",
    "slug": "together-ai",
    "scrapedAt": "2026-07-02T07:16:12.864Z",
    "stageCount": 2,
    "questionCount": 6,
    "tipCount": 10,
    "difficulty": 8,
    "topics": [
      "Implement attention from scratch with appropriate batching considerations",
      "Write a CUDA kernel for a specific operation (element-wise, reduction, softmax)",
      "Design a batching scheduler matching incoming requests to available GPU capacity with fairness"
    ]
  },
  {
    "company": "Tower Research Capital",
    "slug": "tower-research-capital-interview-guide",
    "scrapedAt": "2026-07-02T07:18:44.589Z",
    "stageCount": 0,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Turso",
    "slug": "turso",
    "scrapedAt": "2026-07-02T07:16:15.491Z",
    "stageCount": 2,
    "questionCount": 6,
    "tipCount": 11,
    "difficulty": 7.5,
    "topics": [
      "Implement a simple WAL primitive (append-only log with recovery semantics)",
      "Parse SQLite page format (B-tree leaf or interior page)",
      "Design a replication-stream consumer handling out-of-order arrivals"
    ]
  },
  {
    "company": "Twilio",
    "slug": "twilio-interview-guide",
    "scrapedAt": "2026-07-02T07:27:06.549Z",
    "stageCount": 0,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Two Sigma",
    "slug": "two-sigma",
    "scrapedAt": "2026-07-02T07:18:47.166Z",
    "stageCount": 2,
    "questionCount": 5,
    "tipCount": 11,
    "difficulty": null,
    "topics": [
      "Implement an efficient time-series operation (rolling statistic, expanding window, irregular-time-series resampling)",
      "Process a large structured dataset with bounded memory",
      "Algorithm problems (graphs, trees, dynamic programming) at LeetCode medium-hard difficulty"
    ]
  },
  {
    "company": "Uber",
    "slug": "uber",
    "scrapedAt": "2026-07-02T07:27:11.057Z",
    "stageCount": 3,
    "questionCount": 0,
    "tipCount": 5,
    "difficulty": null,
    "topics": [
      "Graphs: Shortest path algorithms (Dijkstra), routing optimization",
      "Trees: Binary trees, BST operations, tree traversals",
      "Arrays/Strings: Two pointers, sliding window, frequency counting"
    ]
  },
  {
    "company": "UBS",
    "slug": "ubs-interview-guide",
    "scrapedAt": "2026-07-02T07:18:49.747Z",
    "stageCount": 4,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Unity",
    "slug": "unity-interview-guide",
    "scrapedAt": "2026-07-02T07:27:13.608Z",
    "stageCount": 4,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Vanguard",
    "slug": "vanguard-interview-guide",
    "scrapedAt": "2026-07-02T07:18:52.411Z",
    "stageCount": 4,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Veeva Systems",
    "slug": "veeva-systems-interview-guide",
    "scrapedAt": "2026-07-02T07:27:22.886Z",
    "stageCount": 4,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": [
      "1 system design round (often vault / document-management-flavored)",
      "1 domain depth round (Veeva platform internals for senior+)",
      "1 behavioral round"
    ]
  },
  {
    "company": "Vercel",
    "slug": "vercel",
    "scrapedAt": "2026-07-02T07:27:20.361Z",
    "stageCount": 2,
    "questionCount": 8,
    "tipCount": 11,
    "difficulty": 7,
    "topics": [
      "Build a small stateful component or hook with specific async semantics (debounced search, cancellable fetcher, race-condition-safe pagination)",
      "Parse or transform a structured stream (SSR-like render output, log tail, event stream)",
      "Implement a small primitive (retry with exponential backoff and jitter, TTL cache with swr semantics)"
    ]
  },
  {
    "company": "Virtu Financial",
    "slug": "virtu-financial-interview-guide",
    "scrapedAt": "2026-07-02T07:18:55.058Z",
    "stageCount": 0,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Wealthfront",
    "slug": "wealthfront",
    "scrapedAt": "2026-07-02T07:18:57.770Z",
    "stageCount": 2,
    "questionCount": 7,
    "tipCount": 11,
    "difficulty": 8,
    "topics": [
      "Tax-lot matching: given a sell order and a set of lots, select lots to minimize capital-gains impact",
      "Rebalancing optimization: given target allocations and current portfolio, compute trades under constraints (tax, minimum trade size, wash-sale avoidance)",
      "Time-series processing (rolling returns, drawdown, Sharpe ratio calculation from a daily-return stream)"
    ]
  },
  {
    "company": "Weaviate",
    "slug": "weaviate-interview-guide",
    "scrapedAt": "2026-07-02T07:16:18.074Z",
    "stageCount": 10,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Webflow",
    "slug": "webflow-interview-guide",
    "scrapedAt": "2026-07-02T07:27:31.524Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Wells Fargo",
    "slug": "wells-fargo-interview-guide",
    "scrapedAt": "2026-07-02T07:19:00.393Z",
    "stageCount": 4,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Wintermute",
    "slug": "wintermute-interview-guide",
    "scrapedAt": "2026-07-02T07:19:03.290Z",
    "stageCount": 4,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Wise",
    "slug": "wise-interview-guide",
    "scrapedAt": "2026-07-02T07:19:05.909Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Workday",
    "slug": "workday",
    "scrapedAt": "2026-07-02T07:29:43.292Z",
    "stageCount": 2,
    "questionCount": 7,
    "tipCount": 11,
    "difficulty": 6.5,
    "topics": [
      "OO design: model an org chart with managers / reports / dotted-line relationships, a benefits-enrollment system with eligibility rules, a workflow with conditional approvals",
      "Implement a domain-specific primitive (expense-approval chain, time-off balance calculation, tax bracket calculation)",
      "Extend an existing Java codebase: add a feature respecting existing patterns, write tests"
    ]
  },
  {
    "company": "WorkOS",
    "slug": "workos-interview-guide",
    "scrapedAt": "2026-07-02T07:27:36.078Z",
    "stageCount": 0,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "xAI",
    "slug": "xai",
    "scrapedAt": "2026-07-02T07:16:20.745Z",
    "stageCount": 2,
    "questionCount": 5,
    "tipCount": 11,
    "difficulty": 8.5,
    "topics": [
      "Implement attention from scratch with appropriate efficiency (standard question for research engineering)",
      "Parallel-algorithm primitive in CUDA or multi-GPU setting",
      "Data processing at scale &mdash; deduplication, sampling, quality filtering with bounded memory"
    ]
  },
  {
    "company": "XTX Markets",
    "slug": "xtx-markets-interview-guide",
    "scrapedAt": "2026-07-02T07:19:08.623Z",
    "stageCount": 5,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Yelp",
    "slug": "yelp-interview-guide",
    "scrapedAt": "2026-07-02T07:27:40.677Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Zendesk",
    "slug": "zendesk-interview-guide",
    "scrapedAt": "2026-07-02T07:27:43.131Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Zillow",
    "slug": "zillow-interview-guide",
    "scrapedAt": "2026-07-02T07:27:45.602Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Zoom",
    "slug": "zoom",
    "scrapedAt": "2026-07-02T07:29:45.189Z",
    "stageCount": 2,
    "questionCount": 5,
    "tipCount": 11,
    "difficulty": 7,
    "topics": [
      "Real-time buffer management (jitter buffer with bounded memory, reordering out-of-order packets)",
      "Adaptive bitrate logic (given this bandwidth estimate, pick the right layer combination)",
      "Stream aggregation (compute per-meeting statistics from a continuous event stream)"
    ]
  },
  {
    "company": "ZoomInfo",
    "slug": "zoominfo-interview-guide",
    "scrapedAt": "2026-07-02T07:27:50.161Z",
    "stageCount": 1,
    "questionCount": 3,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  },
  {
    "company": "Zscaler",
    "slug": "zscaler-interview-guide",
    "scrapedAt": "2026-07-02T07:27:52.735Z",
    "stageCount": 4,
    "questionCount": 5,
    "tipCount": 0,
    "difficulty": null,
    "topics": []
  }
];

export const INTERVIEW_GUIDE_TOTALS = {
  companies: 301,
  stages: 821,
  questions: 1145,
  withStages: 267,
  withQuestions: 285,
  withTips: 81,
};
