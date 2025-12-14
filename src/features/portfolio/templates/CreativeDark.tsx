import React, { useEffect, useState } from 'react';
import { PortfolioTemplateProps } from '../types/portfolio';
import { Play, ArrowUpRight, Instagram, Twitter, Linkedin } from 'lucide-react';

const CreativeDark: React.FC<PortfolioTemplateProps> = ({ data, onEdit, isMobileView }) => {
    const { hero, projects, about } = data;
    const [scrolled, setScrolled] = useState(0);

    const responsiveClass = (base: string, desktop: string) => {
        return isMobileView ? base : `${base} ${desktop}`;
    };

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="bg-black text-white font-sans min-h-full selection:bg-white selection:text-black overflow-x-hidden">
            {/* Immersive Hero */}
            <header className="h-screen w-full relative flex items-center justify-center overflow-hidden">
                {/* Parallax Background */}
                <div
                    className="absolute inset-0 z-0 opacity-40 grayscale"
                    style={{
                        backgroundImage: `url(${hero.avatarUrl || 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070'})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        transform: `translateY(${scrolled * 0.5}px)`
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/20 to-black z-0" />

                <div className="relative z-10 text-center px-4 mix-blend-difference">
                    <h1
                        onClick={() => onEdit?.('hero.headline')}
                        className={`${responsiveClass('text-5xl', 'md:text-7xl')} font-black tracking-tighter uppercase mb-4 leading-none break-words cursor-pointer hover:text-neutral-500 transition-colors`}
                        title="Click to edit headline"
                    >
                        {hero.headline}
                    </h1>
                    <p
                        onClick={() => onEdit?.('hero.subheadline')}
                        className="text-xl md:text-2xl font-light tracking-widest uppercase opacity-80 mb-12 cursor-pointer hover:text-white hover:opacity-100 transition-all"
                        title="Click to edit subheadline"
                    >
                        {hero.subheadline}
                    </p>
                </div>

                <div className="absolute bottom-12 w-full flex justify-center z-10">
                    <div className="w-[1px] h-24 bg-gradient-to-b from-white to-transparent opacity-50"></div>
                </div>
            </header>

            {/* Introduction - Large Text */}
            <section className="py-32 px-6 md:px-12 bg-black relative z-10">
                <div className="max-w-4xl mx-auto">
                    <p
                        onClick={() => onEdit?.('about')}
                        className="text-2xl md:text-4xl font-bold leading-tight text-neutral-300 cursor-pointer hover:text-white transition-colors"
                        title="Click to edit about me"
                    >
                        "{about}"
                    </p>
                </div>
            </section>

            {/* Work Gallery */}
            <section className="py-20 bg-black px-4 md:px-8">
                <div className="max-w-7xl mx-auto space-y-40">
                    {projects.map((project, index) => (
                        <div key={project.id} className={`flex ${responsiveClass('flex-col', 'md:flex-row')} gap-8 md:gap-20 items-center ${index % 2 === 1 ? responsiveClass('', 'md:flex-row-reverse') : ''}`}>
                            <div className={`${responsiveClass('w-full', 'md:w-3/5')} group cursor-pointer relative`}>
                                <div className={`overflow-hidden ${responsiveClass('aspect-[16/9]', 'md:aspect-[3/2]')} bg-neutral-900`}>
                                    {project.thumbnailUrl ? (
                                        <img src={project.thumbnailUrl} alt={project.title} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-80 group-hover:opacity-100" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-neutral-800 text-6xl font-black uppercase">
                                            {project.title.substring(0, 2)}
                                        </div>
                                    )}
                                </div>
                                {/* Hover Play Button */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                        <Play fill="white" className="ml-1" />
                                    </div>
                                </div>
                            </div>

                            <div className="w-full md:w-2/5 md:sticky md:top-32 self-start">
                                <div className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-4">0{index + 1} / Project</div>
                                <h2
                                    onClick={() => onEdit?.(`projects.${project.id}.title`)}
                                    className="text-3xl md:text-4xl font-bold mb-6 cursor-pointer hover:text-neutral-400 transition-colors"
                                >
                                    {project.title}
                                </h2>
                                <p
                                    onClick={() => onEdit?.(`projects.${project.id}.description`)}
                                    className="text-neutral-400 text-base leading-relaxed mb-8 cursor-pointer hover:text-white transition-colors"
                                >
                                    {project.description}
                                </p>
                                <div className="flex flex-wrap gap-2 mb-8">
                                    {project.tags?.map(tag => (
                                        <span key={tag} className="border border-neutral-800 px-3 py-1 rounded-full text-xs uppercase text-neutral-400">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                {project.demoUrl && (
                                    <a href={project.demoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-white border-b border-white pb-1 hover:opacity-70 transition-opacity uppercase tracking-wider text-sm font-bold">
                                        View Case Study <ArrowUpRight size={16} />
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer - Big Links */}
            <footer className="bg-neutral-900 text-white pt-32 pb-12 px-6">
                <div className={`max-w-7xl mx-auto flex ${responsiveClass('flex-col', 'md:flex-row')} justify-between items-start md:items-end`}>
                    <div>
                        <h2 className={`${responsiveClass('text-5xl', 'md:text-6xl')} font-black tracking-tighter mb-8 leading-none break-words`}>
                            LET'S WORK <br className={`${responsiveClass('hidden', 'md:block')}`} /> TOGETHER.
                        </h2>
                        <a href={`mailto:${data.contactEmail}`} className="text-2xl md:text-3xl hover:text-neutral-400 transition-colors border-b border-white/20 pb-2">
                            {data.contactEmail}
                        </a>
                    </div>
                    <div className="mt-12 md:mt-0 flex gap-8">
                        <Instagram className="w-8 h-8 hover:opacity-50 transition-opacity cursor-pointer" />
                        <Twitter className="w-8 h-8 hover:opacity-50 transition-opacity cursor-pointer" />
                        <Linkedin className="w-8 h-8 hover:opacity-50 transition-opacity cursor-pointer" />
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-neutral-800 text-neutral-500 text-sm flex justify-between">
                    <span>© {new Date().getFullYear()} {hero.headline}</span>
                    <span className="uppercase tracking-widest">Portfolio</span>
                </div>
            </footer>
        </div>
    );
};

export default CreativeDark;
