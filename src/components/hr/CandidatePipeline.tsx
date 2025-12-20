import React, { useEffect, useState } from 'react';
import { JobApplication, PipelineStage, DEFAULT_PIPELINE_STAGES, JobApplicationStatus, PipelineBackgroundTheme } from '../../types';
import { User, Star, Clock, FileText, MoreVertical, Mail, Calendar, ThumbsUp, ThumbsDown, Eye, Settings, Plus, X } from 'lucide-react';
import { loadPipelineSettings, savePipelineSettings } from '../../services/pipelineSettingsService';
import PipelineSettingsModal from './PipelineSettingsModal';

interface CandidateCardProps {
    application: JobApplication;
    candidateName: string;
    candidateEmail?: string;
    onViewResume: () => void;
    onQuickAction: (action: 'advance' | 'reject' | 'email' | 'schedule') => void;
    onDragStart: (e: React.DragEvent) => void;
    matchScore?: number;
}

const CandidateCard: React.FC<CandidateCardProps> = ({
    application,
    candidateName,
    candidateEmail,
    onViewResume,
    onQuickAction,
    onDragStart,
    matchScore
}) => {
    const [showActions, setShowActions] = React.useState(false);

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        return date.toLocaleDateString();
    };

    const getRatingStars = (rating?: number) => {
        if (!rating) return null;
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={12}
                        className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                    />
                ))}
            </div>
        );
    };

    const getMatchScoreColor = (score?: number) => {
        if (!score) return 'bg-gray-100 text-gray-600';
        if (score >= 80) return 'bg-green-100 text-green-700';
        if (score >= 60) return 'bg-yellow-100 text-yellow-700';
        return 'bg-red-100 text-red-700';
    };

    return (
        <div
            draggable
            onDragStart={onDragStart}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                        {candidateName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                        <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate max-w-[120px]">
                            {candidateName}
                        </h4>
                        {candidateEmail && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
                                {candidateEmail}
                            </p>
                        )}
                    </div>
                </div>
                <div className="relative">
                    <button
                        onClick={() => setShowActions(!showActions)}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <MoreVertical size={14} className="text-gray-500" />
                    </button>
                    {showActions && (
                        <div className="absolute right-0 top-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10 min-w-[140px]">
                            <button
                                onClick={() => { onViewResume(); setShowActions(false); }}
                                className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                                <Eye size={14} /> View Resume
                            </button>
                            <button
                                onClick={() => { onQuickAction('email'); setShowActions(false); }}
                                className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                                <Mail size={14} /> Send Email
                            </button>
                            <button
                                onClick={() => { onQuickAction('schedule'); setShowActions(false); }}
                                className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                                <Calendar size={14} /> Schedule
                            </button>
                            <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
                            <button
                                onClick={() => { onQuickAction('advance'); setShowActions(false); }}
                                className="w-full text-left px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-2"
                            >
                                <ThumbsUp size={14} /> Advance
                            </button>
                            <button
                                onClick={() => { onQuickAction('reject'); setShowActions(false); }}
                                className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                            >
                                <ThumbsDown size={14} /> Reject
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Match Score & Rating */}
            <div className="flex items-center gap-2 mb-2">
                {matchScore && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getMatchScoreColor(matchScore)}`}>
                        {matchScore}% Match
                    </span>
                )}
                {getRatingStars(application.rating)}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>{formatDate(application.appliedAt)}</span>
                </div>
                <button
                    onClick={onViewResume}
                    className="flex items-center gap-1 text-primary-600 hover:text-primary-700"
                >
                    <FileText size={12} />
                    Resume
                </button>
            </div>
        </div>
    );
};

interface PipelineColumnProps {
    stage: PipelineStage;
    applications: JobApplication[];
    candidateNames: Record<string, string>;
    onViewResume: (app: JobApplication) => void;
    onUpdateStatus: (appId: string, newStatus: JobApplicationStatus) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, stageId: string) => void;
    isDropTarget: boolean;
    transparency: number; // 0-100
    onEditStage?: (stageId: string) => void;
    onRemoveStage?: (stageId: string) => void;
}

const PipelineColumn: React.FC<PipelineColumnProps> = ({
    stage,
    applications,
    candidateNames,
    onViewResume,
    onUpdateStatus,
    onDragOver,
    onDrop,
    isDropTarget,
    transparency,
    onEditStage,
    onRemoveStage
}) => {
    const getStageColor = (color: string) => {
        const colors: Record<string, { bg: string; border: string; text: string; header: string }> = {
            blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', header: 'bg-blue-500' },
            purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', header: 'bg-purple-500' },
            indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', header: 'bg-indigo-500' },
            orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', header: 'bg-orange-500' },
            pink: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', header: 'bg-pink-500' },
            emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', header: 'bg-emerald-500' },
            green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', header: 'bg-green-500' },
            red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', header: 'bg-red-500' },
        };
        return colors[color] || colors.blue;
    };

    const colorScheme = getStageColor(stage.color);

    const handleQuickAction = (app: JobApplication, action: 'advance' | 'reject' | 'email' | 'schedule') => {
        if (action === 'advance') {
            const nextStage = DEFAULT_PIPELINE_STAGES.find(s => s.order === stage.order + 1);
            if (nextStage) {
                onUpdateStatus(app.id, nextStage.id as JobApplicationStatus);
            }
        } else if (action === 'reject') {
            onUpdateStatus(app.id, 'rejected');
        }
        // TODO: email and schedule actions
    };

    return (
        <div
            className={`flex-1 min-w-[280px] max-w-[320px] rounded-xl overflow-hidden transition-all flex flex-col ${isDropTarget ? 'ring-2 ring-primary-500 ring-offset-2' : ''
                }`}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, stage.id)}
        >
            {/* Column Header */}
            <div className={`${colorScheme.header} px-4 py-3 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">{stage.name}</h3>
                    <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                        {applications.length}
                    </span>
                </div>
            </div>

            {/* Cards Container - fills remaining height */}
            <div
                className={`${colorScheme.bg} dark:bg-gray-900 p-3 flex-1 overflow-y-auto space-y-3`}
                style={{
                    backgroundColor: transparency > 0 ? `rgba(255, 255, 255, ${1 - (transparency / 100)})` : undefined,
                    backdropFilter: transparency > 20 ? 'blur(10px)' : undefined
                }}
            >
                {applications.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 dark:text-gray-600">
                        <User size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No candidates</p>
                    </div>
                ) : (
                    applications.map((app) => (
                        <CandidateCard
                            key={app.id}
                            application={app}
                            candidateName={candidateNames[app.applicantUserId] || 'Unknown'}
                            onViewResume={() => onViewResume(app)}
                            onQuickAction={(action) => handleQuickAction(app, action)}
                            onDragStart={(e) => {
                                e.dataTransfer.setData('application/json', JSON.stringify({ appId: app.id, fromStage: stage.id }));
                            }}
                            matchScore={app.matchAnalysis?.matchPercentage}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

interface CandidatePipelineProps {
    applications: JobApplication[];
    candidateNames: Record<string, string>;
    onViewResume: (app: JobApplication) => void;
    onUpdateStatus: (appId: string, newStatus: JobApplicationStatus) => void;
    userId: string; // NEW: For loading/saving settings
}

const CandidatePipeline: React.FC<CandidatePipelineProps> = ({
    applications,
    candidateNames,
    onViewResume,
    onUpdateStatus,
    userId
}) => {
    const [dropTargetStage, setDropTargetStage] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [backgroundTheme, setBackgroundTheme] = useState<PipelineBackgroundTheme>('none');
    const [customStages, setCustomStages] = useState<PipelineStage[]>(DEFAULT_PIPELINE_STAGES);
    const [columnTransparency, setColumnTransparency] = useState(0); // NEW
    const [customBackgroundUrl, setCustomBackgroundUrl] = useState<string | undefined>(); // NEW

    // Load settings on mount
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const settings = await loadPipelineSettings(userId);
                if (settings) {
                    if (settings.backgroundTheme) {
                        setBackgroundTheme(settings.backgroundTheme);
                    }
                    if (settings.customStages && settings.customStages.length > 0) {
                        setCustomStages(settings.customStages);
                    }
                    if (settings.customBackgroundUrl) {
                        setCustomBackgroundUrl(settings.customBackgroundUrl);
                    }
                    // Load transparency or default to 0
                    setColumnTransparency(settings.columnTransparency ?? 0);
                }
            } catch (error) {
                console.error('Failed to load pipeline settings:', error);
            }
        };

        if (userId) {
            loadSettings();
        }
    }, [userId]);

    // Migration map for legacy status values
    const migrateStatus = (status: string): string => {
        const legacyMap: Record<string, string> = {
            'submitted': 'new',
            'reviewing': 'screening',
            'shortlisted': 'phone_screen',
            'interviewing': 'interview',
            'accepted': 'hired',
        };
        return legacyMap[status] || status;
    };

    // Group applications by status
    const applicationsByStage = React.useMemo(() => {
        const grouped: Record<string, JobApplication[]> = {};
        customStages.forEach(stage => {
            grouped[stage.id] = [];
        });
        applications.forEach(app => {
            const status = migrateStatus(app.status || 'new');
            if (grouped[status]) {
                grouped[status].push(app);
            } else {
                // Fallback to 'new' if status doesn't match any stage
                grouped['new']?.push(app);
            }
        });
        return grouped;
    }, [applications, customStages]);

    const handleDragOver = (e: React.DragEvent, stageId: string) => {
        e.preventDefault();
        setDropTargetStage(stageId);
    };

    const handleDragLeave = () => {
        setDropTargetStage(null);
    };

    const handleDrop = (e: React.DragEvent, targetStageId: string) => {
        e.preventDefault();
        setDropTargetStage(null);

        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            const { appId, fromStage } = data;

            if (fromStage !== targetStageId) {
                onUpdateStatus(appId, targetStageId as JobApplicationStatus);
            }
        } catch (error) {
            console.error('Failed to process drop:', error);
        }
    };

    const handleBackgroundChange = async (theme: PipelineBackgroundTheme) => {
        setBackgroundTheme(theme);

        // Auto-adjust transparency when background is selected
        if (theme !== 'none' && columnTransparency === 0) {
            setColumnTransparency(70); // Auto-set to 70% for backgrounds
            try {
                await savePipelineSettings(userId, { backgroundTheme: theme, columnTransparency: 70 });
            } catch (error) {
                console.error('Failed to save settings:', error);
            }
        } else {
            try {
                await savePipelineSettings(userId, { backgroundTheme: theme });
            } catch (error) {
                console.error('Failed to save background theme:', error);
            }
        }
    };

    const handleStagesChange = async (newStages: PipelineStage[]) => {
        setCustomStages(newStages);
        try {
            await savePipelineSettings(userId, { customStages: newStages });
        } catch (error) {
            console.error('Failed to save custom stages:', error);
        }
    };

    const handleTransparencyChange = async (transparency: number) => {
        setColumnTransparency(transparency);
        try {
            await savePipelineSettings(userId, { columnTransparency: transparency });
        } catch (error) {
            console.error('Failed to save transparency:', error);
        }
    };

    const handleCustomBackgroundChange = async (url: string | null) => {
        setCustomBackgroundUrl(url || undefined);
        try {
            await savePipelineSettings(userId, { customBackgroundUrl: url || undefined });
        } catch (error) {
            console.error('Failed to save custom background:', error);
        }
    };

    const getBackgroundStyle = (theme: PipelineBackgroundTheme, customUrl?: string) => {
        if (theme === 'none') return {};

        let bgImage = '';
        if (theme === 'custom' && customUrl) {
            bgImage = customUrl;
        } else if (theme !== 'custom') {
            bgImage = `/backgrounds/pipeline_bg_${theme}.png`;
        } else {
            return {};
        }

        return {
            backgroundImage: `url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
        };
    };

    // Filter out terminal stages if empty (keep only active pipeline)
    const activeStages = customStages.filter(stage =>
        !stage.isTerminal || applicationsByStage[stage.id]?.length > 0
    );

    return (
        <>
            {/* Settings Button */}
            <div className="flex justify-end mb-4">
                <button
                    onClick={() => setShowSettings(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                >
                    <Settings size={18} />
                    <span className="font-medium">Pipeline Settings</span>
                </button>
            </div>

            {/* Pipeline Container */}
            <div
                className="flex gap-4 overflow-x-auto pb-4 px-2 h-full min-h-[calc(100vh-300px)] rounded-lg transition-all duration-300"
                style={getBackgroundStyle(backgroundTheme, customBackgroundUrl)}
                onDragLeave={handleDragLeave}
            >
                {activeStages.map((stage) => (
                    <PipelineColumn
                        key={stage.id}
                        stage={stage}
                        applications={applicationsByStage[stage.id] || []}
                        candidateNames={candidateNames}
                        onViewResume={onViewResume}
                        onUpdateStatus={onUpdateStatus}
                        onDragOver={(e) => handleDragOver(e, stage.id)}
                        onDrop={handleDrop}
                        isDropTarget={dropTargetStage === stage.id}
                        transparency={columnTransparency}
                    />
                ))}
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <PipelineSettingsModal
                    currentBackground={backgroundTheme}
                    currentStages={customStages}
                    currentTransparency={columnTransparency}
                    customBackgroundUrl={customBackgroundUrl}
                    userId={userId}
                    onBackgroundChange={handleBackgroundChange}
                    onStagesChange={handleStagesChange}
                    onTransparencyChange={handleTransparencyChange}
                    onCustomBackgroundChange={handleCustomBackgroundChange}
                    onClose={() => setShowSettings(false)}
                />
            )}
        </>
    );
};

export default CandidatePipeline;
