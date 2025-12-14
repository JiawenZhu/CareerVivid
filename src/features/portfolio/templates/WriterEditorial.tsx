import React from 'react';
import { PortfolioTemplateProps } from '../types/portfolio';
import { BookOpen, PenTool, Twitter, Mail, ChevronRight, Bookmark } from 'lucide-react';

const WriterEditorial: React.FC<PortfolioTemplateProps> = ({ data, onEdit, isMobileView }) => {
    const { hero, projects, about, timeline } = data;

    const responsiveClass = (base: string, desktop: string) => {
        return isMobileView ? base : `${base} ${desktop}`;
    };

    return (
        <div className="bg-[#fcfbf9] text-[#1a1a1a] font-serif min-h-full selection:bg-yellow-200 selection:text-black border-t-8 border-black">
            {/* Minimal Header */}
            <div className="max-w-3xl mx-auto px-6 py-12 flex flex-wrap justify-between items-center border-b border-gray-200 gap-4">
                <div
                    onClick={() => onEdit?.('hero.headline')}
                    className="font-bold text-xl tracking-tight font-sans uppercase cursor-pointer hover:bg-yellow-100/50 hover:text-black transition-colors rounded px-2 -mx-2"
                    title="Click to edit headline"
                >
                    {hero.headline}
                </div>
                <div className="flex gap-6 text-sm font-sans font-medium text-gray-500 overflow-x-auto">
                    <a href="#about" className="hover:text-black transition-colors">About</a>
                    <a href="#writing" className="hover:text-black transition-colors">Writing</a>
                    <a href="#contact" className="hover:text-black transition-colors">Contact</a>
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
                    {about.slice(0, 150)}{about.length > 150 ? '...' : ''}
                </h1>
                <div className="flex items-center gap-4">
                    <a href={`mailto:${data.contactEmail}`} className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-sans font-medium hover:bg-gray-800 transition-colors">
                        <Mail size={16} /> Subscribe / Contact
                    </a>
                    <div className="flex gap-4 px-4 border-l border-gray-300">
                        <Twitter className="w-5 h-5 text-gray-400 hover:text-black cursor-pointer transition-colors" />
                    </div>
                </div>
            </header>

            {/* Selected Writings (Projects list) */}
            <section id="writing" className="bg-white py-24 border-y border-gray-200">
                <div className="max-w-3xl mx-auto px-6">
                    <div className="flex items-baseline gap-4 mb-16">
                        <span className="w-4 h-4 bg-black rounded-full block"></span>
                        <h2 className="text-sm font-bold font-sans uppercase tracking-widest">Selected Publications</h2>
                    </div>

                    <div className="space-y-20">
                        {projects.map(project => (
                            <article key={project.id} className="group cursor-pointer">
                                <div className={`flex ${responsiveClass('flex-col', 'md:flex-row')} gap-12 items-start`}>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 text-xs font-sans font-bold uppercase tracking-wider text-gray-500 mb-4">
                                            <span>{project.tags[0] || 'Essay'}</span>
                                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                            <span>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                                        </div>
                                        <h3 className="text-2xl md:text-3xl font-bold mb-4 group-hover:underline decoration-2 underline-offset-4 decoration-gray-300 leading-tight">
                                            {project.title}
                                        </h3>
                                        <p className="text-base text-gray-600 leading-relaxed font-serif">
                                            {project.description}
                                        </p>
                                        <div className="mt-6 flex items-center gap-2 text-sm font-sans font-bold text-black opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                                            Read Story <ChevronRight size={14} />
                                        </div>
                                    </div>
                                    {project.thumbnailUrl && (
                                        <div className={`w-full ${responsiveClass('', 'md:w-56')} aspect-[4/5] bg-gray-100 flex-shrink-0 grayscale group-hover:grayscale-0 transition-all duration-500 shadow-sm group-hover:shadow-md`}>
                                            <img src={project.thumbnailUrl} alt="" className="w-full h-full object-cover mix-blend-multiply" />
                                        </div>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* Experience as a clean list */}
            <section className="py-24 max-w-3xl mx-auto px-6">
                <h2 className="text-sm font-bold font-sans uppercase tracking-widest mb-12 border-b border-black pb-4 inline-block">Experience</h2>
                <ul className="space-y-8">
                    {timeline.map(job => (
                        <li key={job.id} className={`grid ${responsiveClass('grid-cols-1', 'md:grid-cols-[1fr_3fr]')} gap-4`}>
                            <div className="text-sm font-sans font-medium text-gray-500">{job.startDate} — {job.endDate}</div>
                            <div>
                                <h4 className="font-bold text-lg mb-1">{job.jobTitle}</h4>
                                <div className="text-gray-600 italic font-serif mb-2">{job.employer}</div>
                                <p className="text-gray-500 text-sm leading-relaxed">{job.description}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </section>

            <footer id="contact" className="bg-[#1a1a1a] text-white py-20 px-6 text-center">
                <div className="max-w-2xl mx-auto">
                    <BookOpen size={48} className="mx-auto mb-8 text-gray-500" />
                    <h2 className="text-4xl font-serif font-bold mb-6">Subscribe to my newsletter</h2>
                    <p className="text-gray-400 mb-8 font-serif text-lg">Join 10,000+ readers getting insights on technology and culture.</p>

                    <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                        <input type="email" placeholder="Email address" className="flex-1 px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors" />
                        <button className="px-6 py-3 bg-white text-black font-sans font-bold hover:bg-gray-200 transition-colors">
                            Subscribe
                        </button>
                    </div>

                    <div className="mt-16 text-xs font-sans text-gray-600 uppercase tracking-widest">
                        © {new Date().getFullYear()} {hero.headline}. New York, NY.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default WriterEditorial;
