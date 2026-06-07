import React from 'react';
import { logger } from '../services/logger';

const showDevDetails = import.meta.env.DEV;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {

    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {

    logger.error('UI Rendering Error', {
      componentStack: errorInfo.componentStack,
    }, error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong.</h2>
            <p className="text-gray-500 mb-6">
              We've been notified of the issue and are looking into it. Please try refreshing the page.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                Reload Page
              </button>
              <button
                onClick={() => { this.setState({ hasError: false }); window.history.back(); }}
                className="btn-secondary"
              >
                Go Back
              </button>
            </div>
            {showDevDetails && (
              <div className="mt-8 text-left bg-red-50 p-4 rounded-lg overflow-auto max-h-48 text-xs text-red-800">
                <p className="font-bold mb-1">{this.state.error && this.state.error.toString()}</p>
                <pre>{this.state.error && this.state.error.stack}</pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
