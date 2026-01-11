
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
const SignInPage = React.lazy(() => import('./pages/SignInPage'));
const SignUpPage = React.lazy(() => import('./pages/SignUpPage'));
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const TechLandingPage = React.lazy(() => import('./pages/TechLandingPage'));
const PricingPage = React.lazy(() => import('./pages/PricingPage'));
const AdminLoginPage = React.lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminDashboardPage = React.lazy(() => import('./pages/admin/AdminPage'));
const AcademicPartnerDashboard = React.lazy(() => import('./pages/academic/AcademicPartnerDashboard'));
const VerifyEmailPage = React.lazy(() => import('./pages/VerifyEmailPage'));
const JobTrackerPage = React.lazy(() => import('./pages/JobTrackerPage'));
const DemoPage = React.lazy(() => import('./pages/DemoPage'));
const PdfPreviewPage = React.lazy(() => import('./pages/PdfPreviewPage'));
const ContactPage = React.lazy(() => import('./pages/ContactPage'));
const BlogListPage = React.lazy(() => import('./pages/BlogListPage'));
const BlogPostPage = React.lazy(() => import('./pages/BlogPostPage'));
const PublicResumePage = React.lazy(() => import('./pages/PublicResumePage'));
const SubscriptionPage = React.lazy(() => import('./pages/SubscriptionPage'));
const PortfolioHub = React.lazy(() => import('./features/portfolio/pages/PortfolioHub'));
const PortfolioEditor = React.lazy(() => import('./features/portfolio/pages/PortfolioEditor'));
const PortfolioBuilderPage = React.lazy(() => import('./pages/PortfolioBuilderPage'));
const PublicPortfolioPage = React.lazy(() => import('./features/portfolio/pages/PublicPortfolioPage'));
const PartnerLandingPage = React.lazy(() => import('./pages/partners/PartnerLandingPage'));
const BusinessCardPage = React.lazy(() => import('./pages/BusinessCardPage'));
const OrderNfcCardPage = React.lazy(() => import('./pages/OrderNfcCardPage'));
const AcademicPartnerPage = React.lazy(() => import('./pages/partners/AcademicPartnerPage'));
const BusinessPartnerPage = React.lazy(() => import('./pages/partners/BusinessPartnerPage'));
const StudentAmbassadorPage = React.lazy(() => import('./pages/partners/StudentAmbassadorPage'));
const PartnerApplicationPage = React.lazy(() => import('./pages/partners/PartnerApplicationPage'));
const PolicyPage = React.lazy(() => import('./pages/PolicyPage'));
const HRPartnerPage = React.lazy(() => import('./pages/partners/HRPartnerPage'));
const BusinessPartnerDashboard = React.lazy(() => import('./pages/BusinessPartnerDashboard'));
const JobPostingEditor = React.lazy(() => import('./pages/JobPostingEditor'));
const JobMarketPage = React.lazy(() => import('./pages/JobMarketPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));
const PermissionDeniedPage = React.lazy(() => import('./pages/PermissionDeniedPage'));
const ReferralLandingPage = React.lazy(() => import('./pages/ReferralLandingPage'));
const ReferralPage = React.lazy(() => import('./pages/ReferralPage'));
const BioLinksPage = React.lazy(() => import('./pages/BioLinksPage'));
const CommerceDashboard = React.lazy(() => import('./features/commerce/pages/CommerceDashboard'));
const ProductPage = React.lazy(() => import('./features/commerce/pages/ProductPage'));

import { SUPPORTED_LANGUAGES } from './constants';
import i18n from './i18n';

// Returns path from pathname, stripping language prefix if present
// e.g., /zh/contact -> /contact
// e.g., /contact -> /contact
const getPathFromUrl = () => {
  let path = window.location.pathname;

  // Remove leading slash for splitting
  if (path.startsWith('/')) path = path.substring(1);

  const parts = path.split('/');

  // Check if first part is a supported language code
  if (parts.length > 0 && SUPPORTED_LANGUAGES.some(l => l.code === parts[0])) {
    // It's a language prefix, remove it to get the actual route
    const langCode = parts[0];
    // Sync i18n if it differs (this handles direct URL access)
    if (i18n.language !== langCode) {
      i18n.changeLanguage(langCode);
    }
    return '/' + parts.slice(1).join('/');
  }

  // No language prefix, return as is (with leading slash)
  return '/' + path;
};

// Navigation utility that uses History API and preserves language
export const navigate = (path: string) => {
  // If path already starts with a language code, use it as is
  const parts = path.split('/').filter(p => p);
  if (parts.length > 0 && SUPPORTED_LANGUAGES.some(l => l.code === parts[0])) {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
    return;
  }

  // Otherwise, prepend current language (normalized to 2-letter code)
  // i18n.language might be 'en-US', we need just 'en'
  const rawLang = i18n.language || 'en';
  const currentLang = rawLang.substring(0, 2);

  // Verify it's a supported language, fallback to 'en' if not
  const normalizedLang = SUPPORTED_LANGUAGES.some(l => l.code === currentLang) ? currentLang : 'en';

  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  const fullPath = `/${normalizedLang}${cleanPath}`;

  window.history.pushState({}, '', fullPath);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

const LoadingFallback = () => (
  <div className="flex flex-col justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
    <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
  </div>
);

const AuthRedirect = ({ target }: { target: string }) => {
  useEffect(() => {
    navigate(target);
  }, [target]);
  return <LoadingFallback />;
};

import { useGuestDataMigration } from './hooks/useGuestDataMigration';
import SEOHelper from './components/SEOHelper';

const App: React.FC = () => {
  const { currentUser, userProfile, loading, isAdmin, isAdminLoading, isEmailVerified } = useAuth();
  useGuestDataMigration(); // Global guest data migration

  // SEO Helper runs on every render to update canonical tags
  // Since App.tsx re-renders on path changes (due to setPath), this works perfectly.

  const [path, setPath] = useState(getPathFromUrl());

  useEffect(() => {
    const onPathChange = () => {
      setPath(getPathFromUrl());
    };
    window.addEventListener('popstate', onPathChange);
    // Also set initial path on load
    onPathChange();

    // Check for legacy hash-based shared links (e.g., /#/shared/ or /#/portfolio/) and redirect to history mode
    if (window.location.hash && (window.location.hash.startsWith('#/shared/') || window.location.hash.startsWith('#/portfolio/'))) {
      const hashPath = window.location.hash.substring(1); // remove '#'
      window.history.replaceState(null, '', hashPath);
      setPath(getPathFromUrl()); // Update state to trigger re-render
    }

    return () => window.removeEventListener('popstate', onPathChange);
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

  // Portfolio Routing Helper
  // Supports: /portfolio/edit/ID, /portfolio/USERNAME/edit/ID
  const isPortfolioEditorRoute = /^\/portfolio\/([^/]+\/)?edit\//.test(path);

  // Supports: /portfolio/ID, /portfolio/USERNAME/ID
  // Must exclude Editor routes
  const isPublicPortfolioRoute = path.startsWith('/portfolio/') && !isPortfolioEditorRoute;

  if (isPublicPortfolioRoute) {
    return (
      <ThemeProvider>
        <Suspense fallback={<LoadingFallback />}>
          <PublicPortfolioPage />
        </Suspense>
      </ThemeProvider>
    );
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
      // If not logged in or not an admin, show permission denied
      return (
        <ThemeProvider>
          <Suspense fallback={<LoadingFallback />}>
            <PermissionDeniedPage requiredRole="Administrator" message="You need administrator privileges to access this page." />
          </Suspense>
        </ThemeProvider>
      );
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
      if (path === '/signin' || path.startsWith('/signin?') || path === '/signup') {
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect');
        content = <AuthRedirect target={redirect ? decodeURIComponent(redirect) : '/'} />;
      } else if (path.startsWith('/edit/')) {
        const id = path.split('/')[2];
        content = <Editor resumeId={id} />;
      } else if (path === '/new') {
        content = <GenerationHub />;
      } else if (path === '/portfolio') {
        content = <PortfolioHub />;
      } else if (isPortfolioEditorRoute) {
        content = <PortfolioEditor />;
      } else if (path === '/portfolio-builder') {
        content = <PortfolioBuilderPage />;
      } else if (path.startsWith('/interview-studio')) {
        const parts = path.split('/');
        const jobId = parts[2]; // /interview-studio/JOB_ID
        content = <InterviewStudio jobId={jobId} />;
      } else if (path === '/tracker') {
        content = <JobTrackerPage />;
      } else if (path === '/profile') {
        content = <ProfilePage />;
      } else if (path === '/referrals') {
        content = <ReferralPage />;
      } else if (path === '/subscription') {
        content = <SubscriptionPage />;
      } else if (path === '/contact') {
        content = <ContactPage />;
      } else if (path === '/policy') {
        content = <PolicyPage />;
      } else if (path === '/business-partner/dashboard') {
        content = <BusinessPartnerDashboard />;
      } else if (path.toLowerCase() === '/jobmarket' || path === '/job-market') {
        content = <JobMarketPage />;
      } else if (path === '/business-partner/jobs/new') {
        content = <JobPostingEditor />;
      } else if (path.startsWith('/business-partner/jobs/') && path.endsWith('/edit')) {
        const jobId = path.split('/')[3]; // Extract job ID from /business-partner/jobs/:jobId/edit
        content = <JobPostingEditor jobId={jobId} />;
      } else if (path === '/blog') {
        content = <BlogListPage />;
      } else if (path.startsWith('/blog/')) {
        const id = path.split('/')[2];
        content = <BlogPostPage postId={id} />;
      } else if (path === '/commerce') {
        content = <CommerceDashboard />;
      } else if (path === '/academic-partner') {
        // Simple role check for now
        if (userProfile?.role === 'academic_partner' || isAdmin) {
          content = <AcademicPartnerDashboard />;
        } else {
          content = <PermissionDeniedPage requiredRole="Academic Partner" message="This page is only accessible to academic partners." />;
        }
      } else if (path === '/order-nfc-card') {
        content = <OrderNfcCardPage />;
      } else if (path === '/business-card') {
        content = <BusinessCardPage />;
      } else {
        // Default to dashboard for any other path when logged in
        content = <Dashboard />;
      }

    }
  } else {
    // Public routes for logged-out users
    if (path === '/signin') {
      content = <SignInPage />;
    } else if (path === '/signup') {
      content = <SignUpPage />;
    } else if (path === '/auth') {
      // Redirect old auth route to signin
      window.location.href = '/signin';
      content = <SignInPage />;
    } else if (path === '/pricing') {
      content = <PricingPage />;
    } else if (path === '/demo') {
      content = <DemoPage />;
    } else if (path === '/contact') {
      content = <ContactPage />;
    } else if (path === '/policy') {
      content = <PolicyPage />;
    } else if (path === '/referral') {
      content = <ReferralLandingPage />;
    } else if (path === '/bio-links') {
      content = <BioLinksPage />;
    } else if (isPortfolioEditorRoute) {
      content = <PortfolioEditor />;
    } else if (path === '/portfolio-builder') {
      content = <PortfolioBuilderPage />;
    } else if (path === '/blog') {
      content = <BlogListPage />;
    } else if (path.startsWith('/blog/')) {
      const id = path.split('/')[2];
      content = <BlogPostPage postId={id} />;
    } else if (path.startsWith('/edit/guest')) {
      content = <Editor resumeId="guest" />;
    } else if (path === '/tech-preview') {
      content = <TechLandingPage />;
    } else if (path === '/partners') {
      content = <PartnerLandingPage />;
    } else if (path === '/partners/academic') {
      content = <AcademicPartnerPage />;
    } else if (path === '/partners/business') {
      content = <BusinessPartnerPage />;
    } else if (path === '/partners/students') {
      content = <StudentAmbassadorPage />;
    } else if (path === '/partners/hiring') {
      content = <HRPartnerPage />;
    } else if (path === '/partners/apply') {
      content = <PartnerApplicationPage />;
    } else if (path === '/business-card') {
      content = <BusinessCardPage />;
    } else if (path === '/order-nfc-card') {
      content = <OrderNfcCardPage />;
    } else if (path === '/' || path === '') {
      // Root path shows landing page
      content = <LandingPage />;
    } else if (path.startsWith('/p/')) {
      // Product Page Route: /p/USER_ID/SLUG
      content = <ProductPage />;
    } else {
      // Unknown routes show 404
      content = <NotFoundPage />;
    }
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-800 dark:text-gray-200 font-sans">
        <SEOHelper />
        <Suspense fallback={<LoadingFallback />}>
          {content}
          {showChatbot && <ChatBot />}
        </Suspense>
      </div>
    </ThemeProvider>
  );
};

export default App;
