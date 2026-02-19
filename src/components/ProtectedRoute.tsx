import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute Wrapper Component
 * 
 * This component wraps protected routes and handles:
 * 1. Loading state - shows a spinner while auth is being checked
 * 2. Unauthenticated access - redirects to /signin with a redirect param
 * 3. Authenticated access - renders the children
 * 
 * The redirect uses window.location.href for a full page navigation,
 * ensuring the signin page loads freshly with the redirect parameter.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
        <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium">
          Checking permissions...
        </p>
      </div>
    );
  }

  // If not loading and user is not authenticated, redirect immediately
  if (!currentUser) {
    // Get current path and query string
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;
    const fullPath = currentPath + currentSearch;
    
    // Encode the redirect URL
    const redirectParam = encodeURIComponent(fullPath);
    
    // Use window.location.href for a hard redirect to ensure clean state
    // This is more reliable than pushState for cross-component navigation
    window.location.href = `/signin?redirect=${redirectParam}`;
    
    // Return loading state while redirect happens
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
        <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium">
          Redirecting to login...
        </p>
      </div>
    );
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
