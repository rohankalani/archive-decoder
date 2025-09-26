import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { AppError, logger } from '@/lib/errors';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('React Error Boundary caught an error', error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: this.constructor.name,
    });

    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isAppError = this.state.error instanceof AppError;
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-2xl text-destructive">
                {isAppError ? 'Application Error' : 'Something went wrong'}
              </CardTitle>
              <CardDescription>
                {isAppError 
                  ? this.state.error?.message 
                  : 'An unexpected error occurred. Please try again or contact support if the problem persists.'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Error Details in Development */}
              {isDevelopment && this.state.error && (
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Error Details (Development Mode)</h4>
                  <div className="text-sm font-mono text-muted-foreground">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <div className="mb-2">
                        <strong>Stack Trace:</strong>
                        <pre className="mt-1 text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error Code for App Errors */}
              {isAppError && (this.state.error as AppError).code && (
                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-sm">
                    <strong>Error Code:</strong>{' '}
                    <code className="bg-background px-2 py-1 rounded">
                      {(this.state.error as AppError).code}
                    </code>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={this.handleRetry} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={this.handleReload} variant="outline" className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>
                <Button onClick={this.handleGoHome} variant="outline" className="flex-1">
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>

              {/* Support Information */}
              <div className="text-center text-sm text-muted-foreground pt-4 border-t">
                If this problem continues, please contact support with error code:{' '}
                <code className="bg-muted px-2 py-1 rounded">
                  {isAppError ? (this.state.error as AppError).code : 'UNKNOWN_ERROR'}
                </code>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============= Higher-Order Component =============

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// ============= Hook for Error Reporting =============

export function useErrorHandler() {
  const handleError = React.useCallback((error: Error, context?: Record<string, unknown>) => {
    logger.error('Error handled by useErrorHandler', error, context);
    
    // In a real application, you might want to show a toast notification
    // or send the error to an external service
    
    throw error; // Re-throw to be caught by ErrorBoundary
  }, []);

  return handleError;
}