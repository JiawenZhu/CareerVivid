import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileText,
  Link2,
  Loader2,
  LogOut,
  ShieldCheck,
  Users,
  ChevronDown,
  BookOpen,
} from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import { navigate } from '../utils/navigation';
import { AgencyBranchProfile, AgencyPrepSession, AgencyPrepSessionStatus } from '../types';
import {
  getAgencyBranchById,
  listenAgencyBranchesForAdmin,
  listenAgencyBranchesForOwner,
  listenAgencyPrepSessions,
} from '../services/agencyPartnerService';
import CandidateDetailDrawer from '../features/agency-partner/components/CandidateDetailDrawer';
import PipelineFunnel from '../features/agency-partner/components/PipelineFunnel';
import TimeSavedBadge from '../features/agency-partner/components/TimeSavedBadge';
import PilotSummaryExportButton from '../features/agency-partner/components/PilotSummaryExportButton';
import InviteByEmailForm from '../features/agency-partner/components/InviteByEmailForm';
import PendingInvitesList from '../features/agency-partner/components/PendingInvitesList';
import AdminDemoControls from '../features/agency-partner/components/AdminDemoControls';
import { useAgencyInvites } from '../features/agency-partner/hooks/useAgencyInvites';
import { computeFunnelStats, computeTimeSaved } from '../features/agency-partner/services/pilotMetricsService';
import CandidateSearchFilter, { CandidateFilters, initialFilters } from '../features/agency-partner/components/CandidateSearchFilter';
import StaleCandidateAlert from '../features/agency-partner/components/StaleCandidateAlert';
import BulkNudgeButton from '../features/agency-partner/components/BulkNudgeButton';
import PipelineSortControls, { SortOption } from '../features/agency-partner/components/PipelineSortControls';
import { isStaleCandidate, getSessionTimestamp, getStaleCandidates } from '../features/agency-partner/utils/staleCandidateUtils';
import RecruiterPlaybookDrawer from '../features/agency-partner/components/RecruiterPlaybookDrawer';

type AgencyDashboardTab = 'pipeline' | 'invite' | 'reports' | 'metrics';

const statusOrder: AgencyPrepSessionStatus[] = ['started', 'resume_imported', 'reviewed', 'ready', 'shared'];

