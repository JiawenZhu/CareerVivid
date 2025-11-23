
import React, { useState, useEffect, Suspense } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { useAuth } from './contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import './i18n'; // Initialize i18n
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from './constants';

// Lazy load pages
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

// Returns path from hash, stripping language prefix if present
// e.g., #/es/dashboard -> /dashboard
const getPathFromHash = () => {
    const hash = window.location.hash;
    let path = hash.startsWith('#') ? hash.substring(1) : '/';
    
    // Check for language prefix
    const parts = path.split('/').filter(p => p);
    if (parts.length > 0 && SUPPORTED_LANGUAGES.some(l => l.code === parts[0])) {
        // It has a language prefix
        path = '/' + parts.slice(1).join('/');
    } else if (path === '' || path === '/') {
        path = '/';
    } else if (!path.startsWith('/')) {
        path = '/' + path;
    }
    
    return path;
};

// Get language from hash
const getLangFromHash = () => {
    const hash = window.location.hash;
    const path = hash.startsWith('#') ? hash.substring(1) : '/';
    const parts = path.split('/').filter(p => p);
    if (parts.length > 0 && SUPPORTED_LANGUAGES.some(l => l.code === parts[0])) {
        return parts[0];
    }
    return null;
};

export const navigate = (path: string) => {
    // Preserve current language if not specified in path
    const currentHash = window.location.hash;
    const currentLang = getLangFromHash() || 'en'; // Default to en if no prefix
    
    if (path.startsWith('/')) {
        // If path starts with a language code, use it directly
        const pathParts = path.split('/').filter(p => p);
        if (pathParts.length > 0 && SUPPORTED_LANGUAGES.some(l => l.code === pathParts[0])) {
            window.location.hash = path;
        } else {
            // Append current lang
            window.location.hash = `/${currentLang}${path}`;
        }
    } else {
        window.location.hash = `/${currentLang}/${path}`;
    }
};

const LoadingFallback = () => (
  <div className="flex flex-col justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
    <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
  </div>
);

const App: React.FC = () => {
  const { currentUser, loading, isAdmin, isAdminLoading, isEmailVerified } = useAuth();
  const [path, setPath] = useState(getPathFromHash());
  const { i18n } = useTranslation();

  useEffect(() => {
    const onHashChange = () => {
      const newPath = getPathFromHash();
      setPath(newPath);
      
      // Sync i18n language with URL
      const urlLang = getLangFromHash();
      if (urlLang && urlLang !== i18n.language) {
          i18n.changeLanguage(urlLang);
      } else if (!urlLang) {
          // If no lang in URL, redirect to current i18n lang (or resolved language)
          const currentHash = window.location.hash.replace('#', '');
          const cleanPath = currentHash.startsWith('/') ? currentHash : '/' + currentHash;
          
          // Ensure we redirect to the language currently loaded in i18n to avoid switching back to 'en' unexpectedly
          const targetLang = i18n.language || 'en';
          // Only redirect if it's a supported language, otherwise default to en
          const safeLang = SUPPORTED_LANGUAGES.some(l => l.code === targetLang) ? targetLang : 'en';
          
          window.location.hash = `/${safeLang}${cleanPath}`;
      }
    };
    window.addEventListener('hashchange', onHashChange);
    
    // Initial check
    const initialLang = getLangFromHash();
    if (initialLang) {
        if (initialLang !== i18n.language) i18n.changeLanguage(initialLang);
    } else {
        // No lang prefix, trigger hash change logic to redirect
        onHashChange();
    }

    return () => window.removeEventListener('hashchange', onHashChange);
  }, [i18n]);

  // Handle routes
  // ... same logic as before but using 'path' which is stripped of lang prefix

  if (path === '/pdf-preview') {
    return (
      <ThemeProvider>
        <Suspense fallback={<LoadingFallback />}>
          <PdfPreviewPage />
        </Suspense>
      </ThemeProvider>
    );
  }

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
      if (currentUser && isAdmin) {
        // Admin logic usually stays on en or specific path, but we'll respect router
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
          content = <Dashboard />;
        }
    }
  } else {
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
