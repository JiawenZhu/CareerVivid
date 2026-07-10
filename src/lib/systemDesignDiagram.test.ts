import { describe, expect, it } from 'vitest';
import {
  createFallbackSystemDesignPlan,
  normalizeSystemDesignPlan,
} from './systemDesignDiagram';

describe('system design diagram plans', () => {
  it('normalizes an AI plan, removes duplicate components, and keeps valid labelled connections', () => {
    const plan = normalizeSystemDesignPlan({
      recommendedStyle: 'layered',
      nodes: [
        { id: 'client', label: 'Web client', layer: 'client' },
        { id: 'gateway', label: 'API gateway', layer: 'edge' },
        { id: 'gateway-copy', label: 'API gateway', layer: 'edge' },
        { id: 'service', label: 'Document service', layer: 'service' },
        { id: 'store', label: 'PostgreSQL document store', layer: 'data' },
      ],
      connections: [
        { from: 'client', to: 'gateway', label: 'send request' },
        { from: 'gateway', to: 'service', label: 'route' },
        { from: 'service', to: 'store', label: 'persist document' },
        { from: 'service', to: 'missing', label: 'ignore this' },
      ],
    });

    expect(plan?.recommendedStyle).toBe('layered');
    expect(plan?.nodes).toHaveLength(4);
    expect(plan?.connections).toEqual([
      { from: 'client', to: 'gateway', label: 'send request' },
      { from: 'gateway', to: 'service', label: 'route' },
      { from: 'service', to: 'store', label: 'persist document' },
    ]);
  });

  it('provides a useful Figma fallback if AI output is unavailable', () => {
    const plan = createFallbackSystemDesignPlan('Design canvas vs DOM vs WebGL tradeoffs for Figma scale.');

    expect(plan.nodes.map((node) => node.label)).toContain('OT / CRDT service');
    expect(plan.connections.some((connection) => connection.label === 'persist data')).toBe(true);
  });
});
