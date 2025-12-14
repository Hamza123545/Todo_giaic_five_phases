"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  children: ReactNode;
  routeName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Route-level error boundary for page-specific error handling
 *
 * Use this to wrap entire route components to prevent errors
 * from affecting other routes.
 */
class RouteErrorBoundaryClass extends Component<
  Props & { router: ReturnType<typeof useRouter> },
  State
> {
  constructor(props: Props & { router: ReturnType<typeof useRouter> }) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(`Error in route ${this.props.routeName || "unknown"}:`, error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Log to error tracking service
    // Example: logErrorToService(error, errorInfo, this.props.routeName);
  }

  handleGoBack = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.router.back();
  };

  handleGoHome = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.router.push("/");
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.router.refresh();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
          <div className="w-full max-w-lg rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/20">
                <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
              </div>
            </div>

            <h1 className="mb-2 text-center text-2xl font-bold text-gray-900 dark:text-white">
              Page Error
            </h1>

            <p className="mb-6 text-center text-gray-600 dark:text-gray-400">
              We encountered an error while loading this page. This might be temporary, so please
              try again.
            </p>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mb-6 rounded-md bg-gray-100 p-4 dark:bg-gray-700">
                <summary className="mb-2 cursor-pointer font-semibold text-gray-700 dark:text-gray-300">
                  Error Details (Development Only)
                </summary>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Error:</p>
                    <pre className="overflow-auto rounded bg-red-50 p-2 text-xs text-red-600 dark:bg-red-900/30 dark:text-red-400">
                      {this.state.error.toString()}
                    </pre>
                  </div>
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                        Component Stack:
                      </p>
                      <pre className="max-h-48 overflow-auto rounded bg-red-50 p-2 text-xs text-red-600 dark:bg-red-900/30 dark:text-red-400">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Try Again
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={this.handleGoBack}
                  className="flex items-center justify-center gap-2 rounded-md bg-gray-200 px-4 py-2 font-medium text-gray-900 transition-colors hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Go Back
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="flex items-center justify-center gap-2 rounded-md bg-gray-200 px-4 py-2 font-medium text-gray-900 transition-colors hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                >
                  <Home className="h-4 w-4" />
                  Home
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper component to inject router
export default function RouteErrorBoundary({ children, routeName }: Props) {
  const router = useRouter();
  return (
    <RouteErrorBoundaryClass router={router} routeName={routeName}>
      {children}
    </RouteErrorBoundaryClass>
  );
}
