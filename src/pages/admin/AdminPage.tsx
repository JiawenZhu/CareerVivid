import React, { useState } from 'react';
import {
    Shield, User, Users, BarChart, Mail, FileText, MessageSquare, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useUsers, useUsageLogs } from './hooks';
import UserManagement from './components/UserManagement';
import Analytics from './components/Analytics';
import MessagesManagement from './components/MessagesManagement';
import BlogManagement from './components/BlogManagement';
import FeedbackManagement from './components/FeedbackManagement';
import ErrorManagement from './components/ErrorManagement';
import EmailTool from './components/EmailTool';
import PartnerApplicationManagement from './components/PartnerApplicationManagement';
import LandingPageManagement from './components/LandingPageManagement';
import { Layout } from 'lucide-react';

const AdminDashboardPage: React.FC = () => {
    const { logOut } = useAuth();
    const { users, loading: usersLoading } = useUsers();
    const { logs, loading: logsLoading } = useUsageLogs();
    const [currentTab, setCurrentTab] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('tab') || 'feedback';
    });

    const renderTabContent = () => {
        switch (currentTab) {
            case 'users': return <UserManagement users={users} logs={logs} loading={usersLoading || logsLoading} />;
            case 'analytics': return <Analytics />;
            case 'messages': return <MessagesManagement />;
            case 'blog': return <BlogManagement />;
            case 'feedback': return <FeedbackManagement />;
            case 'error_reports': return <ErrorManagement />;
            case 'tools': return <EmailTool />;
            case 'partners': return <PartnerApplicationManagement />;
            case 'landing': return <LandingPageManagement />;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
            <header className="bg-white dark:bg-gray-800 shadow-sm">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Shield className="h-8 w-8 text-primary-500" />
                        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                    </div>
                    <button onClick={logOut} className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-primary-500">Sign Out</button>
                </div>
                <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                    {[
                        { id: 'users', label: 'Users', icon: User },
                        { id: 'analytics', label: 'Analytics', icon: BarChart },
                        { id: 'messages', label: 'Messages', icon: Mail },
                        { id: 'blog', label: 'Blog', icon: FileText },
                        { id: 'feedback', label: 'Feedback', icon: MessageSquare },
                        { id: 'error_reports', label: 'Errors', icon: AlertTriangle },
                        { id: 'tools', label: 'Tools', icon: Mail },
                        { id: 'partners', label: 'Partners', icon: Users },
                        { id: 'landing', label: 'Landing Page', icon: Layout },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setCurrentTab(tab.id);
                                // Update URL without reloading
                                const newUrl = new URL(window.location.href);
                                newUrl.searchParams.set('tab', tab.id);
                                window.history.pushState({}, '', newUrl);
                            }}
                            className={`py-3 px-1 text-sm font-semibold flex items-center gap-2 whitespace-nowrap ${currentTab === tab.id ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'}`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </header>
            <main className="py-10">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {renderTabContent()}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboardPage;