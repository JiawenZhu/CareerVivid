import React, { useState } from 'react';
import { Smartphone, Monitor, ArrowLeft } from 'lucide-react';
import { PortfolioData } from '../../types/portfolio';

// --- Basic Template Components (In a real app, these would be separate files) ---
const MinimalTemplate = ({ data }: { data: PortfolioData }) => (
    <div className="min-h-full bg-white text-zinc-900 p-8 md:p-20 font-mono">
        <header className="mb-20">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tighter">{data.hero.headline}</h1>
            <p className="text-xl text-zinc-500 max-w-2xl">{data.hero.subheadline}</p>
        </header>
        <section className="mb-16">
            <h2 className="text-sm font-bold uppercase tracking-widest border-b border-black pb-2 mb-6">Selected Work</h2>
            <div className="space-y-12">
                {data.projects.map((p, i) => (
                    <div key={i} className="group cursor-pointer">
                        <h3 className="text-2xl font-bold group-hover:text-blue-600 transition-colors">{p.title}</h3>
                        <p className="text-zinc-600 mt-2">{p.description}</p>
                    </div>
                ))}
            </div>
        </section>
    </div>
);

const VisualTemplate = ({ data }: { data: PortfolioData }) => (
    <div className="min-h-full bg-zinc-950 text-white p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 p-12 bg-zinc-900 rounded-3xl mb-4 flex flex-col justify-center items-center text-center">
                <h1 className="text-5xl font-serif mb-4">{data.hero.headline}</h1>
                <button className="bg-white text-black px-6 py-2 rounded-full mt-4 font-medium hover:scale-105 transition-transform">{data.hero.ctaText}</button>
            </div>
            {data.projects.map((p, i) => (
                <div key={i} className="aspect-square bg-zinc-800 rounded-3xl p-8 hover:bg-zinc-700 transition-colors relative overflow-hidden group">
                    {/* Placeholder for image */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                        <h3 className="text-xl font-bold">{p.title}</h3>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// --- The Main Editor Component ---
interface EditorProps {
    initialData: PortfolioData;
    onBack: () => void;
}

export const PortfolioEditor: React.FC<EditorProps> = ({ initialData, onBack }) => {
    const [data, setData] = useState(initialData);
    const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

    const handleInputChange = (section: keyof PortfolioData, field: string, value: string) => {
        setData(prev => {
            const sectionData = prev[section];
            if (typeof sectionData === 'object' && sectionData !== null) {
                return {
                    ...prev,
                    [section]: { ...(sectionData as any), [field]: value }
                };
            }
            return prev;
        });
    };

    return (
        <div className="fixed inset-0 bg-[#09090b] flex flex-col z-50">
            {/* Top Bar */}
            <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 bg-[#09090b]">
                <button onClick={onBack} className="text-zinc-400 hover:text-white flex items-center gap-2 text-sm">
                    <ArrowLeft className="w-4 h-4" /> Back to Hub
                </button>
                <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                    <button
                        onClick={() => setViewMode('desktop')}
                        className={`p-1.5 rounded ${viewMode === 'desktop' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <Monitor className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('mobile')}
                        className={`p-1.5 rounded ${viewMode === 'mobile' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <Smartphone className="w-4 h-4" />
                    </button>
                </div>
                <button className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-blue-500">
                    Publish
                </button>
            </div>

            {/* Main Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar (Editor) */}
                <div className="w-80 border-r border-zinc-800 overflow-y-auto p-6 space-y-8 bg-[#0c0c0e]">
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-3">Hero Section</label>
                        <div className="space-y-4">
                            <input
                                value={data.hero.headline}
                                onChange={(e) => handleInputChange('hero', 'headline', e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="Headline"
                            />
                            <textarea
                                value={data.hero.subheadline}
                                onChange={(e) => handleInputChange('hero', 'subheadline', e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none h-24 resize-none"
                                placeholder="Subheadline"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-3">Theme</label>
                        <select
                            value={data.theme}
                            onChange={(e) => setData({ ...data, theme: e.target.value as any })}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white outline-none"
                        >
                            <option value="minimal">Minimalist</option>
                            <option value="visual">Visual Grid</option>
                            <option value="corporate">Corporate</option>
                        </select>
                    </div>
                </div>

                {/* Right Preview */}
                <div className="flex-1 bg-zinc-950 flex items-center justify-center p-8 overflow-hidden relative">
                    <div
                        className="absolute inset-0 opacity-20 pointer-events-none"
                        style={{
                            backgroundSize: '40px 40px',
                            backgroundImage: 'radial-gradient(circle, #3f3f46 1px, transparent 1px)'
                        }}
                    />
                    <div
                        className={`transition-all duration-500 ease-in-out bg-white shadow-2xl overflow-hidden ${viewMode === 'mobile' ? 'w-[375px] h-[667px] rounded-3xl border-8 border-zinc-900' : 'w-full h-full rounded-lg border border-zinc-800'
                            }`}
                    >
                        {/* Dynamic Template Renderer */}
                        <div className="w-full h-full overflow-y-auto scrollbar-thin">
                            {data.theme === 'minimal' && <MinimalTemplate data={data} />}
                            {data.theme === 'visual' && <VisualTemplate data={data} />}
                            {data.theme === 'corporate' && <MinimalTemplate data={data} />} {/* Fallback for now */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
