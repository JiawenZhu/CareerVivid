import React, { useState } from 'react';
import { Sparkles, Terminal, Image, Briefcase } from 'lucide-react';
import { TEMPLATE_METADATA, TemplateMetadata } from '../../features/portfolio/templates/metadata';

interface DashboardProps {
    onGenerate: (prompt: string) => void;
    isGenerating: boolean;
}

export const PortfolioDashboard: React.FC<DashboardProps> = ({ onGenerate, isGenerating }) => {
    const [prompt, setPrompt] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('[Dashboard] Form submitted with prompt:', prompt);
        if (prompt.trim()) {
            onGenerate(prompt);
        } else {
            console.warn('[Dashboard] Empty prompt, not generating');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 w-full max-w-5xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12 space-y-4">
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white">
                    Build your <span className="text-blue-500">dream portfolio</span>
                </h1>
                <p className="text-zinc-400 text-lg">
                    Describe your role, and we'll craft the code, copy, and design.
                </p>
            </div>

            {/* The "Magic" Input */}
            <form onSubmit={handleSubmit} className="w-full max-w-2xl relative group z-20">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-500"></div>
                <div className="relative flex items-center bg-[#0E0E10] border border-zinc-800 rounded-xl p-2 shadow-2xl">
                    <Sparkles className={`w-6 h-6 text-blue-500 ml-3 ${isGenerating ? 'animate-spin' : ''}`} />
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g. A senior product designer at Apple with a love for minimalism..."
                        className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-zinc-500 px-4 py-3 text-lg outline-none"
                        disabled={isGenerating}
                    />
                    <button
                        type="submit"
                        disabled={isGenerating || !prompt}
                        className="bg-white text-black hover:bg-zinc-200 disabled:opacity-50 px-6 py-2 rounded-lg font-medium transition-all"
                    >
                        {isGenerating ? 'Building...' : 'Generate'}
                    </button>
                </div>
            </form>

            {/* Template Grid */}
            <div className="mt-16 w-full">
                <h2 className="text-2xl font-bold text-white mb-6">Choose a Starting Point</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.values(TEMPLATE_METADATA).map((template) => (
                        <TemplateCard
                            key={template.id}
                            template={template}
                            onClick={() => onGenerate(`Create a ${template.name.toLowerCase()} portfolio`)}
                        />
                    ))}
                </div>
            </div>

            {/* Pro Callout */}
            <div className="mt-12">
                <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-300 text-sm flex items-center gap-2 transition-colors">
                    <span>Need full code control? Build on Google AI Studio</span>
                    <span className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded">PRO</span>
                </a>
            </div>
        </div>
    );
};

const TemplateCard = ({ template, onClick }: { template: TemplateMetadata; onClick: () => void }) => {
    return (
        <button
            onClick={onClick}
            className="text-left group relative flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden hover:bg-zinc-900 hover:border-zinc-700 transition-all hover:-translate-y-1 hover:shadow-xl"
        >
            <div className="w-full aspect-video bg-zinc-800 overflow-hidden relative">
                {template.thumbnailUrl ? (
                    <img
                        src={template.thumbnailUrl}
                        alt={template.name}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700">
                        No Preview
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                <div className="absolute top-3 right-3">
                    <span className="bg-black/50 backdrop-blur-md border border-white/10 text-xs py-1 px-2 rounded-full text-white/80">
                        {template.category}
                    </span>
                </div>
            </div>

            <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-white font-semibold text-lg mb-2">{template.name}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{template.description}</p>
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center text-blue-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                    Use Template &rarr;
                </div>
            </div>
        </button>
    );
};
