import React from 'react';
import { PortfolioTemplateProps } from '../types/portfolio';
import { ArrowRight, Sun, Moon, Plus, Trash2 } from 'lucide-react';
import InlineEdit from '../../../components/InlineEdit';
import { usePortfolioAdminAccess } from '../hooks/usePortfolioAdminAccess';

const VisualTemplate: React.FC<PortfolioTemplateProps> = ({ data, onEdit, onUpdate, isMobileView }) => {
    const { hero, projects, about, theme } = data;

    // Admin Access Hook
    const { longPressProps, AdminAccessModal } = usePortfolioAdminAccess({
        data,
        onEdit,
        editField: 'hero.headline'
    });

    const responsiveClass = (base: string, desktop: string) => {
        return isMobileView ? base : `${base} ${desktop}`;
    };

    // Theme Config
    const isDark = theme.darkMode;
    const fontFamily = theme.fontFamily || 'Inter';
    const primaryColor = theme.primaryColor || '#a855f7'; // Purple-500 default

    // Derived Colors
    // Fix: If Dark Mode is active but background is explicitly Light (stale data), force Dark background
    const isExplicitlyLight = theme.backgroundColor?.toLowerCase() === '#ffffff' || theme.backgroundColor?.toLowerCase() === '#fff';
    const bgColor = (isDark && isExplicitlyLight) ? '#0f0f0f' : (theme.backgroundColor || (isDark ? '#0f0f0f' : '#ffffff'));

    // Fix: If Dark Mode is active but text is explicitly Dark (stale), force Light text
    const isExplicitlyDarkText = theme.textColor?.toLowerCase() === '#000000' || theme.textColor?.toLowerCase() === '#111827';
    const textColor = (isDark && isExplicitlyDarkText) ? '#ffffff' : (theme.textColor || (isDark ? '#ffffff' : '#111827'));

    const bgSecondary = isDark ? '#141414' : '#f9fafb';
    const textMuted = isDark ? '#9ca3af' : '#6b7280';

    // Gradient for Hero Text
    const gradientStyle = {
        backgroundImage: `linear-gradient(to right, ${textColor}, ${isDark ? '#6b7280' : '#9ca3af'})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    };

    return (
        <div
            className="font-sans min-h-full selection:bg-purple-500/40 transition-colors duration-500"
            style={{ backgroundColor: bgColor, color: textColor, fontFamily }}
        >
            {/* Hero */}
            <div className={`min-h-[80vh] flex flex-col justify-center px-6 ${responsiveClass('', 'md:px-20')} relative overflow-hidden`}>
                <div
                    className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none opacity-20"
                    style={{ backgroundColor: primaryColor }}
                ></div>

                {/* Theme Toggle (Absolute) */}
                {onUpdate && (
                    <button
                        onClick={() => onUpdate({ theme: { ...theme, darkMode: !theme.darkMode } })}
                        className="absolute top-8 right-8 p-3 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 transition-all z-50 backdrop-blur-sm"
                        title="Toggle Theme"
                    >
                        {isDark ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                )}

                <h1
                    className={`${responsiveClass('text-5xl', 'md:text-7xl')} font-black tracking-tight mb-6 leading-none block cursor-pointer`}
                    {...(onEdit ? { onClick: () => onEdit('hero.headline') } : longPressProps)}
                >
                    <span style={gradientStyle}>{hero.headline}</span>
                </h1>

                <InlineEdit
                    value={hero.subheadline}
                    fieldId="hero.subheadline"
                    onFocus={onEdit}
                    className="text-xl font-light max-w-2xl mb-10 block"
                    style={{ color: textMuted }}
                    tagName="p"
                />
                <div className="flex gap-4 flex-wrap">
                    {/* Dynamic Buttons */}
                    {hero.buttons?.map((btn, idx) => (
                        <div key={btn.id} className="relative group/btn">
                            {onUpdate && (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        const newButtons = [...(hero.buttons || [])];
                                        newButtons.splice(idx, 1);
                                        onUpdate({ hero: { ...hero, buttons: newButtons } });
                                    }}
                                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/btn:opacity-100 transition-opacity z-10"
                                >
                                    &times;
                                </button>
                            )}
                            <a
                                href={btn.url}
                                target="_blank"
                                rel="noreferrer"
                                className={`
                                    px-8 py-4 rounded-full font-bold text-lg flex items-center gap-2 transition-transform hover:scale-105
                                    ${btn.variant === 'primary' ? 'text-white' : ''}
                                    ${btn.variant === 'outline' ? 'border-2' : ''}
                                `}
                                style={{
                                    backgroundColor: btn.variant === 'primary' ? (isDark ? 'white' : 'black') : 'transparent',
                                    color: btn.variant === 'primary' ? (isDark ? 'black' : 'white') : textColor,
                                    borderColor: textColor
                                }}
                            >
                                {btn.label}
                                {btn.type === 'link' && <ArrowRight size={20} />}
                            </a>
                        </div>
                    ))}

                    {!hero.buttons && hero.ctaPrimaryLabel && (
                        <div className="inline-block relative group">
                            <span
                                className="px-8 py-4 rounded-full font-bold text-lg flex items-center gap-2 transition-transform hover:scale-105"
                                style={{ backgroundColor: isDark ? 'white' : 'black', color: isDark ? 'black' : 'white' }}
                            >
                                <InlineEdit
                                    value={hero.ctaPrimaryLabel}
                                    fieldId="hero.ctaPrimaryLabel"
                                    onFocus={onEdit}
                                    isLink={!!hero.ctaPrimaryUrl}
                                    tagName={hero.ctaPrimaryUrl ? "a" : "span"}
                                    href={hero.ctaPrimaryUrl}
                                    target="_blank"
                                />
                                <ArrowRight size={20} />
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Gallery Grid */}
            <div className={`px-6 ${responsiveClass('', 'md:px-20')} py-20 transition-colors duration-500`} style={{ backgroundColor: bgSecondary }}>
                <div className="flex justify-between items-end mb-16">
                    <InlineEdit
                        value={data.sectionLabels?.projects || 'Recent Work.'}
                        fieldId="sectionLabels.projects"
                        onFocus={onEdit}
                        className="text-4xl font-bold block"
                        tagName="h2"
                    />
                    <span style={{ color: textMuted }}>{projects.length} Projects</span>
                </div>

                <div className={`grid ${responsiveClass('grid-cols-1', 'md:grid-cols-2')} gap-8`}>
                    {projects.map((project, idx) => (
                        <div key={project.id} className={`group relative rounded-2xl overflow-hidden aspect-[4/3] bg-gray-800 ${idx % 3 === 0 ? responsiveClass('', 'md:col-span-2 md:aspect-[21/9]') : ''}`}>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity z-10"></div>
                            {project.thumbnailUrl ? (
                                <img src={project.thumbnailUrl} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-600">No Image</div>
                            )}

                            <div className="absolute bottom-0 left-0 p-8 z-20 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 w-full text-white">
                                <div className="flex gap-2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                                    {project.tags?.map(tag => (
                                        <span key={tag} className="text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md px-2 py-1 rounded text-white">{tag}</span>
                                    ))}
                                </div>
                                <InlineEdit
                                    value={project.title}
                                    fieldId={`projects.${idx}.title`}
                                    onFocus={onEdit}
                                    className="text-3xl font-bold mb-2 block"
                                    tagName="h3"
                                />
                                <InlineEdit
                                    value={project.description}
                                    fieldId={`projects.${idx}.description`}
                                    onFocus={onEdit}
                                    className="text-gray-300 line-clamp-2 max-w-xl block"
                                    tagName="p"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Simple Bio */}
            <div className={`px-6 ${responsiveClass('', 'md:px-20')} py-24 flex flex-col items-center text-center`} style={{ backgroundColor: bgColor }}>
                <div
                    className="w-16 h-1 bg-gradient-to-r rounded-full mb-8"
                    style={{ backgroundImage: `linear-gradient(to right, ${primaryColor}, ${isDark ? '#ec4899' : '#a855f7'})` }}
                ></div>
                <div
                    className={`text-lg ${responsiveClass('', 'md:text-2xl')} font-light max-w-3xl leading-relaxed`}
                    style={{ color: textColor }}
                >
                    "<InlineEdit
                        value={about}
                        fieldId="about"
                        onFocus={onEdit}
                        className="inline"
                        tagName="span"
                        multiline
                    />"
                </div>
                <a
                    href={`mailto:${data.contactEmail}`}
                    className="mt-8 text-sm uppercase tracking-widest border-b transition-all pb-1 font-medium"
                    style={{ color: textMuted, borderColor: isDark ? '#1f2937' : '#e5e7eb' }}
                >
                    Let's Create Together
                </a>
            </div>
            <AdminAccessModal />
        </div>
    );
};

export default VisualTemplate;
