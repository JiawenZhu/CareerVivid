import React, { useEffect, useState } from 'react';
import { JobApplication, PipelineStage, DEFAULT_PIPELINE_STAGES, JobApplicationStatus, PipelineBackgroundTheme } from '../../types';
import { Settings } from 'lucide-react';
import { loadPipelineSettings, savePipelineSettings } from '../../services/pipelineSettingsService';
import PipelineSettingsModal from './PipelineSettingsModal';
import CandidatePipelineColumn from './CandidatePipelineColumn';

interface CandidatePipelineProps {
    applications: JobApplication[];
    candidateNames: Record<string, string>;
    candidateEmails: Record<string, string>; // NEW
    onViewResume: (app: JobApplication) => void;
    onUpdateStatus: (appId: string, newStatus: JobApplicationStatus) => void;
    userId: string;
}

const CandidatePipeline: React.FC<CandidatePipelineProps> = ({
    applications,
    candidateNames,
    candidateEmails,
    onViewResume,
    onUpdateStatus,
    userId
}) => {
    const [dropTargetStage, setDropTargetStage] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [backgroundTheme, setBackgroundTheme] = useState<PipelineBackgroundTheme>('none');
    const [customStages, setCustomStages] = useState<PipelineStage[]>(DEFAULT_PIPELINE_STAGES);
    const [columnTransparency, setColumnTransparency] = useState(0);
    const [customBackgroundUrl, setCustomBackgroundUrl] = useState<string | undefined>();

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
                    <CandidatePipelineColumn
                        key={stage.id}
                        stage={stage}
                        applications={applicationsByStage[stage.id] || []}
                        candidateNames={candidateNames}
                        candidateEmails={candidateEmails}
                        onViewResume={onViewResume}
                        onUpdateStatus={onUpdateStatus}
                        onDragOver={(e) => handleDragOver(e, stage.id)}
                        onDrop={handleDrop}
                        isDropTarget={dropTargetStage === stage.id}
                        transparency={columnTransparency}
                        onEmailAction={(app) => {
                            // Direct mailto: link with template
                            const candidateName = candidateNames[app.applicantUserId] || 'Candidate';
                            const candidateEmail = candidateEmails[app.applicantUserId];

                            if (!candidateEmail) {
                                alert('No email found for this candidate');
                                return;
                            }

                            const subject = encodeURIComponent('Interview Invitation');
                            const body = encodeURIComponent(
                                `Dear ${candidateName},\n\n` +
                                `We are pleased to invite you for an interview for the position you applied for.\n\n` +
                                `We look forward to speaking with you.\n\n` +
                                `Best regards`
                            );

                            // User requested "same thing as google calendar" - using Gmail web link
                            // This is more reliable than mailto: which depends on local client config
                            const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1` +
                                `&to=${encodeURIComponent(candidateEmail)}` +
                                `&su=${subject}` +
                                `&body=${body}`;

                            console.log('Opening Gmail web client:', gmailUrl);

                            // Open in new tab like the calendar integration
                            window.open(gmailUrl, '_blank');
                        }}
                        onScheduleAction={(app) => {
                            // Direct Google Calendar link
                            const candidateName = candidateNames[app.applicantUserId] || 'Candidate';
                            const candidateEmail = candidateEmails[app.applicantUserId];

                            if (!candidateEmail) {
                                alert('No email found for this candidate');
                                return;
                            }

                            // Format: YYYYMMDDTHHMMSS
                            const now = new Date();
                            const tomorrow = new Date(now);
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            tomorrow.setHours(10, 0, 0, 0); // 10 AM tomorrow

                            const endTime = new Date(tomorrow);
                            endTime.setHours(11, 0, 0, 0); // 11 AM (1 hour)

                            const formatDate = (date: Date) => {
                                return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
                            };

                            const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE` +
                                `&text=${encodeURIComponent(`Interview with ${candidateName}`)}` +
                                `&dates=${formatDate(tomorrow)}/${formatDate(endTime)}` +
                                `&details=${encodeURIComponent(`Interview scheduled via CareerVivid`)}` +
                                `&add=${encodeURIComponent(candidateEmail)}`;

                            window.open(calendarUrl, '_blank');
                        }}
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
