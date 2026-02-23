import React from 'react';
import { PortfolioTemplateProps } from '../../types/portfolio';
import { Scale, BookOpen, Clock, Globe, Mail, Phone, Award, FileText } from 'lucide-react';

const LegalTrust: React.FC<PortfolioTemplateProps> = ({ data, onEdit, isMobileView }) => {
    const { hero, projects, timeline, education, contactEmail, socialLinks, about } = data;

    const responsiveClass = (base: string, desktop: string) => {
        return isMobileView ? base : `${base} ${desktop}`;
    };

    return (
        <div className="bg-slate-900 text-slate-200 font-serif min-h-full selection:bg-amber-500/30 selection:text-amber-100">
            {/* Top Bar - Contact Grid */}
            <div className="border-b border-slate-700 bg-slate-950 px-6 py-2 text-xs md:text-sm tracking-widest uppercase text-slate-400">
                <div className={`max-w-6xl mx-auto flex ${responsiveClass('flex-col', 'md:flex-row')} justify-between items-center gap-2`}>
                    <span className="flex items-center gap-2"><Scale size={14} className="text-amber-500" /> Attorneys at Law & Strategic Consultants</span>
                    <span className="flex gap-6">
                        <a href={`mailto:${contactEmail}`} className="hover:text-amber-500 transition-colors flex items-center gap-2">
                            <Mail size={14} /> {contactEmail || 'contact@firm.com'}
                        </a>
                        <span className={`${responsiveClass('hidden', 'md:inline')}`}>|</span>
                        <span className="flex items-center gap-2"><Phone size={14} /> +1 (555) 000-0000</span>
                    </span>
                </div>
            </div>

            {/* Hero / Partner Profile */}
            <header className={`px-6 ${responsiveClass('py-20', 'md:py-32')} max-w-4xl mx-auto text-center`}>
                <div className="w-20 h-1 bg-amber-500 mx-auto mb-8" />
                <h1
                    onClick={() => onEdit?.('hero.headline')}
                    className={`${responsiveClass('text-5xl', 'md:text-7xl')} font-medium text-slate-50 mb-6 drop-shadow-lg cursor-pointer hover:text-amber-500 transition-colors`}
                    title="Click to edit headline"
                >
                    {hero.headline}
                </h1>
                <p
                    onClick={() => onEdit?.('hero.subheadline')}
                    className={`${responsiveClass('text-xl', 'md:text-2xl')} text-amber-500/90 italic font-light mb-12 font-sans max-w-2xl mx-auto cursor-pointer hover:text-white transition-colors`}
                    title="Click to edit subheadline"
                >
                    {hero.subheadline}
                </p>
                <div className="flex justify-center gap-6">
                    <a href={hero.ctaPrimaryUrl || "#contact"} className="px-8 py-3 bg-amber-600 text-slate-900 font-bold uppercase tracking-widest text-sm hover:bg-amber-500 transition-colors shadow-lg shadow-amber-900/20">
                        {hero.ctaPrimaryLabel || 'Consultation'}
                    </a>
                    <a href={hero.ctaSecondaryUrl || "#practice-areas"} className="px-8 py-3 border border-slate-600 text-slate-300 font-bold uppercase tracking-widest text-sm hover:border-amber-500 hover:text-amber-500 transition-colors">
                        {hero.ctaSecondaryLabel || 'Our Practice'}
                    </a>
                </div>
            </header>

            {/* Biography */}
            <section className="bg-slate-800 py-20 px-6 border-y border-slate-700">
                <div className={`max-w-4xl mx-auto grid ${responsiveClass('grid-cols-1', 'md:grid-cols-[1fr_2fr]')} gap-12 items-start`}>
                    <div className="relative">
                        <div className="aspect-[3/4] bg-slate-700 border-4 border-slate-600 shadow-2xl overflow-hidden">
                            {hero.avatarUrl ? (
                                <img src={hero.avatarUrl} alt="Attorney Profile" className="w-full h-full object-cover grayscale opacity-80 hover:opacity-100 transition-opacity" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-600">
                                    <Scale size={64} />
                                </div>
                            )}
                        </div>
                        <div className="mt-4 text-center">
                            <h3 className="text-amber-500 font-sans font-bold uppercase tracking-wider text-sm">Managing Partner</h3>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-3xl font-medium text-slate-100 mb-6 flex items-center gap-3">
                            <span className="w-8 h-[1px] bg-amber-500 block"></span>
                            Professional Biography
                        </h2>
                        <div
                            onClick={() => onEdit?.('about')}
                            className="text-slate-300 leading-loose text-lg font-light text-justify cursor-pointer hover:bg-slate-800/80 hover:text-slate-100 transition-colors rounded -m-4 p-4"
                            title="Click to edit biography"
                        >
                            {about}
                        </div>

                        {/* Education as prestigious list */}
                        <div className="mt-12">
                            <h3 className="text-sm font-sans font-bold uppercase text-slate-500 mb-4 tracking-widest">Education & Bar Admissions</h3>
                            <ul className="space-y-4">
                                {education.map(edu => (
                                    <li key={edu.id} className="flex items-start gap-3 text-slate-300">
                                        <Award size={18} className="text-amber-600 mt-1 flex-shrink-0" />
                                        <div>
                                            <strong
                                                onClick={() => onEdit?.(`education.${edu.id}.degree`)}
                                                className="text-slate-100 block cursor-pointer hover:text-amber-500 transition-colors"
                                            >
                                                {edu.degree}
                                            </strong>
                                            <span
                                                onClick={() => onEdit?.(`education.${edu.id}.school`)}
                                                className="text-slate-400 italic cursor-pointer hover:text-slate-200 transition-colors"
                                            >
                                                {edu.school}, {edu.city}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Case Studies / Matters (Projects) */}
            <section className="max-w-6xl mx-auto py-24 px-6">
                <h2 className="text-center text-3xl font-medium text-slate-100 mb-16 relative">
                    <span className="bg-slate-900 px-6 relative z-10">Representative Matters</span>
                    <span className="absolute left-0 right-0 top-1/2 h-[1px] bg-slate-800 -z-0"></span>
                </h2>

                <div className={`grid ${responsiveClass('grid-cols-1', 'md:grid-cols-3')} gap-8`}>
                    {projects.map((caseStudy, idx) => (
                        <div key={caseStudy.id} className="bg-slate-800 p-8 border-t-4 border-amber-600 hover:bg-slate-800/80 transition-colors group">
                            <div className="text-amber-600/20 font-sans font-bold text-6xl mb-4 select-none group-hover:text-amber-600/40 transition-colors">
                                {(idx + 1).toString().padStart(2, '0')}
                            </div>
                            <h3
                                onClick={() => onEdit?.(`projects.${caseStudy.id}.title`)}
                                className="text-xl font-bold text-slate-100 mb-3 font-sans group-hover:text-amber-500 transition-colors cursor-pointer"
                            >
                                {caseStudy.title}
                            </h3>
                            <p
                                onClick={() => onEdit?.(`projects.${caseStudy.id}.description`)}
                                className="text-slate-400 leading-relaxed mb-6 font-light cursor-pointer hover:text-slate-200 transition-colors"
                            >
                                {caseStudy.description}
                            </p>
                            {caseStudy.demoUrl && (
                                <a href={caseStudy.demoUrl} className="text-amber-500 text-sm font-sans font-bold uppercase tracking-widest hover:text-amber-400 flex items-center gap-2">
                                    Read Case Study <BookOpen size={14} />
                                </a>
                            )}
                        </div>
                    ))}
                    {projects.length === 0 && (
                        <p className="col-span-3 text-center text-slate-500 italic">No case studies published at this time.</p>
                    )}
                </div>
            </section>

            {/* Experience / Tenure */}
            <section className="bg-slate-950 py-20 px-6 font-sans">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-8 text-center">Professional History</h2>
                    <div className="space-y-0">
                        {timeline.map((job) => (
                            <div key={job.id} className={`flex ${responsiveClass('flex-col', 'md:flex-row md:items-center')} py-6 border-b border-slate-900 last:border-0 hover:bg-slate-900/50 transition-colors px-4 -mx-4 rounded`}>
                                <div className="w-48 text-amber-600 font-bold mb-1 md:mb-0 shrink-0">
                                    {job.startDate} — {job.endDate}
                                </div>
                                <div className="flex-1">
                                    <h3
                                        onClick={() => onEdit?.(`timeline.${job.id}.jobTitle`)}
                                        className="text-slate-200 font-bold text-lg cursor-pointer hover:text-amber-500 transition-colors"
                                    >
                                        {job.jobTitle}
                                    </h3>
                                    <div
                                        onClick={() => onEdit?.(`timeline.${job.id}.employer`)}
                                        className="text-slate-400 cursor-pointer hover:text-slate-300 transition-colors"
                                    >
                                        {job.employer}, {job.city}
                                    </div>
                                </div>
                                <div
                                    onClick={() => onEdit?.(`timeline.${job.id}.description`)}
                                    className={`mt-2 md:mt-0 text-slate-500 text-sm md:w-1/3 md:text-right ${responsiveClass('', 'hidden lg:block')} truncate cursor-pointer hover:text-slate-300 transition-colors`}
                                >
                                    {job.description}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Disclaimer Footer */}
            <footer className="bg-slate-950 border-t border-slate-900 py-12 px-6 text-center text-slate-600 text-xs font-sans">
                <p className="mb-4 text-slate-500">ATTORNEY ADVERTISING. Prior results do not guarantee a similar outcome.</p>
                <div className="flex flex-wrap justify-center gap-6 mb-8 uppercase tracking-widest">
                    <span>Privacy Policy</span>
                    <span>Terms of Service</span>
                    <span>Disclaimer</span>
                </div>
                <p>© {new Date().getFullYear()} {hero.headline}. All Rights Reserved.</p>
            </footer>
        </div>
    );
};

export default LegalTrust;
