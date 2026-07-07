import { useCallback, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { CompanyQuestProgress, InterviewAnalysis, QuestStageResult } from '../types';
import { QuestStage, isStageCleared } from '../lib/companyQuests';
import { normalizeScore } from '../lib/gamification';
import { awardXp } from '../services/progressService';

export interface StageAttemptOutcome {
  cleared: boolean;
  newlyCleared: boolean;
  questCompleted: boolean;
  normalizedScore: number;
}

export interface UseCompanyQuestResult {
  quest: CompanyQuestProgress | null;
  isLoading: boolean;
  /** Record an interview analysis against a stage; awards XP on first clear. */
  recordStageAttempt: (
    stage: QuestStage,
    stages: QuestStage[],
    analysis: InterviewAnalysis,
  ) => Promise<StageAttemptOutcome>;
}

const questRef = (uid: string, slug: string) => doc(db, 'users', uid, 'quests', slug);

export const useCompanyQuest = (slug: string, company: string): UseCompanyQuestResult => {
  const { currentUser } = useAuth();
  const [quest, setQuest] = useState<CompanyQuestProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || !slug) {
      setQuest(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = onSnapshot(
      questRef(currentUser.uid, slug),
      (snap) => {
        setQuest(snap.exists() ? (snap.data() as CompanyQuestProgress) : null);
        setIsLoading(false);
      },
      (error) => {
        console.error('Failed to subscribe to quest progress:', error);
        setIsLoading(false);
      },
    );
    return unsubscribe;
  }, [currentUser, slug]);

  const recordStageAttempt = useCallback(async (
    stage: QuestStage,
    stages: QuestStage[],
    analysis: InterviewAnalysis,
  ): Promise<StageAttemptOutcome> => {
    if (!currentUser) throw new Error('Not signed in');

    const now = Date.now();
    const normalizedScore = normalizeScore(analysis.overallScore);
    const prev = quest?.stageResults?.[stage.id];
    const wasCleared = isStageCleared(prev?.bestScore, stage);
    const cleared = normalizedScore >= stage.passThreshold;
    const newlyCleared = cleared && !wasCleared;

    // Coding and system-design stages: track which company-pool challenges the
    // user has cleared, so the quest can serve a fresh one next time.
    const artifact = analysis.questArtifact;
    const prevSolved = prev?.clearedChallengeIds ?? [];
    const solvedId = cleared && (artifact?.type === 'coding' || artifact?.type === 'system_design')
      ? artifact.challengeId
      : undefined;
    const clearedChallengeIds = solvedId && !prevSolved.includes(solvedId)
      ? [...prevSolved, solvedId]
      : prevSolved;

    const nextResult: QuestStageResult = {
      bestScore: Math.max(prev?.bestScore ?? 0, normalizedScore),
      attempts: (prev?.attempts ?? 0) + 1,
      clearedAt: prev?.clearedAt ?? (cleared ? now : null),
      lastAnalysisId: analysis.id,
      ...(clearedChallengeIds.length ? { clearedChallengeIds } : {}),
    };

    const nextStageResults = { ...(quest?.stageResults ?? {}), [stage.id]: nextResult };
    const questCompleted = stages.every((s) => isStageCleared(nextStageResults[s.id]?.bestScore, s));

    const nextQuest: CompanyQuestProgress = {
      slug,
      company,
      stageResults: nextStageResults,
      startedAt: quest?.startedAt ?? now,
      completedAt: quest?.completedAt ?? (questCompleted ? now : null),
      updatedAt: now,
    };

    await setDoc(questRef(currentUser.uid, slug), nextQuest, { merge: true });

    // XP awards are idempotent per stage/quest via dedupe ids, and must not
    // break progress persistence if they fail.
    if (newlyCleared) {
      void awardXp(currentUser.uid, {
        type: 'quest_stage_cleared',
        dedupeId: `quest_${slug}_${stage.id}`,
        meta: { slug, stage: stage.id, score: normalizedScore },
      }).catch((error) => console.error('Failed to award stage XP:', error));
    }
    if (questCompleted && !quest?.completedAt) {
      void awardXp(currentUser.uid, {
        type: 'quest_completed',
        dedupeId: `quest_${slug}_completed`,
        meta: { slug },
      }).catch((error) => console.error('Failed to award quest XP:', error));
    }

    return { cleared, newlyCleared, questCompleted, normalizedScore };
  }, [currentUser, quest, slug, company]);

  return { quest, isLoading, recordStageAttempt };
};
