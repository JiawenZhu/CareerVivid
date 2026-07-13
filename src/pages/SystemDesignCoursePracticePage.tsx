import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { ArrowLeft, Loader2 } from 'lucide-react';
import AppLayout from '../components/Layout/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { getCourseSystemDesignPractice, getCourseSystemDesignResultId } from '../lib/systemDesignCoursePractice';
import { navigate } from '../utils/navigation';
import type { InterviewAnalysis, QuestSystemDesignArtifact } from '../types';

const SystemDesignBattle = React.lazy(() => import('../components/Quest/SystemDesignBattle'));

type Props = { courseId: string; exerciseId: string };

const SystemDesignCoursePracticePage: React.FC<Props> = ({ courseId, exerciseId }) => {
  const { currentUser } = useAuth();
  const practice = useMemo(() => getCourseSystemDesignPractice(courseId, exerciseId), [courseId, exerciseId]);
  const [savedAnalysis, setSavedAnalysis] = useState<InterviewAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const courseReturnPath = `/learn/${courseId}/${exerciseId}`;
  const documentId = getCourseSystemDesignResultId(courseId, exerciseId);

  useEffect(() => {
    if (!currentUser) return undefined;
    const reference = doc(db, 'users', currentUser.uid, 'courseSystemDesignResults', documentId);
    return onSnapshot(reference, (snapshot) => {
      setSavedAnalysis(snapshot.exists() ? (snapshot.data() as InterviewAnalysis) : null);
      setIsLoading(false);
    }, () => setIsLoading(false));
  }, [currentUser, documentId]);

  if (!practice) {
    return <AppLayout><div className="cv-design-page flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6"><p className="cv-design-title text-xl">Course practice not found</p><button type="button" onClick={() => navigate(courseReturnPath)} className="cv-design-button-secondary inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs"><ArrowLeft size={14} /> Back to lesson</button></div></AppLayout>;
  }

  const saveAnalysis = async (analysisData: Omit<InterviewAnalysis, 'id' | 'timestamp'>): Promise<InterviewAnalysis> => {
    if (!currentUser) throw new Error('Sign in to save this course practice result.');
    const saved: InterviewAnalysis = { ...analysisData, id: documentId, timestamp: Date.now() };
    await setDoc(doc(db, 'users', currentUser.uid, 'courseSystemDesignResults', documentId), {
      ...saved,
      courseId,
      exerciseId,
      challengeId: practice.brief.challengeId,
      updatedAt: Date.now(),
    });
    return saved;
  };

  if (isLoading) return <AppLayout><div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-[var(--cv-text-muted)]" size={24} /></div></AppLayout>;

  return <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><Loader2 className="animate-spin text-white" size={28} /></div>}>
    <SystemDesignBattle
      userId={currentUser?.uid}
      company="CareerVivid"
      stageTitle={practice.stageTitle}
      brief={practice.brief}
      practiceContext="course"
      initialArtifact={savedAnalysis?.questArtifact as QuestSystemDesignArtifact | undefined}
      saveAnalysis={saveAnalysis}
      onAnalysisComplete={setSavedAnalysis}
      onClose={() => navigate(courseReturnPath)}
    />
  </Suspense>;
};

export default SystemDesignCoursePracticePage;
