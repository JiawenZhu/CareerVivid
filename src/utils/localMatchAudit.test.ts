import { describe, expect, it } from 'vitest';
import { buildLocalMatchAudit } from './localMatchAudit';

describe('buildLocalMatchAudit', () => {
  it('separates matched resume skills from missing job keywords', () => {
    const resume = `
      Front End Developer with React, TypeScript, Firebase, documentation, and design systems experience.
      Built responsive UI components and collaborated with product managers.
    `;
    const job = `
      Design responsive web applications using React.js and modern JavaScript.
      Collaborate with product managers. Requirements include RESTful APIs, cross-browser compatibility, accessibility, and performance tuning.
    `;

    const audit = buildLocalMatchAudit(resume, job);

    expect(audit.matchedSkills.map(item => item.term)).toEqual(
      expect.arrayContaining(['React', 'Responsive UI', 'Product collaboration'])
    );
    expect(audit.missingKeywords.map(item => item.term)).toEqual(
      expect.arrayContaining(['REST APIs', 'Cross-browser compatibility', 'Accessibility', 'Performance tuning'])
    );
    expect(audit.score).toBeGreaterThan(0);
    expect(audit.recommendations.length).toBeGreaterThanOrEqual(3);
  });

  it('returns a scanning state for empty job descriptions', () => {
    const audit = buildLocalMatchAudit('React TypeScript', '');

    expect(audit.coverageLabel).toBe('Scanning');
    expect(audit.score).toBe(0);
    expect(audit.matchedSkills).toEqual([]);
  });
});
