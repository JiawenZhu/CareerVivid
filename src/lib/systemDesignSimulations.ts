export type SystemDesignScenarioId =
  | 'interview-framework'
  | 'capacity-estimation'
  | 'api-data-models'
  | 'core-building-blocks'
  | 'cache-rate-limiting'
  | 'data-at-scale'
  | 'async-event-processing'
  | 'reliability-multi-region'
  | 'real-time-systems'
  | 'feeds-search-analytics'
  | 'distributed-kv'
  | 'senior-capstone';

export type SimulationNode = {
  id: string;
  label: string;
  detail: string;
  state: 'idle' | 'active' | 'healthy' | 'warning' | 'blocked';
};

export type SystemDesignStep = {
  title: string;
  narrative: string;
  ariaDescription: string;
  nodes: SimulationNode[];
  metrics: Array<{ label: string; value: string; tone?: 'neutral' | 'good' | 'warn' }>;
};

export type SystemDesignScenario = {
  id: SystemDesignScenarioId;
  title: string;
  input: { label: string; min: number; max: number; step: number; initial: number; unit: string };
  steps: (value: number) => SystemDesignStep[];
};

const node = (id: string, label: string, detail: string, state: SimulationNode['state'] = 'idle'): SimulationNode => ({ id, label, detail, state });
const metric = (label: string, value: string, tone: 'neutral' | 'good' | 'warn' = 'neutral') => ({ label, value, tone });
const ms = (value: number) => `${Math.round(value)} ms`;
const compact = (value: number) => value >= 1000 ? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k` : `${Math.round(value)}`;

const sharedSteps = (
  title: string,
  value: number,
  states: Array<{ label: string; narrative: string; nodes: SimulationNode[]; metrics: SystemDesignStep['metrics'] }>,
): SystemDesignStep[] => states.map((state, index) => ({
  title: `${title} · ${index + 1}`,
  narrative: state.narrative,
  ariaDescription: `${state.label}. ${state.nodes.map((item) => `${item.label}: ${item.detail}`).join('. ')}. ${state.metrics.map((item) => `${item.label} ${item.value}`).join(', ')}. Input value ${value}.`,
  nodes: state.nodes,
  metrics: state.metrics,
}));

export const SYSTEM_DESIGN_SCENARIOS: Record<SystemDesignScenarioId, SystemDesignScenario> = {
  'interview-framework': {
    id: 'interview-framework',
    title: 'Request flow under an interview clock',
    input: { label: 'Peak requests per second', min: 100, max: 2000, step: 100, initial: 600, unit: 'RPS' },
    steps: (rps) => sharedSteps('Scope before components', rps, [
      { label: 'Clarify', narrative: 'Start by bounding users, peak traffic, consistency, latency, and failure expectations before choosing technology.', nodes: [node('client', 'Client', 'sends a create request', 'active'), node('api', 'API boundary', 'requirements not yet fixed', 'warning'), node('store', 'Primary store', 'not selected')], metrics: [metric('Peak traffic', `${compact(rps)} RPS`), metric('Latency target', 'clarify'), metric('Consistency', 'clarify')] },
      { label: 'Happy path', narrative: 'Trace one request end-to-end. Every box must have a responsibility and every arrow must carry a concrete operation.', nodes: [node('client', 'Client', 'POST /resource', 'active'), node('api', 'API boundary', 'authenticates and validates', 'healthy'), node('store', 'Primary store', 'writes durable record', 'healthy')], metrics: [metric('Peak traffic', `${compact(rps)} RPS`), metric('Write path', 'synchronous'), metric('p95', ms(120), 'good')] },
      { label: 'Scale decision', narrative: 'Only add a component when it relieves a stated constraint. Here, stateless APIs can scale horizontally.', nodes: [node('client', 'Client', 'requests arrive', 'active'), node('lb', 'Load balancer', 'spreads traffic', 'healthy'), node('api', 'API fleet', `${Math.ceil(rps / 300)} instances at 300 RPS each`, 'healthy'), node('store', 'Primary store', 'durable writes', 'healthy')], metrics: [metric('Fleet size', `${Math.ceil(rps / 300)} instances`), metric('Instance load', '300 RPS', 'good'), metric('p95', ms(135), 'good')] },
      { label: 'Failure follow-up', narrative: 'Name the first dependency that can fail and tell the interviewer what the caller sees while it recovers.', nodes: [node('client', 'Client', 'receives bounded error', 'healthy'), node('lb', 'Load balancer', 'removes unhealthy API', 'healthy'), node('api', 'API fleet', 'one instance unavailable', 'warning'), node('store', 'Primary store', 'preserves acknowledged writes', 'healthy')], metrics: [metric('Error budget', '0.1%'), metric('Retry policy', 'bounded'), metric('Data loss', '0', 'good')] },
    ]),
  },
  'capacity-estimation': {
    id: 'capacity-estimation',
    title: 'Capacity: QPS, storage, and headroom',
    input: { label: 'Daily active users', min: 10000, max: 1000000, step: 10000, initial: 200000, unit: 'DAU' },
    steps: (dau) => {
      const peak = Math.ceil(dau * 12 / 86400 * 4);
      const storage = (dau * 12 * 0.8 / 1024).toFixed(1);
      return sharedSteps('Estimate, then add headroom', dau, [
        { label: 'Traffic assumption', narrative: 'Convert a stated product behavior into a peak rate. State the multiplier instead of hiding it.', nodes: [node('users', 'Users', `${compact(dau)} daily active`, 'active'), node('requests', 'Requests', '12 actions per user per day', 'healthy'), node('peak', 'Peak window', '4x average traffic', 'warning')], metrics: [metric('Average QPS', `${compact(Math.ceil(peak / 4))}`), metric('Peak QPS', `${compact(peak)}`), metric('Assumption', '12 actions / user')] },
        { label: 'Storage estimate', narrative: 'Separate durable record size from caches, indexes, and replication. These grow differently.', nodes: [node('write', 'Write stream', `${compact(peak * 0.2)} writes / sec`, 'active'), node('record', 'Record', '0.8 KB durable payload', 'healthy'), node('storage', 'Storage', 'append + index growth', 'healthy')], metrics: [metric('Daily data', `${storage} GB`), metric('Replica factor', '3x'), metric('One-year raw', `${(Number(storage) * 365 / 1024).toFixed(1)} TB`)] },
        { label: 'Headroom', narrative: 'Capacity must include deployment and incident margin; sizing to the average is an outage plan.', nodes: [node('fleet', 'API fleet', 'keeps spare capacity', 'healthy'), node('queue', 'Ingress queue', 'absorbs short bursts', 'healthy'), node('alert', 'Capacity alert', 'fires before saturation', 'healthy')], metrics: [metric('Target utilization', '60%', 'good'), metric('Burst headroom', '2.5x', 'good'), metric('Peak QPS', `${compact(peak)}`)] },
        { label: 'Cost trade-off', narrative: 'Say which estimate is uncertain and which measurement you would collect next to avoid premature overbuilding.', nodes: [node('meter', 'Telemetry', 'measures payload and arrival distribution', 'active'), node('fleet', 'API fleet', 'scales on queue age', 'healthy'), node('storage', 'Storage', 'tiered by retention', 'healthy')], metrics: [metric('Unknown to measure', 'payload p99'), metric('Scale trigger', 'queue age'), metric('Cost driver', 'retention')] },
      ]);
    },
  },
  'api-data-models': {
    id: 'api-data-models',
    title: 'API contracts and data ownership',
    input: { label: 'Writes per second', min: 10, max: 1000, step: 10, initial: 180, unit: 'writes/s' },
    steps: (writes) => sharedSteps('Make the data contract explicit', writes, [
      { label: 'Contract', narrative: 'Define one idempotent mutation and identify its request key before discussing storage.', nodes: [node('client', 'Client', 'POST /links with idempotency key', 'active'), node('api', 'API', 'validates schema and auth', 'healthy'), node('ledger', 'Write record', 'deduplicates request key', 'healthy')], metrics: [metric('Write rate', `${writes}/s`), metric('Idempotency window', '24 h'), metric('Response', '201 or prior result')] },
      { label: 'Ownership', narrative: 'Give each service one source of truth. Derived indexes must be rebuildable from the durable record.', nodes: [node('api', 'Link service', 'owns link record', 'healthy'), node('db', 'Primary database', 'link_id -> destination', 'healthy'), node('index', 'Read index', 'derived lookup projection', 'idle')], metrics: [metric('Primary key', 'link_id'), metric('Read model', 'derived'), metric('Consistency', 'read-your-write')] },
      { label: 'Read path', narrative: 'Return the smallest useful read model and avoid joining across unowned databases in the request path.', nodes: [node('reader', 'Reader', 'GET /{code}', 'active'), node('cache', 'Cache', 'keyed by code', 'healthy'), node('db', 'Primary database', 'fallback lookup', 'healthy')], metrics: [metric('Read/write ratio', '100:1'), metric('Cacheable', 'yes', 'good'), metric('p95', ms(35), 'good')] },
      { label: 'Evolution', narrative: 'Version semantics, not tables. Additive fields and tolerant readers keep independent clients deployable.', nodes: [node('v1', 'Older client', 'ignores new field', 'healthy'), node('api', 'API', 'accepts optional metadata', 'healthy'), node('db', 'Primary database', 'stores versioned payload', 'healthy')], metrics: [metric('Migration', 'expand/contract'), metric('Breaking change', 'avoid'), metric('Rollback', 'compatible', 'good')] },
    ]),
  },
  'core-building-blocks': {
    id: 'core-building-blocks',
    title: 'Load balancing, storage, and asynchronous work',
    input: { label: 'Latency target', min: 50, max: 500, step: 25, initial: 150, unit: 'ms p95' },
    steps: (target) => sharedSteps('Choose primitives for a constraint', target, [
      { label: 'Ingress', narrative: 'A load balancer owns routing and health, not application state. Keep the request handler stateless.', nodes: [node('lb', 'Load balancer', 'health-aware routing', 'active'), node('api-a', 'API A', 'stateless handler', 'healthy'), node('api-b', 'API B', 'stateless handler', 'healthy')], metrics: [metric('p95 target', ms(target)), metric('Routing', 'least loaded'), metric('Session state', 'externalized')] },
      { label: 'Storage choice', narrative: 'Match the store to access pattern: indexed lookup, ordered log, blob object, or relationship traversal.', nodes: [node('api', 'API', 'chooses operation', 'active'), node('kv', 'Key-value store', 'hot lookup', 'healthy'), node('object', 'Object storage', 'large immutable payload', 'healthy')], metrics: [metric('Lookup', 'O(1) expected'), metric('Blob durability', 'multi-AZ'), metric('p95 target', ms(target))] },
      { label: 'Slow work', narrative: 'Move work that does not affect the immediate response onto a durable queue and expose its eventual status.', nodes: [node('api', 'API', 'returns job id', 'healthy'), node('queue', 'Durable queue', 'buffers work', 'active'), node('worker', 'Worker', 'processes asynchronously', 'healthy')], metrics: [metric('Client response', ms(Math.min(target, 80)), 'good'), metric('Delivery', 'at least once'), metric('Status', 'poll or callback')] },
      { label: 'Constraint check', narrative: 'Verify the primitive did not violate the stated latency, durability, or consistency requirement.', nodes: [node('trace', 'Trace', 'correlates request and job', 'active'), node('queue', 'Durable queue', 'persists before ack', 'healthy'), node('store', 'System of record', 'commits result', 'healthy')], metrics: [metric('Durability', 'ack after persist', 'good'), metric('p95 sync', ms(Math.min(target, 80)), 'good'), metric('Async SLA', 'queue age')] },
    ]),
  },
  'cache-rate-limiting': {
    id: 'cache-rate-limiting',
    title: 'Cache hit, miss, TTL, and admission control',
    input: { label: 'Cache TTL', min: 10, max: 300, step: 10, initial: 60, unit: 'seconds' },
    steps: (ttl) => {
      const hitRate = Math.max(55, Math.min(95, 62 + ttl / 4));
      return sharedSteps('Protect the durable path', ttl, [
        { label: 'Cache hit', narrative: 'A valid cached entry serves the read without contacting the primary database.', nodes: [node('client', 'Client', 'GET popular key', 'active'), node('cache', 'Cache', `fresh entry, TTL ${ttl}s`, 'healthy'), node('db', 'Primary database', 'not queried', 'idle')], metrics: [metric('Cache hit', 'yes', 'good'), metric('TTL remaining', `${ttl}s`), metric('p95', ms(12), 'good')] },
        { label: 'Cache miss', narrative: 'A miss reads the primary source, then populates the cache with an explicit expiry policy.', nodes: [node('client', 'Client', 'GET cold key', 'active'), node('cache', 'Cache', 'miss', 'warning'), node('db', 'Primary database', 'authoritative lookup', 'active')], metrics: [metric('Cache hit rate', `${Math.round(hitRate)}%`), metric('Fill policy', 'read-through'), metric('p95', ms(72))] },
        { label: 'Rate limit', narrative: 'Rate limits are evaluated before expensive work. A distributed limiter needs a consistent key and bounded error.', nodes: [node('client', 'Client', 'request burst', 'active'), node('limiter', 'Token bucket', 'per user + route', 'healthy'), node('api', 'API', 'only admitted requests', 'healthy')], metrics: [metric('Bucket', '100 tokens'), metric('Refill', '20/s'), metric('Rejected', '429 bounded', 'good')] },
        { label: 'Expiry trade-off', narrative: 'Longer TTL increases hit rate but expands staleness. State the invalidation trigger for writes.', nodes: [node('writer', 'Writer', 'changes source', 'active'), node('invalidate', 'Invalidation event', 'deletes key', 'healthy'), node('cache', 'Cache', `fallback expiry ${ttl}s`, 'healthy')], metrics: [metric('Estimated hit rate', `${Math.round(hitRate)}%`, 'good'), metric('Staleness bound', `${ttl}s`), metric('Write invalidation', 'event-driven')] },
      ]);
    },
  },
  'data-at-scale': {
    id: 'data-at-scale',
    title: 'Sharding, rebalancing, and replication lag',
    input: { label: 'Shard count', min: 2, max: 16, step: 1, initial: 4, unit: 'shards' },
    steps: (shards) => {
      const perShard = Math.ceil(120000 / shards);
      return sharedSteps('Partition without losing the key', shards, [
        { label: 'Shard key', narrative: 'Choose a shard key from the dominant access path and test it against skew, locality, and resharding.', nodes: [node('router', 'Shard router', 'hashes tenant_id', 'active'), node('shard-a', 'Shard A', 'hash range', 'healthy'), node('shard-b', 'Shard B', 'hash range', 'healthy')], metrics: [metric('Shards', `${shards}`), metric('Records / shard', compact(perShard)), metric('Key', 'tenant_id')] },
        { label: 'Hot shard', narrative: 'A popular tenant creates skew even with a correct hash. Detect it by per-shard load, not fleet average.', nodes: [node('router', 'Shard router', 'routes hot tenant', 'active'), node('hot', 'Shard 2', 'hot partition', 'warning'), node('other', 'Other shards', 'under target', 'healthy')], metrics: [metric('Hot shard load', '92%', 'warn'), metric('Fleet average', '48%'), metric('Mitigation', 'salt or split')] },
        { label: 'Rebalance', narrative: 'Move a bounded key range while reads are dual-routed and writes are fenced by an ownership epoch.', nodes: [node('source', 'Source shard', 'streams key range', 'active'), node('target', 'Target shard', 'catches up changes', 'healthy'), node('router', 'Router', 'dual reads during move', 'healthy')], metrics: [metric('Migration state', 'dual read'), metric('Write fence', 'epoch'), metric('Cutover', 'after catch-up')] },
        { label: 'Replication lag', narrative: 'Replica reads are useful only when the product tolerates their staleness. Route read-your-write to primary.', nodes: [node('primary', 'Primary', 'acknowledges write', 'healthy'), node('replica', 'Replica', 'applies log behind primary', 'warning'), node('reader', 'Reader', 'chooses consistency mode', 'active')], metrics: [metric('Replica lag', `${Math.max(35, Math.round(220 / shards))} ms`, 'warn'), metric('Read-your-write', 'primary'), metric('Eventual reads', 'replica')] },
      ]);
    },
  },
  'async-event-processing': {
    id: 'async-event-processing',
    title: 'Partitions, consumer lag, retries, and DLQ',
    input: { label: 'Consumer throughput', min: 100, max: 2000, step: 100, initial: 600, unit: 'events/s' },
    steps: (throughput) => {
      const ingress = 900;
      const lag = Math.max(0, ingress - throughput);
      return sharedSteps('Keep asynchronous work observable', throughput, [
        { label: 'Partition', narrative: 'Partition by an ordering key when one consumer must see one key in order, then scale across keys.', nodes: [node('producer', 'Producer', `${ingress} events/s`, 'active'), node('partitions', 'Topic partitions', 'keyed by notification_id', 'healthy'), node('consumer', 'Consumer group', `${throughput} events/s`, throughput >= ingress ? 'healthy' : 'warning')], metrics: [metric('Partitions', '6'), metric('Ingress', `${ingress}/s`), metric('Consumer rate', `${throughput}/s`)] },
        { label: 'Lag', narrative: 'Lag is a time-to-user signal, not just a count. Add consumers only up to the partition count.', nodes: [node('topic', 'Topic', 'retains unprocessed events', 'warning'), node('consumer', 'Consumers', `${Math.min(6, Math.max(1, Math.ceil(throughput / 150)))} active workers`, lag ? 'warning' : 'healthy'), node('monitor', 'Lag monitor', 'alerts on age', 'active')], metrics: [metric('Backlog growth', `${lag}/s`, lag ? 'warn' : 'good'), metric('Oldest event', lag ? 'rising' : 'stable', lag ? 'warn' : 'good'), metric('Scale ceiling', '6 consumers')] },
        { label: 'Retry', narrative: 'At-least-once delivery means handlers must be idempotent. Retry transient failures with a bounded schedule.', nodes: [node('consumer', 'Consumer', 'handler timeout', 'warning'), node('retry', 'Retry topic', 'exponential delay', 'active'), node('store', 'Idempotency store', 'deduplicates side effect', 'healthy')], metrics: [metric('Delivery', 'at least once'), metric('Retry max', '5'), metric('Idempotency key', 'event_id')] },
        { label: 'DLQ', narrative: 'Poison events leave the hot path after bounded retries, preserving evidence for repair without blocking the partition.', nodes: [node('retry', 'Retry topic', 'retry budget exhausted', 'warning'), node('dlq', 'Dead-letter queue', 'retains failure context', 'healthy'), node('operator', 'Operator', 'replays after fix', 'active')], metrics: [metric('DLQ policy', 'after 5 attempts'), metric('Replay', 'explicit'), metric('Data loss', '0', 'good')] },
      ]);
    },
  },
  'reliability-multi-region': {
    id: 'reliability-multi-region',
    title: 'Backpressure, circuit breakers, and regional failover',
    input: { label: 'Replication factor', min: 2, max: 5, step: 1, initial: 3, unit: 'regions' },
    steps: (regions) => sharedSteps('Fail safely before failing globally', regions, [
      { label: 'Backpressure', narrative: 'When a dependency slows down, bound concurrency and queue age so overload becomes a controlled product decision.', nodes: [node('api', 'API', 'limits in-flight calls', 'active'), node('queue', 'Bounded queue', 'rejects before memory exhausts', 'healthy'), node('worker', 'Worker', 'slower than ingress', 'warning')], metrics: [metric('Queue cap', '10k'), metric('Admission', 'bounded'), metric('User response', 'retry later')] },
      { label: 'Circuit breaker', narrative: 'Open the circuit after a rolling failure threshold, serve a safe fallback, and probe recovery deliberately.', nodes: [node('api', 'API', 'dependency calls', 'active'), node('breaker', 'Circuit breaker', 'open after 5 failures', 'warning'), node('dependency', 'Dependency', 'timeouts isolated', 'blocked')], metrics: [metric('Failure window', '10 s'), metric('Fallback', 'cached status'), metric('Cascade risk', 'contained', 'good')] },
      { label: 'Replica quorum', narrative: 'Choose an acknowledgement rule that maps to the requested durability. More regions improve survival but extend the write path.', nodes: [node('writer', 'Writer', 'submits mutation', 'active'), node('region-a', 'Region A', 'primary copy', 'healthy'), node('region-b', 'Region B', 'replica copy', 'healthy'), node('region-c', 'Region C', regions >= 3 ? 'replica copy' : 'not configured', regions >= 3 ? 'healthy' : 'idle')], metrics: [metric('Regions', `${regions}`), metric('Write quorum', `${Math.floor(regions / 2) + 1}`), metric('Durability', 'quorum ack')] },
      { label: 'Failover', narrative: 'A regional failure needs health detection, traffic steering, and an explicit data-consistency posture during recovery.', nodes: [node('dns', 'Traffic manager', 'stops routing failed region', 'active'), node('failed', 'Region A', 'unavailable', 'blocked'), node('survivor', 'Healthy regions', 'serve traffic', 'healthy')], metrics: [metric('RTO', '< 5 min'), metric('RPO', 'quorum-bound'), metric('Mode', 'degraded write policy')] },
    ]),
  },
  'real-time-systems': {
    id: 'real-time-systems',
    title: 'Real-time chat, presence, and fan-out',
    input: { label: 'Members in active room', min: 10, max: 5000, step: 10, initial: 400, unit: 'members' },
    steps: (members) => sharedSteps('Bound fan-out and connection state', members, [
      { label: 'Connection', narrative: 'A gateway owns WebSocket connections; it does not own durable chat history.', nodes: [node('client', 'Chat client', 'WebSocket connected', 'active'), node('gateway', 'Connection gateway', 'tracks socket session', 'healthy'), node('router', 'Room router', 'maps room to partition', 'healthy')], metrics: [metric('Active room', `${compact(members)} members`), metric('Transport', 'WebSocket'), metric('Heartbeat', '30 s')] },
      { label: 'Persist before fan-out', narrative: 'Append the message durably before publishing it so reconnecting clients can fill a gap.', nodes: [node('sender', 'Sender', 'submits message', 'active'), node('log', 'Message log', 'durable ordered append', 'healthy'), node('fanout', 'Fan-out service', 'reads committed event', 'healthy')], metrics: [metric('Delivery', 'at least once'), metric('Ordering', 'per room'), metric('Message id', 'dedupe key')] },
      { label: 'Fan-out', narrative: 'Deliver to connected members through gateway shards and let offline users catch up from the durable log.', nodes: [node('fanout', 'Fan-out service', `publishes to ${compact(members)} sessions`, 'active'), node('gateways', 'Gateway fleet', 'pushes to local sockets', 'healthy'), node('log', 'Message log', 'offline catch-up source', 'healthy')], metrics: [metric('Fan-out work', `${compact(members)} deliveries`), metric('Offline path', 'log replay'), metric('p99 delivery', ms(180))] },
      { label: 'Presence failure', narrative: 'Presence is best-effort and expires naturally. Do not make message durability depend on a heartbeat.', nodes: [node('presence', 'Presence store', 'TTL expired for one session', 'warning'), node('log', 'Message log', 'still accepts messages', 'healthy'), node('client', 'Client', 'reconnects and resyncs', 'active')], metrics: [metric('Presence consistency', 'eventual'), metric('Message durability', 'unchanged', 'good'), metric('Resync', 'cursor based')] },
    ]),
  },
  'feeds-search-analytics': {
    id: 'feeds-search-analytics',
    title: 'Feeds, autocomplete, and metrics pipelines',
    input: { label: 'Query traffic', min: 100, max: 20000, step: 100, initial: 2400, unit: 'QPS' },
    steps: (qps) => sharedSteps('Separate serving from computation', qps, [
      { label: 'Feed fan-out', narrative: 'A feed write can fan out on write for ordinary accounts while large accounts use fan-out on read.', nodes: [node('post', 'Post event', 'new content', 'active'), node('fanout', 'Fan-out workers', 'writes follower inboxes', 'healthy'), node('celebrity', 'Large account path', 'deferred merge on read', 'warning')], metrics: [metric('Policy', 'hybrid fan-out'), metric('Freshness', '< 5 s'), metric('Celebrity cost', 'read-time merge')] },
      { label: 'Autocomplete', narrative: 'Serve a small ranked prefix index from memory and update it asynchronously from query and document events.', nodes: [node('query', 'Search client', 'prefix "sys"', 'active'), node('index', 'Prefix index', 'top ranked candidates', 'healthy'), node('ranker', 'Ranker', 'applies popularity + locale', 'healthy')], metrics: [metric('Query QPS', `${compact(qps)}`), metric('p95', ms(35), 'good'), metric('Index update', 'async')] },
      { label: 'Metrics pipeline', narrative: 'Events are batched, partitioned, and aggregated off the serving path so observability does not become customer latency.', nodes: [node('sdk', 'SDK', 'emits metric', 'active'), node('stream', 'Metrics stream', 'partitioned by series', 'healthy'), node('aggregator', 'Aggregator', 'rolls up windows', 'healthy')], metrics: [metric('Cardinality guard', 'enforced'), metric('Aggregation', '10 s windows'), metric('Serving impact', 'none', 'good')] },
      { label: 'Cost guardrail', narrative: 'Bound storage and query cost with retention, sampling, and cardinality controls that preserve the signals used for decisions.', nodes: [node('stream', 'Metrics stream', 'drops invalid labels', 'healthy'), node('store', 'Time-series store', 'retention tiers', 'healthy'), node('alert', 'Alert engine', 'uses aggregates', 'active')], metrics: [metric('Hot retention', '14 days'), metric('Cold retention', '1 year'), metric('Sampling', 'tail aware')] },
    ]),
  },
  'distributed-kv': {
    id: 'distributed-kv',
    title: 'Distributed KV: replication, quorum, and repair',
    input: { label: 'Replication factor', min: 3, max: 7, step: 1, initial: 3, unit: 'replicas' },
    steps: (replicas) => {
      const quorum = Math.floor(replicas / 2) + 1;
      return sharedSteps('Make consistency a product choice', replicas, [
        { label: 'Route key', narrative: 'A consistent hash ring maps one key to a replica set. Virtual nodes smooth ownership changes.', nodes: [node('client', 'Client', 'PUT account:42', 'active'), node('ring', 'Hash ring', `selects ${replicas} replicas`, 'healthy'), node('owners', 'Replica set', 'owns key range', 'healthy')], metrics: [metric('Replication', `${replicas}x`), metric('Virtual nodes', 'enabled'), metric('Partition key', 'account_id')] },
        { label: 'Quorum write', narrative: 'A write completes after the declared quorum. The remaining replicas converge from the log or hinted handoff.', nodes: [node('coordinator', 'Coordinator', 'sends mutation', 'active'), node('replicas', 'Replica set', `${quorum}/${replicas} acknowledgements`, 'healthy'), node('log', 'Replication log', 'tracks outstanding copy', 'healthy')], metrics: [metric('Write quorum', `${quorum}/${replicas}`), metric('Durability', 'quorum ack', 'good'), metric('Tail replica', 'async')] },
        { label: 'Read consistency', narrative: 'A quorum read detects conflicting versions; a fast local read trades that guarantee for latency.', nodes: [node('reader', 'Reader', 'requests key', 'active'), node('replicas', 'Replica set', `${quorum} responses compared`, 'healthy'), node('resolver', 'Version resolver', 'chooses causal winner', 'healthy')], metrics: [metric('Strong read', `${quorum} responses`), metric('Fast read', 'one replica'), metric('Conflict', 'versioned')] },
        { label: 'Repair', narrative: 'Background anti-entropy and read repair reduce divergence. Explain what happens during a partition before promising consistency.', nodes: [node('a', 'Replica A', 'new version', 'healthy'), node('b', 'Replica B', 'missed write', 'warning'), node('repair', 'Repair worker', 'merges versions', 'active')], metrics: [metric('Repair', 'anti-entropy'), metric('Partition mode', 'explicit policy'), metric('Replica lag', 'monitored')] },
      ]);
    },
  },
  'senior-capstone': {
    id: 'senior-capstone',
    title: 'Job scheduler capstone: changing requirements',
    input: { label: 'Scheduled jobs per minute', min: 100, max: 20000, step: 100, initial: 3000, unit: 'jobs/min' },
    steps: (jobs) => sharedSteps('Adapt the design when the prompt changes', jobs, [
      { label: 'Initial requirement', narrative: 'Schedule one-time and recurring jobs with at-least-once execution. Begin with explicit timing, idempotency, and status requirements.', nodes: [node('api', 'Scheduler API', 'creates schedule', 'active'), node('store', 'Schedule store', 'durable next_run_at', 'healthy'), node('dispatcher', 'Dispatcher', 'finds due schedules', 'healthy')], metrics: [metric('Arrival', `${compact(jobs)} jobs/min`), metric('Execution', 'at least once'), metric('Clock source', 'UTC')] },
      { label: 'Dispatch', narrative: 'Claim due work with a lease, enqueue it durably, and make execution idempotent so retries do not duplicate side effects.', nodes: [node('dispatcher', 'Dispatcher', 'claims lease', 'active'), node('queue', 'Execution queue', 'durable job event', 'healthy'), node('worker', 'Worker', 'idempotent handler', 'healthy')], metrics: [metric('Lease', '30 s'), metric('Dedup key', 'schedule + run time'), metric('Queue age', '< 10 s', 'good')] },
      { label: 'Requirement change', narrative: 'The interviewer now requires exactly-once billing and tenant time zones. Separate observable execution from the billing side effect.', nodes: [node('scheduler', 'Scheduler', 'emits planned run', 'healthy'), node('billing', 'Billing ledger', 'idempotent charge key', 'active'), node('timezone', 'Time-zone rules', 'resolves local schedule', 'warning')], metrics: [metric('New constraint', 'billing exactly once'), metric('Time zones', 'IANA rules'), metric('Design change', 'ledger boundary')] },
      { label: 'Failure drill', narrative: 'A worker dies after the external call but before acknowledgement. Explain the evidence, retry behavior, and reconciliation path.', nodes: [node('worker', 'Worker', 'lost after external call', 'blocked'), node('ledger', 'Ledger', 'checks idempotency key', 'healthy'), node('reconciler', 'Reconciler', 'repairs uncertain state', 'active')], metrics: [metric('Retry', 'safe via key'), metric('Audit trail', 'durable'), metric('Manual repair', 'bounded')] },
    ]),
  },
};

export const getSystemDesignScenario = (id: string | undefined): SystemDesignScenario | undefined =>
  id ? SYSTEM_DESIGN_SCENARIOS[id as SystemDesignScenarioId] : undefined;

/** Pure deterministic step generator for widget rendering and focused tests. */
export const buildSystemDesignSteps = (scenarioId: SystemDesignScenarioId, value: number): SystemDesignStep[] =>
  SYSTEM_DESIGN_SCENARIOS[scenarioId].steps(value);
