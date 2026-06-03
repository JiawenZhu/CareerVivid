import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, FileText, Loader2, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import { useResumes } from '../hooks/useResumes';
import { navigate } from '../utils/navigation';
import { calculateResumeScore } from '../utils/resumeScoreUtils';
import { AgencyBranchProfile, AgencyPrepSession } from '../types';
import {
  getAgencyBranchBySlug,
  listenAgencyPrepSession,
  shareAgencyPrepSession,
  upsertAgencyPrepSession,
} from '../services/agencyPartnerService';
import PrivacyPreviewCard from '../features/agency-partner/components/PrivacyPreviewCard';
import ShareRevokeButton from '../features/agency-partner/components/ShareRevokeButton';

interface AgencyPreparePageProps {
  agencySlug: string;
}

const editorialGridStyle: React.CSSProperties = {
  backgroundColor: '#f7f1e7',
  backgroundImage: 'linear-gradient(rgba(228, 211, 188, 0.32) 1px, transparent 1px), linear-gradient(90deg, rgba(228, 211, 188, 0.32) 1px, transparent 1px)',
  backgroundSize: '48px 48px',
};

const AgencyPreparePage: React.FC<AgencyPreparePageProps> = ({ agencySlug }) => {
  const { currentUser, loading: authLoading } = useAuth();
  const { resumes, isLoading: resumesLoading, addBlankResume } = useResumes();
  const [branch, setBranch] = useState<AgencyBranchProfile | null>(null);
  const [branchLoading, setBranchLoading] = useState(true);
  const [branchError, setBranchError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<AgencyPrepSession | null>(null);
  const [shareState, setShareState] = useState<'idle' | 'sharing' | 'shared' | 'error'>('idle');

  const selectedResume = resumes[0] || null;
  const scoreData = useMemo(() => (
    selectedResume ? calculateResumeScore(selectedResume) : null
  ), [selectedResume]);
  const latestScore = scoreData?.overallScore;

  useEffect(() => {
    let isCancelled = false;

    setBranchLoading(true);
    getAgencyBranchBySlug(agencySlug)
      .then((result) => {
        if (isCancelled) return;
        setBranch(result);
        setBranchError(result ? null : 'This agency prep link is not active yet.');
      })
      .catch((error) => {
        if (isCancelled) return;
        console.error('Failed to load agency branch:', error);
        setBranchError('Unable to load this agency prep link.');
      })
      .finally(() => {
        if (!isCancelled) setBranchLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [agencySlug]);

  useEffect(() => {
    if (!branch || !currentUser || authLoading || resumesLoading) return;

    const candidateName = currentUser.displayName ||
      [selectedResume?.personalDetails?.firstName, selectedResume?.personalDetails?.lastName].filter(Boolean).join(' ') ||
      'Candidate';

    upsertAgencyPrepSession({
      branch,
      candidateUserId: currentUser.uid,
      candidateName,
      candidateEmail: currentUser.email || selectedResume?.personalDetails?.email || '',
      resume: selectedResume,
      latestScore,
    })
      .then(setSessionId)
      .catch((error) => {
        console.error('Failed to update agency prep session:', error);
      });
  }, [authLoading, branch, currentUser, latestScore, resumesLoading, selectedResume]);

  useEffect(() => {
    if (!sessionId) return;
    const unsubscribe = listenAgencyPrepSession(sessionId, (updatedSession) => {
      setSession(updatedSession);
      if (updatedSession) {
        if (updatedSession.consentToShare) {
          setShareState('shared');
        } else {
          setShareState('idle');
        }
      }
    }, (error) => {
      console.error('Failed to listen to prep session:', error);
    });
    return () => unsubscribe();
  }, [sessionId]);

  const handleShare = async () => {
    if (!sessionId || !currentUser || !selectedResume || typeof latestScore !== 'number') return;

    setShareState('sharing');
    try {
      await shareAgencyPrepSession({
        sessionId,
        candidateUserId: currentUser.uid,
        resumeId: selectedResume.id,
        latestScore,
      });
      setShareState('shared');
    } catch (error) {
      console.error('Failed to share readiness report:', error);
      setShareState('error');
    }
  };

  const isLoading = authLoading || branchLoading;

  return (
    <div className="text-[#211b16] min-h-screen flex flex-col selection:bg-[#ead9c3]" style={editorialGridStyle}>
      <PublicHeader variant="editorial" />
      <main className="flex-grow pt-24 pb-12 px-4">
        <div className="mx-auto max-w-5xl">
          {isLoading ? (
            <div className="flex min-h-[420px] items-center justify-center">
              <div className="inline-flex items-center gap-3 rounded-lg border border-[#e4d3bc] bg-[#fffaf1] px-5 py-4 text-sm font-semibold text-[#665a4a] shadow-sm shadow-[#8b5a16]/5">
                <Loader2 className="h-5 w-5 animate-spin text-[#8b5a16]" />
                Loading agency prep workspace...
              </div>
            </div>
          ) : branchError || !branch ? (
            <section className="rounded-lg border border-[#e4d3bc] bg-[#fffaf1] p-8 text-center shadow-xl shadow-[#8b5a16]/10">
              <Lock className="mx-auto mb-4 h-10 w-10 text-[#8b5a16]" />
              <h1 className="text-3xl font-bold text-[#211b16]">Prep link unavailable</h1>
              <p className="mx-auto mt-3 max-w-xl text-[#665a4a]">{branchError}</p>
              <button
                onClick={() => navigate('/partners/agency')}
                className="mt-6 rounded-lg bg-[#211b16] px-5 py-3 font-bold text-[#fffaf1] transition hover:bg-[#3a2f26]"
              >
                Learn about agency pilots
              </button>
            </section>
          ) : !currentUser ? (
            <section className="rounded-lg border border-[#e4d3bc] bg-[#fffaf1] p-8 shadow-xl shadow-[#8b5a16]/10">
              <div className="max-w-2xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d7c4a9] bg-[#fdf5e8] px-4 py-2 text-sm font-bold text-[#8b5a16]">
                  <ShieldCheck size={16} />
                  {branch.branchName} prep portal
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-[#211b16]">Sign in to prepare your resume.</h1>
                <p className="mt-4 text-lg leading-8 text-[#665a4a]">
                  CareerVivid will help you improve your resume score before you send it back to the recruiter. Your full resume is not shared with {branch.branchName} unless you choose to share it.
                </p>
                <button
                  onClick={() => navigate('/signin')}
                  className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#211b16] px-6 py-3 font-bold text-[#fffaf1] transition hover:bg-[#3a2f26]"
                >
                  Sign in to start
                  <ArrowRight size={18} />
                </button>
              </div>
            </section>
          ) : session?.overLimit ? (
            <section className="rounded-lg border border-[#e4d3bc] bg-[#fffaf1] p-8 text-center shadow-xl shadow-[#8b5a16]/10">
              <Lock className="mx-auto mb-4 h-10 w-10 text-[#8b5a16]" />
              <h1 className="text-3xl font-bold text-[#211b16]">Pilot seat limit reached</h1>
              <p className="mx-auto mt-3 max-w-xl text-[#665a4a]">
                This branch pilot has reached its maximum candidate capacity of {branch.inviteLimit || 40} seats. Please contact your recruiter at {branch.branchName} to request a pilot upgrade.
              </p>
            </section>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-5">
              <section className="rounded-lg border border-[#e4d3bc] bg-[#fffaf1] p-8 shadow-xl shadow-[#8b5a16]/10">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d7c4a9] bg-[#fdf5e8] px-4 py-2 text-sm font-bold text-[#8b5a16]">
                  <ShieldCheck size={16} />
                  {branch.branchName} prep portal
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-[#211b16]">Get your resume recruiter-ready.</h1>
                <p className="mt-4 text-lg leading-8 text-[#665a4a]">
                  Use your CareerVivid resume workspace to improve your score, download the final PDF, and share a readiness report with this branch only when you are ready.
                </p>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  {[
                    ['1', 'Select or create a resume'],
                    ['2', 'Run a deep review quickly so you can focus on interviews'],
                    ['3', 'Share readiness so recruiters can reach out when your resume matches a role'],
                  ].map(([step, label]) => (
                    <div key={step} className="rounded-lg border border-[#ead9c3] bg-[#fdf5e8] p-4">
                      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#211b16] text-sm font-bold text-[#fffaf1]">{step}</div>
                      <p className="text-sm font-semibold text-[#665a4a]">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  {selectedResume ? (
                    <button
                      onClick={() => navigate(`/edit/${selectedResume.id}`)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#211b16] px-6 py-3 font-bold text-[#fffaf1] transition hover:bg-[#3a2f26]"
                    >
                      Open resume editor
                      <Sparkles size={18} />
                    </button>
                  ) : (
                    <button
                      onClick={addBlankResume}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#211b16] px-6 py-3 font-bold text-[#fffaf1] transition hover:bg-[#3a2f26]"
                    >
                      Create resume
                      <FileText size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="inline-flex items-center justify-center rounded-lg border border-[#d7c4a9] bg-[#fffaf1] px-6 py-3 font-bold text-[#665a4a] transition hover:border-[#bfa782] hover:text-[#211b16]"
                  >
                    View dashboard
                  </button>
                </div>
              </section>

              <PrivacyPreviewCard
                branchName={branch.branchName}
                candidateName={currentUser?.displayName || [selectedResume?.personalDetails?.firstName, selectedResume?.personalDetails?.lastName].filter(Boolean).join(' ') || undefined}
                candidateEmail={currentUser?.email || selectedResume?.personalDetails?.email || undefined}
                latestScore={latestScore}
                scoreDelta={typeof latestScore === 'number' && typeof scoreData?.overallScore === 'number' ? Math.max(0, latestScore - (scoreData.overallScore - latestScore)) : undefined}
                consentToShare={shareState === 'shared'}
              />
              </div>

              <aside className="rounded-lg border border-[#e4d3bc] bg-[#fffaf1] p-6 shadow-xl shadow-[#8b5a16]/10">
                <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#8b5a16]">Readiness</p>
                <div className="mt-5 rounded-lg border border-[#ead9c3] bg-[#fdf5e8] p-5 text-center">
                  <p className="text-5xl font-black text-[#211b16]">{latestScore ?? '--'}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-[#665a4a]">Resume score</p>
                </div>
                <div className="mt-5 space-y-3 text-sm text-[#665a4a]">
                  <div className="flex items-center justify-between">
                    <span>Resume selected</span>
                    <span className="font-bold text-[#211b16]">{selectedResume ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Target</span>
                    <span className="font-bold text-[#211b16]">85+</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Agency access</span>
                    <span className="font-bold text-[#211b16]">{shareState === 'shared' ? 'Shared' : 'Progress only'}</span>
                  </div>
                </div>
                <button
                  disabled={!selectedResume || typeof latestScore !== 'number' || shareState === 'sharing' || shareState === 'shared'}
                  onClick={handleShare}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#2f6f5e] px-5 py-3 font-bold text-white transition hover:bg-[#285f51] disabled:cursor-not-allowed disabled:bg-[#aab8aa]"
                >
                  {shareState === 'sharing' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 size={18} />}
                  {shareState === 'shared' ? 'Readiness shared' : 'Share readiness report'}
                </button>
                {shareState === 'error' && (
                  <p className="mt-3 text-sm font-medium text-red-700">Could not share yet. Please try again.</p>
                )}
                <p className="mt-4 text-xs leading-5 text-[#665a4a]">
                  Sharing turns on a viewer-only resume link and sends this branch your score summary. You can stop sharing any time.
                </p>
                {shareState === 'shared' && sessionId ? (
                  <div className="mt-5 border-t border-[#e4d3bc] pt-4">
                    <ShareRevokeButton
                      sessionId={sessionId}
                      branchName={branch.branchName}
                      onRevoked={() => setShareState('idle')}
                    />
                  </div>
                ) : null}
              </aside>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AgencyPreparePage;
