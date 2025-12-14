import React from 'react';
import { PortfolioTemplateProps } from '../types/portfolio';
import { Instagram, MapPin, Music, Github, Twitter, Mail, ArrowUpRight, Coffee, Laptop, Camera } from 'lucide-react';

const BentoPersonal: React.FC<PortfolioTemplateProps> = ({ data, onEdit, isMobileView }) => {
    const { hero, projects, about } = data;

    // Helper to force mobile styles when in mobile view
    const responsiveClass = (base: string, desktop: string) => {
        return isMobileView ? base : `${base} ${desktop}`;
    };

    return (
        <div className="bg-gray-100 text-gray-900 font-sans min-h-full p-4 md:p-8 flex items-center justify-center selection:bg-rose-200 selection:text-rose-900">
            <div className={`max-w-6xl w-full mx-auto grid ${responsiveClass('grid-cols-1', 'md:grid-cols-4')} auto-rows-[180px] gap-4`}>

                {/* Hero Tile - Large */}
                <div className={`bg-white rounded-3xl p-8 col-span-1 ${responsiveClass('', 'md:col-span-2 md:row-span-2')} shadow-sm border border-gray-200/50 flex flex-col justify-between hover:shadow-md transition-shadow`}>
                    <div className="w-16 h-16 bg-gray-100 rounded-full overflow-hidden mb-4">
                        {hero.avatarUrl ? (
                            <img src={hero.avatarUrl} alt="Me" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-rose-200 flex items-center justify-center text-rose-500 font-bold text-2xl">
                                {hero.headline.charAt(0)}
                            </div>
                        )}
                    </div>
                    <div>
                        <h1
                            onClick={() => onEdit?.('hero.headline')}
                            className="text-3xl font-bold tracking-tight mb-2 cursor-pointer hover:text-rose-500 transition-colors"
                            title="Click to edit headline"
                        >
                            I'm {hero.headline}.
                        </h1>
                        <p
                            onClick={() => onEdit?.('hero.subheadline')}
                            className="text-gray-500 text-lg leading-relaxed cursor-pointer hover:bg-gray-50 rounded -m-1 p-1"
                            title="Click to edit subheadline"
                        >
                            {hero.subheadline}
                        </p>
                    </div>
                </div>

                {/* Map Tile */}
                <div className={`bg-emerald-500 rounded-3xl p-6 col-span-1 ${responsiveClass('', 'md:col-span-1 md:row-span-1')} shadow-sm text-white flex flex-col items-center justify-center text-center hover:scale-[1.02] transition-transform`}>
                    <MapPin size={32} className="mb-2" />
                    <span className="font-bold text-lg">San Francisco, CA</span>
                    <span className="text-emerald-100 text-sm">Based in</span>
                </div>

                {/* Socials Tile */}
                <div className={`bg-black rounded-3xl p-6 col-span-1 ${responsiveClass('', 'md:col-span-1 md:row-span-1')} shadow-sm text-white flex flex-col justify-between hover:bg-neutral-900 transition-colors`}>
                    <div className="flex justify-between items-start">
                        <Twitter className="w-8 h-8" />
                        <ArrowUpRight className="opacity-50" />
                    </div>
                    <div className="font-bold">@handle</div>
                </div>

                {/* Spotify / Music Tile (Placeholder) */}
                <div className={`bg-rose-500 rounded-3xl p-6 col-span-1 ${responsiveClass('', 'md:col-span-1 md:row-span-1')} shadow-sm text-white flex flex-col justify-between overflow-hidden relative group`}>
                    <div className="absolute right-[-20px] top-[-20px] w-32 h-32 bg-rose-400 rounded-full blur-2xl opacity-50"></div>
                    <Music className="relative z-10 w-8 h-8 animate-pulse" />
                    <div className="relative z-10">
                        <div className="text-rose-100 text-xs font-bold uppercase tracking-wider">On Repeat</div>
                        <div className="font-bold text-lg leading-tight mt-1">Lo-Fi Coding Beats</div>
                    </div>
                </div>

                {/* Tech Stack / Tools Tile */}
                <div className={`bg-white rounded-3xl p-6 col-span-1 ${responsiveClass('', 'md:col-span-1 md:row-span-2')} shadow-sm border border-gray-200/50 flex flex-col overflow-hidden`}>
                    <div className="font-bold text-gray-400 text-xs uppercase tracking-wider mb-4">My Stack</div>
                    <div className="flex-1 flex flex-wrap content-start gap-2">
                        {data.techStack.map(skill => (
                            <span key={skill.id} className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600 hover:bg-rose-50 hover:text-rose-500 transition-colors" title={skill.name}>
                                <span className="text-xs font-bold">{skill.name.slice(0, 2)}</span>
                            </span>
                        ))}
                        <span className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200">
                            +
                        </span>
                    </div>
                </div>

                {/* About Me Text Tile */}
                <div className={`bg-white rounded-3xl p-8 col-span-1 ${responsiveClass('', 'md:col-span-2 md:row-span-1')} shadow-sm border border-gray-200/50 hover:shadow-md transition-shadow flex items-center`}>
                    <p
                        onClick={() => onEdit?.('about')}
                        className="text-gray-600 text-lg md:text-xl font-medium cursor-pointer hover:bg-gray-50 rounded p-2 -m-2 transition-colors w-full"
                        title="Click to edit about me"
                    >
                        "{about.slice(0, 120)}{about.length > 120 && '...'}"
                    </p>
                </div>

                {/* Mail Tile */}
                <a href={`mailto:${data.contactEmail}`} className={`bg-blue-600 rounded-3xl p-6 col-span-1 ${responsiveClass('', 'md:col-span-1 md:row-span-1')} shadow-sm text-white flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors cursor-pointer group`}>
                    <Mail className="group-hover:scale-110 transition-transform" />
                    <span className="font-bold">Say Hi!</span>
                </a>

                {/* Project Gallery Large */}
                <div className={`bg-white rounded-3xl p-6 col-span-1 ${responsiveClass('', 'md:col-span-2 md:row-span-2')} shadow-sm border border-gray-200/50 overflow-hidden relative group`}>
                    <div className="absolute top-6 left-6 z-10 flex gap-2">
                        <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold shadow-sm">Featured Work</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 h-full pt-10">
                        {projects.slice(0, 4).map(proj => (
                            <div
                                key={proj.id}
                                className="bg-gray-100 rounded-xl overflow-hidden relative aspect-square group/item cursor-pointer"
                                onClick={() => onEdit?.(`projects.${proj.id}.title`)}
                            >
                                {proj.thumbnailUrl && <img src={proj.thumbnailUrl} alt="" className="w-full h-full object-cover" />}
                                <div className="absolute inset-0 bg-black/50 flex flex-col justify-end p-4 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                    <span className="text-white font-bold text-sm line-clamp-1">{proj.title}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Github Tile */}
                <div className={`bg-[#24292e] rounded-3xl p-6 col-span-1 ${responsiveClass('', 'md:col-span-1 md:row-span-1')} shadow-sm text-white flex flex-col justify-center items-center gap-2 hover:bg-black transition-colors`}>
                    <Github size={32} />
                    <span className="font-bold">Github</span>
                </div>

                {/* Photo Tile */}
                <div className={`bg-amber-200 rounded-3xl col-span-1 ${responsiveClass('', 'md:col-span-1 md:row-span-1')} shadow-sm overflow-hidden relative group`}>
                    <img src="https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?auto=format&fit=crop&q=80&w=500" alt="Mood" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                        <Camera className="text-white opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BentoPersonal;
