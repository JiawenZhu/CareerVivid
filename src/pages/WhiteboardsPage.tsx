import React from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Plus, PenTool } from 'lucide-react';
import { useWhiteboards } from '../hooks/useWhiteboards';
import { useNavigation } from '../contexts/NavigationContext';
import WhiteboardCard from '../components/Dashboard/WhiteboardCard';
import { navigate } from '../utils/navigation';
import AppLayout from '../components/Layout/AppLayout';

const WhiteboardsPage: React.FC = () => {
    const { t } = useTranslation();
    const { navPosition } = useNavigation();
    const { whiteboards, deleteWhiteboard, duplicateWhiteboard, updateWhiteboard, createWhiteboard } = useWhiteboards();

    const handleCreateWhiteboard = async () => {
        const id = await createWhiteboard();
        navigate(`/whiteboard/${id}`);
    };

    return (
        <AppLayout>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 relative text-left">
                {/* Dashboard Link */}
                <div className={`absolute top-6 right-6 z-20 ${navPosition === 'side' ? 'md:hidden' : ''}`}>
                    <a
                        href="/"
                        className="flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold py-2 px-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <LayoutDashboard size={18} />
                        <span className="hidden sm:inline">Dashboard</span>
                    </a>
                </div>

                {/* Top Header Section */}
                <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 pt-8 pb-12 mb-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                <PenTool className="text-primary-600" size={32} />
                                My Whiteboards
                            </h1>
                            <button
                                onClick={handleCreateWhiteboard}
                                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 font-medium"
                            >
                                <Plus size={20} /> <span className="hidden sm:inline">New Whiteboard</span>
                            </button>
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
                                        onDragStart={(e) => e.preventDefault()}
                                    />
                                ))
                            ) : (
                                <div className="col-span-full py-12 text-center bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center">
                                    <p className="text-gray-500 dark:text-gray-400 mb-4">No whiteboards created yet.</p>
                                    <button
                                        onClick={handleCreateWhiteboard}
                                        className="bg-primary-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-primary-700 transition"
                                    >
                                        + Create your first Whiteboard
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default WhiteboardsPage;