const AgencyPartnerDashboard: React.FC = () => {
  const { currentUser, userProfile, isAdmin, logOut, loading } = useAuth();
  const { t } = useTranslation();
  const tAgency = (key: string, options?: Record<string, unknown>) => t(`agency_partner_dashboard.${key}`, options);
  const [branches, setBranches] = useState<AgencyBranchProfile[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<AgencyPrepSession[]>([]);
  const [activeTab, setActiveTab] = useState<AgencyDashboardTab>('pipeline');
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [filters, setFilters] = useState<CandidateFilters>(initialFilters);
  const [currentSort, setCurrentSort] = useState<SortOption>('recently_active');
  const [showPlaybook, setShowPlaybook] = useState(false);
  const requestedBranchId = new URLSearchParams(window.location.search).get('branchId');

  const hasAgencyAccess = Boolean(
    isAdmin ||
    userProfile?.role === 'agency_partner' ||
    userProfile?.roles?.includes('agency_partner')
  );

  useEffect(() => {
    if (loading) return;
    if (!currentUser) {
      navigate('/signin');
      return;
    }
    if (!hasAgencyAccess) {
      navigate('/');
    }
  }, [currentUser, hasAgencyAccess, loading]);

  useEffect(() => {
    if (!currentUser || !hasAgencyAccess) return;

    setIsLoadingBranches(true);

    if (isAdmin && requestedBranchId) {
      let cancelled = false;
      getAgencyBranchById(requestedBranchId)
        .then((branch) => {
          if (cancelled) return;
          if (!branch) {
            setBranches([]);
            setSelectedBranchId(null);
            setError(tAgency('errors.branch_not_found'));
            return;
          }
          setBranches([branch]);
          setSelectedBranchId(branch.id);
          setError(null);
        })
        .catch((err) => {
          if (cancelled) return;
          console.error('Failed to load agency branch:', err);
          setError(tAgency('errors.unable_to_load_branch'));
        })
        .finally(() => {
          if (!cancelled) setIsLoadingBranches(false);
        });

      return () => {
        cancelled = true;
      };
    }

    const branchListener = isAdmin
      ? listenAgencyBranchesForAdmin
      : (onChange: (branches: AgencyBranchProfile[]) => void, onError?: (error: Error) => void) =>
        listenAgencyBranchesForOwner(currentUser.uid, onChange, onError);

    const unsubscribe = branchListener((nextBranches) => {
      setBranches(nextBranches);
      setSelectedBranchId(current => {
        if (current && nextBranches.some(branch => branch.id === current)) return current;
        return nextBranches[0]?.id || null;
      });
      setIsLoadingBranches(false);
    }, (err) => {
      console.error('Failed to load agency branches:', err);
      setError(tAgency('errors.unable_to_load_branches'));
      setIsLoadingBranches(false);
    });

    return () => unsubscribe();
  }, [currentUser, hasAgencyAccess, isAdmin, requestedBranchId]);

  useEffect(() => {
    if (!selectedBranchId) {
      setSessions([]);
      return;
    }

    setIsLoadingSessions(true);
    const unsubscribe = listenAgencyPrepSessions(selectedBranchId, (nextSessions) => {
      setSessions(nextSessions);
      setIsLoadingSessions(false);
    }, (err) => {
      console.error('Failed to load agency prep sessions:', err);
      setError(tAgency('errors.unable_to_load_sessions'));
      setIsLoadingSessions(false);
    });

    return () => unsubscribe();
  }, [selectedBranchId]);

  const selectedBranch = useMemo(
    () => branches.find(branch => branch.id === selectedBranchId) || branches[0] || null,
    [branches, selectedBranchId],
  );

  const inviteLink = selectedBranch
    ? `${window.location.origin}/prepare/${selectedBranch.slug}`
    : '';

  const availableTags = useMemo(() => {
    const tagsSet = new Set<string>();
    sessions.forEach(session => {
      if (session.positionTags && Array.isArray(session.positionTags)) {
        session.positionTags.forEach(tag => {
          if (tag) tagsSet.add(tag.trim());
        });
      }
    });
    return Array.from(tagsSet).sort();
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      // 1. Text Search (name or email)
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const nameMatch = session.candidateName?.toLowerCase().includes(query);
        const emailMatch = session.candidateEmail?.toLowerCase().includes(query);
        if (!nameMatch && !emailMatch) return false;
      }

      // 2. Status Filter
      if (filters.statusFilter !== 'all' && session.status !== filters.statusFilter) {
        return false;
      }

      // 3. Score Filter
      if (filters.scoreFilter !== 'all') {
        const score = session.latestScore ?? 0;
        if (filters.scoreFilter === 'under_70' && score >= 70) return false;
        if (filters.scoreFilter === '70_84' && (score < 70 || score > 84)) return false;
        if (filters.scoreFilter === '85_plus' && score < 85) return false;
      }

      // 4. Stale Filter
      if (filters.staleOnly && !isStaleCandidate(session, 3)) {
        return false;
      }

      // 5. Tag Filter
      if (filters.tagFilter !== 'all') {
        if (!session.positionTags || !session.positionTags.includes(filters.tagFilter)) {
          return false;
        }
      }

      return true;
    });
  }, [sessions, filters]);

  const sortedSessions = useMemo(() => {
    return [...filteredSessions].sort((a, b) => {
      if (currentSort === 'recently_active') {
        const timeA = getSessionTimestamp(a.updatedAt);
        const timeB = getSessionTimestamp(b.updatedAt);
        return timeB - timeA;
      }
      if (currentSort === 'highest_score') {
        const scoreA = a.latestScore ?? -1;
        const scoreB = b.latestScore ?? -1;
        return scoreB - scoreA;
      }
      if (currentSort === 'biggest_lift') {
        const liftA = a.scoreDelta ?? -1;
        const liftB = b.scoreDelta ?? -1;
        return liftB - liftA;
      }
      if (currentSort === 'name_a_z') {
        const nameA = a.candidateName || '';
        const nameB = b.candidateName || '';
        return nameA.localeCompare(nameB);
      }
      return 0;
    });
  }, [filteredSessions, currentSort]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredSessions.forEach((session) => {
      counts[session.status] = (counts[session.status] || 0) + 1;
    });
    return counts;
  }, [filteredSessions]);

  const sharedSessions = useMemo(
    () => sessions.filter(session => session.consentToShare && session.status === 'shared'),
    [sessions],
  );

  const averageLatestScore = useMemo(() => {
    const scored = sessions.map(session => session.latestScore).filter((score): score is number => typeof score === 'number');
    if (scored.length === 0) return null;
    return Math.round(scored.reduce((sum, score) => sum + score, 0) / scored.length);
  }, [sessions]);

  const averageScoreLift = useMemo(() => {
    const deltas = sessions.map(session => session.scoreDelta).filter((score): score is number => typeof score === 'number');
    if (deltas.length === 0) return null;
    return Math.round(deltas.reduce((sum, score) => sum + score, 0) / deltas.length);
  }, [sessions]);

  const { invites, isLoading: invitesLoading } = useAgencyInvites(selectedBranchId);
  const funnel = useMemo(() => computeFunnelStats(sessions, invites.length || undefined), [sessions, invites.length]);
  const timeSaved = useMemo(() => computeTimeSaved(sessions), [sessions]);
  const selectedSession = useMemo(
    () => sessions.find(session => session.id === selectedSessionId) || null,
    [sessions, selectedSessionId],
  );
  const canManageNotes = Boolean(
    isAdmin || (selectedBranch && currentUser && selectedBranch.ownerUserId === currentUser.uid)
  );

  const copyInviteLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const tabs: Array<{ id: AgencyDashboardTab; label: string; icon: React.ElementType }> = [
    { id: 'pipeline', label: tAgency('tabs.prep_pipeline'), icon: Users },
    { id: 'invite', label: tAgency('tabs.invite_link'), icon: Link2 },
    { id: 'reports', label: tAgency('tabs.ready_reports'), icon: FileText },
    { id: 'metrics', label: tAgency('tabs.pilot_metrics'), icon: BarChart3 },
  ];

  const getPrepStatusLabel = (status: AgencyPrepSessionStatus) => tAgency(`status.${status}`);

  if (loading || isLoadingBranches) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb] dark:bg-[#101214]">
        <div className="inline-flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm font-medium text-gray-700 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
          {tAgency('loading')}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-gray-950 dark:bg-[#101214] dark:text-gray-50">
      <header className="sticky top-0 z-20 border-b border-gray-200/80 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-[#121417]/90">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button onClick={() => navigate('/')} className="flex shrink-0 items-center gap-2">
              <Logo className="h-8 w-8" />
              <span className="text-lg font-black tracking-tight text-gray-950 dark:text-white">CareerVivid</span>
            </button>
            <span className="hidden h-5 w-px bg-gray-300 dark:bg-gray-700 sm:block" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{tAgency('header.title')}</p>
              <p className="hidden text-xs text-gray-500 dark:text-gray-400 sm:block">{tAgency('header.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(isAdmin ? '/admin?tab=partners' : '/dashboard')}
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white sm:inline-flex"
            >
              {isAdmin ? tAgency('nav.admin_partners') : tAgency('nav.dashboard')}
            </button>
            <button
              onClick={logOut}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              <LogOut size={15} />
              {tAgency('nav.sign_out')}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1500px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        {isAdmin && (
          <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold">{tAgency('admin_view.title')}</p>
                <p className="mt-1 text-xs font-medium text-amber-800 dark:text-amber-300">
                  {tAgency('admin_view.description')}
                </p>
              </div>
              <button
                onClick={() => navigate('/admin?tab=partners')}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-900 transition hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200 dark:hover:bg-amber-900/40"
              >
                <ArrowLeft size={14} />
                {tAgency('admin_view.back_to_partners')}
              </button>
            </div>
            <div className="border-t border-amber-200 pt-3 dark:border-amber-900/40">
              <AdminDemoControls
                branches={branches}
                selectedBranchId={selectedBranchId}
                onSelectBranch={setSelectedBranchId}
              />
            </div>
          </div>
        )}

        {!selectedBranch ? (
          <section className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-emerald-600" />
            <h1 className="text-2xl font-black text-gray-950 dark:text-white">{tAgency('empty.no_branch_title')}</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-600 dark:text-gray-300">
              {tAgency('empty.no_branch_description')}
            </p>
          </section>
        ) : (
          <>
            <section className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.7fr)]">
              <div className="relative overflow-hidden rounded-3xl border border-[#e4d3bc] bg-white p-6 shadow-sm dark:border-[#302e2a] dark:bg-gray-900">
                <div className="absolute inset-x-0 top-0 h-px bg-[#e4d3bc] dark:bg-[#302e2a]" />
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <ShieldCheck size={14} />
                        {tAgency('hero.zero_integration_pilot')}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPlaybook(true)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#e4d3bc] bg-[#fdf5e8] hover:bg-[#fbe7c8] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#8b5a16] shadow-sm transition hover:scale-[1.02] active:scale-[0.98] dark:border-[#5a4a36] dark:bg-[#3a2f26] dark:text-[#caa26c] cursor-pointer"
                      >
                        <BookOpen size={13} />
                        {tAgency('hero.pilot_playbook')}
                      </button>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-gray-950 dark:text-white sm:text-4xl">
                      {selectedBranch.branchName}
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-300">
                      {tAgency('hero.description')}
                    </p>
                  </div>
                  <div className="relative">
                    <select
                      value={selectedBranch.id}
                      onChange={(event) => setSelectedBranchId(event.target.value)}
                      disabled={Boolean(isAdmin && requestedBranchId)}
                      className="appearance-none rounded-xl border border-[#e4d3bc] bg-white pl-3 pr-10 py-2 text-sm font-semibold text-[#211b16] shadow-sm transition hover:bg-[#fdf5e8] dark:border-[#302e2a] dark:bg-[#262522] dark:text-[#f4f1e9] dark:hover:bg-[#1f1f1d] cursor-pointer"
                    >
                      {branches.map(branch => (
                        <option key={branch.id} value={branch.id} className="bg-white text-[#211b16] dark:bg-[#262522] dark:text-[#f4f1e9]">
                          {branch.branchName}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8b5a16] dark:text-[#caa26c]">
                      <ChevronDown size={14} />
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    [tAgency('stats.candidates'), sessions.length],
                    [tAgency('stats.ready'), statusCounts.ready || 0],
                    [tAgency('stats.shared'), sharedSessions.length],
                    [tAgency('stats.avg_score'), averageLatestScore ?? '--'],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950/50">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">{label}</p>
                      <p className="mt-1 text-2xl font-black text-gray-950 dark:text-white">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <Link2 size={20} />
                </div>
                <h2 className="text-lg font-black text-gray-950 dark:text-white">{tAgency('invite_card.title')}</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                  {tAgency('invite_card.description')}
                </p>
                <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs font-semibold text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300">
                  {inviteLink}
                </div>
                <button
                  onClick={copyInviteLink}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-200"
                >
                  {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                  {copied ? tAgency('invite_card.copied') : tAgency('invite_card.copy')}
                </button>

                {/* Seat Limit Progress Bar */}
                <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-800">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                    <span>{tAgency('invite_card.seat_usage')}</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {tAgency('invite_card.candidates_count', { current: sessions.length, limit: selectedBranch.inviteLimit || 40 })}
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        sessions.length >= (selectedBranch.inviteLimit || 40)
                          ? 'bg-amber-500'
                          : 'bg-emerald-600'
                      }`}
                      style={{ width: `${Math.min(100, (sessions.length / (selectedBranch.inviteLimit || 40)) * 100)}%` }}
                    />
                  </div>
                </div>
              </aside>
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="flex flex-wrap gap-2 border-b border-gray-200 p-3 dark:border-gray-800">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
                        activeTab === tab.id
                          ? 'bg-gray-950 text-white shadow-sm dark:bg-white dark:text-gray-950'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
                      }`}
                    >
                      <Icon size={16} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="p-5">
                {isLoadingSessions ? (
                  <div className="flex items-center justify-center py-14 text-sm font-medium text-gray-500">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {tAgency('loading_sessions')}
                  </div>
                ) : activeTab === 'pipeline' ? (
                  <div className="space-y-6">
                    {/* Inactivity Stale Warning Alert */}
                    <StaleCandidateAlert
                      sessions={sessions}
                      onViewStale={() => setFilters((prev) => ({ ...prev, staleOnly: true }))}
                      renderNudgeButton={
                        <BulkNudgeButton
                          branchId={selectedBranch.id}
                          staleSessionIds={getStaleCandidates(sessions, 3).map((s) => s.id)}
                          demo={selectedBranch.id === 'demo-champaign-agency-2026'}
                        />
                      }
                    />

                    {/* Filter & Sort Bar */}
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                      <div className="flex-1">
                        <CandidateSearchFilter
                          filters={filters}
                          onFiltersChange={setFilters}
                          availableTags={availableTags}
                        />
                      </div>
                      <div className="flex shrink-0 justify-end self-start lg:self-auto">
                        <PipelineSortControls
                          currentSort={currentSort}
                          onSortChange={setCurrentSort}
                        />
                      </div>
                    </div>

                    {/* Kanban Columns Grid */}
                    <div className="grid gap-4 lg:grid-cols-5">
                      {statusOrder.map((status) => {
                        const columnSessions = sortedSessions.filter((session) => session.status === status);
                        return (
                          <div
                            key={status}
                            className="rounded-2xl border border-[#e4d3bc] bg-[#fffaf1]/60 p-4 dark:border-[#302e2a] dark:bg-[#262522]/40"
                          >
                            <div className="mb-3 flex items-center justify-between">
                              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                                {getPrepStatusLabel(status)}
                              </h3>
                              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#211b16] shadow-sm dark:bg-[#1f1f1d] dark:text-[#f4f1e9]">
                                {columnSessions.length}
                              </span>
                            </div>
                            <div className="space-y-2">
                              {columnSessions.map((session) => (
                                <button
                                  key={session.id}
                                  type="button"
                                  onClick={() => setSelectedSessionId(session.id)}
                                  className="w-full rounded-xl border border-[#e4d3bc] bg-white p-3 text-left transition hover:border-[#caa26c] hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8b5a16] dark:border-[#302e2a] dark:bg-[#1f1f1d] dark:hover:border-[#caa26c]"
                                >
                                  <div className="flex items-start justify-between gap-1">
                                    <p className="truncate text-sm font-bold text-gray-950 dark:text-white">
                                      {session.candidateName || tAgency('fallback.candidate')}
                                    </p>
                                    {isStaleCandidate(session, 3) && (
                                      <span
                                        className="h-2 w-2 shrink-0 rounded-full bg-amber-500 animate-pulse mt-1"
                                        title={tAgency('candidate.inactive_title')}
                                      />
                                    )}
                                  </div>
                                  <p className="truncate text-xs text-[#6b6358] dark:text-[#aaa39a]">
                                    {session.candidateEmail}
                                  </p>

                                  {/* Position Tags */}
                                  {session.positionTags && session.positionTags.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      {session.positionTags.slice(0, 2).map((tag) => (
                                        <span
                                          key={tag}
                                          className="inline-flex rounded-full bg-[#fdf5e8] border border-[#e4d3bc] px-1.5 py-0.5 text-[9px] font-bold text-[#8b5a16] dark:bg-[#262522] dark:border-[#302e2a] dark:text-[#caa26c]"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                      {session.positionTags.length > 2 && (
                                        <span className="text-[9px] font-semibold text-[#6b6358] dark:text-[#aaa39a]">
                                          +{session.positionTags.length - 2}
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  <div className="mt-2 flex items-center justify-between">
                                    <p className="text-xs font-semibold text-[#6b6358] dark:text-[#aaa39a]">
                                      {tAgency('candidate.score', { score: session.latestScore ?? '—' })}
                                      {typeof session.scoreDelta === 'number' && session.scoreDelta > 0 ? (
                                        <span className="ml-1.5 text-emerald-600 dark:text-emerald-300">
                                          +{session.scoreDelta}
                                        </span>
                                      ) : null}
                                    </p>
                                  </div>
                                </button>
                              ))}
                              {columnSessions.length === 0 && (
                                <p className="py-8 text-center text-xs italic text-gray-400 dark:text-gray-600">
                                  {tAgency('empty.no_candidates')}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : activeTab === 'invite' ? (
                  <div className="space-y-5">
                    <InviteByEmailForm branchId={selectedBranch.id} demo={selectedBranch.id === 'demo-champaign-agency-2026'} />
                    <PendingInvitesList invites={invites} sessions={sessions} isLoading={invitesLoading} />
                    <div className="rounded-2xl border border-[#e4d3bc] bg-[#fffaf1] p-5 dark:border-[#302e2a] dark:bg-[#1f1f1d]">
                      <h3 className="text-sm font-bold text-[#211b16] dark:text-[#f4f1e9]">{tAgency('recruiter_script.title')}</h3>
                      <p className="mt-2 text-sm leading-6 text-[#6b6358] dark:text-[#aaa39a]">
                        {tAgency('recruiter_script.body')}
                      </p>
                    </div>
                  </div>
                ) : activeTab === 'reports' ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="text-xs uppercase tracking-[0.12em] text-gray-500">
                        <tr>
                          <th className="px-3 py-3">{tAgency('reports.candidate')}</th>
                          <th className="px-3 py-3">{tAgency('reports.score')}</th>
                          <th className="px-3 py-3">{tAgency('reports.report')}</th>
                          <th className="px-3 py-3">{tAgency('reports.resume')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {sharedSessions.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-3 py-10 text-center text-gray-500">{tAgency('reports.empty')}</td>
                          </tr>
                        ) : sharedSessions.map(session => (
                          <tr key={session.id}>
                            <td className="px-3 py-4">
                              <p className="font-bold text-gray-950 dark:text-white">{session.candidateName}</p>
                              <p className="text-xs text-gray-500">{session.candidateEmail}</p>
                            </td>
                            <td className="px-3 py-4 font-black text-gray-950 dark:text-white">
                              {session.latestScore ?? '--'}
                              {typeof session.scoreDelta === 'number' && session.scoreDelta > 0 ? (
                                <span className="ml-2 text-xs font-bold text-emerald-600">+{session.scoreDelta}</span>
                              ) : null}
                            </td>
                            <td className="px-3 py-4 text-gray-600 dark:text-gray-300">
                              {session.readinessReport?.summary || tAgency('reports.readiness_shared')}
                            </td>
                            <td className="px-3 py-4">
                              {session.resumeSharePath ? (
                                <button
                                  onClick={() => navigate(session.resumeSharePath || '/dashboard')}
                                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 transition hover:bg-gray-100 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-800"
                                >
                                  {tAgency('reports.open')} <ExternalLink size={13} />
                                </button>
                              ) : (
                                <span className="text-xs text-gray-500">{tAgency('reports.not_shared')}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-3">
                      <TimeSavedBadge
                        variant="hero"
                        minutes={timeSaved.totalMinutes}
                        caption={tAgency(sessions.length === 1 ? 'metrics.time_saved_caption_one' : 'metrics.time_saved_caption_other', { count: sessions.length })}
                      />
                      <div className="rounded-2xl border border-[#e4d3bc] bg-white p-5 dark:border-[#302e2a] dark:bg-[#1f1f1d]">
                        <p className="text-xs font-semibold text-[#6b6358] dark:text-[#aaa39a]">{tAgency('metrics.shared_reports')}</p>
                        <p className="mt-2 text-3xl font-bold text-[#211b16] dark:text-[#f4f1e9]">{sharedSessions.length}</p>
                      </div>
                      <div className="rounded-2xl border border-[#e4d3bc] bg-white p-5 dark:border-[#302e2a] dark:bg-[#1f1f1d]">
                        <p className="text-xs font-semibold text-[#6b6358] dark:text-[#aaa39a]">{tAgency('metrics.average_score_lift')}</p>
                        <p className="mt-2 text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                          {averageScoreLift !== null ? `+${averageScoreLift}` : '—'}
                        </p>
                      </div>
                    </div>
                    <PipelineFunnel stats={funnel} />
                    <div className="rounded-2xl border border-[#e4d3bc] bg-white p-5 dark:border-[#302e2a] dark:bg-[#1f1f1d]">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-bold text-[#211b16] dark:text-[#f4f1e9]">{tAgency('metrics.export_title')}</h3>
                          <p className="text-xs text-[#6b6358] dark:text-[#aaa39a]">
                            {tAgency('metrics.export_description')}
                          </p>
                        </div>
                      </div>
                      <PilotSummaryExportButton branch={selectedBranch} sessions={sessions} />
                    </div>
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        <CandidateDetailDrawer
          session={selectedSession}
          canManageNotes={canManageNotes}
          onClose={() => setSelectedSessionId(null)}
        />
        
        <RecruiterPlaybookDrawer
          isOpen={showPlaybook}
          onClose={() => setShowPlaybook(false)}
          inviteLink={inviteLink}
        />
      </main>
    </div>
  );
};

export default AgencyPartnerDashboard;
