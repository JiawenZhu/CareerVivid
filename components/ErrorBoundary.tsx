import React, { ErrorInfo, ReactNode } from 'react';
import { reportError } from '../services/errorService';
import { AlertTriangle, Copy } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isCopied: boolean;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    isCopied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  // FIX: Reverted to a standard class method. React handles binding 'this' for lifecycle methods.
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to our reporting service
    console.error("Uncaught error:", error, errorInfo);
    reportError(error, { componentStack: errorInfo.componentStack });
    // Also save errorInfo to state to include in copied details
    this.setState({ errorInfo });
  }

  handleCopyDetails = () => {
    const { error, errorInfo } = this.state;
    const details = `
Error: ${error?.toString()}
URL: ${window.location.href}
Time: ${new Date().toISOString()}
Component Stack:
${errorInfo?.componentStack?.trim() || 'Not available.'}
    `;
    navigator.clipboard.writeText(details.trim());
    this.setState({ isCopied: true });
    setTimeout(() => this.setState({ isCopied: false }), 2000);
  };


  // FIX: Reverted to a standard class method. React handles binding 'this' for render.
  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-900 p-4">
            <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-lg w-full">
                <AlertTriangle className="w-16 h-16 mx-auto text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Something went wrong.</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                    We're sorry for the inconvenience. Our team has been notified of the issue.
                </p>
                
                <details className="mt-4 text-left">
                    <summary className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:underline">
                        Error Details
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded-md text-xs overflow-auto max-h-40 text-gray-600 dark:text-gray-300">
                        <code>{this.state.error?.toString()}</code>
                    </pre>
                </details>
                
                <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-semibold"
                    >
                        Refresh Page
                    </button>
                    <button
                        onClick={this.handleCopyDetails}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold"
                    >
                        <Copy size={16} />
                        {this.state.isCopied ? 'Copied!' : 'Copy Details'}
                    </button>
                </div>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;