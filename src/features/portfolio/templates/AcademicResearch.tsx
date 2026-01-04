import React, { useState } from 'react';
import { PortfolioTemplateProps } from '../types/portfolio';
import { Book, FileText, Download, Mail, ExternalLink, GraduationCap, Users } from 'lucide-react';
import { usePortfolioAdminAccess } from '../hooks/usePortfolioAdminAccess';

const AcademicResearch: React.FC<PortfolioTemplateProps> = ({ data, onEdit, isMobileView }) => {
    const { hero, projects, timeline, education, contactEmail } = data;
    const [activeTab, setActiveTab] = useState<'about' | 'publications' | 'cv' | 'teaching'>('about');

    // Admin Access Hook
    const { longPressProps, AdminAccessModal } = usePortfolioAdminAccess({ data, onEdit });

    const responsiveClass = (base: string, desktop: string) => {
        return isMobileView ? base : `${base} ${desktop}`;
    };

    return (
        <div className={`bg-white text-slate-800 font-sans min-h-full flex ${responsiveClass('flex-col', 'md:flex-row')} selection:bg-blue-100 selection:text-blue-900`}>
            {/* Sidebar Navigation */}
            <aside className={`w-full ${responsiveClass('', 'md:w-80 border-r border-slate-200 md:h-screen md:sticky md:top-0 md:flex flex-col shrink-0')} bg-slate-50`}>
                <div className={`p-8 text-center ${responsiveClass('', 'md:text-left')}`}>
                    <div
                        className={`w-32 h-32 mx-auto ${responsiveClass('', 'md:mx-0')} bg-slate-200 rounded-full overflow-hidden border-4 border-white shadow-sm mb-6 ${onEdit ? 'cursor-pointer hover:opacity-80' : ''}`}
                        {...(onEdit ? { onClick: () => onEdit('hero.avatarUrl') } : longPressProps)}
                    >
                        {hero.avatarUrl ? (
                            <img src={hero.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <GraduationCap size={48} />
                            </div>
                        )}
                    </div>
                    <h1
                        onClick={() => onEdit?.('hero.headline')}
                        className="text-2xl font-bold text-slate-900 mb-2 cursor-pointer hover:text-blue-700 transition-colors"
                        title="Click to edit headline"
                    >
                        {hero.headline}
                    </h1>
                    <p
                        onClick={() => onEdit?.('hero.subheadline')}
                        className="text-slate-600 text-sm mb-6 cursor-pointer hover:bg-slate-100 rounded"
                        title="Click to edit subheadline"
                    >
                        {hero.subheadline}
                    </p>

                    <div className={`flex flex-wrap gap-3 justify-center ${responsiveClass('', 'md:justify-start')} mb-8`}>
                        <a href={`mailto:${contactEmail}`} className="p-2 bg-white border border-slate-200 rounded hover:border-blue-500 hover:text-blue-600 transition-colors">
                            <Mail size={18} />
                        </a>
                        <button className="p-2 bg-white border border-slate-200 rounded hover:border-blue-500 hover:text-blue-600 transition-colors">
                            <img src="https://scholar.google.com/favicon.ico" alt="Scholar" className="w-4 h-4 opacity-70 grayscale hover:grayscale-0" />
                        </button>
                    </div>

                    <a href="#" className="w-full py-2 bg-blue-700 text-white rounded font-medium text-sm hover:bg-blue-800 transition-colors flex items-center justify-center gap-2">
                        <Download size={16} /> Download CV
                    </a>
                </div>

                <nav className={`flex-1 px-4 pb-8 overflow-y-auto ${responsiveClass('hidden', 'hidden md:block')}`}>
                    <ul className="space-y-1">
                        <li>
                            <button
                                onClick={() => setActiveTab('about')}
                                className={`w-full text-left px-4 py-2 rounded text-sm font-medium transition-colors ${activeTab === 'about' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                                Home
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActiveTab('publications')}
                                className={`w-full text-left px-4 py-2 rounded text-sm font-medium transition-colors ${activeTab === 'publications' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                                Publications ({projects.length})
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActiveTab('cv')}
                                className={`w-full text-left px-4 py-2 rounded text-sm font-medium transition-colors ${activeTab === 'cv' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                                Experience
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActiveTab('teaching')}
                                className={`w-full text-left px-4 py-2 rounded text-sm font-medium transition-colors ${activeTab === 'teaching' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                                Teaching
                            </button>
                        </li>
                    </ul>
                </nav>

                {/* Mobile Tab Bar */}
                <div className={`${responsiveClass('flex', 'md:hidden flex')} overflow-x-auto border-b border-slate-200 px-4 gap-4 bg-white sticky top-0 z-10`}>
                    <button onClick={() => setActiveTab('about')} className={`py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'about' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>About</button>
                    <button onClick={() => setActiveTab('publications')} className={`py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'publications' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>Publications</button>
                    <button onClick={() => setActiveTab('cv')} className={`py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'cv' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>Experience</button>
                    <button onClick={() => setActiveTab('teaching')} className={`py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'teaching' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>Teaching</button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className={`flex-1 p-8 ${responsiveClass('', 'md:p-16')} max-w-4xl overflow-y-auto`}>
                {activeTab === 'about' && (
                    <div className="space-y-12 animate-fade-in">
                        <section>
                            <h2 className="text-3xl font-bold text-slate-900 mb-6 border-b border-slate-200 pb-2">About</h2>
                            <div
                                onClick={() => onEdit?.('about')}
                                className="text-lg leading-relaxed text-slate-700 text-justify cursor-pointer hover:bg-slate-50 rounded p-4 -m-4 transition-colors"
                                title="Click to edit about me"
                            >
                                {data.about}
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b border-slate-200 pb-2">Research Interests</h2>
                            <div className="flex flex-wrap gap-2">
                                {data.techStack.map(skill => (
                                    <span key={skill.id} className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded border border-slate-200">
                                        {skill.name}
                                    </span>
                                ))}
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b border-slate-200 pb-2">Education</h2>
                            <div className="space-y-4">
                                {education.map(edu => (
                                    <div key={edu.id} className="flex gap-4">
                                        <div className="mt-1"><GraduationCap size={20} className="text-slate-400" /></div>
                                        <div>
                                            <div className="font-bold text-slate-900">{edu.degree}</div>
                                            <div className="text-slate-600">{edu.school}, {edu.city}</div>
                                            <div className="text-sm text-slate-500">{edu.endDate}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'publications' && (
                    <div className="space-y-8 animate-fade-in">
                        <h2 className="text-3xl font-bold text-slate-900 border-b border-slate-200 pb-2">Publications</h2>
                        <div className="space-y-6">
                            {projects.map((pub, idx) => (
                                <div key={pub.id} className="pl-4 border-l-4 border-slate-200 hover:border-blue-500 transition-colors bg-white rounded p-4 hover:shadow-sm">
                                    <div className="text-sm text-slate-500 font-bold mb-1">[{(idx + 1)}]</div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-2">{pub.title}</h3>
                                    <p className="text-slate-600 text-sm mb-3">{pub.description}</p>
                                    <div className="flex gap-4 text-sm mt-3">
                                        {pub.demoUrl && (
                                            <a href={pub.demoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-700 hover:underline">
                                                <FileText size={14} /> PDF
                                            </a>
                                        )}
                                        {pub.repoUrl && (
                                            <a href={pub.repoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-700 hover:underline">
                                                <ExternalLink size={14} /> Publisher Link
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {projects.length === 0 && <p className="text-slate-500 italic">No publications listed.</p>}
                        </div>
                    </div>
                )}

                {activeTab === 'cv' && (
                    <div className="space-y-8 animate-fade-in">
                        <h2 className="text-3xl font-bold text-slate-900 border-b border-slate-200 pb-2">Curriculum Vitae</h2>

                        <div className="space-y-12">
                            {timeline.map((job) => (
                                <div key={job.id} className={`grid ${responsiveClass('grid-cols-1', 'md:grid-cols-[1fr_3fr]')} gap-4`}>
                                    <div className={`text-slate-500 font-medium text-sm ${responsiveClass('', 'text-right border-slate-200 md:border-r md:pr-4')}`}>
                                        {job.startDate} — {job.endDate}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900">{job.jobTitle}</h3>
                                        <div className="text-slate-700 italic mb-2">{job.employer}, {job.city}</div>
                                        <p className="text-slate-600 text-sm leading-relaxed max-w-xl">{job.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'teaching' && (
                    <div className="space-y-8 animate-fade-in">
                        <h2 className="text-3xl font-bold text-slate-900 border-b border-slate-200 pb-2">Teaching & Service</h2>
                        <div className="bg-blue-50 p-6 rounded-lg text-blue-900 border border-blue-100">
                            <div className="flex items-center gap-2 font-bold mb-2">
                                <Users size={20} /> Current Courses
                            </div>
                            <ul className="list-disc list-inside space-y-1 ml-1">
                                <li>Introduction to Computer Science (Fall 2024)</li>
                                <li>Advanced Algorithms (Spring 2025)</li>
                            </ul>
                        </div>

                        <p className="text-slate-600 leading-relaxed">
                            My teaching philosophy centers on empowering students to become independent thinkers...
                        </p>
                    </div>
                )}
            </main>
            <AdminAccessModal />
        </div>
    );
};

export default AcademicResearch;
