import React from 'react';
import { PortfolioButton, PortfolioTemplateProps } from '../types/portfolio';
import { BookOpen, Mail, ChevronRight, Bookmark } from 'lucide-react';
import { usePortfolioAdminAccess } from '../hooks/usePortfolioAdminAccess';
import { getAvatarSizeClasses, getAvatarShapeClasses, getAvatarFlexOrder } from '../utils/avatar';

const WriterEditorial: React.FC<PortfolioTemplateProps> = ({ data, onEdit, isMobileView }) => {
    const { hero, projects, about, timeline } = data;
    const heroButtons: PortfolioButton[] = Array.isArray(hero.buttons)
        ? hero.buttons
        : [
            ...(hero.ctaPrimaryLabel || hero.ctaPrimaryUrl ? [{
                id: 'primary',
                label: hero.ctaPrimaryLabel || 'View Work',
                url: hero.ctaPrimaryUrl || '#writing',
                variant: 'primary' as const,
                type: 'link' as const,
            }] : []),
            ...(hero.ctaSecondaryLabel || hero.ctaSecondaryUrl ? [{
                id: 'secondary',
                label: hero.ctaSecondaryLabel || 'Contact Me',
                url: hero.ctaSecondaryUrl || `mailto:${data.contactEmail || ''}`,
                variant: 'outline' as const,
                type: 'link' as const,
            }] : []),
        ];

    const getButtonClassName = (variant: string = 'outline') => {
        if (variant === 'primary') return 'bg-black text-white hover:bg-gray-800';
        if (variant === 'secondary') return 'bg-gray-100 text-black hover:bg-gray-200';
        if (variant === 'ghost') return 'text-gray-600 hover:text-black hover:bg-gray-100';
        return 'border border-gray-300 text-gray-700 hover:border-black hover:text-black';
    };

    // Admin Access Hook — target avatar if set, else headline
    const { longPressProps, AdminAccessModal } = usePortfolioAdminAccess({
        data,
        onEdit,
        editField: hero.avatarUrl ? 'hero.avatarUrl' : 'hero.headline'
    });

    const responsiveClass = (base: string, desktop: string) => {
        return isMobileView ? base : `${base} ${desktop}`;
    };

    return (
        <div className="bg-[#fcfbf9] text-[#1a1a1a] font-serif min-h-full selection:bg-yellow-200 selection:text-black border-t-8 border-black">
            {/* Minimal Header */}
            <div className="max-w-3xl mx-auto px-6 py-12 flex flex-wrap justify-between items-center border-b border-gray-200 gap-4">
                <div className="flex items-center">
                    {/* Avatar */}
                    {hero.avatarUrl && (
                        <img
                            src={hero.avatarUrl}
                            alt="Profile"
                            onClick={() => onEdit?.('hero.avatarUrl')}
                            {...(!onEdit ? longPressProps : {})}
                            className={`${getAvatarSizeClasses(hero.avatarSize)} ${getAvatarShapeClasses(hero.avatarShape)} ${getAvatarFlexOrder(hero.avatarPosition)} object-cover cursor-pointer grayscale hover:grayscale-0 transition-all`}
                            title="Click to edit avatar"
                        />
                    )}
                    <div
                        {...(onEdit ? { onClick: () => onEdit('hero.headline') } : (hero.avatarUrl ? {} : longPressProps))}
                        className="font-bold text-xl tracking-tight font-sans uppercase cursor-pointer hover:bg-yellow-100/50 hover:text-black transition-colors rounded px-2 -mx-2"
                        title="Click to edit headline"
                    >
                        {hero.headline}
                    </div>
                </div>
                <div className="flex gap-6 text-sm font-sans font-medium text-gray-500 overflow-x-auto">
                    <a href="#about" onClick={(event) => { if (onEdit) { event.preventDefault(); onEdit('sectionLabels.about'); } }} className="hover:text-black transition-colors">About</a>
                    <a href="#writing" onClick={(event) => { if (onEdit) { event.preventDefault(); onEdit('sectionLabels.projects'); } }} className="hover:text-black transition-colors">Writing</a>
                    <a href="#contact" onClick={(event) => { if (onEdit) { event.preventDefault(); onEdit('contactEmail'); } }} className="hover:text-black transition-colors">Contact</a>
                </div>
            </div>

            {/* Introduction / Manifesto */}
            <header className="max-w-3xl mx-auto px-6 py-24">
                <p
                    onClick={() => onEdit?.('hero.subheadline')}
                    className={`${responsiveClass('text-lg', 'md:text-xl')} leading-relaxed text-gray-600 mb-8 font-serif italic cursor-pointer hover:bg-yellow-100/50 hover:text-black transition-colors rounded px-2 -mx-2`}
                    title="Click to edit subheadline"
                >
                    {hero.subheadline}
                </p>
                <h1
                    onClick={() => onEdit?.('about')}
                    className={`${responsiveClass('text-3xl', 'md:text-5xl')} font-bold leading-tight mb-12 cursor-pointer hover:bg-yellow-100/50 hover:text-black transition-colors rounded px-2 -mx-2`}
                    title="Click to edit about me"
                >
                    {(about || '').slice(0, 150)}{(about || '').length > 150 ? '...' : ''}
                </h1>
                <div className="flex flex-wrap items-center gap-3">
                    {heroButtons.map((button) => {
                        const href = button.type === 'action' && button.action === 'scroll_to_contact'
                            ? '#contact'
                            : button.url || '#';
                        const opensNewTab = !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:');
                        const isContactButton = href.startsWith('mailto:') || button.label.toLowerCase().includes('contact');

                        return (
                            <a
                                key={button.id}
                                href={href}
                                target={opensNewTab ? '_blank' : undefined}
                                rel={opensNewTab ? 'noreferrer' : undefined}
                                onClick={(event) => {
                                    if (onEdit) {
                                        event.preventDefault();
                                        onEdit('hero.buttons');
                                    }
                                }}
                                className={`inline-flex items-center gap-2 px-5 py-3 font-sans text-sm font-semibold transition-colors ${getButtonClassName(button.variant)}`}
                            >
                                {isContactButton && <Mail size={16} />}
                                {button.label}
                            </a>
                        );
                    })}
                </div>
            </header>

            {/* Selected Writings (Projects list) */}
            <section id="writing" className="bg-white py-24 border-y border-gray-200">
                <div className="max-w-3xl mx-auto px-6">
                    <div className="flex items-baseline gap-4 mb-16">
                        <span className="w-4 h-4 bg-black rounded-full block"></span>
                        <h2 onClick={() => onEdit?.('sectionLabels.projects')} className="text-sm font-bold font-sans uppercase tracking-widest cursor-pointer hover:text-gray-600">Selected Publications</h2>
                    </div>

                    <div className="space-y-24">
                    {(projects || []).map((project, idx) => (
                            <article key={project.id} className="group cursor-pointer">
                                <div className={`flex ${responsiveClass('flex-col', 'md:flex-row')} gap-12 items-start`}>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 text-xs font-sans font-bold uppercase tracking-wider text-gray-500 mb-4">
                                            <span onClick={() => onEdit?.(`projects.${idx}.tags`)}>{project.tags?.[0] || 'Essay'}</span>
                                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                            <span>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                                        </div>
                                        <h3
                                            onClick={() => onEdit?.(`projects.${idx}.title`)}
                                            className="text-2xl md:text-3xl font-bold mb-4 group-hover:underline decoration-2 underline-offset-4 decoration-gray-300 leading-tight"
                                        >
                                            {project.title}
                                        </h3>
                                        <p
                                            onClick={() => onEdit?.(`projects.${idx}.description`)}
                                            className="text-base text-gray-600 leading-relaxed font-serif"
                                        >
                                            {project.description}
                                        </p>
                                        <div
                                            onClick={() => onEdit?.(`projects.${idx}.demoUrl`)}
                                            className="mt-6 flex items-center gap-2 text-sm font-sans font-bold text-black opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
                                        >
                                            Read Story <ChevronRight size={14} />
                                        </div>
                                    </div>
                                    {project.thumbnailUrl && (
                                        <div className={`w-full ${responsiveClass('', 'md:w-56')} aspect-[4/5] bg-gray-100 flex-shrink-0 grayscale group-hover:grayscale-0 transition-all duration-500 shadow-sm group-hover:shadow-md`}>
                                            <img
                                                src={project.thumbnailUrl}
                                                alt=""
                                                onClick={() => onEdit?.(`projects.${idx}.thumbnailUrl`)}
                                                className="w-full h-full object-cover mix-blend-multiply"
                                            />
                                        </div>
                                    )}
                                </div>
                            </article>
                        ))}
                        {(projects || []).length === 0 && (
                            <div onClick={() => onEdit?.('projects.add')} className="rounded-2xl border border-dashed border-gray-300 bg-[#fcfbf9] p-10 text-center cursor-pointer hover:border-gray-500">
                                <Bookmark className="mx-auto mb-4 h-8 w-8 text-gray-300" />
                                <h3 className="font-sans text-sm font-bold uppercase tracking-widest text-gray-500">No publications yet</h3>
                                <p className="mt-3 text-sm text-gray-500">Add a project to turn this into a featured article or writing sample.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Experience as a clean list */}
            <section className="py-24 max-w-3xl mx-auto px-6">
                <h2 onClick={() => onEdit?.('sectionLabels.timeline')} className="text-sm font-bold font-sans uppercase tracking-widest mb-12 border-b border-black pb-4 inline-block cursor-pointer hover:text-gray-600">Experience</h2>
                <div className="space-y-12">
                    {(timeline || []).map((job, idx) => (
                        <div key={job.id} className={`grid ${responsiveClass('grid-cols-1', 'md:grid-cols-[1fr_3fr]')} gap-4`}>
                            <div
                                onClick={() => onEdit?.(`timeline.${idx}.startDate`)}
                                className="text-sm font-sans font-medium text-gray-500 cursor-pointer hover:text-black"
                            >
                                {job.startDate} — {job.endDate}
                            </div>
                            <div>
                                <h4 onClick={() => onEdit?.(`timeline.${idx}.jobTitle`)} className="font-bold text-lg mb-1 cursor-pointer hover:text-black">{job.jobTitle}</h4>
                                <div onClick={() => onEdit?.(`timeline.${idx}.employer`)} className="text-gray-600 italic font-serif mb-2 cursor-pointer hover:text-black">{job.employer}</div>
                                <p onClick={() => onEdit?.(`timeline.${idx}.description`)} className="text-gray-500 text-sm leading-relaxed cursor-pointer hover:text-black">{job.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <footer id="contact" className="bg-[#1a1a1a] text-white py-20 px-6 text-center">
                <div className="max-w-2xl mx-auto">
                    <BookOpen size={48} className="mx-auto mb-8 text-gray-500" />
                    <h2 onClick={() => onEdit?.('contactEmail')} className="text-4xl font-serif font-bold mb-6 cursor-pointer hover:text-gray-200">Subscribe to my newsletter</h2>
                    <p onClick={() => onEdit?.('contactEmail')} className="text-gray-400 mb-8 font-serif text-lg cursor-pointer hover:text-gray-300">Join 10,000+ readers getting insights on technology and culture.</p>

                    <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                        <input
                            type="email"
                            placeholder="Email address"
                            onFocus={() => onEdit?.('contactEmail')}
                            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
                        />
                        <button
                            onClick={() => onEdit?.('contactEmail')}
                            className="px-6 py-3 bg-white text-black font-sans font-bold hover:bg-gray-200 transition-colors"
                        >
                            Subscribe
                        </button>
                    </div>

                    <div className="mt-16 text-xs font-sans text-gray-600 uppercase tracking-widest">
                        © {new Date().getFullYear()} {hero.headline}. New York, NY.
                    </div>
                </div>
            </footer>
            <AdminAccessModal />
        </div>
    );
};

export default WriterEditorial;
