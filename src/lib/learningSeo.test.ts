import { describe, expect, it } from 'vitest';
import { getLearningSeoKey, getLearningSeoPage } from './learningSeo';

describe('learning SEO metadata', () => {
    it('assigns unique canonical metadata to the course catalog and both public courses', () => {
        const pages = [
            getLearningSeoPage('catalog'),
            getLearningSeoPage('ai-agent-curriculum'),
            getLearningSeoPage('coding-interview-patterns'),
        ];

        expect(new Set(pages.map((page) => page.path))).toEqual(new Set([
            '/learning',
            '/learning/ai-agent-curriculum',
            '/learning/coding-interview-patterns',
        ]));
        expect(pages.every((page) => page.title.length > 20 && page.description.length > 100)).toBe(true);
    });

    it('uses the dedicated coding route instead of the AI curriculum fallback', () => {
        expect(getLearningSeoKey('coding-interview-patterns')).toBe('coding-interview-patterns');
        expect(getLearningSeoKey('ai-agent-curriculum')).toBe('ai-agent-curriculum');
        expect(getLearningSeoKey(null)).toBe('catalog');
    });
});
