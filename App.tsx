import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import GenerationHub from './pages/GenerationHub';
import InterviewStudio from './pages/InterviewStudio';
import ProfilePage from './pages/ProfilePage';
import ChatBot from './components/ChatBot';
import { ThemeProvider } from './contexts/ThemeContext';
import { useAuth } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import { Loader2 } from 'lucide-react';
import LandingPage from './pages/LandingPage';
import PricingPage from './pages/PricingPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import JobTrackerPage from './pages/JobTrackerPage';
import DemoPage from './pages/DemoPage';

// Returns path from hash, e.g., #/admin/login -> /admin/login
const getPathFromHash = () => {
    const hash = window.location.hash;
    return hash.startsWith('#/') ? hash.substring(1) : '/';
};

// New navigation utility that works with hashes
export const navigate = (path: string) => {
  window.location.hash = path;
};

const App: React.FC = () => {
  const { currentUser, loading, isAdmin, isAdminLoading, isEmailVerified } = useAuth();
  const [path, setPath] = useState(getPathFromHash());

  useEffect(() => {
    const onHashChange = () => {
      setPath(getPathFromHash());
    };
    window.addEventListener('hashchange', onHashChange);
    // Also set initial path in case hash is already there on load
    onHashChange();
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (loading || isAdminLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
        <p className="dark:text-white mt-4">Loading...</p>
      </div>
    );
  }

  // Admin Routing
  if (path.startsWith('/admin')) {
    if (path === '/admin/login') {
      // If user is already a logged-in admin, redirect them to dashboard
      if (currentUser && isAdmin) {
        useEffect(() => navigate('/admin'), []);
        return null;
      }
      const accessDenied = !!currentUser && !isAdmin;
      return <ThemeProvider><AdminLoginPage accessDenied={accessDenied} /></ThemeProvider>;
    }
    
    if (currentUser && isAdmin) {
      if (!isEmailVerified && currentUser.providerData[0]?.providerId === 'password') {
         return <ThemeProvider><VerifyEmailPage /></ThemeProvider>;
      }
      return <ThemeProvider><AdminDashboardPage /></ThemeProvider>;
    } else {
      // If not logged in or not an admin, redirect any other /admin/* route to login
      useEffect(() => navigate('/admin/login'), []);
      return null;
    }
  }

  // User and Public Routing
  let content;
  let showChatbot = false;
  
  if (currentUser) {
     if (!isEmailVerified && currentUser.providerData[0]?.providerId === 'password') {
        content = <VerifyEmailPage />;
     } else {
        showChatbot = true;
        if (path.startsWith('/edit/')) {
          const id = path.split('/')[2];
          content = <Editor resumeId={id} />;
        } else if (path === '/new') {
          content = <GenerationHub />;
        } else if (path === '/interview-studio') {
          content = <InterviewStudio />;
        } else if (path === '/tracker') {
          content = <JobTrackerPage />;
        } else if (path === '/profile') {
          content = <ProfilePage />;
        } else {
          // Default to dashboard for any other path when logged in
          content = <Dashboard />;
        }
    }
  } else {
    // Public routes for logged-out users
    if (path === '/auth') {
      content = <AuthPage />;
    } else if (path === '/pricing') {
      content = <PricingPage />;
    } else if (path === '/demo') {
      content = <DemoPage />;
    } else if (path.startsWith('/edit/guest')) {
      content = <Editor resumeId="guest" />;
    } else {
      // Default to landing page for root and any other path
      content = <LandingPage />;
    }
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-800 dark:text-gray-200 font-sans">
        {content}
        {showChatbot && <ChatBot />}
      </div>
    </ThemeProvider>
  );
};

export default App;