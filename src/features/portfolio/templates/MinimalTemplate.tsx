import React from 'react';
import { PortfolioTemplateProps } from '../types/portfolio';
import { ExternalLink, Github, FileText, Sun, Moon } from 'lucide-react';
import InlineEdit from '../../../components/InlineEdit';

const MinimalTemplate: React.FC<PortfolioTemplateProps> = ({ data, onEdit, onUpdate, isMobileView }) => {
    const { hero, projects, timeline, about, techStack, attachedResumeId, theme } = data;

    const responsiveClass = (base: string, desktop: string) => {
        return isMobileView ? base : `${base} ${desktop}`;
    };

    // Animation classes
    const animationClass = theme.animations?.enabled ? {
        'fade': 'animate-in fade-in duration-1000',
        'slide': 'animate-in slide-in-from-bottom duration-1000',
        'zoom': 'animate-in zoom-in duration-1000',
        'none': ''
    }[theme.animations.type] : '';

    const rootStyle = {
        fontFamily: theme.fontFamily,
        color: theme.textColor,
        backgroundColor: theme.backgroundColor
    };

    return (
        <div
            className={`bg-white text-gray-900 min-h-full p-8 ${responsiveClass('', 'md:p-16')} max-w-4xl mx-auto selection:bg-gray-200 ${animationClass}`}
            style={rootStyle}
        >
            {/* Hero */}
            <header className="mb-20">
                <p className="text-sm opacity-60 mb-4">Hello, I am</p>
                <h1
                    onClick={() => onEdit?.('hero.headline')}
                    className={`${responsiveClass('text-5xl', 'md:text-6xl')} font-bold tracking-tighter mb-4 cursor-pointer hover:underline decoration-2 underline-offset-4`}
                    title="Click to edit headline"
                >
                    {hero.headline}
                </h1>
                <p
                    onClick={() => onEdit?.('hero.subheadline')}
                    className="text-xl opacity-80 mb-8 max-w-2xl cursor-pointer hover:opacity-100 transition-opacity"
                    title="Click to edit subheadline"
                >
                    {hero.subheadline}
                </p>

                {/* Dynamic Buttons */}
                <div className="flex flex-wrap gap-4 items-center">
                    {/* Render new dynamic buttons if available */}
                    {hero.buttons?.map((btn, idx) => (
                        <div key={btn.id} className="inline-block relative group">
                            {/* Delete Button (Only in Editor) */}
                            {onUpdate && (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const newButtons = [...(hero.buttons || [])];
                                        newButtons.splice(idx, 1);
                                        onUpdate({
                                            hero: { ...hero, buttons: newButtons }
                                        });
                                    }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600 shadow-sm"
                                    title="Remove Button"
                                >
                                    &times;
                                </button>
                            )}

                            {btn.type === 'action' && btn.action === 'theme_toggle' ? (
                                <button
                                    onClick={() => onUpdate?.({ theme: { ...theme, darkMode: !theme.darkMode } })}
                                    style={btn.style}
                                    className={`
                                        px-4 py-2 font-bold transition-all duration-200 flex items-center gap-2
                                        ${btn.variant === 'primary' ? 'bg-black text-white hover:bg-gray-800' : ''}
                                        ${btn.variant === 'secondary' ? 'bg-gray-200 text-black hover:bg-gray-300' : ''}
                                        ${btn.variant === 'outline' ? 'border-2 border-current hover:opacity-70' : ''}
                                        ${btn.variant === 'ghost' ? 'opacity-60 hover:opacity-100 hover:bg-black/5' : ''}
                                    `}
                                >
                                    {theme.darkMode ? <Sun size={18} /> : <Moon size={18} />}
                                    <span>{theme.darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                                </button>
                            ) : (
                                <a
                                    href={btn.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={btn.style}
                                    className={`
                                        px-4 py-2 font-bold transition-all duration-200 block
                                        ${btn.variant === 'primary' ? 'bg-black text-white hover:bg-gray-800' : ''}
                                        ${btn.variant === 'secondary' ? 'bg-gray-200 text-black hover:bg-gray-300' : ''}
                                        ${btn.variant === 'outline' ? 'border-2 border-current hover:opacity-70' : ''}
                                        ${btn.variant === 'ghost' ? 'opacity-60 hover:opacity-100 hover:bg-black/5' : ''}
                                    `}
                                >
                                    {btn.label}
                                </a>
                            )}
                        </div>
                    ))}

                    {/* Fallback Legacy Primary CTA (if no buttons array) */}
                    {!hero.buttons && hero.ctaPrimaryLabel && (
                        <div className="border-b-2 border-black hover:bg-black hover:text-white transition-colors pb-0.5 font-bold">
                            <InlineEdit
                                value={hero.ctaPrimaryLabel}
                                fieldId="hero.ctaPrimaryLabel"
                                onFocus={onEdit}
                                isLink={!!hero.ctaPrimaryUrl}
                                tagName={hero.ctaPrimaryUrl ? "a" : "div"}
                                href={hero.ctaPrimaryUrl}
                                target="_blank"
                            />
                        </div>
                    )}

                    {attachedResumeId && (
                        <a href={`#/resume/${attachedResumeId}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors text-sm font-bold border-b-2 border-transparent hover:border-gray-300 pb-0.5">
                            <FileText size={16} /> Download CV
                        </a>
                    )}
                </div>
            </header>

            {/* About */}
            <section className="mb-20">
                <InlineEdit
                    value={data.sectionLabels?.about || 'About'}
                    fieldId="sectionLabels.about"
                    onFocus={onEdit}
                    className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 block"
                    tagName="h2"
                />
                <p
                    onClick={() => onEdit?.('about')}
                    className="text-lg leading-relaxed text-gray-800 max-w-2xl cursor-pointer hover:bg-gray-50 rounded -m-2 p-2"
                    title="Click to edit about me"
                >
                    {about}
                </p>

                <div className="mt-8 flex flex-wrap gap-2">
                    {techStack.map((skill, idx) => (
                        <span
                            key={skill.id}
                            onClick={() => onEdit?.(`techStack.${idx}.name`)}
                            className="bg-gray-100 px-3 py-1 text-sm rounded-md text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors"
                            title="Click to edit skill"
                        >
                            {skill.name}
                        </span>
                    ))}
                    <span
                        onClick={() => onEdit?.('techStack')}
                        className="px-3 py-1 text-sm rounded-md text-gray-400 border border-dashed border-gray-300 cursor-pointer hover:text-black hover:border-black transition-colors"
                    >
                        + Add
                    </span>
                </div>
            </section>

            {/* Projects */}
            <section className="mb-20">
                <InlineEdit
                    value={data.sectionLabels?.projects || 'Selected Work'}
                    fieldId="sectionLabels.projects"
                    onFocus={onEdit}
                    className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 block"
                    tagName="h2"
                />
                <div className="grid gap-10">
                    {projects.map((project, idx) => (
                        <div key={project.id} className="group border-l-2 border-gray-100 pl-6 hover:border-black transition-colors duration-300">
                            <h3
                                onClick={() => onEdit?.(`projects.${idx}.title`)}
                                className="text-2xl font-bold mb-2 cursor-pointer hover:text-blue-600 w-fit"
                                title="Click to edit project title"
                            >
                                {project.title}
                            </h3>
                            <p
                                onClick={() => onEdit?.(`projects.${idx}.description`)}
                                className="text-gray-600 mb-4 max-w-xl cursor-pointer hover:bg-gray-50 rounded -m-1 p-1"
                                title="Click to edit project description"
                            >
                                {project.description}
                            </p>
                            <div className="flex items-center gap-4 text-sm font-bold">
                                {project.demoUrl && (
                                    <div className="flex items-center gap-1 hover:text-blue-600">
                                        <InlineEdit
                                            value="Live Demo"
                                            fieldId={`projects.${idx}.demoUrl`}
                                            onFocus={onEdit}
                                            tagName="a"
                                            href={project.demoUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            isLink
                                        />
                                        <ExternalLink size={14} />
                                    </div>
                                )}
                                {project.repoUrl && (
                                    <div className="flex items-center gap-1 hover:text-purple-600">
                                        <InlineEdit
                                            value="Source Code"
                                            fieldId={`projects.${idx}.repoUrl`}
                                            onFocus={onEdit}
                                            tagName="a"
                                            href={project.repoUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            isLink
                                        />
                                        <Github size={14} />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {projects.length === 0 && <p className="text-gray-400 italic">No projects added yet.</p>}
                </div>
            </section>

            {/* Timeline */}
            <section className="mb-20">
                <InlineEdit
                    value={data.sectionLabels?.timeline || 'Experience'}
                    fieldId="sectionLabels.timeline"
                    onFocus={onEdit}
                    className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 block"
                    tagName="h2"
                />
                <div className="space-y-8">
                    {timeline.map((job, idx) => (
                        <div key={job.id} className="grid grid-cols-[100px_1fr] gap-4">
                            <div className="text-sm text-gray-500">
                                <InlineEdit value={job.startDate} fieldId={`timeline.${idx}.startDate`} onFocus={onEdit} />
                                <span className="mx-1">—</span>
                                <InlineEdit value={job.endDate} fieldId={`timeline.${idx}.endDate`} onFocus={onEdit} />
                            </div>
                            <div>
                                <h3
                                    onClick={() => onEdit?.(`timeline.${idx}.jobTitle`)}
                                    className="font-bold cursor-pointer hover:text-blue-600 w-fit"
                                    title="Click to edit job title"
                                >
                                    {job.jobTitle}
                                </h3>
                                <div
                                    onClick={() => onEdit?.(`timeline.${idx}.employer`)}
                                    className="text-sm font-medium text-gray-500 mb-1 cursor-pointer hover:text-black w-fit"
                                    title="Click to edit employer"
                                >
                                    {job.employer}
                                </div>
                                <p
                                    onClick={() => onEdit?.(`timeline.${idx}.description`)}
                                    className="text-gray-600 mt-1 text-sm cursor-pointer hover:bg-gray-50 rounded -m-1 p-1"
                                    title="Click to edit description"
                                >
                                    {job.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <footer className="pt-20 border-t border-gray-100 text-sm text-gray-400 flex justify-between">
                <span>© {new Date().getFullYear()} {hero.headline}</span>
                <a href={`mailto:${data.contactEmail}`} className="hover:text-black">Get in touch</a>
            </footer>
        </div>
    );
};

export default MinimalTemplate;
