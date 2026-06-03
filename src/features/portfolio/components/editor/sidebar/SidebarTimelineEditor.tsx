import React from 'react';
import { Trash2 } from 'lucide-react';
import MonthYearPicker from '../../../../../components/MonthYearPicker';
import { PortfolioData } from '../../../types/portfolio';

interface SidebarTimelineEditorProps {
    portfolioData: PortfolioData;
    onUpdate: (data: Partial<PortfolioData>) => void;
    themeClasses: any;
    editorTheme: 'light' | 'dark';
}

const SidebarTimelineEditor: React.FC<SidebarTimelineEditorProps> = ({
    portfolioData,
    onUpdate,
    themeClasses,
    editorTheme
}) => {
    const handleAddTimeline = () => {
        const newJob = {
            id: Date.now().toString(),
            jobTitle: 'Job Title',
            employer: 'Company Name',
            city: '',
            startDate: '2023-01',
            endDate: 'Present',
            description: 'Description of your role...',
            achievements: []
        };
        onUpdate({ timeline: [...(portfolioData.timeline || []), newJob] });
    };

    return (
        <div className="space-y-4">
            {portfolioData.timeline.map((job, idx) => (
                <div key={job.id} className={`p-4 rounded-lg border relative group/card ${themeClasses.cardBg}`}>
                    <div className="absolute top-4 right-4 z-10 opacity-0 group-hover/card:opacity-100 transition-opacity">
                        <button
                            onClick={() => {
                                const newTimeline = portfolioData.timeline.filter((_, i) => i !== idx);
                                onUpdate({ timeline: newTimeline });
                            }}
                            className="p-1.5 bg-black/50 text-gray-400 hover:text-red-400 hover:bg-black/80 rounded-md transition-all"
                            title="Delete Entry"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                    <div className="mb-2">
                        <input
                            id={`timeline.${idx}.jobTitle`}
                            className={`bg-transparent font-bold w-full outline-none ${themeClasses.textMain}`}
                            value={job.jobTitle}
                            onChange={(e) => {
                                const newTimeline = [...portfolioData.timeline];
                                newTimeline[idx].jobTitle = e.target.value;
                                onUpdate({ timeline: newTimeline });
                            }}
                            placeholder="Job Title"
                        />
                        <input
                            id={`timeline.${idx}.employer`}
                            className="bg-transparent text-sm text-indigo-400 w-full outline-none"
                            value={job.employer}
                            onChange={(e) => {
                                const newTimeline = [...portfolioData.timeline];
                                newTimeline[idx].employer = e.target.value;
                                onUpdate({ timeline: newTimeline });
                            }}
                            placeholder="Company"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-2 mb-2">
                        <MonthYearPicker
                            id={`timeline.${idx}.startDate`}
                            label="Start Date"
                            value={job.startDate}
                            onChange={(val) => {
                                const newTimeline = [...portfolioData.timeline];
                                newTimeline[idx].startDate = val;
                                onUpdate({ timeline: newTimeline });
                            }}
                        />
                        <MonthYearPicker
                            id={`timeline.${idx}.endDate`}
                            label="End Date"
                            value={job.endDate}
                            onChange={(val) => {
                                const newTimeline = [...portfolioData.timeline];
                                newTimeline[idx].endDate = val;
                                onUpdate({ timeline: newTimeline });
                            }}
                        />
                    </div>
                    <textarea
                        id={`timeline.${idx}.description`}
                        className={`bg-transparent text-sm w-full outline-none resize-none p-2 rounded ${editorTheme === 'dark' ? 'text-gray-500 bg-black/10' : 'text-gray-600 bg-gray-100'}`}
                        rows={2}
                        value={job.description}
                        onChange={(e) => {
                            const newTimeline = [...portfolioData.timeline];
                            newTimeline[idx].description = e.target.value;
                            onUpdate({ timeline: newTimeline });
                        }}
                    />
                </div>
            ))}
            <button
                onClick={handleAddTimeline}
                className="w-full py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg text-sm font-medium transition-colors"
            >
                + Add Timeline Entry
            </button>
            <div className="mt-4 pt-4 border-t border-white/5">
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Section Label</label>
                <input
                    id="sectionLabels.timeline"
                    type="text"
                    className={`w-full rounded-lg px-4 py-2 text-sm outline-none transition-colors ${themeClasses.inputBg}`}
                    value={portfolioData.sectionLabels?.timeline || 'My Journey'}
                    onChange={(e) => onUpdate({
                        sectionLabels: { ...portfolioData.sectionLabels, timeline: e.target.value }
                    })}
                />
            </div>
        </div>
    );
};

export default SidebarTimelineEditor;
