import { describe, expect, it } from 'vitest';
import categoryBanks from '../../data/quest-category-banks.json';
import {
  buildMobileInterviewQuestionCatalog,
  WEB_QUEST_STAGE_QUESTION_LIMIT,
} from '../../scripts/mobile-interview-question-catalog.mjs';
import { buildQuestLine, getStageQuestionPool, QuestStageKind } from './companyQuests';
import { LocalInterviewGuide } from './localInterviewGuides';

const guideModules = import.meta.glob('../../data/interview-guides/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, LocalInterviewGuide>;

const guides = Object.values(guideModules)
  .filter((guide) => guide.slug && guide.company)
  .sort((left, right) => left.slug.localeCompare(right.slug));

const mobileKeyForStage: Record<QuestStageKind, string> = {
  screening: 'screening',
  coding: 'coding',
  system_design: 'systemDesign',
  behavioral: 'behavioral',
  values: 'values',
  final: 'final',
};

describe('mobile interview question parity', () => {
  it('matches the exact first five Web questions for every company and stage', () => {
    const mobileCatalog = buildMobileInterviewQuestionCatalog(guides, categoryBanks) as Record<
      string,
      { stageQuestions: Record<string, string[]> }
    >;

    expect(guides).toHaveLength(301);
    expect(Object.keys(mobileCatalog)).toHaveLength(guides.length);

    for (const guide of guides) {
      for (const stage of buildQuestLine(guide)) {
        const webQuestions = getStageQuestionPool(guide, stage)
          .slice(0, WEB_QUEST_STAGE_QUESTION_LIMIT);
        const mobileQuestions = mobileCatalog[guide.slug].stageQuestions[mobileKeyForStage[stage.id]];

        expect(mobileQuestions, `${guide.slug}:${stage.id}`).toEqual(webQuestions);
      }
    }
  });
});
