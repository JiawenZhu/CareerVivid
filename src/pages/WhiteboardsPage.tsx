import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Plus, PenTool } from 'lucide-react';
import { useWhiteboards } from '../hooks/useWhiteboards';
import { useNavigation } from '../contexts/NavigationContext';
import WhiteboardCard from '../components/Dashboard/WhiteboardCard';
import { navigate } from '../utils/navigation';
import AppLayout from '../components/Layout/AppLayout';
import ShareWhiteboardModal from '../components/ShareWhiteboardModal';
import { WhiteboardData } from '../types';

const WhiteboardsPage: React.FC = () => {
    const { t } = useTranslation();
    const { navPosition } = useNavigation();
    const { whiteboards, deleteWhiteboard, duplicateWhiteboard, updateWhiteboard, createWhiteboard } = useWhiteboards();
    const [shareModalWhiteboard, setShareModalWhiteboard] = useState<WhiteboardData | null>(null);

    const handleCreateWhiteboard = async () => {
        const id = await createWhiteboard();
        navigate(`/whiteboard/${id}`);
    };

    return (
        <AppLayout>
            <div className="cv-design-page cv-design-grid relative min-h-screen pb-20 text-left">
                {/* Top Header Section */}
                <div className="cv-design-header mb-12 pb-12 pt-8">
                    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center mb-8">
                            <h1 className="cv-design-title flex items-center gap-3 text-3xl">
                                <PenTool className="text-[var(--cv-action-primary)]" size={32} />
                                My Whiteboards
                            </h1>
                            <div className="flex items-center gap-3">
                                <div className={navPosition === 'side' ? 'md:hidden' : ''}>
                                    <button
                                        onClick={() => navigate('/dashboard')}
                                        className="cv-design-button-secondary px-4 py-2 text-sm"
                                    >
                                        <LayoutDashboard size={18} />
                                        <span className="hidden sm:inline">Dashboard</span>
                                    </button>
                                </div>
                                <button
                                    onClick={handleCreateWhiteboard}
                                    className="cv-design-button-primary px-4 py-2 text-sm"
                                >
                                    <Plus size={20} /> <span className="hidden sm:inline">New Whiteboard</span>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {whiteboards.length > 0 ? (
                                whiteboards.map(whiteboard => (
                                    <WhiteboardCard
                                        key={whiteboard.id}
                                        whiteboard={whiteboard}
                                        onDelete={deleteWhiteboard}
                                        onDuplicate={duplicateWhiteboard}
                                        onUpdate={updateWhiteboard}
                                        onShare={(w) => setShareModalWhiteboard(w)}
                                        onDragStart={(e) => e.preventDefault()}
                                    />
                                ))
                            ) : (
                                <div className="cv-design-card col-span-full flex flex-col items-center rounded-xl border-dashed py-12 text-center">
                                    <p className="cv-design-body mb-4">No whiteboards created yet.</p>
                                    <button
                                        onClick={handleCreateWhiteboard}
                                        className="cv-design-button-primary rounded-lg px-6 py-2 text-sm"
                                    >
                                        + Create your first Whiteboard
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {shareModalWhiteboard && (
                <ShareWhiteboardModal
                    isOpen={!!shareModalWhiteboard}
                    onClose={() => setShareModalWhiteboard(null)}
                    whiteboard={shareModalWhiteboard}
                />
            )}
        </AppLayout>
    );
};

export default WhiteboardsPage;
