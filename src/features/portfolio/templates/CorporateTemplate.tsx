import React from 'react';
import { PortfolioTemplateProps } from '../types/portfolio';
import { Mail, Linkedin, Globe, MapPin, Download, Sun, Moon } from 'lucide-react';
import InlineEdit from '../../../components/InlineEdit';
import TikTokWidget from '../components/widgets/TikTokWidget';
import { usePortfolioAdminAccess } from '../hooks/usePortfolioAdminAccess';

const CorporateTemplate: React.FC<PortfolioTemplateProps> = ({ data, onEdit, onUpdate, isMobileView }) => {
    const { hero, timeline, education, techStack, about, theme } = data;

    // Admin Access Hook
    const { longPressProps, AdminAccessModal } = usePortfolioAdminAccess({ data, onEdit });

    const responsiveClass = (base: string, desktop: string) => {
        return isMobileView ? base : `${base} ${desktop}`;
    };

    // Theme Config
    const isDark = theme.darkMode;
    const fontFamily = theme.fontFamily || 'Inter';
    const primaryColor = theme.primaryColor || '#3b82f6'; // Blue-500 default

    // Derived Colors
    // Fix: Force dark background if Dark Mode is active but background is explicitly White (stale data)
    const isExplicitlyLight = theme.backgroundColor?.toLowerCase() === '#ffffff' || theme.backgroundColor?.toLowerCase() === '#fff';
    const bgColor = (isDark && isExplicitlyLight) ? '#020617' : (theme.backgroundColor || (isDark ? '#020617' : '#ffffff'));

    // Fix: Force light text if Dark Mode is active but text is explicitly Dark
    const isExplicitlyDarkText = theme.textColor?.toLowerCase() === '#000000' || theme.textColor?.toLowerCase() === '#0f172a';
    const textColor = (isDark && isExplicitlyDarkText) ? '#f8fafc' : (theme.textColor || (isDark ? '#f8fafc' : '#0f172a'));

    const sidebarBg = isDark ? '#111827' : '#0f172a'; // Gray-900 : Slate-900
    const sidebarText = '#f8fafc';
    const accentColor = primaryColor;

    // TikTok Integration
    const tiktokLink = data.socialLinks?.find(l => l.url.includes('tiktok.com') || l.platform === 'tiktok');
    let tiktokUsername = '';
    if (tiktokLink) {
        // Extract username from URL (e.g. tiktok.com/@username)
        const match = tiktokLink.url.match(/@([a-zA-Z0-9_.-]+)/);
        if (match) tiktokUsername = match[1];
    }

    return (
        <div
            className={`font-sans min-h-full max-w-[1024px] mx-auto shadow-2xl my-8 md:my-0 transition-colors duration-300`}
            style={{ fontFamily, backgroundColor: bgColor, color: textColor }}
        >
            {/* Header / Sidebar Layout */}
            <div className={`flex ${responsiveClass('flex-col', 'md:flex-row')} min-h-screen`}>

                {/* Left Sidebar */}
                <aside
                    className={`w-full ${responsiveClass('', 'md:w-80 md:fixed md:h-full md:overflow-y-auto')} p-8 transition-colors duration-300`}
                    style={{ backgroundColor: sidebarBg, color: sidebarText }}
                >
                    <div className="mb-8 text-center md:text-left">
                        {hero.avatarUrl && (
                            <img
                                src={hero.avatarUrl}
                                alt="Profile"
                                className={`w-32 h-32 rounded-full border-4 border-white/10 mx-auto md:mx-0 mb-6 object-cover ${onEdit ? 'cursor-pointer hover:opacity-80' : ''}`}
                                {...(onEdit ? { onClick: () => onEdit('hero.avatarUrl') } : longPressProps)}
                            />
                        )}
                        <InlineEdit
                            value={hero.headline}
                            fieldId="hero.headline"
                            onFocus={onEdit}
                            className="mb-3 block text-2xl font-black leading-tight text-white [overflow-wrap:anywhere]"
                            tagName="h1"
                            style={{ color: sidebarText }}
                        />
                        <InlineEdit
                            value={hero.subheadline}
                            fieldId="hero.subheadline"
                            onFocus={onEdit}
                            className="block text-sm font-semibold leading-6 text-slate-200"
                            tagName="p"
                            style={{ color: '#dbeafe' }}
                        />
                        {/* Sidebar Actions (Theme Toggle for example) */}
                        <div className="mt-4 flex gap-2">
                            {onUpdate && (
                                <button
                                    onClick={() => onUpdate({ theme: { ...theme, darkMode: !theme.darkMode } })}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-xs flex items-center gap-2"
                                    title="Toggle Dark Mode"
                                >
                                    {isDark ? <Sun size={14} /> : <Moon size={14} />}
                                    {isDark ? 'Light' : 'Dark'}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6 mb-12">
                        <div className="flex items-center gap-3 opacity-80">
                            <Mail size={18} />
                            <a
                                href={`mailto:${data.contactEmail}`}
                                onClick={(event) => {
                                    if (onEdit) {
                                        event.preventDefault();
                                        onEdit('contactEmail');
                                    }
                                }}
                                className="hover:text-white truncate transition-colors"
                            >
                                {data.contactEmail}
                            </a>
                        </div>
                        <div className="flex gap-4">
                            {(data.socialLinks || []).map((link, idx) => (
                                <div key={link.id} className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity">
                                    <Globe size={18} />
                                    <a
                                        href={link.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(event) => {
                                            if (onEdit) {
                                                event.preventDefault();
                                                onEdit(`socialLinks.${idx}.label`);
                                            }
                                        }}
                                        className="truncate"
                                    >
                                        {link.label || 'Website'}
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mb-12">
                        <InlineEdit
                            value={data.sectionLabels?.techStack || 'Skills'}
                            fieldId="sectionLabels.techStack"
                            onFocus={onEdit}
                            className="mb-4 block border-b border-white/20 pb-2 text-xs font-bold uppercase tracking-widest text-slate-300"
                            tagName="h2"
                        />
                        <div className="flex flex-wrap gap-2">
                            {(techStack || []).map((skill, idx) => (
                                <span
                                    key={skill.id}
                                    onClick={() => onEdit?.(`techStack.${idx}.name`)}
                                    className="rounded border border-white/10 bg-white/10 px-2.5 py-1.5 text-sm font-medium text-slate-100 cursor-pointer hover:bg-white/20"
                                >
                                    {skill.name}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="mb-12">
                        <h2
                            onClick={() => onEdit?.('education')}
                            className="mb-4 border-b border-white/20 pb-2 text-xs font-bold uppercase tracking-widest text-slate-300 cursor-pointer hover:text-white"
                        >
                            Education
                        </h2>
                        <div className="space-y-8">
                            {(education || []).map((edu, idx) => (
                                <div key={edu.id}>
                                    <div
                                        onClick={() => onEdit?.(`education.${idx}.school`)}
                                        className="font-bold cursor-pointer hover:text-white"
                                    >
                                        {edu.school}
                                    </div>
                                    <div
                                        onClick={() => onEdit?.(`education.${idx}.degree`)}
                                        className="opacity-80 text-sm cursor-pointer hover:text-white"
                                    >
                                        {edu.degree}
                                    </div>
                                    <div
                                        onClick={() => onEdit?.(`education.${idx}.endDate`)}
                                        className="opacity-60 text-xs mt-1 cursor-pointer hover:text-white"
                                    >
                                        {edu.endDate}
                                    </div>
                                </div>
                            ))}
                            {(!education || education.length === 0) && (
                                <p onClick={() => onEdit?.('education.add')} className="opacity-40 italic text-sm cursor-pointer hover:opacity-80">
                                    No education listed
                                </p>
                            )}
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className={`flex-1 p-8 ${responsiveClass('', 'md:p-16 md:ml-80')}`}>
                    <section className="mb-12">
                        <InlineEdit
                            value={data.sectionLabels?.about || 'Professional Summary'}
                            fieldId="sectionLabels.about"
                            onFocus={onEdit}
                            className="text-2xl font-bold mb-6 pb-2 border-b block"
                            style={{ borderColor: `${textColor}20` }} // 20 hex = 12% opacity
                            tagName="h2"
                        />
                        <p
                            onClick={() => onEdit?.('about')}
                            className="cursor-pointer rounded-lg text-base leading-8 transition-colors hover:bg-slate-50 hover:text-slate-950 dark:hover:bg-white/5"
                            style={{ color: isDark ? '#e2e8f0' : '#334155' }}
                            title="Click to edit about me"
                        >
                            {about}
                        </p>
                    </section>

                    <section className="mb-12">
                        <InlineEdit
                            value={data.sectionLabels?.timeline || 'Work Experience'}
                            fieldId="sectionLabels.timeline"
                            onFocus={onEdit}
                            className="text-2xl font-bold mb-8 pb-2 border-b block"
                            style={{ borderColor: `${textColor}20` }}
                            tagName="h2"
                        />
                        <div className="space-y-8">
                            {(timeline || []).map((job, idx) => (
                                <div key={job.id} className="relative pl-8 border-l-2" style={{ borderColor: `${textColor}10` }}>
                                    <div
                                        className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white"
                                        style={{ backgroundColor: accentColor }}
                                    ></div>
                                    <div className={`flex ${responsiveClass('flex-col', 'sm:flex-row sm:items-baseline')} justify-between mb-2`}>
                                        <InlineEdit
                                            value={job.jobTitle}
                                            fieldId={`timeline.${idx}.jobTitle`}
                                            onFocus={onEdit}
                                            className="text-xl font-bold block"
                                            tagName="h3"
                                        />
                                        <span
                                            className="text-sm font-medium px-2 py-1 rounded"
                                            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: isDark ? 'white' : 'inherit' }}
                                        >
                                            <InlineEdit value={job.startDate} fieldId={`timeline.${idx}.startDate`} onFocus={onEdit} />
                                            <span className="mx-1">-</span>
                                            <InlineEdit value={job.endDate} fieldId={`timeline.${idx}.endDate`} onFocus={onEdit} />
                                        </span>
                                    </div>
                                    <div className="text-lg font-medium mb-2 opacity-80" style={{ color: accentColor }}>
                                        <InlineEdit
                                            value={job.employer}
                                            fieldId={`timeline.${idx}.employer`}
                                            onFocus={onEdit}
                                        />
                                    </div>
                                    <p
                                        onClick={() => onEdit?.(`timeline.${idx}.description`)}
                                        className="cursor-pointer whitespace-pre-wrap rounded-md text-[15px] leading-7 opacity-90 transition-colors hover:bg-slate-50 hover:text-slate-950 dark:hover:bg-white/5"
                                        style={{ color: isDark ? '#d1d5db' : '#475569' }}
                                        title="Click to edit role description"
                                    >
                                        {job.description}
                                    </p>
                                </div>
                            ))}
                            {(!timeline || timeline.length === 0) && (
                                <p onClick={() => onEdit?.('timeline.add')} className="opacity-40 italic cursor-pointer hover:opacity-80">
                                    No experience listed.
                                </p>
                            )}
                        </div>
                    </section>

                    {/* Projects Section (Missing in original Corporate) */}
                    <section className="mb-12">
                        <InlineEdit
                            value={data.sectionLabels?.projects || 'Key Projects'}
                            fieldId="sectionLabels.projects"
                            onFocus={onEdit}
                            className="text-2xl font-bold mb-8 pb-2 border-b block"
                            style={{ borderColor: `${textColor}20` }}
                            tagName="h2"
                        />
                        <div className="grid md:grid-cols-2 gap-8">
                            {(data.projects || []).map((proj, idx) => (
                                <div key={proj.id} className="group p-6 rounded-lg border transition-all hover:shadow-md" style={{ borderColor: `${textColor}10`, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'white' }}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3
                                            className="font-bold text-xl group-hover:underline cursor-pointer"
                                            onClick={() => onEdit?.(`projects.${idx}.title`)}
                                        >
                                            {proj.title}
                                        </h3>
                                        <div className="flex gap-2">
                                            {proj.demoUrl && (
                                                <a
                                                    href={proj.demoUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    onClick={(event) => {
                                                        if (onEdit) {
                                                            event.preventDefault();
                                                            onEdit(`projects.${idx}.demoUrl`);
                                                        }
                                                    }}
                                                    className="opacity-60 hover:opacity-100 hover:text-blue-500"
                                                >
                                                    <Globe size={16} />
                                                </a>
                                            )}
                                            {proj.repoUrl && (
                                                <a
                                                    href={proj.repoUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    onClick={(event) => {
                                                        if (onEdit) {
                                                            event.preventDefault();
                                                            onEdit(`projects.${idx}.repoUrl`);
                                                        }
                                                    }}
                                                    className="opacity-60 hover:opacity-100"
                                                >
                                                    <Download size={16} />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <p
                                        className="opacity-70 mb-4"
                                        onClick={() => onEdit?.(`projects.${idx}.description`)}
                                    >
                                        {proj.description}
                                    </p>
                                </div>
                            ))}
                            {(!data.projects || data.projects.length === 0) && (
                                <p onClick={() => onEdit?.('projects.add')} className="opacity-40 italic cursor-pointer hover:opacity-80">
                                    No projects listed.
                                </p>
                            )}
                        </div>
                    </section>
                </main>
            </div>
            <AdminAccessModal />
        </div>
    );
};

export default CorporateTemplate;
