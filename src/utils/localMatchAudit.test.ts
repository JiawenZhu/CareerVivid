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
    expect(audit.signalCount).toBe(0);
    expect(audit.matchedSkills).toEqual([]);
  });

  it('does not report a perfect fit for a single overlapping keyword', () => {
    const resume = `
      Front End Developer with JavaScript, React, TypeScript, and documentation experience.
      Built responsive web applications and managed technical content workflows.
    `;
    const job = `
      Nurse-Illinois Hope Houses. Full job description.
      Current Illinois Registered Nurse license required.
      AA/AS degree in Nursing required.
      Provides ongoing medical assessment, case management, medication administration, and patient care.
      Behavioral/Mental Health setting experience and experience working with youth preferred.
      Completes timely and accurate documentation required for the position.
    `;

    const audit = buildLocalMatchAudit(resume, job);

    expect(audit.matchedSkills.map(item => item.term)).toContain('Documentation');
    expect(audit.missingKeywords.map(item => item.term)).toEqual(
      expect.arrayContaining(['RN License', 'Nursing', 'Medication administration', 'Behavioral health'])
    );
    expect(audit.signalCount).toBeGreaterThanOrEqual(8);
    expect(audit.score).toBeLessThan(35);
    expect(audit.coverageLabel).toBe('Large gap');
  });

  it('uses a minimum signal floor for sparse job text', () => {
    const audit = buildLocalMatchAudit(
      'Documentation and content strategy',
      'Full job description. Documentation required for this role.'
    );

    expect(audit.signalCount).toBeGreaterThan(1);
    expect(audit.score).toBeLessThan(100);
    expect(audit.coverageLabel).not.toBe('Strong local fit');
  });
});
