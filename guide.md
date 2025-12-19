Study this project. /Users/jiawenzhu/Developer/JasTalk AI Interview Agent/bring-any-idea-to-life

Do the following
Here is the complete transformation plan and the code to turn the bring-any-idea-to-life project into your Portfolio Creator.

I have restructured the application to move from "Generating Random Apps" to "Generating Structured Portfolios" while keeping the cool animations and high-tech feel.

1. Define the Data Structure
First, we need a consistent shape for the portfolio data so the Editor and Templates can talk to each other.

Create: src/types/portfolio.ts

TypeScript

export interface Project {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  demoUrl?: string;
  repoUrl?: string;
  tags: string[];
}

export interface PortfolioData {
  theme: 'minimal' | 'visual' | 'corporate';
  hero: {
    headline: string;
    subheadline: string;
    ctaText: string;
  };
  about: {
    bio: string;
    skills: string[];
  };
  projects: Project[];
  socials: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    email?: string;
  };
}
2. Update the AI Engine (The Brain)
We need Gemini to return strict JSON now, not raw HTML.

Update: src/services/gemini.ts

TypeScript

import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL = 'gemini-3-flash'; // Fast and good at JSON
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are an expert Portfolio Architect. 
Your goal is to take a user's prompt (e.g., "I am a senior designer") and generate a structured JSON object for their personal website.

RULES:
1. Return ONLY valid JSON. No markdown formatting.
2. Choose a 'theme' based on the role ('minimal' for devs, 'visual' for designers, 'corporate' for execs).
3. Create realistic, professional placeholder content.
4. For images, use high-quality Unsplash source URLs (e.g. 'https://source.unsplash.com/random/800x600?tech').

JSON SCHEMA:
{
  "theme": "minimal" | "visual" | "corporate",
  "hero": { "headline": string, "subheadline": string, "ctaText": string },
  "about": { "bio": string, "skills": string[] },
  "projects": [ { "id": string, "title": string, "description": string, "imageUrl": string, "tags": string[] } ],
  "socials": { "github": string, "linkedin": string, "email": string }
}
`;

export async function generatePortfolio(prompt: string): Promise<any> {
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: { parts: [{ text: prompt }] },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json"
      },
    });

    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
}
3. The "IDX-Style" Dashboard
This replaces the old InputArea with a modern, card-based dashboard.

Create: src/components/PortfolioDashboard.tsx

TypeScript

import React, { useState } from 'react';
import { SparklesIcon, CommandLineIcon, PhotoIcon, BriefcaseIcon } from '@heroicons/react/24/outline';

interface DashboardProps {
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
}

export const PortfolioDashboard: React.FC<DashboardProps> = ({ onGenerate, isGenerating }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) onGenerate(prompt);
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
          <SparklesIcon className={`w-6 h-6 text-blue-500 ml-3 ${isGenerating ? 'animate-spin' : ''}`} />
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. A senior product designer at Apple with a love for minimalism..."
            className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-zinc-500 px-4 py-3 text-lg"
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

      {/* Template Grid (IDX Style) */}
      <div className="mt-16 w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        <TemplateCard 
          icon={CommandLineIcon} 
          title="The Minimalist" 
          desc="Clean, typography-focused layout for developers." 
          color="text-emerald-400"
          onClick={() => onGenerate("Create a minimal developer portfolio")}
        />
        <TemplateCard 
          icon={PhotoIcon} 
          title="The Visual" 
          desc="Immersive grid layout for designers and creatives." 
          color="text-purple-400"
          onClick={() => onGenerate("Create a visual portfolio for a designer")}
        />
        <TemplateCard 
          icon={BriefcaseIcon} 
          title="The Corporate" 
          desc="Structured and professional for executives." 
          color="text-blue-400"
          onClick={() => onGenerate("Create a professional executive portfolio")}
        />
      </div>

      {/* Pro Callout */}
      <div className="mt-12">
        <a href="https://aistudio.google.com/" target="_blank" className="text-zinc-500 hover:text-zinc-300 text-sm flex items-center gap-2 transition-colors">
          <span>Need full code control? Build on Google AI Studio</span>
          <span className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded">PRO</span>
        </a>
      </div>
    </div>
  );
};

const TemplateCard = ({ icon: Icon, title, desc, color, onClick }: any) => (
  <button onClick={onClick} className="text-left p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 transition-all group">
    <div className={`w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center mb-4 ${color} group-hover:scale-110 transition-transform`}>
      <Icon className="w-5 h-5" />
    </div>
    <h3 className="text-white font-semibold mb-1">{title}</h3>
    <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
  </button>
);
4. The Editor & Templates (The Engine)
This creates the "Split View" editor and a basic template renderer.

Create: src/components/PortfolioEditor.tsx

TypeScript

import React, { useState } from 'react';
import { DevicePhoneMobileIcon, ComputerDesktopIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { PortfolioData } from '../types/portfolio';

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
    setData(prev => ({
      ...prev,
      [section]: { ...prev[section as keyof object], [field]: value }
    }));
  };

  return (
    <div className="fixed inset-0 bg-[#09090b] flex flex-col z-50">
      {/* Top Bar */}
      <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 bg-[#09090b]">
        <button onClick={onBack} className="text-zinc-400 hover:text-white flex items-center gap-2 text-sm">
          <ArrowLeftIcon className="w-4 h-4" /> Back to Hub
        </button>
        <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
          <button 
            onClick={() => setViewMode('desktop')}
            className={`p-1.5 rounded ${viewMode === 'desktop' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <ComputerDesktopIcon className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode('mobile')}
            className={`p-1.5 rounded ${viewMode === 'mobile' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <DevicePhoneMobileIcon className="w-4 h-4" />
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
              onChange={(e) => setData({...data, theme: e.target.value as any})}
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
          <div className="absolute inset-0 bg-dot-grid opacity-20 pointer-events-none" />
          <div 
            className={`transition-all duration-500 ease-in-out bg-white shadow-2xl overflow-hidden ${
              viewMode === 'mobile' ? 'w-[375px] h-[667px] rounded-3xl border-8 border-zinc-900' : 'w-full h-full rounded-lg border border-zinc-800'
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
5. Wire it all up in App.tsx
Update: src/App.tsx

TypeScript

import React, { useState } from 'react';
import { PortfolioDashboard } from './components/PortfolioDashboard';
import { PortfolioEditor } from './components/PortfolioEditor';
import { generatePortfolio } from './services/gemini';
import { PortfolioData } from './types/portfolio';

const App: React.FC = () => {
  const [activePortfolio, setActivePortfolio] = useState<PortfolioData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (prompt: string) => {
    setIsGenerating(true);
    try {
      const data = await generatePortfolio(prompt);
      setActivePortfolio(data);
    } catch (error) {
      console.error(error);
      alert("AI Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-[100dvh] bg-[#09090b] text-white overflow-hidden font-sans">
      {activePortfolio ? (
        <PortfolioEditor 
          initialData={activePortfolio} 
          onBack={() => setActivePortfolio(null)} 
        />
      ) : (
        <PortfolioDashboard 
          onGenerate={handleGenerate} 
          isGenerating={isGenerating} 
        />
      )}
    </div>
  );
};

export default App;