export type SystemDesignDiagramStyle = 'auto' | 'flow' | 'layered' | 'sequence';

export interface SystemDesignDiagramNode {
  id: string;
  label: string;
  layer: 'client' | 'edge' | 'service' | 'data' | 'event';
}

export interface SystemDesignDiagramConnection {
  from: string;
  to: string;
  label: string;
}

export interface SystemDesignDiagramPlan {
  nodes: SystemDesignDiagramNode[];
  connections: SystemDesignDiagramConnection[];
  recommendedStyle?: Exclude<SystemDesignDiagramStyle, 'auto'>;
}

const normalizeKey = (value: unknown) => String(value ?? '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-');

const cleanLabel = (value: unknown, fallback: string) => {
  const label = String(value ?? '').replace(/\s+/g, ' ').trim();
  return (label || fallback).slice(0, 72);
};

const resolveLayer = (value: unknown, label: string): SystemDesignDiagramNode['layer'] => {
  const candidate = `${String(value ?? '')} ${label}`.toLowerCase();
  if (/client|browser|mobile|web app|consumer/.test(candidate)) return 'client';
  if (/gateway|load balanc|cdn|websocket|edge|proxy/.test(candidate)) return 'edge';
  if (/queue|stream|kafka|event|pub.?sub|worker/.test(candidate)) return 'event';
  if (/database|postgres|mysql|redis|cache|storage|store|warehouse/.test(candidate)) return 'data';
  return 'service';
};

const planLooksUsable = (plan: SystemDesignDiagramPlan) =>
  plan.nodes.length >= 3 && plan.connections.length >= 2;

export const createFallbackSystemDesignPlan = (prompt: string): SystemDesignDiagramPlan => {
  const isCollaborativeCanvas = /figma|canvas|dom|webgl|crdt|operational transformation|collaborat/i.test(prompt);
  const nodes = isCollaborativeCanvas
    ? [
      ['client', 'Design client'],
      ['edge', 'WebSocket gateway'],
      ['service', 'Collaboration service'],
      ['service', 'OT / CRDT service'],
      ['data', 'Redis session state'],
      ['data', 'PostgreSQL document store'],
    ]
    : [
      ['client', 'Client application'],
      ['edge', 'API gateway'],
      ['service', 'Application service'],
      ['event', 'Message queue'],
      ['data', 'Redis cache'],
      ['data', 'PostgreSQL'],
    ];

  const normalizedNodes = nodes.map(([layer, label], index) => ({
    id: `node-${index + 1}`,
    label,
    layer: layer as SystemDesignDiagramNode['layer'],
  }));

  return {
    nodes: normalizedNodes,
    connections: [
      { from: 'node-1', to: 'node-2', label: 'connect' },
      { from: 'node-2', to: 'node-3', label: 'route request' },
      { from: 'node-3', to: 'node-4', label: 'publish change' },
      { from: 'node-3', to: 'node-5', label: 'read session' },
      { from: 'node-3', to: 'node-6', label: 'persist data' },
    ],
    recommendedStyle: isCollaborativeCanvas ? 'layered' : 'flow',
  };
};

/**
 * Converts the small, AI-generated architecture plan into a reliable local
 * model. The whiteboard never needs to trust model-produced Excalidraw internals.
 */
export const normalizeSystemDesignPlan = (raw: unknown): SystemDesignDiagramPlan | null => {
  if (!raw || typeof raw !== 'object') return null;
  const source = raw as Record<string, unknown>;
  if (!Array.isArray(source.nodes) || !Array.isArray(source.connections)) return null;

  const seenIds = new Set<string>();
  const seenLabels = new Set<string>();
  const nodeAliases = new Map<string, string>();
  const nodes: SystemDesignDiagramNode[] = [];

  for (const [index, rawNode] of source.nodes.entries()) {
    if (!rawNode || typeof rawNode !== 'object') continue;
    const node = rawNode as Record<string, unknown>;
    const label = cleanLabel(node.label ?? node.name ?? node.component, `Component ${index + 1}`);
    const labelKey = normalizeKey(label);
    if (!labelKey || seenLabels.has(labelKey)) continue;

    const requestedId = normalizeKey(node.id ?? label) || `node-${index + 1}`;
    const id = seenIds.has(requestedId) ? `node-${index + 1}` : requestedId;
    seenIds.add(id);
    seenLabels.add(labelKey);
    nodeAliases.set(requestedId, id);
    nodeAliases.set(labelKey, id);
    nodes.push({ id, label, layer: resolveLayer(node.layer ?? node.kind, label) });
  }

  const nodeIds = new Set(nodes.map((node) => node.id));
  const seenConnections = new Set<string>();
  const connections: SystemDesignDiagramConnection[] = [];
  for (const rawConnection of source.connections) {
    if (!rawConnection || typeof rawConnection !== 'object') continue;
    const connection = rawConnection as Record<string, unknown>;
    const from = nodeAliases.get(normalizeKey(connection.from ?? connection.source));
    const to = nodeAliases.get(normalizeKey(connection.to ?? connection.target));
    if (!from || !to || from === to || !nodeIds.has(from) || !nodeIds.has(to)) continue;
    const connectionKey = `${from}:${to}`;
    if (seenConnections.has(connectionKey)) continue;
    seenConnections.add(connectionKey);
    connections.push({
      from,
      to,
      label: cleanLabel(connection.label ?? connection.action ?? connection.message, 'request'),
    });
  }

  const style = source.recommendedStyle;
  const recommendedStyle = style === 'flow' || style === 'layered' || style === 'sequence' ? style : undefined;
  const plan = { nodes, connections, recommendedStyle };
  return planLooksUsable(plan) ? plan : null;
};
