import { describe, expect, it } from 'vitest';
import type { ResumeData } from '../types';
import {
  buildNaturalProfessionalLanguageGuidance,
  getLocalizedReviewTagLabel,
  getResumeReviewLanguageProfile,
  normalizeReviewTagLabel,
} from './aiReviewLanguage';

describe('AI review language helpers', () => {
  it('uses Simplified Chinese labels when the resume language is zh-CN', () => {
    const resume = {
      language: 'zh-CN',
      title: 'ZH-CN - Network Technician',
    } as Partial<ResumeData>;

    const language = getResumeReviewLanguageProfile(resume);

    expect(language.code).toBe('zh-CN');
    expect(language.ui.old).toBe('原文：');
    expect(language.ui.apply).toBe('应用');
    expect(getLocalizedReviewTagLabel('Action Verbs', language)).toBe('动作动词');
  });

  it('infers Chinese from resume content when the language field is missing', () => {
    const resume = {
      personalDetails: { jobTitle: '网络技术员' },
      professionalSummary: '拥有三年以上系统管理、硬件和软件支持、网络运维经验。',
      employmentHistory: [
        {
          jobTitle: 'IT网络安全实习生',
          employer: '圣何塞公立中学',
          description: '为行政办公室设计了安全的 WLAN 和 LAN 部署。',
        },
      ],
    } as Partial<ResumeData>;

    expect(getResumeReviewLanguageProfile(resume).code).toBe('zh-CN');
  });

  it('normalizes localized model-returned tag labels back to canonical tags', () => {
    expect(normalizeReviewTagLabel('动作动词')).toBe('Action Verbs');
    expect(normalizeReviewTagLabel('ATS 匹配')).toBe('ATS Match');
    expect(normalizeReviewTagLabel('score impact')).toBe('Score Impact');
    expect(normalizeReviewTagLabel('unknown')).toBeNull();
  });

  it('documents natural mixed-language guidance for technical terms', () => {
    const guidance = buildNaturalProfessionalLanguageGuidance('Simplified Chinese');

    expect(guidance).toContain('Simplified Chinese');
    expect(guidance).toContain('Windows');
    expect(guidance).toContain('macOS');
    expect(guidance).toContain('Gemini API');
    expect(guidance).toContain('QR code');
    expect(guidance).toContain('API key');
    expect(guidance).toContain('Do not force-translate');
    expect(guidance).toContain('localize the sentence and grammar');
  });
});
