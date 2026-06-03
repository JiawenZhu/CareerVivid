import React from 'react';
import { ArrowRight, Briefcase, Check, FileText, PanelRightOpen, Sparkles } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import { useResumes } from '../hooks/useResumes';
import { navigate } from '../utils/navigation';

const ExtensionWelcomePage: React.FC = () => {
    const { currentUser, userProfile } = useAuth();
    const { resumes, isLoading } = useResumes();
    const firstName = userProfile?.displayName?.split(' ')[0] || currentUser?.displayName?.split(' ')[0] || 'there';
    const hasResume = !isLoading && resumes.length > 0;

    const startResume = () => {
        navigate('/newresume?scrollTo=create-section');
    };

    return (
        <div className="min-h-screen bg-[#f7f8fb] text-slate-950">
            <div className="grid min-h-screen lg:grid-cols-[320px_1fr]">
                <aside className="border-r border-slate-200 bg-white px-8 py-10">
                    <Logo className="h-10 w-10" />
                    <h1 className="mt-10 text-2xl font-extrabold tracking-tight">Welcome, {firstName}.</h1>
                    <p className="mt-4 text-sm leading-6 text-slate-600">
                        Finish the extension setup once, then CareerVivid can autofill applications, score jobs, and create tailored materials from your real resume.
                    </p>

                    <div className="mt-10 space-y-4">
                        {[
                            'Create or import your base resume',
                            'Select that resume in the side panel',
                            'Return to a job page to save and tailor',
                        ].map((item, index) => (
                            <div key={item} className="flex items-start gap-3">
                                <div className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                    index === 0 && !hasResume ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                    {index === 0 && !hasResume ? '1' : <Check size={14} />}
                                </div>
                                <span className="text-sm font-semibold text-slate-700">{item}</span>
                            </div>
                        ))}
                    </div>
                </aside>

                <main className="flex items-center justify-center px-6 py-12">
                    <div className="grid w-full max-w-6xl gap-8 xl:grid-cols-[1fr_380px]">
                        <section className="self-center">
                            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-700 shadow-sm">
                                <PanelRightOpen size={14} />
                                Chrome side panel ready
                            </div>

                            <h2 className="mt-6 max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                                Set up CareerVivid before your first application.
                            </h2>
                            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
                                CareerVivid works best with a base resume first. Once it exists, the extension can use that resume to fill job applications, compare fit, save jobs, and launch tailored resumes.
                            </p>

                            <div className="mt-8 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <FileText className="text-indigo-600" size={22} />
                                    <h3 className="mt-3 text-sm font-extrabold">Base resume</h3>
                                    <p className="mt-1 text-xs leading-5 text-slate-500">Import an existing resume or generate one from a prompt.</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <Briefcase className="text-blue-600" size={22} />
                                    <h3 className="mt-3 text-sm font-extrabold">Job context</h3>
                                    <p className="mt-1 text-xs leading-5 text-slate-500">Open a job page and let the side panel detect the role.</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <Sparkles className="text-emerald-600" size={22} />
                                    <h3 className="mt-3 text-sm font-extrabold">Tailored output</h3>
                                    <p className="mt-1 text-xs leading-5 text-slate-500">Use AI matching, autofill, tailored resume, and interview practice.</p>
                                </div>
                            </div>

                            <div className="mt-9 flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={startResume}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-300/60 transition hover:bg-black"
                                >
                                    {hasResume ? 'Create another resume' : 'Create your first resume'}
                                    <ArrowRight size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/dashboard')}
                                    className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Open dashboard
                                </button>
                            </div>
                        </section>

                        <aside className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70">
                            <div className="flex items-center gap-3">
                                <Logo className="h-10 w-10" />
                                <div>
                                    <div className="text-xs font-bold uppercase tracking-wide text-indigo-600">CareerVivid Extension</div>
                                    <div className="text-lg font-black text-slate-950">Ready for setup</div>
                                </div>
                            </div>
                            <p className="mt-5 text-sm leading-6 text-slate-600">
                                After your first resume is ready, return to LinkedIn, Ashby, Lever, Greenhouse, or Workday and open the CareerVivid side panel from Chrome.
                            </p>
                            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                                <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Next action</div>
                                <div className="mt-2 text-sm font-bold text-slate-900">
                                    {hasResume ? `${resumes.length} resume${resumes.length === 1 ? '' : 's'} available` : 'No resume connected yet'}
                                </div>
                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                    {hasResume ? 'Select one in the side panel to power autofill.' : 'Create or import one to unlock autofill and matching.'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={startResume}
                                className="mt-6 w-full rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-extrabold text-indigo-700 transition hover:bg-indigo-100"
                            >
                                Go to resume builder
                            </button>
                        </aside>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ExtensionWelcomePage;
