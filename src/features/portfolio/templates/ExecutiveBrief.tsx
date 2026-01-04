import React from 'react';
import { PortfolioTemplateProps } from '../types/portfolio';
import { Briefcase, TrendingUp, Users, Award, ChevronRight, Download, Linkedin, Mail } from 'lucide-react';
import { usePortfolioAdminAccess } from '../hooks/usePortfolioAdminAccess';

const ExecutiveBrief: React.FC<PortfolioTemplateProps> = ({ data, onEdit, isMobileView }) => {
    const { hero, projects, timeline, about, education } = data;

    // Admin Access Hook
    const { longPressProps, AdminAccessModal } = usePortfolioAdminAccess({ data, onEdit });

    const responsiveClass = (base: string, desktop: string) => {
        return isMobileView ? base : `${base} ${desktop}`;
    };

    return (
        <div className="bg-[#f8f9fa] text-[#2c3e50] font-sans min-h-full selection:bg-slate-300 selection:text-slate-900 border-t-[6px] border-[#2c3e50]">
            {/* Minimal Top Bar */}
            <div className="max-w-5xl mx-auto px-6 py-8 flex justify-between items-center">
                <div className="font-bold text-lg tracking-tight uppercase text-slate-500">Executive Brief</div>
                <div className="flex items-center gap-4">
                    <a href={`mailto:${data.contactEmail}`} className="text-slate-600 hover:text-slate-900 transition-colors"><Mail size={20} /></a>
                    <a href="#" className="text-slate-600 hover:text-[#0077b5] transition-colors"><Linkedin size={20} /></a>
                </div>
            </div>

            {/* Header Content */}
            <header className="max-w-5xl mx-auto px-6 pb-20 pt-10">
                <div className={`grid ${responsiveClass('', 'md:grid-cols-[2fr_1fr]')} gap-12 items-start`}>
                    <div>
                        <h1
                            onClick={() => onEdit?.('hero.headline')}
                            className={`${responsiveClass('text-4xl', 'md:text-6xl')} font-extrabold tracking-tight text-slate-900 mb-6 leading-tight cursor-pointer hover:text-[#0077b5] transition-colors`}
                            title="Click to edit headline"
                        >
                            {hero.headline}
                        </h1>
                        <p
                            onClick={() => onEdit?.('hero.subheadline')}
                            className={`${responsiveClass('text-xl', 'md:text-2xl')} text-slate-500 leading-relaxed max-w-2xl font-light cursor-pointer hover:bg-slate-200 rounded -m-1 p-1`}
                            title="Click to edit subheadline"
                        >
                            {hero.subheadline}
                        </p>

                        <div className="mt-10 flex flex-wrap gap-4">
                            <a href="#" className="px-6 py-3 bg-[#2c3e50] text-white font-semibold rounded hover:bg-[#34495e] transition-colors flex items-center gap-2">
                                Download Executive Bio <Download size={16} />
                            </a>
                            <a href="#contact" className="px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded hover:border-slate-400 transition-colors">
                                Get in Touch
                            </a>
                        </div>
                    </div>
                    {/* Headshot Card */}
                    <div className="relative">
                        <div className="bg-white p-4 shadow-xl border border-slate-100 rounded-lg transform rotate-2 hover:rotate-0 transition-transform duration-500">
                            <div
                                className={`aspect-[3/4] bg-slate-200 rounded overflow-hidden ${onEdit ? 'cursor-pointer hover:ring-2 hover:ring-[#2c3e50]' : ''}`}
                                {...(onEdit ? { onClick: () => onEdit('hero.avatarUrl') } : longPressProps)}
                            >
                                {hero.avatarUrl ? (
                                    <img src={hero.avatarUrl} alt="Executive Headshot" className="w-full h-full object-cover grayscale contrast-125 hover:grayscale-0 transition-all duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <Users size={64} />
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 text-center">
                                <div className="font-bold text-slate-900 uppercase tracking-wider text-sm">Strategic Leader</div>
                                <div className="text-xs text-slate-500 mt-1">Global Operations & Growth</div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Key Achievements / Metrics (Projects) */}
            <section className="bg-white py-20 px-6 border-y border-slate-200">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center gap-3 mb-12">
                        <TrendingUp className="text-[#2c3e50]" />
                        <h2 className="text-xl font-bold uppercase tracking-widest text-[#2c3e50]">Strategic Impact</h2>
                    </div>

                    <div className={`grid ${responsiveClass('grid-cols-1', 'md:grid-cols-2 lg:grid-cols-3')} gap-8`}>
                        {projects.map((proj, idx) => (
                            <div key={proj.id} className="p-8 bg-slate-50 rounded-lg border border-slate-100 hover:border-[#2c3e50] transition-colors group">
                                <div className="text-4xl font-extrabold text-slate-200 mb-4 group-hover:text-[#2c3e50]/20 transition-colors">{(idx + 1).toString().padStart(2, '0')}</div>
                                <h3
                                    onClick={() => onEdit?.(`projects.${proj.id}.title`)}
                                    className="text-lg font-bold text-slate-900 mb-3 cursor-pointer hover:text-[#2c3e50]/70 transition-colors"
                                >
                                    {proj.title}
                                </h3>
                                <p
                                    onClick={() => onEdit?.(`projects.${proj.id}.description`)}
                                    className="text-slate-600 text-sm leading-relaxed mb-6 cursor-pointer hover:bg-slate-100 p-1 -m-1 rounded"
                                >
                                    {proj.description}
                                </p>
                                <div className="flex gap-2">
                                    {proj.tags.slice(0, 2).map(tag => (
                                        <span key={tag} className="px-2 py-1 bg-white border border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500 rounded">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Professional Timeline */}
            <section className="py-20 px-6 max-w-5xl mx-auto">
                <div className="flex items-center gap-3 mb-12">
                    <Briefcase className="text-[#2c3e50]" />
                    <h2 className="text-xl font-bold uppercase tracking-widest text-[#2c3e50]">Career Trajectory</h2>
                </div>

                <div className="space-y-0 border-l-2 border-slate-200 ml-3">
                    {timeline.map((job) => (
                        <div key={job.id} className="relative pl-8 pb-12 last:pb-0">
                            <div className="absolute -left-[9px] top-1 w-4 h-4 bg-white border-4 border-[#2c3e50] rounded-full"></div>
                            <div className={`flex ${responsiveClass('flex-col', 'sm:flex-row sm:items-baseline')} justify-between mb-2`}>
                                <h3
                                    onClick={() => onEdit?.(`timeline.${job.id}.employer`)}
                                    className="text-2xl font-bold text-slate-900 cursor-pointer hover:text-[#2c3e50]/70 transition-colors"
                                >
                                    {job.employer}
                                </h3>
                                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">{job.startDate} — {job.endDate}</span>
                            </div>
                            <div
                                onClick={() => onEdit?.(`timeline.${job.id}.jobTitle`)}
                                className="text-lg text-[#2c3e50] font-medium mb-4 cursor-pointer hover:text-[#34495e] transition-colors"
                            >
                                {job.jobTitle}
                            </div>
                            <p
                                onClick={() => onEdit?.(`timeline.${job.id}.description`)}
                                className="text-slate-600 leading-relaxed max-w-3xl cursor-pointer hover:bg-slate-50 p-1 -m-1 rounded"
                            >
                                {job.description}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Education & Bio Summary */}
            <section className="bg-[#2c3e50] text-white py-20 px-6">
                <div className={`max-w-5xl mx-auto grid ${responsiveClass('', 'md:grid-cols-2')} gap-16`}>
                    <div>
                        <h2 className="text-lg font-bold uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2">
                            <Award size={18} /> Education
                        </h2>
                        <ul className="space-y-6">
                            {education.map(edu => (
                                <li key={edu.id} className="border-l border-slate-600 pl-6">
                                    <div
                                        onClick={() => onEdit?.(`education.${edu.id}.school`)}
                                        className="font-bold text-lg cursor-pointer hover:text-slate-300 transition-colors"
                                    >
                                        {edu.school}
                                    </div>
                                    <div
                                        onClick={() => onEdit?.(`education.${edu.id}.degree`)}
                                        className="text-slate-300 mb-1 cursor-pointer hover:text-white transition-colors"
                                    >
                                        {edu.degree}
                                    </div>
                                    <div className="text-sm text-slate-500 uppercase tracking-wider">{edu.endDate}</div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-lg font-bold uppercase tracking-widest text-slate-400 mb-8">Executive Summary</h2>
                        <p
                            onClick={() => onEdit?.('about')}
                            className="text-slate-300 leading-loose text-lg font-light cursor-pointer hover:bg-slate-700 rounded p-2 -m-2 transition-colors"
                            title="Click to edit summary"
                        >
                            {about}
                        </p>
                    </div>
                </div>
            </section>

            <footer className="text-center py-8 text-slate-400 text-sm">
                &copy; {new Date().getFullYear()} {hero.headline}. Confidential & Proprietary.
            </footer>
            <AdminAccessModal />
        </div>
    );
};

export default ExecutiveBrief;
