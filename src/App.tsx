
import React, { useState, useEffect, Suspense } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { useAuth } from './contexts/AuthContext';
import { Loader2 } from 'lucide-react';

// Lazy load pages to drastically reduce initial JavaScript payload
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Editor = React.lazy(() => import('./pages/Editor'));
const GenerationHub = React.lazy(() => import('./pages/GenerationHub'));
const InterviewStudio = React.lazy(() => import('./pages/InterviewStudio'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const ChatBot = React.lazy(() => import('./components/ChatBot'));
const AuthPage = React.lazy(() => import('./pages/AuthPage'));
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const PricingPage = React.lazy(() => import('./pages/PricingPage'));
const AdminLoginPage = React.lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminDashboardPage = React.lazy(() => import('./pages/admin/AdminPage'));
const VerifyEmailPage = React.lazy(() => import('./pages/VerifyEmailPage'));
const JobTrackerPage = React.lazy(() => import('./pages/JobTrackerPage'));
const DemoPage = React.lazy(() => import('./pages/DemoPage'));
const PdfPreviewPage = React.lazy(() => import('./pages/PdfPreviewPage'));
const ContactPage = React.lazy(() => import('./pages/ContactPage'));
const BlogListPage = React.lazy(() => import('./pages/BlogListPage'));
const BlogPostPage = React.lazy(() => import('./pages/BlogPostPage'));
const PublicResumePage = React.lazy(() => import('./pages/PublicResumePage'));

// Returns path from hash, e.g., #/admin/login -> /admin/login
const getPathFromHash = () => {
    const hash = window.location.hash;
    return hash.startsWith('#/') ? hash.substring(1) : '/';
};

// New navigation utility that works with hashes
export const navigate = (path: string) => {
  window.location.hash = path;
};

const LoadingFallback = () => (
  <div className="flex flex-col justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
    <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
  </div>
);

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

  // Special route for PDF generation - bypasses auth checks for speed/simplicity in headless env
  if (path === '/pdf-preview') {
    return (
      <ThemeProvider>
        <Suspense fallback={<LoadingFallback />}>
          <PdfPreviewPage />
        </Suspense>
      </ThemeProvider>
    );
  }

  // Public Share Route (Accessible without auth)
  if (path.startsWith('/shared/')) {
      return (
          <ThemeProvider>
              <Suspense fallback={<LoadingFallback />}>
                  <PublicResumePage />
              </Suspense>
          </ThemeProvider>
      )
  }

  if (loading || isAdminLoading) {
    return <LoadingFallback />;
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
      return (
        <ThemeProvider>
          <Suspense fallback={<LoadingFallback />}>
            <AdminLoginPage accessDenied={accessDenied} />
          </Suspense>
        </ThemeProvider>
      );
    }
    
    if (currentUser && isAdmin) {
      if (!isEmailVerified && currentUser.providerData[0]?.providerId === 'password') {
         return (
            <ThemeProvider>
              <Suspense fallback={<LoadingFallback />}>
                <VerifyEmailPage />
              </Suspense>
            </ThemeProvider>
         );
      }
      return (
        <ThemeProvider>
          <Suspense fallback={<LoadingFallback />}>
            <AdminDashboardPage />
          </Suspense>
        </ThemeProvider>
      );
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
        } else if (path === '/contact') {
          content = <ContactPage />;
        } else if (path === '/blog') {
          content = <BlogListPage />;
        } else if (path.startsWith('/blog/')) {
          const id = path.split('/')[2];
          content = <BlogPostPage postId={id} />;
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
    } else if (path === '/contact') {
      content = <ContactPage />;
    } else if (path === '/blog') {
      content = <BlogListPage />;
    } else if (path.startsWith('/blog/')) {
      const id = path.split('/')[2];
      content = <BlogPostPage postId={id} />;
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
        <Suspense fallback={<LoadingFallback />}>
          {content}
          {showChatbot && <ChatBot />}
        </Suspense>
      </div>
    </ThemeProvider>
  );
};

export default App;
