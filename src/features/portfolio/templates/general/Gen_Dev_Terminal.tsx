import React, { useState, useEffect } from 'react';
import { PortfolioTemplateProps } from '../../types/portfolio';
import { Terminal, Github, ExternalLink, Command, Hash, Mail, GitBranch } from 'lucide-react';
import { usePortfolioAdminAccess } from '../../hooks/usePortfolioAdminAccess';
import { getAvatarSizeClasses, getAvatarShapeClasses, getAvatarPositionClasses } from '../../utils/avatar';

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
    const { hero, projects, timeline, about, techStack } = data;

    // Admin Access Hook — target avatar if set, else headline
    const { longPressProps, AdminAccessModal } = usePortfolioAdminAccess({
        data,
        onEdit,
        editField: hero.avatarUrl ? 'hero.avatarUrl' : 'hero.headline'
    });

    // Helper to conditionally apply desktop classes only if not in mobile view
    const responsiveClass = (mobile: string, desktop: string) => {
        return isMobileView ? mobile : `${mobile} ${desktop}`;
    };

    return (
        <>
        <div className={`min-h-full overflow-x-hidden bg-[#07110d] font-mono text-emerald-300 selection:bg-emerald-400/30 selection:text-emerald-50 ${responsiveClass('p-2', 'md:p-8')}`}>
            <div className="mx-auto max-w-5xl overflow-hidden rounded-lg border border-emerald-500/15 bg-[#050807] shadow-2xl shadow-emerald-950/40 backdrop-blur-sm">
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
                        <div onClick={() => onEdit?.('hero.headline')} className="mb-2 text-sm text-zinc-400 cursor-pointer hover:text-emerald-300">$ whoami</div>
                        {/* Avatar */}
                        {hero.avatarUrl && (
                            <img
                                src={hero.avatarUrl}
                                alt="Profile"
                                onClick={() => onEdit?.('hero.avatarUrl')}
                                {...(!onEdit ? longPressProps : {})}
                                className={`${getAvatarSizeClasses(hero.avatarSize)} ${getAvatarShapeClasses(hero.avatarShape)} ${getAvatarPositionClasses(hero.avatarPosition)} block object-cover cursor-pointer mb-2 transition-all hover:scale-105`}
                                style={{ boxShadow: '0 0 0 2px #10b981, 0 0 12px #10b98140' }}
                                title="Click to edit avatar"
                            />
                        )}
                        <h1
                            onClick={() => onEdit?.('hero.headline')}
                            className={`-ml-2 cursor-pointer rounded pl-2 font-black tracking-tight text-emerald-50 transition-colors hover:bg-emerald-500/10 hover:text-emerald-200 break-words ${responsiveClass('text-3xl sm:text-4xl', 'md:text-5xl')}`}
                            title="Click to edit headline"
                        >
                            <TypewriterText text={hero.headline} disableAnimation={!!onEdit} />
                        </h1>
                        <p
                            onClick={() => onEdit?.('hero.subheadline')}
                            className={`max-w-2xl cursor-pointer border-l-2 border-emerald-400/50 py-1 pl-4 leading-8 text-zinc-200 transition-colors hover:border-emerald-300 hover:text-emerald-100 ${responsiveClass('text-base', 'md:text-lg')}`}
                            title="Click to edit subheadline"
                        >
                            {hero.subheadline}
                        </p>

                        <div className="flex flex-wrap gap-4 pt-4">
                            {hero.ctaPrimaryLabel && (
                                <a
                                    href={hero.ctaPrimaryUrl}
                                    onClick={(event) => {
                                        if (onEdit) {
                                            event.preventDefault();
                                            onEdit('hero.buttons');
                                        }
                                    }}
                                    className={`bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded border border-emerald-500/50 transition-colors flex items-center gap-2 group justify-center ${responsiveClass('w-full', 'sm:w-auto sm:justify-start')}`}
                                >
                                    <Command size={16} />
                                    <span>{hero.ctaPrimaryLabel}</span>
                                </a>
                            )}
                            {hero.ctaSecondaryLabel && (
                                <a
                                    href={hero.ctaSecondaryUrl}
                                    onClick={(event) => {
                                        if (onEdit) {
                                            event.preventDefault();
                                            onEdit('hero.buttons');
                                        }
                                    }}
                                    className={`px-4 py-2 text-zinc-400 hover:text-emerald-400 transition-colors flex items-center gap-2 justify-center ${responsiveClass('w-full', 'sm:w-auto sm:justify-start')}`}
                                >
                                    {hero.ctaSecondaryLabel} <Hash size={16} />
                                </a>
                            )}
                        </div>
                    </section>

                    {/* Tech Stack - "npm install" style */}
                    <section>
                        <div onClick={() => onEdit?.('techStack')} className="text-zinc-500 text-sm mb-4 border-b border-zinc-800 pb-2 flex justify-between cursor-pointer hover:text-emerald-300">
                            <span>$ ls ./skills/</span>
                            <span className="text-zinc-700">r-x</span>
                        </div>
                        <div className={`grid gap-3 ${responsiveClass('grid-cols-1', 'sm:grid-cols-2 md:grid-cols-4 md:gap-4')}`}>
                            {(techStack || []).map((skill, idx) => (
                                <div
                                    key={skill.id || `skill-${idx}`}
                                    onClick={() => onEdit?.(`techStack.${idx}.name`)}
                                    className="flex items-center gap-2 text-zinc-200 transition-colors hover:text-emerald-200 group cursor-pointer"
                                >
                                    <div className="w-2 h-2 bg-emerald-500/50 rounded-full group-hover:bg-emerald-400" />
                                    {skill.name}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* About Section */}
                    <section>
                        <div onClick={() => onEdit?.('about')} className="text-zinc-500 text-sm mb-4 border-b border-zinc-800 pb-2 cursor-pointer hover:text-emerald-300">
                            <span>$ cat about.md</span>
                        </div>
                        <div
                            onClick={() => onEdit?.('about')}
                            className={`cursor-pointer border-l-2 border-zinc-700 pl-4 font-sans leading-8 text-zinc-200 transition-colors hover:border-emerald-400 hover:text-emerald-50 ${responsiveClass('text-sm', 'md:text-base')}`}
                            title="Click to edit about me"
                        >
                            {about}
                        </div>
                    </section>

                    {/* Projects - Git Repo Cards */}
                    <section>
                        <div onClick={() => onEdit?.('projects')} className="text-zinc-500 text-sm mb-6 border-b border-zinc-800 pb-2 cursor-pointer hover:text-emerald-300">
                            <span>$ git log --oneline --graph</span>
                        </div>
                        <div className="grid gap-6">
                            {(projects || []).map((project, idx) => (
                                <div key={project.id || `proj-${idx}`} className="group rounded border border-zinc-700/80 bg-zinc-900/70 p-4 transition-all hover:border-emerald-500/50">
                                    <div className={`flex justify-between items-start mb-2 ${responsiveClass('flex-col gap-2', 'sm:flex-row sm:gap-0')}`}>
                                        <div className="flex items-center gap-2">
                                            <GitBranch size={16} className="text-emerald-500 shrink-0" />
                                            <h3
                                                onClick={() => onEdit?.(`projects.${idx}.title`)}
                                                className="font-bold text-lg text-emerald-100 group-hover:text-emerald-400 transition-colors cursor-pointer break-words"
                                            >
                                                {project.title}
                                            </h3>
                                        </div>
                                        <span onClick={() => onEdit?.(`projects.${idx}.title`)} className={`text-xs text-zinc-600 font-mono px-2 py-0.5 border border-zinc-800 rounded cursor-pointer hover:text-emerald-300 ${responsiveClass('self-start', 'sm:self-auto')}`}>Public</span>
                                    </div>
                                    <p
                                        onClick={() => onEdit?.(`projects.${idx}.description`)}
                                        className="mb-4 ml-2 cursor-pointer border-l border-zinc-700 pl-6 text-sm leading-6 text-zinc-300 transition-colors hover:border-emerald-500/50 hover:text-emerald-200"
                                    >
                                        {project.description}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-4 pl-6 ml-2 text-sm text-zinc-500">
                                        {project.link && (
                                            <a
                                                href={project.link}
                                                target="_blank"
                                                rel="noreferrer"
                                                onClick={(event) => {
                                                    if (onEdit) {
                                                        event.preventDefault();
                                                        onEdit(`projects.${idx}.link`);
                                                    }
                                                }}
                                                className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
                                            >
                                                <ExternalLink size={14} /> Documentation
                                            </a>
                                        )}
                                        {project.demoUrl && (
                                            <a
                                                href={project.demoUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                onClick={(event) => {
                                                    if (onEdit) {
                                                        event.preventDefault();
                                                        onEdit(`projects.${idx}.demoUrl`);
                                                    }
                                                }}
                                                className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
                                            >
                                                <ExternalLink size={14} /> Live Demo
                                            </a>
                                        )}
                                        {project.repoUrl && (
                                            <a
                                                href={project.repoUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                onClick={(event) => {
                                                    if (onEdit) {
                                                        event.preventDefault();
                                                        onEdit(`projects.${idx}.repoUrl`);
                                                    }
                                                }}
                                                className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
                                            >
                                                <Github size={14} /> Source
                                            </a>
                                        )}
                                        <span className={`ml-auto text-xs opacity-50 ${responsiveClass('w-full text-right mt-2', 'sm:w-auto sm:mt-0')}`}>{new Date().getFullYear()}</span>
                                    </div>
                                </div>
                            ))}
                            {(!projects || projects.length === 0) && (
                                <span onClick={() => onEdit?.('projects.add')} className="text-zinc-600 italic cursor-pointer hover:text-emerald-300">
                                    // No repos found
                                </span>
                            )}
                        </div>
                    </section>

                    {/* Timeline */}
                    <section>
                        <div onClick={() => onEdit?.('timeline')} className="text-zinc-500 text-sm mb-6 border-b border-zinc-800 pb-2 cursor-pointer hover:text-emerald-300">
                            <span>$ history | grep 'work'</span>
                        </div>
                        <div className="space-y-6">
                            {(timeline || []).map((job, idx) => (
                                <div key={job.id || `job-${idx}`} className="relative pl-6 border-l border-zinc-800 hover:border-emerald-500/50 transition-colors">
                                    <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-800 border-2 border-zinc-950" />
                                    <div className={`flex mb-1 ${responsiveClass('flex-col', 'sm:flex-row sm:justify-between sm:items-baseline')}`}>
                                        <h3
                                            onClick={() => onEdit?.(`timeline.${idx}.jobTitle`)}
                                            className={`text-emerald-200 font-bold flex gap-1 cursor-pointer hover:text-emerald-400 ${responsiveClass('text-base flex-col', 'md:text-lg sm:flex-row sm:items-center sm:gap-2')}`}
                                        >
                                            {job.jobTitle} <span className="text-zinc-500 font-normal text-sm hover:text-zinc-400" onClick={(e) => { e.stopPropagation(); onEdit?.(`timeline.${idx}.employer`); }}>@ {job.employer}</span>
                                        </h3>
                                        <span
                                            onClick={() => onEdit?.(`timeline.${idx}.startDate`)}
                                            className={`text-zinc-600 text-xs font-mono cursor-pointer hover:text-zinc-400 ${responsiveClass('mb-2', 'sm:mb-0')}`}
                                        >
                                            {job.startDate} — {job.endDate}
                                        </span>
                                    </div>
                                    <p
                                        onClick={() => onEdit?.(`timeline.${idx}.description`)}
                                    className="cursor-pointer text-sm leading-6 text-zinc-300 transition-colors hover:text-emerald-200"
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
                            <a
                                href={`mailto:${data.contactEmail}`}
                                onClick={(event) => {
                                    if (onEdit) {
                                        event.preventDefault();
                                        onEdit('contactEmail');
                                    }
                                }}
                                className="hover:text-emerald-400 transition-colors flex items-center gap-2"
                            >
                                <Mail size={14} /> Contact
                            </a>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
        <AdminAccessModal />
        </>    
    );
};

export default DevTerminal;
