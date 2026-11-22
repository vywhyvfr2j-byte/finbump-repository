import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

// Per-route error boundary. When a page crashes, the user sees a friendly
// "try again" screen instead of a blank white page. Because it's keyed by
// route path in FinBumpGate, navigating to a new route remounts it cleanly.
export default class RouteErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Route error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60dvh] flex flex-col items-center justify-center px-5 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-destructive/10 text-destructive mb-4">
            <AlertCircle size={24} />
          </div>
          <p className="font-display text-lg font-semibold mb-1">Something went wrong</p>
          <p className="text-sm text-muted-foreground max-w-xs mb-5">
            This page hit an unexpected error. Try again — your data is safe.
          </p>
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-5 h-10 text-sm font-medium shadow hover:bg-primary/90 transition-colors"
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}