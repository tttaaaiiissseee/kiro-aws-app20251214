import React, { Component, ReactNode } from 'react';
import { QueryErrorResetBoundary } from 'react-query';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class QueryErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Query Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <QueryErrorResetBoundary>
          {({ reset }) => (
            <div>
              {this.props.fallback ? (
                this.props.fallback(this.state.error!, () => {
                  this.setState({ hasError: false, error: null });
                  reset();
                })
              ) : (
                <DefaultErrorFallback 
                  error={this.state.error!} 
                  resetError={() => {
                    this.setState({ hasError: false, error: null });
                    reset();
                  }} 
                />
              )}
            </div>
          )}
        </QueryErrorResetBoundary>
      );
    }

    return this.props.children;
  }
}

// Default error fallback component
const DefaultErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({
  error,
  resetError,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
          <svg
            className="w-6 h-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <div className="mt-4 text-center">
          <h3 className="text-lg font-medium text-gray-900">
            Something went wrong
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            {error.message || 'An unexpected error occurred'}
          </p>
          <div className="mt-6">
            <button
              onClick={resetError}
              className="w-full inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try again
            </button>
          </div>
          {import.meta.env.DEV && (
            <details className="mt-4 text-left">
              <summary className="text-sm text-gray-500 cursor-pointer">
                Error details (development only)
              </summary>
              <pre className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-auto">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};

export default QueryErrorBoundary;