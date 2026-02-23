import React from 'react';
import { PortfolioTemplateProps } from '../types/portfolio';
import { Stethoscope, Activity, FileText, Calendar, MapPin, Award, GraduationCap, ChevronRight, Mail } from 'lucide-react';
import { usePortfolioAdminAccess } from '../hooks/usePortfolioAdminAccess';

const MedicalCare: React.FC<PortfolioTemplateProps> = ({ data, onEdit, isMobileView }) => {
    const { hero, projects, timeline, education, contactEmail, about } = data;

    // Admin Access Hook
    const { longPressProps, AdminAccessModal } = usePortfolioAdminAccess({ data, onEdit });

    const responsiveClass = (base: string, desktop: string) => {
        return isMobileView ? base : `${base} ${desktop}`;
    };

    return (
        <div className="bg-white text-slate-700 font-sans min-h-full selection:bg-teal-100 selection:text-teal-900">
            {/* Top Navigation / Brand */}
            <div className="border-b border-slate-100 py-4 px-6 md:px-12 flex justify-between items-center bg-white sticky top-0 z-50 opacity-95 backdrop-blur">
                <div className="flex items-center gap-2 text-teal-600 font-semibold tracking-tight uppercase text-sm">
                    <Activity size={18} />
                    <span>Medical Professional</span>
                </div>
                <div className="text-sm font-medium text-slate-500 hover:text-teal-600 cursor-pointer">
                    Book Appointment
                </div>
            </div>

            {/* Hero */}
            <header className="bg-slate-50 border-b border-slate-100 py-20 px-6 md:px-12 text-center md:text-left">
                <div className={`max-w-5xl mx-auto ${responsiveClass('', 'md:flex md:items-center md:justify-between')} gap-12`}>
                    <div className="space-y-6 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-bold uppercase tracking-wide">
                            <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></span>
                            Accepting New Patients
                        </div>
                        <h1
                            onClick={() => onEdit?.('hero.headline')}
                            className={`${responsiveClass('text-4xl', 'md:text-6xl')} font-bold text-slate-900 tracking-tight leading-tight cursor-pointer hover:text-teal-600 transition-colors`}
                            title="Click to edit headline"
                        >
                            {hero.headline}
                        </h1>
                        <p
                            onClick={() => onEdit?.('hero.subheadline')}
                            className="text-xl text-slate-600 leading-relaxed font-light cursor-pointer hover:bg-slate-100 rounded -m-1 p-1"
                            title="Click to edit subheadline"
                        >
                            {hero.subheadline}
                        </p>
                        <div className={`pt-4 flex ${responsiveClass('flex-col', 'sm:flex-row')} gap-4 justify-center md:justify-start`}>
                            <a href={hero.ctaPrimaryUrl || "#contact"} className="px-6 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors shadow-sm hover:shadow-md flex items-center justify-center gap-2">
                                <Calendar size={18} /> {hero.ctaPrimaryLabel || 'Schedule Visit'}
                            </a>
                            <a href={hero.ctaSecondaryUrl || "#about"} className="px-6 py-3 bg-white text-slate-700 border border-slate-200 font-medium rounded-lg hover:border-teal-500 hover:text-teal-600 transition-colors flex items-center justify-center gap-2">
                                <FileText size={18} /> {hero.ctaSecondaryLabel || 'View Credentials'}
                            </a>
                        </div>
                    </div>
                    {/* Hero Image / Avatar */}
                    <div className="mt-12 md:mt-0 flex-shrink-0 relative">
                        <div
                            className="w-64 h-64 md:w-80 md:h-80 rounded-full border-8 border-white shadow-xl overflow-hidden bg-slate-200 mx-auto"
                            {...(onEdit ? { onClick: () => onEdit('hero.avatarUrl') } : longPressProps)}
                        >
                            {hero.avatarUrl ? (
                                <img src={hero.avatarUrl} alt="Doctor Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                                    <Stethoscope size={64} />
                                </div>
                            )}
                        </div>
                        <div className="absolute bottom-4 right-4 md:right-0 bg-white p-3 rounded-lg shadow-lg border border-slate-100 flex items-center gap-3">
                            <div className="bg-teal-100 p-2 rounded-full text-teal-600">
                                <Award size={20} />
                            </div>
                            <div className="text-left">
                                <div className="text-xs text-slate-500 uppercase font-bold">Board Certified</div>
                                <div className="text-sm font-bold text-slate-800">Specialist</div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Credentials & Education - Prominent Section */}
            <section className="py-16 px-6 md:px-12 max-w-5xl mx-auto">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 md:p-12">
                    <h2 className="text-teal-600 font-bold uppercase tracking-widest text-sm mb-8 flex items-center gap-2">
                        <GraduationCap size={18} /> Education & Formatting
                    </h2>
                    <div className={`grid ${responsiveClass('', 'md:grid-cols-2')} gap-8`}>
                        {education.map((edu, idx) => (
                            <div key={edu.id} className="flex gap-4">
                                <div className="flex-shrink-0 w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 font-bold border border-slate-100">
                                    {idx + 1}
                                </div>
                                <div>
                                    <h3
                                        onClick={() => onEdit?.(`education.${edu.id}.school`)}
                                        className="font-bold text-slate-900 text-lg cursor-pointer hover:text-teal-600 transition-colors"
                                    >
                                        {edu.school}
                                    </h3>
                                    <p
                                        onClick={() => onEdit?.(`education.${edu.id}.degree`)}
                                        className="text-teal-600 font-medium cursor-pointer hover:text-teal-800 transition-colors"
                                    >
                                        {edu.degree}
                                    </p>
                                    <p className="text-slate-500 text-sm mt-1">{edu.startDate} - {edu.endDate} • {edu.city}</p>
                                    <p className="text-slate-600 text-sm mt-2">{edu.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* About / Philosophy */}
            <section className="bg-teal-50/50 py-20 px-6 md:px-12 border-y border-teal-100/50">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className={`${responsiveClass('text-2xl', 'md:text-3xl')} font-bold text-slate-900 mb-6`}>Patient-Centered Care Philosophy</h2>
                    <p
                        onClick={() => onEdit?.('about')}
                        className={`${responsiveClass('text-lg', 'md:text-xl')} text-slate-600 leading-relaxed max-w-3xl mx-auto cursor-pointer hover:text-slate-900 hover:bg-teal-100 transition-colors rounded p-2`}
                        title="Click to edit philosophy"
                    >
                        "{about}"
                    </p>
                </div>
            </section>

            {/* Experience / Residencies */}
            <section className="py-20 px-6 md:px-12 max-w-5xl mx-auto">
                <div className={`flex ${responsiveClass('flex-col', 'md:flex-row md:items-center')} justify-between gap-4 mb-12`}>
                    <h2 className="text-2xl font-bold text-slate-900">Clinical Experience</h2>
                    <a href="#" className="text-teal-600 font-medium hover:underline flex items-center gap-1">Download CV <ChevronRight size={16} /></a>
                </div>

                <div className="border-l-2 border-slate-200 ml-3 md:ml-6 space-y-12">
                    {timeline.map((job) => (
                        <div key={job.id} className="relative pl-8 md:pl-12">
                            <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white border-4 border-teal-500" />
                            <div className="bg-slate-50 p-6 rounded-xl hover:shadow-md transition-shadow border border-slate-100">
                                <div className={`flex ${responsiveClass('flex-col', 'md:flex-row md:justify-between md:items-start')} mb-4`}>
                                    <div>
                                        <h3
                                            onClick={() => onEdit?.(`timeline.${job.id}.jobTitle`)}
                                            className="font-bold text-lg text-slate-900 cursor-pointer hover:text-teal-600 transition-colors"
                                        >
                                            {job.jobTitle}
                                        </h3>
                                        <div
                                            onClick={() => onEdit?.(`timeline.${job.id}.employer`)}
                                            className="text-teal-700 font-medium flex items-center gap-1 mt-1 cursor-pointer hover:text-teal-900 transition-colors"
                                        >
                                            <MapPin size={14} /> {job.employer}, {job.city}
                                        </div>
                                    </div>
                                    <span className="mt-2 md:mt-0 px-3 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-slate-500 uppercase tracking-wide">
                                        {job.startDate} — {job.endDate}
                                    </span>
                                </div>
                                <p
                                    onClick={() => onEdit?.(`timeline.${job.id}.description`)}
                                    className="text-slate-600 leading-relaxed text-sm cursor-pointer hover:bg-slate-100 rounded p-1 -m-1"
                                >
                                    {job.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Research / Projects (If any) */}
            {projects.length > 0 && (
                <section className="py-16 px-6 md:px-12 bg-slate-50 border-t border-slate-100">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-2xl font-bold text-slate-900 mb-8">Publications & Research</h2>
                        <div className="grid gap-4">
                            {projects.map(pub => (
                                <div key={pub.id} className="bg-white p-6 rounded-lg border border-slate-200 hover:border-teal-300 transition-colors group">
                                    <h3
                                        onClick={() => onEdit?.(`projects.${pub.id}.title`)}
                                        className="font-bold text-lg text-slate-800 group-hover:text-teal-700 transition-colors cursor-pointer"
                                    >
                                        {pub.title}
                                    </h3>
                                    <p
                                        onClick={() => onEdit?.(`projects.${pub.id}.description`)}
                                        className="text-slate-600 mt-2 text-sm cursor-pointer hover:text-slate-800 transition-colors"
                                    >
                                        {pub.description}
                                    </p>
                                    <div className="mt-4 flex gap-2">
                                        {pub.tags.map(tag => (
                                            <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded uppercase font-bold">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <footer className="bg-white border-t border-slate-100 py-12 text-center text-slate-400 text-sm">
                <div className="flex justify-center gap-6 mb-4">
                    <Mail className="hover:text-teal-600 cursor-pointer transition-colors" />
                    {/* Add more icons relevant to medical */}
                </div>
                <p>&copy; {new Date().getFullYear()} {hero.headline}. All rights reserved.</p>
            </footer>
            <AdminAccessModal />
        </div>
    );
};

export default MedicalCare;
