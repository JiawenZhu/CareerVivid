import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  COMPANY_CATEGORY,
  COMPANY_CATEGORIES,
  getCategoryStageQuestions,
  getCompanyCategory,
  CATEGORY_SYSTEM_DESIGN_ORDER,
} from './companyCategories';

const guidesDir = path.resolve(__dirname, '../../data/interview-guides');
const slugs = fs
  .readdirSync(guidesDir)
  .filter((f) => f.endsWith('.json') && f !== '_index.json')
  .map((f) => {
    const d = JSON.parse(fs.readFileSync(path.join(guidesDir, f), 'utf8'));
    return d.company ? d.slug : null;
  })
  .filter(Boolean) as string[];

describe('company category taxonomy', () => {
  it('maps every bundled guide slug to a category', () => {
    const missing = slugs.filter((s) => !COMPANY_CATEGORY[s]);
    expect(missing).toEqual([]);
  });

  it('resolves a category for every guide (map or keyword fallback)', () => {
    for (const slug of slugs) {
      const cat = getCompanyCategory({ slug, company: slug });
      expect(COMPANY_CATEGORIES).toContain(cat);
    }
  });

  it('gives every category a screening/behavioral/values/final bank across all difficulty tiers', () => {
    for (const cat of COMPANY_CATEGORIES) {
      for (const stage of ['screening', 'behavioral', 'values', 'final'] as const) {
        for (const difficulty of ['easy', 'medium', 'hard'] as const) {
          const qs = getCategoryStageQuestions('Acme', cat, stage, difficulty);
          // chosen tier (5) + backfill from the other two tiers (10) = 15
          expect(qs.length, `${cat}/${stage}/${difficulty}`).toBe(15);
          for (const q of qs) {
            expect(q).not.toContain('{company}');
            expect(q.trim().length).toBeGreaterThan(10);
          }
        }
      }
    }
  });

  it('leads with the requested difficulty tier', () => {
    const easy = getCategoryStageQuestions('Acme', 'quant-trading', 'values', 'easy');
    const hard = getCategoryStageQuestions('Acme', 'quant-trading', 'values', 'hard');
    // the first question should differ between easy and hard requests
    expect(easy[0]).not.toBe(hard[0]);
  });

  it('substitutes the company name into templated questions', () => {
    const qs = getCategoryStageQuestions('Globex', 'big-tech', 'screening', 'medium');
    expect(qs.join(' ')).toContain('Globex');
  });

  it('lists 5 system-design pattern ids per category', () => {
    for (const cat of COMPANY_CATEGORIES) {
      expect(CATEGORY_SYSTEM_DESIGN_ORDER[cat].length, cat).toBe(5);
    }
  });
});
