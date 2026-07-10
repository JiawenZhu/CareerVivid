import React, { useMemo, useState } from 'react';
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    ChevronRight,
    CheckCircle2,
    ChevronDown,
    Clock3,
    ExternalLink,
    GraduationCap,
    Layers3,
    ListChecks,
    Loader2,
    Lock,
    Play,
    Rocket,
    ShieldCheck,
    Sparkles,
    Target,
    Zap,
} from 'lucide-react';
import AppLayout from '../components/Layout/AppLayout';
import { navigate } from '../utils/navigation';
import { getInteractiveCourses, getCourseExerciseCount, getCourseExercises } from '../lib/interactiveCourses';
import { useAuth } from '../contexts/AuthContext';
import { useUserProgress } from '../hooks/useUserProgress';
import { useCourseProgress } from '../hooks/useCourseProgress';
import { useAllCourseProgress } from '../hooks/useAllCourseProgress';
import { Helmet } from 'react-helmet-async';
import AuthGateModal, { AuthGateModalProps } from '../components/AuthGateModal';
import { canAccessCourse, isCourseFreeForGuests } from '../config/accessPolicy';
import { stripLanguagePrefix } from '../utils/languagePreference';
import {
    CourseModuleWithState,
    getCourseModulesWithState,
    getCourseTotalCount,
    getLearningSourceById,
} from '../lib/courseCurriculum';

const STATE_ICON_WELL: Record<CourseModuleWithState['state'], string> = {
    completed: 'bg-[var(--cv-success-50)] text-[var(--cv-success-600)] border border-[var(--cv-success-600)]/30',
    available: 'cv-design-icon-well',
    locked: 'bg-[var(--cv-surface-warm-muted,transparent)] text-[var(--cv-text-muted)] border border-[var(--cv-border-warm)]',
};

/**
 * One unified learning path: each of the 10 steps combines the curriculum
 * module (objective, topics, sources) with its interactive lessons. No
 * duplicated lists — the row's primary action opens the lessons, expanding
 * the row reveals the details.
 */
