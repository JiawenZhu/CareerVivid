import { describe, expect, it } from 'vitest';
import { canGuestUseLocalQuestStage } from './accessPolicy';

describe('canGuestUseLocalQuestStage', () => {
  it.each(['sap', 'figma', 'scale-ai', 'hashicorp', 'mercury', 'vercel', 'google', 'openai', 'unknown-company'])(
    'allows local technical practice for %s',
    (slug) => {
      expect(canGuestUseLocalQuestStage(slug, 'coding')).toBe(true);
      expect(canGuestUseLocalQuestStage(slug, 'system_design')).toBe(true);
    },
  );

  it('keeps AI-assisted stages behind sign-in for every company', () => {
    expect(canGuestUseLocalQuestStage('figma', 'recruiter')).toBe(false);
    expect(canGuestUseLocalQuestStage('figma', 'behavioral')).toBe(false);
    expect(canGuestUseLocalQuestStage('openai', 'screening')).toBe(false);
    expect(canGuestUseLocalQuestStage('unknown-company', 'final')).toBe(false);
  });
});
