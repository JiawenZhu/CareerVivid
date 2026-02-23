import React from 'react';
import { PortfolioTemplateProps } from '../../types/portfolio';
import { ArrowUpRight, Mail } from 'lucide-react';

const UXFolio: React.FC<PortfolioTemplateProps> = ({ data, onEdit, isMobileView }) => {
    const { hero, projects, about, contactEmail } = data;

    // Helper to force mobile styles when in mobile view, ignoring tailwind responsive prefixes which rely on viewport width
    const responsiveClass = (base: string, desktop: string) => {
        return isMobileView ? base : `${base} ${desktop}`;
    };

    return (
        <div className="bg-white text-black font-sans min-h-full selection:bg-black selection:text-white">
            {/* Massive Hero */}
            <header className="px-6 py-20 md:px-12 md:py-32 lg:py-40 max-w-screen-2xl mx-auto">
                <h1
                    onClick={() => onEdit?.('hero.headline')}
                    className={`${responsiveClass('text-4xl mb-6', 'md:text-7xl')} font-bold tracking-tight leading-tight break-words cursor-pointer hover:text-gray-700 transition-colors`}
                    title="Click to edit headline"
                >
                    {hero.headline}
                </h1>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <p
                        onClick={() => onEdit?.('hero.subheadline')}
                        className={`${responsiveClass('text-lg', 'md:text-xl')} text-gray-500 max-w-xl leading-relaxed cursor-pointer hover:text-black transition-colors`}
                        title="Click to edit subheadline"
                    >
                        {hero.subheadline}
                    </p>
                    <div className="flex gap-4">
                        <a href={`mailto:${contactEmail}`} className="px-6 py-3 bg-black text-white font-medium rounded-full hover:scale-105 transition-transform">
                            Let's Talk
                        </a>
                        <a href="#work" className="px-6 py-3 border border-gray-200 font-medium rounded-full hover:border-black transition-colors">
                            View Work
                        </a>
                    </div>
                </div>
            </header>

            {/* Selected Work - Masonry Style Grid */}
            <section id="work" className="px-6 pb-20 md:px-12 max-w-screen-2xl mx-auto">
                <div className="flex items-baseline justify-between mb-12 border-b border-black pb-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Selected Works</h2>
                    <span className="text-xs font-bold text-gray-400">{projects.length} PROJECTS</span>
                </div>

                <div className={`grid ${responsiveClass('grid-cols-1 gap-y-12', 'md:grid-cols-2 gap-x-12 gap-y-24')}`}>
                    {projects.map((project, index) => (
                        <div
                            key={project.id}
                            className={`group cursor-pointer ${index % 2 === 1 ? 'md:mt-24' : ''}`} // Offset effect for masonry feel
                        >
                            <div className="mb-6 overflow-hidden rounded-sm bg-gray-100 relative aspect-[4/3]">
                                {project.thumbnailUrl ? (
                                    <img
                                        src={project.thumbnailUrl}
                                        alt={project.title}
                                        className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold text-6xl group-hover:bg-gray-200 transition-colors">
                                        {project.title.charAt(0)}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                    </div>
                                )}

                                {/* Hover Overlay Button */}
                                <div className="absolute bottom-6 right-6 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                    <div className="bg-white rounded-full p-4 shadow-xl">
                                        <ArrowUpRight size={24} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-start">
                                    <h3
                                        onClick={() => onEdit?.(`projects.${project.id}.title`)}
                                        className="text-2xl font-bold group-hover:underline decoration-2 underline-offset-4 cursor-pointer"
                                    >
                                        {project.title}
                                    </h3>
                                    <span className="text-xs font-bold text-gray-400 border border-gray-200 px-3 py-1 rounded-full uppercase tracking-wider">
                                        {project.tags?.[0] || 'Design'}
                                    </span>
                                </div>
                                <p
                                    onClick={() => onEdit?.(`projects.${project.id}.description`)}
                                    className="text-base text-gray-500 line-clamp-2 cursor-pointer hover:bg-gray-50 p-1 -m-1 rounded"
                                >
                                    {project.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* About / Info */}
            <section className="bg-zinc-50 py-20 px-6 md:px-12 mt-20">
                <div className={`max-w-screen-2xl mx-auto grid ${responsiveClass('grid-cols-1', 'md:grid-cols-[1fr_2fr]')} gap-12`}>
                    <div>
                        <h2 className="text-xs font-bold uppercase tracking-widest mb-8 text-gray-400">About Me</h2>
                        {hero.avatarUrl && (
                            <img src={hero.avatarUrl} alt="Profile" className="w-full max-w-sm rounded-lg grayscale contrast-125 mb-8" />
                        )}
                    </div>
                    <div>
                        <p
                            onClick={() => onEdit?.('about')}
                            className={`${responsiveClass('text-2xl', 'md:text-4xl')} leading-tight font-medium text-zinc-900 mb-12 cursor-pointer hover:bg-gray-50 rounded`}
                            title="Click to edit about me"
                        >
                            {about}
                        </p>

                        <div className={`grid ${responsiveClass('grid-cols-2', 'md:grid-cols-3')} gap-8 border-t border-gray-200 pt-8`}>
                            <div>
                                <h3 className="text-sm font-bold uppercase mb-4 text-gray-400">Services</h3>
                                <ul className="space-y-2 text-lg">
                                    <li>UI/UX Design</li>
                                    <li>Product Strategy</li>
                                    <li>Design Systems</li>
                                    <li>Prototyping</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold uppercase mb-4 text-gray-400">Connect</h3>
                                <div className="space-y-2 text-lg">
                                    {data.socialLinks.map((link, i) => (
                                        <a key={i} href={link.url} target="_blank" rel="noreferrer" className="block hover:underline">
                                            {link.label}
                                        </a>
                                    ))}
                                    <a href={`mailto:${contactEmail}`} className="block hover:underline">{contactEmail}</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="px-6 py-8 md:px-12 flex justify-between items-center text-sm text-gray-400 max-w-screen-2xl mx-auto">
                <span>© {new Date().getFullYear()} {hero.headline}</span>
                <span>Designed with CareerVivid</span>
            </footer>
        </div>
    );
};

export default UXFolio;
