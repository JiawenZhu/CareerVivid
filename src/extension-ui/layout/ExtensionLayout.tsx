import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import BottomNav from '../components/BottomNav';
import ExtensionLogin from '../pages/ExtensionLogin';
import ExtensionHome from '../pages/ExtensionHome';
import ExtensionResumes from '../pages/ExtensionResumes';
import ExtensionTracker from '../pages/ExtensionTracker';
import ExtensionProfile from '../pages/ExtensionProfile';

const ExtensionLayout: React.FC = () => {
    const { currentUser } = useAuth();
    const { theme } = useTheme();

    // Internal tab state for extension navigation
    const [activeTab, setActiveTab] = useState('home');

    // If not authenticated, show simplified Login screen
    if (!currentUser) {
        return (
            <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
                <div className="bg-white dark:bg-gray-950 min-h-screen text-gray-900 dark:text-gray-100">
                    <ExtensionLogin />
                </div>
            </div>
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'home': return <ExtensionHome />;
            case 'resumes': return <ExtensionResumes />;
            case 'tracker': return <ExtensionTracker />;
            case 'profile': return <ExtensionProfile />;
            default: return <ExtensionHome />;
        }
    };

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
            <div className="bg-gray-50 dark:bg-gray-950 min-h-screen text-gray-900 dark:text-gray-100 pb-16">
                {renderContent()}
                <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
        </div>
    );
};

export default ExtensionLayout;