const CoursePage: React.FC = () => {
    const { currentUser, isPremium } = useAuth();
    const [authGate, setAuthGate] = useState<Pick<AuthGateModalProps, 'title' | 'message' | 'variant'> | null>(null);

    /**
     * Gate for opening a course's lessons:
     *  - free course → always allowed (guests included)
     *  - guest → sign-in gate
     *  - signed-in without premium → upgrade gate
     */
    const openCourse = (courseId: string) => {
        if (canAccessCourse(courseId, { isSignedIn: Boolean(currentUser), isPremium: Boolean(isPremium) })) {
            navigate(`/learn/${courseId}`);
            return;
        }
        if (!currentUser) {
            setAuthGate({
                title: 'Sign in to open this course',
                message: `The Foundations course is free for everyone — create an account to unlock the rest of the curriculum and save your progress.`,
                variant: 'signin',
            });
            return;
        }
        setAuthGate({ variant: 'upgrade' });
    };
    const { levelInfo, isLoading: isLoadingLevel } = useUserProgress();
    const { progress, isLoading: isLoadingCourse, complete } = useCourseProgress('ai-agent-curriculum', getCourseTotalCount());
    const { progressByCourse } = useAllCourseProgress();
    const currentPath = stripLanguagePrefix(window.location.pathname);
    const parts = currentPath.split('/');
    const selectedCourseId = parts[2] || null;
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [completingId, setCompletingId] = useState<string | null>(null);

    const interactiveCourses = useMemo(() => getInteractiveCourses(), []);
    const labByModuleOrder = useMemo(
        () => new Map(interactiveCourses.map((course, index) => [index + 1, course])),
        [interactiveCourses],
    );
    const completedIds = progress?.completedModuleIds ?? [];
    const modules = useMemo(() => getCourseModulesWithState(completedIds), [completedIds]);
    const totalCount = getCourseTotalCount();
    const completedCount = completedIds.length;
    const progressPct = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;
    const courseComplete = totalCount > 0 && completedCount === totalCount;

    const currentModule = useMemo(() => modules.find((m) => m.state === 'available'), [modules]);
    const currentLab = currentModule ? labByModuleOrder.get(currentModule.order) : undefined;
    const activeModule = currentModule ?? modules.at(-1);
    const activeLab = activeModule ? labByModuleOrder.get(activeModule.order) : undefined;
    const totalLessonCount = useMemo(
        () => interactiveCourses.reduce((total, course) => total + getCourseExerciseCount(course), 0),
        [interactiveCourses],
    );
    const completedLessonCount = useMemo(
        () => interactiveCourses.reduce((total, course) => {
            const completedExercises = new Set(progressByCourse[course.id]?.completedModuleIds ?? []);
            return total + getCourseExercises(course).filter((exercise) => completedExercises.has(exercise.id)).length;
        }, 0),
        [interactiveCourses, progressByCourse],
    );
    const activeLessonCount = activeLab ? getCourseExerciseCount(activeLab) : 0;

    const toggleExpand = (module: CourseModuleWithState) => {
        if (module.state === 'locked') {
            // Guests clicking a locked module get the sign-in gate instead of
            // a dead click — same conversion moment as the interview quests.
            if (!currentUser) {
                setAuthGate({
                    title: `Sign in to unlock ${module.title}`,
                    message: 'Foundations is free for everyone. Create a free account to work through the rest of the curriculum in order and keep your progress.',
                    variant: 'signin',
                });
            }
            return;
        }
        setExpandedId((prev) => (prev === module.id ? null : module.id));
    };

    const handleComplete = async (moduleId: string) => {
        if (!currentUser) return;
        setCompletingId(moduleId);
        try {
            await complete(moduleId);
            setExpandedId((prev) => {
                const next = modules.find((m) => m.order === (modules.find((mm) => mm.id === moduleId)?.order ?? 0) + 1);
                return next && next.state !== 'locked' ? next.id : prev;
            });
        } catch (e) {
            console.error('Failed to mark module complete:', e);
        } finally {
            setCompletingId(null);
        }
    };

    return (
        <AppLayout>
            <Helmet>
                <title>Free AI Courses — Learn Agents by Doing | CareerVivid</title>
                <meta name="description" content={`${interactiveCourses.length} hands-on AI courses from LLM foundations to a shipped portfolio project. Interactive playgrounds, quizzes, and code labs — the Foundations course is free, no account needed.`} />
                <link rel="canonical" href="https://careervivid.app/learning" />
                <script type="application/ld+json">{JSON.stringify({
                    '@context': 'https://schema.org',
                    '@type': 'ItemList',
                    name: 'CareerVivid AI-agent curriculum',
                    numberOfItems: interactiveCourses.length,
                    itemListElement: interactiveCourses.map((course, index) => ({
                        '@type': 'ListItem',
                        position: index + 1,
                        item: {
                            '@type': 'Course',
                            name: course.title.replace(/^\d+\.\s*/, ''),
                            description: course.tagline,
                            provider: { '@type': 'Organization', name: 'CareerVivid', url: 'https://careervivid.app/' },
                            isAccessibleForFree: isCourseFreeForGuests(course.id),
                            hasCourseInstance: {
                                '@type': 'CourseInstance',
                                courseMode: 'online',
                                courseWorkload: course.estimatedMinutes ? `PT${course.estimatedMinutes}M` : 'PT1H',
                            },
                            offers: {
                                '@type': 'Offer',
                                price: isCourseFreeForGuests(course.id) ? '0' : undefined,
                                priceCurrency: 'USD',
                                category: isCourseFreeForGuests(course.id) ? 'Free' : 'Subscription',
                            },
                        },
                    })),
                })}</script>
            </Helmet>
            {authGate && <AuthGateModal {...authGate} onClose={() => setAuthGate(null)} />}
            <div className={`${selectedCourseId ? 'cv-design-page cv-design-grid' : 'bg-[var(--cv-bg-product)] text-[var(--cv-text-heading-product)]'} relative min-h-screen pb-16 text-left`}>
                <div className="@container/course-page mx-auto max-w-screen-2xl px-4 py-6 text-left sm:px-6 lg:px-8 lg:py-8">
                    {!selectedCourseId ? (
                        <div className="mx-auto max-w-6xl space-y-6 pb-8">
                            <header className="flex flex-col gap-5 border-b border-[var(--cv-border-product)] pb-6 lg:flex-row lg:items-end lg:justify-between">
                                <div className="min-w-0">
                                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--cv-text-accent)]">Learning studio</p>
                                    <h1 className="max-w-2xl font-[var(--cv-font-heading)] text-2xl font-extrabold leading-tight text-[var(--cv-text-heading-product)] sm:text-3xl">Build skills you can apply in real interviews.</h1>
                                    <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[var(--cv-text-body-product)]">
                                        Work through practical AI engineering lessons, then carry the same systems thinking into your projects and interview practice.
                                    </p>
                                </div>
                                <div className="grid shrink-0 grid-cols-3 divide-x divide-[var(--cv-border-product)] border-y border-[var(--cv-border-product)] bg-[var(--cv-surface)] py-3 text-center shadow-[0_1px_2px_rgba(16,24,40,0.05)] lg:min-w-[328px]">
                                    <div className="px-3">
                                        <p className="text-lg font-extrabold text-[var(--cv-text-heading-product)]">{totalCount}</p>
                                        <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--cv-text-muted)]">Modules</p>
                                    </div>
                                    <div className="px-3">
                                        <p className="text-lg font-extrabold text-[var(--cv-text-heading-product)]">{totalLessonCount}</p>
                                        <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--cv-text-muted)]">Hands-on labs</p>
                                    </div>
                                    <div className="px-3">
                                        <p className="text-lg font-extrabold text-[var(--cv-text-heading-product)]">{completedCount}</p>
                                        <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--cv-text-muted)]">Completed</p>
                                    </div>
                                </div>
                            </header>

                            <section className="border border-[var(--cv-border-product)] bg-[var(--cv-surface)] shadow-[0_1px_2px_rgba(16,24,40,0.05)]" aria-labelledby="continue-learning-heading">
                                <div className="grid divide-y divide-[var(--cv-border-product)] lg:grid-cols-[minmax(0,1.35fr)_minmax(240px,0.8fr)_auto] lg:divide-x lg:divide-y-0">
                                    <div className="p-5 sm:p-6">
                                        <div className="flex items-start gap-4">
                                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--cv-border-accent)] bg-[var(--cv-purple-50)] text-[var(--cv-text-accent)]">
                                                <GraduationCap size={21} />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--cv-text-accent)]">Active curriculum</p>
                                                <h2 id="continue-learning-heading" className="mt-1 font-[var(--cv-font-heading)] text-lg font-extrabold leading-tight text-[var(--cv-text-heading-product)]">AI Agent Builder Curriculum</h2>
                                                <p className="mt-1.5 max-w-xl text-sm leading-6 text-[var(--cv-text-body-product)]">10 guided steps from LLM foundations to a portfolio-ready AI project, with readings, playgrounds, quizzes, and code labs.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-5 sm:p-6">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--cv-text-muted)]">{courseComplete ? 'Curriculum complete' : 'Up next'}</p>
                                        <p className="mt-1 font-[var(--cv-font-heading)] text-sm font-extrabold leading-5 text-[var(--cv-text-heading-product)]">{activeModule?.title ?? 'AI Agent Builder Curriculum'}</p>
                                        <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[var(--cv-text-body-product)]">
                                            <BookOpen size={14} className="text-[var(--cv-text-accent)]" />
                                            <span>Step {activeModule?.order ?? totalCount} of {totalCount}</span>
                                            <span aria-hidden>·</span>
                                            <span>{activeLessonCount} lessons</span>
                                        </div>
                                    </div>

                                    <div className="flex min-w-[220px] flex-col justify-between gap-5 p-5 sm:p-6">
                                        <div>
                                            <div className="flex items-end justify-between gap-3">
                                                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--cv-text-muted)]">Your progress</p>
                                                <p className="text-sm font-extrabold text-[var(--cv-text-accent)]">{progressPct}%</p>
                                            </div>
                                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--cv-neutral-100)]">
                                                <div className="h-full rounded-full bg-[var(--cv-action-primary)] transition-[width] duration-500" style={{ width: `${Math.max(progressPct, completedCount > 0 ? 4 : 0)}%` }} />
                                            </div>
                                            <p className="mt-2 text-xs font-medium text-[var(--cv-text-body-product)]">{isLoadingCourse ? 'Loading progress...' : `${completedCount} of ${totalCount} modules complete`}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {activeLab && !courseComplete && (
                                                <button type="button" onClick={() => openCourse(activeLab.id)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--cv-action-primary)] px-3 text-xs font-bold text-white transition-colors hover:bg-[var(--cv-action-primary-hover)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--cv-focus-ring)]">
                                                    <Play size={13} /> Continue learning
                                                </button>
                                            )}
                                            <button type="button" onClick={() => navigate('/learning/ai-agent-curriculum')} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--cv-action-soft-border)] bg-[var(--cv-action-soft-bg)] px-3 text-xs font-bold text-[var(--cv-action-soft-text)] transition-colors hover:bg-[var(--cv-action-soft-hover)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--cv-focus-ring)]">
                                                View plan <ChevronRight size={13} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
                                <section className="border border-[var(--cv-border-product)] bg-[var(--cv-surface)] shadow-[0_1px_2px_rgba(16,24,40,0.05)]" aria-labelledby="learning-path-heading">
                                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--cv-border-product)] px-5 py-4 sm:px-6">
                                        <div>
                                            <h2 id="learning-path-heading" className="font-[var(--cv-font-heading)] text-base font-extrabold text-[var(--cv-text-heading-product)]">Your 10-step learning path</h2>
                                            <p className="mt-0.5 text-xs font-medium text-[var(--cv-text-body-product)]">Each module opens into an applied lab with clear evidence of progress.</p>
                                        </div>
                                        <button type="button" onClick={() => navigate('/learning/ai-agent-curriculum')} className="inline-flex items-center gap-1 text-xs font-bold text-[var(--cv-text-accent)] hover:text-[var(--cv-action-primary-hover)]">
                                            Explore curriculum <ArrowRight size={13} />
                                        </button>
                                    </div>
                                    <ol className="grid grid-cols-1 divide-y divide-[var(--cv-border-product)] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                                        {modules.map((module, index) => {
                                            const isCurrent = module.id === activeModule?.id && !courseComplete;
                                            const isCompleted = module.state === 'completed';
                                            const lab = labByModuleOrder.get(module.order);
                                            return (
                                                <li key={module.id} className={`${index >= 2 ? 'sm:border-t sm:border-[var(--cv-border-product)]' : ''}`}>
                                                    <button type="button" onClick={() => navigate('/learning/ai-agent-curriculum')} className={`flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-[var(--cv-neutral-25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--cv-border-focus)] sm:px-6 ${isCurrent ? 'bg-[var(--cv-purple-25)]' : ''}`}>
                                                        <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold ${isCompleted ? 'bg-[var(--cv-success-50)] text-[var(--cv-success-600)]' : isCurrent ? 'bg-[var(--cv-action-primary)] text-white' : 'bg-[var(--cv-neutral-100)] text-[var(--cv-text-muted)]'}`}>
                                                            {isCompleted ? <CheckCircle2 size={14} /> : module.order}
                                                        </span>
                                                        <span className="min-w-0">
                                                            <span className="block text-sm font-bold leading-5 text-[var(--cv-text-heading-product)]">{module.title}</span>
                                                            <span className="mt-0.5 block line-clamp-2 text-xs font-medium leading-5 text-[var(--cv-text-body-product)]">{module.objective}</span>
                                                            <span className={`mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide ${isCompleted ? 'text-[var(--cv-success-600)]' : isCurrent ? 'text-[var(--cv-text-accent)]' : 'text-[var(--cv-text-muted)]'}`}>
                                                                {isCompleted ? 'Completed' : isCurrent ? `Up next${lab ? ` · ${getCourseExerciseCount(lab)} lessons` : ''}` : 'Locked in sequence'}
                                                            </span>
                                                        </span>
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ol>
                                </section>

                                <aside className="space-y-4 lg:sticky lg:top-6">
                                    <section className="border border-[var(--cv-border-product)] bg-[var(--cv-surface)] p-5 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
                                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--cv-purple-50)] text-[var(--cv-text-accent)]">
                                            <ListChecks size={18} />
                                        </span>
                                        <h2 className="mt-4 font-[var(--cv-font-heading)] text-base font-extrabold text-[var(--cv-text-heading-product)]">Practice with proof</h2>
                                        <p className="mt-1.5 text-xs font-medium leading-5 text-[var(--cv-text-body-product)]">Every completed lesson becomes a durable signal: a lab, quiz, or exercise you can revisit before an interview.</p>
                                        <div className="mt-4 border-t border-[var(--cv-border-product)] pt-4">
                                            <p className="text-xl font-extrabold text-[var(--cv-text-heading-product)]">{completedLessonCount}<span className="text-sm text-[var(--cv-text-muted)]"> / {totalLessonCount}</span></p>
                                            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--cv-text-muted)]">Hands-on lessons finished</p>
                                        </div>
                                    </section>

                                    <section className="border border-[var(--cv-border-product)] bg-[var(--cv-surface)] p-5 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
                                        <div className="flex items-center gap-2 text-[var(--cv-text-accent)]">
                                            <Clock3 size={15} />
                                            <p className="text-[11px] font-bold uppercase tracking-[0.14em]">Study rhythm</p>
                                        </div>
                                        <p className="mt-2 font-[var(--cv-font-heading)] text-sm font-extrabold leading-5 text-[var(--cv-text-heading-product)]">Keep the next session focused.</p>
                                        <p className="mt-1 text-xs font-medium leading-5 text-[var(--cv-text-body-product)]">Finish one lab, then use its takeaway to explain a technical decision out loud.</p>
                                    </section>
                                </aside>
                            </div>

                            <section className="border-t border-[var(--cv-border-product)] pt-6" aria-labelledby="coming-next-heading">
                                <div className="flex flex-wrap items-end justify-between gap-3">
                                    <div>
                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--cv-text-muted)]">Coming next</p>
                                        <h2 id="coming-next-heading" className="mt-1 font-[var(--cv-font-heading)] text-lg font-extrabold text-[var(--cv-text-heading-product)]">Specialized paths are on the roadmap.</h2>
                                    </div>
                                    <p className="text-xs font-medium text-[var(--cv-text-body-product)]">Complete the foundations path first.</p>
                                </div>
                                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                                    <article className="flex items-start gap-4 border border-[var(--cv-border-product)] bg-[var(--cv-surface)] p-5 opacity-80 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--cv-blue-50)] text-[var(--cv-blue-600)]"><Layers3 size={19} /></span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="font-[var(--cv-font-heading)] text-sm font-extrabold text-[var(--cv-text-heading-product)]">Advanced RAG &amp; Vector Databases</h3>
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[var(--cv-text-muted)]"><Lock size={11} /> Coming soon</span>
                                            </div>
                                            <p className="mt-1 text-xs font-medium leading-5 text-[var(--cv-text-body-product)]">Semantic search, hybrid retrieval, query translation, and metadata filtering with Qdrant and PgVector.</p>
                                            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--cv-text-muted)]">Intermediate · 8 steps</p>
                                        </div>
                                    </article>
                                    <article className="flex items-start gap-4 border border-[var(--cv-border-product)] bg-[var(--cv-surface)] p-5 opacity-80 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--cv-success-50)] text-[var(--cv-success-600)]"><ShieldCheck size={19} /></span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="font-[var(--cv-font-heading)] text-sm font-extrabold text-[var(--cv-text-heading-product)]">Agent Security &amp; Guardrails</h3>
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[var(--cv-text-muted)]"><Lock size={11} /> Coming soon</span>
                                            </div>
                                            <p className="mt-1 text-xs font-medium leading-5 text-[var(--cv-text-body-product)]">Prompt injection, jailbreaks, data leakage, adversarial inputs, and layered guardrails for production AI systems.</p>
                                            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--cv-text-muted)]">Advanced · 6 steps</p>
                                        </div>
                                    </article>
                                </div>
                            </section>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Back Button */}
                            <button
                                onClick={() => navigate('/learning')}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--cv-text-muted)] hover:text-[var(--cv-text-heading)] transition-colors"
                            >
                                <ArrowLeft size={14} /> Back to courses
                            </button>

                            <div className="grid grid-cols-1 items-start gap-5 @[1080px]/course-page:grid-cols-[minmax(0,1fr)_340px]">
                                <main className="space-y-4">
                                    {/* Hero */}
                                    <section className="cv-design-card p-4 sm:p-6">
                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <div className="cv-design-eyebrow mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--cv-action-border)] bg-[var(--cv-action-soft-bg)] px-2.5 py-1 text-xs">
                                                    <GraduationCap size={14} />
                                                    <span>AI-agent curriculum</span>
                                                </div>
                                                <h1 className="cv-design-title text-2xl sm:text-3xl">Build real AI agents, step by step</h1>
                                                <p className="cv-design-body mt-1.5 max-w-2xl text-sm">
                                                    10 steps from LLM foundations to a shipped portfolio project. Each step mixes readings, videos, animated playgrounds, quizzes, and a code lab — curated from Microsoft, OpenAI, Anthropic, Google, and Hugging Face's open courses.
                                                </p>
                                            </div>
                                            {currentLab && (
                                                <button
                                                    type="button"
                                                    onClick={() => openCourse(currentLab.id)}
                                                    className="cv-design-button-primary inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-4 text-sm"
                                                >
                                                    <Play size={15} />
                                                    {completedCount > 0 ? 'Continue' : 'Start'} step {currentModule?.order}
                                                    <ArrowRight size={15} />
                                                </button>
                                            )}
                                        </div>
                                    </section>

                                    {/* The learning path — one row per step */}
                                    <section className="cv-design-card overflow-hidden">
                                        <ol>
                                            {modules.map((module, idx) => {
                                                const isExpanded = expandedId === module.id;
                                                const isLast = idx === modules.length - 1;
                                                const isCompleting = completingId === module.id;
                                                const lab = labByModuleOrder.get(module.order);
                                                const lessonCount = lab ? getCourseExerciseCount(lab) : 0;
                                                const isCurrent = module.id === currentModule?.id;
                                                const labProgress = lab ? progressByCourse[lab.id] : undefined;
                                                const doneLessons = lab && labProgress
                                                    ? getCourseExercises(lab).filter((e) => labProgress.completedModuleIds.includes(e.id)).length
                                                    : 0;
                                                const lessonPct = lessonCount > 0 ? Math.round((doneLessons / lessonCount) * 100) : 0;
                                                const actionLabel = module.state === 'completed' || (lessonCount > 0 && doneLessons >= lessonCount)
                                                    ? 'Review'
                                                    : doneLessons > 0 ? 'Continue' : 'Start';
                                                return (
                                                    <li key={module.id} className={!isLast ? 'border-b border-[var(--cv-border-warm)]' : ''}>
                                                        <div
                                                            className={`flex w-full items-center gap-3 p-4 text-left transition-colors sm:p-5 ${module.state !== 'locked' ? 'hover:bg-[var(--cv-surface-warm-muted,rgba(0,0,0,0.02))]' : 'opacity-60'} ${isCurrent ? 'bg-[var(--cv-action-soft-bg,rgba(99,91,213,0.04))]' : ''}`}
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleExpand(module)}
                                                                // Locked rows stay clickable for guests so the tap opens
                                                                // the sign-in gate instead of dying silently.
                                                                disabled={module.state === 'locked' && Boolean(currentUser)}
                                                                aria-expanded={isExpanded}
                                                                className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:cursor-not-allowed"
                                                            >
                                                                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${STATE_ICON_WELL[module.state]}`}>
                                                                    {module.state === 'completed' ? <CheckCircle2 size={17} /> : module.state === 'locked' ? <Lock size={14} /> : module.order}
                                                                </span>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <h2 className="cv-design-title text-base sm:text-lg">{module.title}</h2>
                                                                        {isCurrent && (
                                                                            <span className="rounded-full bg-[var(--cv-action-primary)] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
                                                                                Up next
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="cv-design-body mt-0.5 truncate text-xs sm:text-sm">{module.objective}</p>
                                                                    {lab && module.state !== 'locked' && (
                                                                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                                                                            <p className="flex items-center gap-x-2 text-[11px] font-bold text-[var(--cv-text-muted)]">
                                                                                <span className="uppercase">{lab.difficulty}</span>
                                                                                <span aria-hidden>·</span>
                                                                                <span>{doneLessons} / {lessonCount} lessons</span>
                                                                                {lab.estimatedMinutes && (
                                                                                    <>
                                                                                        <span aria-hidden>·</span>
                                                                                        <span>~{lab.estimatedMinutes} min</span>
                                                                                    </>
                                                                                )}
                                                                            </p>
                                                                            <span className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--cv-border-warm)]">
                                                                                <span
                                                                                    className={`block h-full rounded-full transition-[width] duration-500 ${lessonPct >= 100 ? 'bg-[var(--cv-success-600)]' : 'bg-[var(--cv-action-primary)]'}`}
                                                                                    style={{ width: `${Math.max(lessonPct, doneLessons > 0 ? 6 : 0)}%` }}
                                                                                />
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </button>
                                                            {lab && module.state !== 'locked' && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openCourse(lab.id)}
                                                                    className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-colors ${isCurrent
                                                                        ? 'cv-design-button-primary'
                                                                        : 'border border-[var(--cv-action-border)] bg-[var(--cv-action-soft-bg)] text-[var(--cv-action-primary)] hover:border-[var(--cv-action-primary)]'}`}
                                                                >
                                                                    <Play size={13} />
                                                                    {actionLabel}
                                                                </button>
                                                            )}
                                                            {module.state !== 'locked' && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleExpand(module)}
                                                                    aria-expanded={isExpanded}
                                                                    aria-label={isExpanded ? 'Hide details' : 'Show details'}
                                                                    className="shrink-0 p-1 text-[var(--cv-text-muted)] transition-colors hover:text-[var(--cv-text-heading)]"
                                                                >
                                                                    <ChevronDown
                                                                        size={18}
                                                                        className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                                    />
                                                                </button>
                                                            )}
                                                        </div>

                                                        {isExpanded && (
                                                            <div className="space-y-4 border-t border-[var(--cv-border-warm)] bg-[var(--cv-surface-warm-muted,transparent)] px-4 pb-5 pt-4 sm:px-5">
                                                                <div>
                                                                    <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--cv-text-eyebrow)]">
                                                                        <Sparkles size={12} /> What you'll learn
                                                                    </p>
                                                                    <ul className="space-y-1.5">
                                                                        {module.topics.map((topic) => (
                                                                            <li key={topic} className="cv-design-body flex items-start gap-2 text-xs sm:text-sm">
                                                                                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--cv-action-primary)]" />
                                                                                {topic}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>

                                                                {module.exercise && (
                                                                    <div className="flex items-start gap-2.5 rounded-lg border border-[var(--cv-border-warm)] bg-[var(--cv-surface-warm-card)] p-3">
                                                                        <span className="cv-design-icon-well mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md">
                                                                            <BookOpen size={12} />
                                                                        </span>
                                                                        <div className="min-w-0">
                                                                            <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--cv-text-muted)]">Exercise</p>
                                                                            <p className="cv-design-body mt-0.5 text-xs sm:text-sm">{module.exercise}</p>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {module.project && (
                                                                    <div className="flex items-start gap-2.5 rounded-lg border border-[var(--cv-border-warm)] bg-[var(--cv-surface-warm-card)] p-3">
                                                                        <span className="cv-design-icon-well mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md">
                                                                            <Target size={12} />
                                                                        </span>
                                                                        <div className="min-w-0">
                                                                            <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--cv-text-muted)]">Project</p>
                                                                            <p className="cv-design-body mt-0.5 text-xs sm:text-sm">{module.project}</p>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {module.sourceIds.length > 0 && (
                                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                                        <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--cv-text-muted)]">Sources</span>
                                                                        {module.sourceIds.map((sourceId) => {
                                                                            const source = getLearningSourceById(sourceId);
                                                                            if (!source) return null;
                                                                            return source.repoUrl ? (
                                                                                <a
                                                                                    key={sourceId}
                                                                                    href={source.repoUrl}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="inline-flex items-center gap-1 rounded-full border border-[var(--cv-border-warm)] bg-[var(--cv-surface-warm-card-strong)] px-2 py-0.5 text-[11px] font-medium text-[var(--cv-text-body)] transition-colors hover:border-[var(--cv-action-border)] hover:text-[var(--cv-action-primary)]"
                                                                                >
                                                                                    {source.title}
                                                                                    <ExternalLink size={10} />
                                                                                </a>
                                                                            ) : (
                                                                                <span key={sourceId} className="rounded-full border border-[var(--cv-border-warm)] bg-[var(--cv-surface-warm-card-strong)] px-2 py-0.5 text-[11px] font-medium text-[var(--cv-text-body)]">
                                                                                    {source.title}
                                                                                </span>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}

                                                                <div className="flex flex-wrap items-center gap-3 pt-1">
                                                                    {lab && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => openCourse(lab.id)}
                                                                            className="cv-design-button-primary inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-xs"
                                                                        >
                                                                            <Play size={13} /> {actionLabel} lessons
                                                                            <ArrowRight size={13} />
                                                                        </button>
                                                                    )}
                                                                    {module.state === 'completed' ? (
                                                                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--cv-success-600)]">
                                                                            <CheckCircle2 size={14} /> Module complete
                                                                        </span>
                                                                    ) : currentUser ? (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleComplete(module.id)}
                                                                            disabled={isCompleting}
                                                                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--cv-border-warm)] bg-[var(--cv-surface-warm-card)] px-4 text-xs font-bold text-[var(--cv-text-body)] transition-colors hover:border-[var(--cv-action-border)] disabled:cursor-not-allowed"
                                                                        >
                                                                            {isCompleting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                                                            Mark complete
                                                                        </button>
                                                                    ) : (
                                                                        <p className="cv-design-body text-xs">Sign in to track your progress through this module.</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </li>
                                                );
                                            })}
                                        </ol>
                                    </section>
                                </main>

                                <aside className="space-y-4 @[1080px]/course-page:sticky @[1080px]/course-page:top-6">
                                    {currentUser ? (
                                        <>
                                            {/* Level */}
                                            <section className="cv-design-card p-4">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>
                                                        <p className="cv-design-title text-base">Level {isLoadingLevel ? '—' : levelInfo.level}</p>
                                                        <p className="cv-design-body mt-0.5 text-xs">
                                                            {isLoadingLevel ? 'Loading…' : `${levelInfo.currentLevelXp} / ${levelInfo.nextLevelXp} XP to level ${levelInfo.level + 1}`}
                                                        </p>
                                                    </div>
                                                    <span className="cv-design-icon-well flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
                                                        <Zap size={16} />
                                                    </span>
                                                </div>
                                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--cv-border-warm)]">
                                                    <div
                                                        className="h-full rounded-full bg-[var(--cv-action-primary)] transition-[width] duration-500"
                                                        style={{ width: `${Math.max((isLoadingLevel ? 0 : levelInfo.progress) * 100, 2)}%` }}
                                                    />
                                                </div>
                                            </section>

                                            {/* Course progress */}
                                            <section className="cv-design-card p-4">
                                                <h2 className="cv-design-title text-base">Course progress</h2>
                                                <p className="cv-design-body mt-0.5 text-xs">
                                                    {isLoadingCourse ? 'Loading…' : `${completedCount} / ${totalCount} modules completed`}
                                                </p>
                                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--cv-border-warm)]">
                                                    <div
                                                        className="h-full rounded-full bg-[var(--cv-action-primary)] transition-[width] duration-500"
                                                        style={{ width: `${Math.max(progressPct, completedCount > 0 ? 4 : 0)}%` }}
                                                    />
                                                </div>
                                                {courseComplete && (
                                                    <p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-[var(--cv-success-600)]">
                                                        <Rocket size={14} /> Curriculum complete — nice work!
                                                    </p>
                                                )}
                                            </section>

                                            {/* Course badges: one per completed module */}
                                            <section className="cv-design-card p-4">
                                                <div className="flex items-center justify-between gap-3">
                                                    <h2 className="cv-design-title text-base">Course badges</h2>
                                                    <span className="cv-design-body text-xs">{completedCount} / {totalCount}</span>
                                                </div>
                                                <p className="cv-design-body mt-0.5 text-xs">Complete a module to earn its badge — collect 'em all.</p>
                                                <div className="mt-3 grid grid-cols-5 gap-2">
                                                    {modules.map((module) => {
                                                        const earned = module.state === 'completed';
                                                        return (
                                                            <div
                                                                key={module.id}
                                                                title={module.title}
                                                                className={`flex aspect-square items-center justify-center rounded-lg border text-xs font-extrabold transition-colors ${earned
                                                                    ? 'border-[var(--cv-success-600)]/40 bg-[var(--cv-success-50)] text-[var(--cv-success-600)]'
                                                                    : 'border-[var(--cv-border-warm)] bg-[var(--cv-surface-warm-card)] text-[var(--cv-text-muted)]'
                                                                    }`}
                                                            >
                                                                {earned ? <CheckCircle2 size={16} /> : module.order}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </section>
                                        </>
                                    ) : (
                                        <section className="cv-design-card p-4">
                                            <h2 className="cv-design-title text-base">Your progress</h2>
                                            <p className="cv-design-body mt-1.5 text-xs">Sign in to save your module completions, earn XP, and unlock the next chapter automatically.</p>
                                        </section>
                                    )}
                                </aside>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
};

export default CoursePage;
