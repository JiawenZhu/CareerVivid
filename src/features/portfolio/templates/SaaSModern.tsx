import { PortfolioTemplateProps } from '../types/portfolio';
import { Layers, ChevronRight, Zap, Box, TrendingUp, CheckCircle, Smartphone, Globe, Code } from 'lucide-react';
import InlineEdit from '../../../components/InlineEdit';

const SaaSModern: React.FC<PortfolioTemplateProps> = ({ data, onEdit, isMobileView }) => {
    const { hero, projects, timeline, about, techStack } = data;

    // Helper to force mobile styles when in mobile view
    const responsiveClass = (base: string, desktop: string) => {
        return isMobileView ? base : `${base} ${desktop}`;
    };

    return (
        <div className="bg-slate-50 text-slate-800 font-sans min-h-full selection:bg-indigo-100 selection:text-indigo-900">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div
                        onClick={() => onEdit?.('hero.headline')}
                        className="flex items-center gap-2 font-bold text-slate-900 cursor-pointer hover:bg-slate-100 rounded p-1 transition-colors"
                    >
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                            <Layers size={18} />
                        </div>
                        {hero.headline}
                    </div>
                    <div className={`${responsiveClass('hidden', 'md:flex')} items-center gap-8 text-sm font-medium text-slate-500`}>
                        <a href="#features" className="hover:text-slate-900">Expertise</a>
                        <a href="#projects" className="hover:text-slate-900">Projects</a>
                        <a href="#about" className="hover:text-slate-900">About</a>
                    </div>
                    <div>
                        <a href={`mailto:${data.contactEmail}`} className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors">
                            Contact Me
                        </a>
                    </div>
                </div>
            </nav>

            {/* Hero Section - Stripe/Linear Style */}
            <header className="pt-32 pb-32 px-6 overflow-hidden relative">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100 via-slate-50 to-slate-50 -z-10" />

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-indigo-100 text-indigo-600 text-xs font-bold uppercase tracking-wide mb-8 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        Available for new opportunities
                    </div>
                    <h1
                        onClick={() => onEdit?.('hero.headline')}
                        className={`${responsiveClass('text-5xl', 'md:text-6xl')} font-bold tracking-tight text-slate-900 mb-6 bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-transparent pb-2 cursor-pointer hover:opacity-70 transition-opacity`}
                        title="Click to edit headline"
                    >
                        {hero.headline}
                    </h1>
                    <p
                        onClick={() => onEdit?.('hero.subheadline')}
                        className="text-xl md:text-2xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed text-balance cursor-pointer hover:text-indigo-600 transition-colors"
                        title="Click to edit subheadline"
                    >
                        {hero.subheadline}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <div className="px-8 py-4 bg-indigo-600 text-white rounded-full font-semibold shadow-lg shadow-indigo-200 hover:shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2 cursor-pointer group">
                            <InlineEdit
                                value={hero.ctaPrimaryLabel || 'View Work'}
                                fieldId="hero.ctaPrimaryLabel"
                                onFocus={onEdit}
                                isLink={!!hero.ctaPrimaryUrl}
                                tagName="a"
                                href={hero.ctaPrimaryUrl}
                                target="_blank"
                            />
                            <ChevronRight size={18} />
                        </div>
                        <div className="px-8 py-4 bg-white text-slate-700 rounded-full font-semibold shadow-md hover:shadow-lg transition-all border border-slate-100 cursor-pointer">
                            <InlineEdit
                                value={hero.ctaSecondaryLabel || 'About Me'}
                                fieldId="hero.ctaSecondaryLabel"
                                onFocus={onEdit}
                                isLink={!!hero.ctaSecondaryUrl}
                                tagName="a"
                                href={hero.ctaSecondaryUrl}
                                target="_blank"
                            />
                        </div>
                    </div>
                </div>

                {/* Abstract UI Mockup Decoration */}
                <div className={`mt-20 max-w-5xl mx-auto relative ${responsiveClass('hidden', 'md:block')} select-none pointer-events-none`}>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent z-10" />
                    <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-2 aspect-[16/9] rotate-x-12 perspective-1000 transform origin-top opacity-80">
                        <div className="h-full w-full bg-slate-50 rounded border border-slate-100 grid grid-cols-3 gap-4 p-4">
                            <div className="col-span-1 bg-white rounded shadow-sm border border-slate-100 h-full"></div>
                            <div className="col-span-2 grid grid-rows-3 gap-4">
                                <div className="bg-white rounded shadow-sm border border-slate-100 h-full"></div>
                                <div className="bg-white rounded shadow-sm border border-slate-100 h-full row-span-2"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Bento Grid Features / Skills */}
            <section id="features" className="py-24 px-6 max-w-6xl mx-auto">
                <h2 className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-12 text-center">Core Competencies</h2>
                <div className={`grid ${responsiveClass('grid-cols-1', 'md:grid-cols-3')} gap-6 auto-rows-auto min-h-[250px]`}>
                    {/* Card 1: Main Skill */}
                    <div className={`${responsiveClass('', 'md:col-span-2')} bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group min-h-[280px]`}>
                        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-50 rounded-full group-hover:bg-indigo-100 transition-colors" />
                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div className="p-3 bg-indigo-100 rounded-xl w-fit text-indigo-600 mb-4"><Zap /></div>
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                                    <InlineEdit
                                        value={about}
                                        fieldId="about"
                                        onFocus={onEdit}
                                        className="inline"
                                        multiline
                                    />
                                </h3>
                                <p className="text-slate-500 line-clamp-3">Expertise in building scalable web applications using modern technologies like React, Node.js, and TypeScript.</p>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Tech Stack List */}
                    <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-sm text-white overflow-hidden relative min-h-[280px]">
                        <div className="absolute top-0 right-0 p-32 bg-indigo-500/20 blur-3xl rounded-full" />
                        <h3 className="text-lg font-bold mb-6 relative z-10 flex items-center gap-2"><Code size={18} /> Tech Stack</h3>
                        <div className="flex flex-wrap gap-2 relative z-10">
                            {techStack.slice(0, 8).map(skill => (
                                <span key={skill.id} className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium backdrop-blur-sm border border-white/5">
                                    {skill.name}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Card 3: Experience Stat */}
                    <div className="bg-indigo-600 rounded-3xl p-8 shadow-lg text-white flex flex-col justify-center items-center text-center min-h-[200px]">
                        <div className="text-6xl font-bold mb-2 tracking-tighter">{timeline.length}+</div>
                        <div className="text-indigo-200 font-medium">Years of Experience</div>
                    </div>

                    {/* Card 4: Product Strategy */}
                    <div className={`${responsiveClass('', 'md:col-span-2')} bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row items-center gap-8`}>
                        <div className="flex-1 space-y-4">
                            <div className="p-3 bg-purple-100 rounded-xl w-fit text-purple-600"><TrendingUp /></div>
                            <h3 className="text-xl font-bold text-slate-900">Product Strategy</h3>
                            <p className="text-slate-500">Driving growth through data-driven decision making and user-centric design principles.</p>
                        </div>
                        <div className="w-full md:w-48 bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-2 select-none">
                            <div className="h-2 bg-slate-200 rounded w-3/4"></div>
                            <div className="h-2 bg-slate-200 rounded w-1/2"></div>
                            <div className="h-2 bg-purple-200 rounded w-full"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Projects */}
            <section id="projects" className="py-24 px-6 bg-slate-100">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-slate-900 mb-12">Recent Projects</h2>
                    <div className={`grid ${responsiveClass('grid-cols-1', 'md:grid-cols-2')} gap-12`}>
                        {projects.map(project => (
                            <div key={project.id} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300">
                                <div className="aspect-video bg-slate-200 relative overflow-hidden">
                                    {project.thumbnailUrl ? (
                                        <img src={project.thumbnailUrl} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                                            <Box size={48} />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                </div>
                                <div className="p-8">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3
                                            onClick={() => onEdit?.(`projects.${project.id}.title`)}
                                            className="text-2xl font-bold text-slate-900 cursor-pointer hover:text-indigo-600"
                                        >
                                            {project.title}
                                        </h3>
                                        {project.demoUrl && (
                                            <a href={project.demoUrl} target="_blank" className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors" rel="noreferrer">
                                                <Smartphone size={18} className="text-slate-600" />
                                            </a>
                                        )}
                                    </div>
                                    <p
                                        onClick={() => onEdit?.(`projects.${project.id}.description`)}
                                        className="text-slate-600 mb-6 line-clamp-2 cursor-pointer hover:bg-slate-50 p-1 -m-1 rounded"
                                    >
                                        {project.description}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {project.tags?.map(tag => (
                                            <span key={tag} className="px-2 py-1 bg-slate-50 border border-slate-100 text-slate-500 text-xs font-semibold rounded uppercase">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-200 py-12 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                        <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white text-xs">S</div>
                        <span>{hero.headline}</span>
                    </div>
                    <div className="text-sm text-slate-500">
                        © {new Date().getFullYear()} All rights reserved. Built with CareerVivid.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default SaaSModern;
