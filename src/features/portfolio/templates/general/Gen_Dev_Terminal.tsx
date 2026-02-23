import React, { useState, useEffect } from 'react';
import { PortfolioTemplateProps } from '../../types/portfolio';
import { Terminal, Github, ExternalLink, Command, Hash, Mail, MapPin, Calendar, GitBranch } from 'lucide-react';



const TypewriterText: React.FC<{ text: string; delay?: number; disableAnimation?: boolean }> = ({ text, delay = 50, disableAnimation = false }) => {
    const [displayedText, setDisplayedText] = useState(disableAnimation ? text : '');

    useEffect(() => {
        if (disableAnimation) {
            setDisplayedText(text);
            return;
        }

        setDisplayedText('');
        let i = 0;
        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayedText((prev) => prev + text.charAt(i));
                i++;
            } else {
                clearInterval(timer);
            }
        }, delay);
        return () => clearInterval(timer);
    }, [text, delay, disableAnimation]);

    return <span>{displayedText}<span className="animate-pulse">_</span></span>;
};

const DevTerminal: React.FC<PortfolioTemplateProps> = ({ data, onEdit, isMobileView }) => {
    const { hero, projects, timeline, about, techStack, theme } = data;

    // Helper to conditionally apply desktop classes only if not in mobile view
    const responsiveClass = (mobile: string, desktop: string) => {
        return isMobileView ? mobile : `${mobile} ${desktop}`;
    };

    return (
        <div className={`bg-zinc-950 text-emerald-400 font-mono min-h-full selection:bg-emerald-400/30 selection:text-emerald-100 overflow-x-hidden ${responsiveClass('p-2', 'md:p-8')}`}>
            <div className="max-w-5xl mx-auto border border-zinc-800 rounded-lg bg-black/50 shadow-2xl backdrop-blur-sm overflow-hidden">
                {/* Terminal Header */}
                <div className="bg-zinc-900 px-3 py-2 border-b border-zinc-800 flex items-center gap-2 sticky top-0 z-10">
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/80" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                        <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <div className="flex-1 text-center text-xs text-zinc-500 flex items-center justify-center gap-1">
                        <Terminal size={12} />
                        <span>portfolio.sh</span>
                    </div>
                </div>

                <div className={`space-y-12 ${responsiveClass('p-4', 'md:p-10 md:space-y-16')}`}>
                    {/* Hero Section */}
                    <section className="space-y-6">
                        <div className="text-zinc-500 text-sm mb-2">$ whoami</div>
                        <h1
                            onClick={() => onEdit?.('hero.headline')}
                            className={`font-bold tracking-tight cursor-pointer hover:bg-emerald-500/10 hover:text-emerald-300 transition-colors rounded -ml-2 pl-2 break-words ${responsiveClass('text-3xl sm:text-4xl', 'md:text-6xl')}`}
                            title="Click to edit headline"
                        >
                            <TypewriterText text={hero.headline} disableAnimation={!!onEdit} />
                        </h1>
                        <p
                            onClick={() => onEdit?.('hero.subheadline')}
                            className={`text-zinc-400 max-w-2xl border-l-2 border-emerald-500/30 pl-4 py-1 cursor-pointer hover:border-emerald-500 hover:text-emerald-300 transition-colors ${responsiveClass('text-lg', 'md:text-xl')}`}
                            title="Click to edit subheadline"
                        >
                            {hero.subheadline}
                        </p>

                        <div className="flex flex-wrap gap-4 pt-4">
                            {hero.ctaPrimaryLabel && (
                                <a href={hero.ctaPrimaryUrl} className={`bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded border border-emerald-500/50 transition-colors flex items-center gap-2 group justify-center ${responsiveClass('w-full', 'sm:w-auto sm:justify-start')}`}>
                                    <Command size={16} />
                                    <span>{hero.ctaPrimaryLabel}</span>
                                </a>
                            )}
                            {hero.ctaSecondaryLabel && (
                                <a href={hero.ctaSecondaryUrl} className={`px-4 py-2 text-zinc-400 hover:text-emerald-400 transition-colors flex items-center gap-2 justify-center ${responsiveClass('w-full', 'sm:w-auto sm:justify-start')}`}>
                                    {hero.ctaSecondaryLabel} <Hash size={16} />
                                </a>
                            )}
                        </div>
                    </section>

                    {/* Tech Stack - "npm install" style */}
                    <section>
                        <div className="text-zinc-500 text-sm mb-4 border-b border-zinc-800 pb-2 flex justify-between">
                            <span>$ ls ./skills/</span>
                            <span className="text-zinc-700">r-x</span>
                        </div>
                        <div className={`grid gap-3 ${responsiveClass('grid-cols-1', 'sm:grid-cols-2 md:grid-cols-4 md:gap-4')}`}>
                            {techStack.map(skill => (
                                <div key={skill.id} className="flex items-center gap-2 text-zinc-300 hover:text-emerald-300 transition-colors group">
                                    <div className="w-2 h-2 bg-emerald-500/50 rounded-full group-hover:bg-emerald-400" />
                                    {skill.name}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* About Section */}
                    <section>
                        <div className="text-zinc-500 text-sm mb-4 border-b border-zinc-800 pb-2">
                            <span>$ cat about.md</span>
                        </div>
                        <div
                            onClick={() => onEdit?.('about')}
                            className={`text-zinc-300 leading-relaxed font-sans opacity-90 border-l-2 border-zinc-800 pl-4 cursor-pointer hover:border-emerald-500 hover:text-emerald-100 transition-colors ${responsiveClass('text-sm', 'md:text-base')}`}
                            title="Click to edit about me"
                        >
                            {about}
                        </div>
                    </section>

                    {/* Projects - Git Repo Cards */}
                    <section>
                        <div className="text-zinc-500 text-sm mb-6 border-b border-zinc-800 pb-2">
                            <span>$ git log --oneline --graph</span>
                        </div>
                        <div className="grid gap-6">
                            {projects.map(project => (
                                <div key={project.id} className="border border-zinc-800 bg-zinc-900/30 rounded p-4 hover:border-emerald-500/30 transition-all group">
                                    <div className={`flex justify-between items-start mb-2 ${responsiveClass('flex-col gap-2', 'sm:flex-row sm:gap-0')}`}>
                                        <div className="flex items-center gap-2">
                                            <GitBranch size={16} className="text-emerald-500 shrink-0" />
                                            <h3
                                                onClick={() => onEdit?.(`projects.${project.id}.title`)}
                                                className="font-bold text-lg text-emerald-100 group-hover:text-emerald-400 transition-colors cursor-pointer break-words"
                                            >
                                                {project.title}
                                            </h3>
                                        </div>
                                        <span className={`text-xs text-zinc-600 font-mono px-2 py-0.5 border border-zinc-800 rounded ${responsiveClass('self-start', 'sm:self-auto')}`}>Public</span>
                                    </div>
                                    <p
                                        onClick={() => onEdit?.(`projects.${project.id}.description`)}
                                        className="text-zinc-400 mb-4 text-sm pl-6 border-l border-zinc-800/50 ml-2 cursor-pointer hover:text-emerald-300 hover:border-emerald-500/50 transition-colors"
                                    >
                                        {project.description}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-4 pl-6 ml-2 text-sm text-zinc-500">
                                        {project.demoUrl && (
                                            <a href={project.demoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-emerald-400 transition-colors">
                                                <ExternalLink size={14} /> Live Demo
                                            </a>
                                        )}
                                        {project.repoUrl && (
                                            <a href={project.repoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-emerald-400 transition-colors">
                                                <Github size={14} /> Source
                                            </a>
                                        )}
                                        <span className={`ml-auto text-xs opacity-50 ${responsiveClass('w-full text-right mt-2', 'sm:w-auto sm:mt-0')}`}>{new Date().getFullYear()}</span>
                                    </div>
                                </div>
                            ))}
                            {projects.length === 0 && <span className="text-zinc-600 italic">// No repos found</span>}
                        </div>
                    </section>

                    {/* Timeline */}
                    <section>
                        <div className="text-zinc-500 text-sm mb-6 border-b border-zinc-800 pb-2">
                            <span>$ history | grep 'work'</span>
                        </div>
                        <div className="space-y-6">
                            {timeline.map((job, idx) => (
                                <div key={job.id} className="relative pl-6 border-l border-zinc-800 hover:border-emerald-500/50 transition-colors">
                                    <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-800 border-2 border-zinc-950" />
                                    <div className={`flex mb-1 ${responsiveClass('flex-col', 'sm:flex-row sm:justify-between sm:items-baseline')}`}>
                                        <h3
                                            onClick={() => onEdit?.(`timeline.${job.id}.jobTitle`)}
                                            className={`text-emerald-200 font-bold flex gap-1 cursor-pointer hover:text-emerald-400 ${responsiveClass('text-base flex-col', 'md:text-lg sm:flex-row sm:items-center sm:gap-2')}`}
                                        >
                                            {job.jobTitle} <span className="text-zinc-500 font-normal text-sm hover:text-zinc-400" onClick={(e) => { e.stopPropagation(); onEdit?.(`timeline.${job.id}.employer`); }}>@ {job.employer}</span>
                                        </h3>
                                        <span className={`text-zinc-600 text-xs font-mono ${responsiveClass('mb-2', 'sm:mb-0')}`}>{job.startDate} — {job.endDate}</span>
                                    </div>
                                    <p
                                        onClick={() => onEdit?.(`timeline.${job.id}.description`)}
                                        className="text-zinc-400 text-sm cursor-pointer hover:text-emerald-300 transition-colors"
                                    >
                                        {job.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Footer */}
                    <footer className="border-t border-zinc-800 pt-8 mt-12 flex flex-col md:flex-row justify-between items-center text-zinc-500 text-sm gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span>System Operational</span>
                        </div>
                        <div className="flex gap-4">
                            <a href={`mailto:${data.contactEmail}`} className="hover:text-emerald-400 transition-colors flex items-center gap-2">
                                <Mail size={14} /> Contact
                            </a>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default DevTerminal;
