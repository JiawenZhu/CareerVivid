import React from 'react';
import { ArrowRight, Briefcase, CheckCircle2, Clock, FileText, Link2, ShieldCheck, Users } from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import Footer from '../../components/Footer';
import { navigate } from '../../utils/navigation';
import SEOHelper from '../../components/SEOHelper';

const editorialGridStyle: React.CSSProperties = {
    backgroundColor: '#f7f1e7',
    backgroundImage: 'linear-gradient(rgba(228, 211, 188, 0.32) 1px, transparent 1px), linear-gradient(90deg, rgba(228, 211, 188, 0.32) 1px, transparent 1px)',
    backgroundSize: '48px 48px',
};

const AgencyPartnerPage: React.FC = () => {
    return (
        <div className="text-[#211b16] min-h-screen flex flex-col selection:bg-[#ead9c3]" style={editorialGridStyle}>
            <SEOHelper
                title="Agency Partner Pilot | CareerVivid"
                description="CareerVivid helps staffing agencies prepare walk-in and online applicants with resume optimization, readiness reporting, and candidate-controlled sharing."
                keywords="staffing agency resume preparation, recruiter time savings, candidate readiness, CareerVivid agency partner"
                url="https://careervivid.app/partners/agency"
                schemaType="SoftwareApplication"
                schemaData={{
                    "@type": "SoftwareApplication",
                    name: "CareerVivid Agency Partner Pilot",
                    applicationCategory: "BusinessApplication",
                    applicationSubCategory: "Candidate preparation workspace",
                    operatingSystem: "Web",
                    description: "A co-branded candidate preparation layer for staffing agencies to track applicant readiness before recruiter review.",
                    url: "https://careervivid.app/partners/agency"
                }}
            />
            <PublicHeader variant="editorial" />
            <main className="flex-grow pt-20">
                <section className="bg-[#fffaf1]/70 py-20 px-4 border-b border-[#e4d3bc]">
                    <div className="max-w-5xl mx-auto">
                        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-[#d7c4a9] bg-[#fffaf1] px-4 py-2 text-sm font-bold text-[#8b5a16] shadow-sm shadow-[#8b5a16]/5">
                                    <Briefcase size={16} />
                                    Agency Partner Pilot
                                </div>
                                <h1 className="mt-6 text-4xl md:text-5xl font-bold tracking-tight text-[#211b16]">
                                    Prepare applicants before recruiters spend time fixing resumes.
                                </h1>
                                <p className="mt-6 text-lg leading-8 text-[#665a4a]">
                                    CareerVivid gives staffing branches a co-branded prep portal for walk-ins and online applicants. Candidates improve their resume score, download a cleaner PDF, and share a readiness report only when they consent.
                                </p>
                                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                    <button
                                        onClick={() => navigate('/partners/apply?type=agency')}
                                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#211b16] px-6 py-3 font-bold text-[#fffaf1] shadow-lg shadow-[#8b5a16]/15 transition hover:bg-[#3a2f26]"
                                    >
                                        Start a 14-day pilot
                                        <ArrowRight size={18} />
                                    </button>
                                    <button
                                        onClick={() => navigate('/partners')}
                                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d7c4a9] bg-[#fffaf1] px-6 py-3 font-bold text-[#665a4a] transition hover:border-[#bfa782] hover:text-[#211b16]"
                                    >
                                        View partner paths
                                    </button>
                                </div>
                            </div>

                            <div className="rounded-lg border border-[#e4d3bc] bg-[#fffaf1] p-6 shadow-xl shadow-[#8b5a16]/10">
                                <div className="flex items-center gap-3 border-b border-[#e4d3bc] pb-4">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#e8f0e6] text-[#2f6f5e]">
                                        <Link2 size={22} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-[#211b16]">Branch prep link</p>
                                        <p className="text-xs text-[#665a4a]">careervivid.app/prepare/spherion-savoy</p>
                                    </div>
                                </div>
                                <div className="mt-5 space-y-4">
                                    {[
                                        ['Invited applicants', '20 pilot seats'],
                                        ['Average score lift', '+12 points'],
                                        ['Recruiter visibility', 'Progress before consent'],
                                        ['Integration work', 'None for pilot'],
                                    ].map(([label, value]) => (
                                        <div key={label} className="flex items-center justify-between rounded-lg border border-[#ead9c3] bg-[#fdf5e8] px-4 py-3 dark:border-[#4a453d] dark:bg-[#302e2a]">
                                            <span className="text-sm font-medium text-[#665a4a] dark:text-[#aaa39a]">{label}</span>
                                            <span className="text-sm font-bold text-[#211b16] dark:text-[#f4f1e9]">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-20 max-w-7xl mx-auto px-4">
                    <div className="grid gap-6 md:grid-cols-3">
                        {[
                            {
                                icon: <Clock size={24} />,
                                title: 'Reduce resume cleanup',
                                body: 'Let candidates handle basic resume fixes before recruiters spend manual time editing documents.',
                            },
                            {
                                icon: <FileText size={24} />,
                                title: 'Standardize readiness',
                                body: 'Track score movement, resume completion, and shared reports from one branch dashboard.',
                            },
                            {
                                icon: <ShieldCheck size={24} />,
                                title: 'Protect candidate consent',
                                body: 'Agencies see progress first. Full resume links and reports unlock only after the candidate shares.',
                            },
                        ].map((item) => (
                            <div key={item.title} className="rounded-lg border border-[#e4d3bc] bg-[#fffaf1] p-6 shadow-sm shadow-[#8b5a16]/5">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#e8f0e6] text-[#2f6f5e]">
                                    {item.icon}
                                </div>
                                <h3 className="text-xl font-bold text-[#211b16]">{item.title}</h3>
                                <p className="mt-3 text-sm leading-6 text-[#665a4a]">{item.body}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bg-[#fffaf1]/70 py-20 border-y border-[#e4d3bc]">
                    <div className="mx-auto max-w-5xl px-4">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-[#211b16]">The zero-integration pilot</h2>
                            <p className="mt-3 text-[#665a4a]">Start with a branch link and 10-20 candidates. API or ATS sync comes only after the workflow proves useful.</p>
                        </div>
                        <div className="mt-10 grid gap-4 md:grid-cols-3">
                            {[
                                'Recruiter gives applicant the branch prep link.',
                                'Applicant improves resume and downloads the final PDF.',
                                'Applicant consents to share the readiness report with the branch.',
                            ].map((step, index) => (
                                <div key={step} className="rounded-lg border border-[#e4d3bc] bg-[#fffaf1] p-5">
                                    <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#211b16] text-sm font-bold text-[#fffaf1]">
                                        {index + 1}
                                    </div>
                                    <p className="text-sm font-semibold leading-6 text-[#665a4a]">{step}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-20 px-4">
                    <div className="mx-auto max-w-4xl rounded-lg border border-[#3a2f26] bg-[#211b16] p-10 text-center text-[#fffaf1] shadow-xl shadow-[#8b5a16]/15">
                        <Users className="mx-auto mb-5 h-12 w-12 text-[#ead9c3]" />
                        <h2 className="text-3xl font-bold">Validate with one branch first.</h2>
                        <p className="mx-auto mt-4 max-w-2xl text-[#d8c6ad]">
                            The pilot is designed to prove recruiter time savings and candidate readiness before asking agencies to change systems.
                        </p>
                        <button
                            onClick={() => navigate('/partners/apply?type=agency')}
                            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#fffaf1] px-8 py-3 font-bold text-[#211b16] transition hover:bg-[#f7f1e7]"
                        >
                            Apply for agency pilot
                            <CheckCircle2 size={18} />
                        </button>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default AgencyPartnerPage;
