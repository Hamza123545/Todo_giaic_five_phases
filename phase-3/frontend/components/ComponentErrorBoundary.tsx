"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  componentName?: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Component-level error boundary for granular error handling
 *
 * Use this to wrap individual components that may fail independently
 * without crashing the entire application.
 */
export default class ComponentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(`Error in component ${this.props.componentName || "unknown"}:`, error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({ error });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default component-level error UI
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-900 dark:text-red-200">
                {this.props.componentName || "Component"} Error
              </h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                This component encountered an error and couldn&apos;t be displayed.
              </p>
              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-red-600 dark:text-red-400">
                    Error details
                  </summary>
                  <pre className="mt-2 overflow-auto rounded bg-red-100 p-2 text-xs text-red-800 dark:bg-red-900/50 dark:text-red-200">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}
              <button
                onClick={this.handleRetry}
                className="mt-3 inline-flex items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-500 dark:hover:bg-red-600"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
