import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { AppError } from '@/lib/errors';
import { cn } from '@/lib/utils';

interface ErrorDisplayProps {
  error: AppError | Error;
  onRetry?: () => void;
  onGoHome?: () => void;
  className?: string;
  variant?: 'card' | 'alert' | 'inline';
  showDetails?: boolean;
}

export function ErrorDisplay({
  error,
  onRetry,
  onGoHome,
  className,
  variant = 'card',
  showDetails = false,
}: ErrorDisplayProps) {
  const isAppError = error instanceof AppError;
  const isDevelopment = process.env.NODE_ENV === 'development';

  const errorCode = isAppError ? error.code : 'UNKNOWN_ERROR';
  const statusCode = isAppError ? error.statusCode : 500;

  if (variant === 'alert') {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error.message}
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="mt-2 ml-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Try Again
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={cn('text-center py-8', className)}>
        <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold text-destructive mb-2">
          {isAppError ? 'Something went wrong' : 'Error'}
        </h3>
        <p className="text-muted-foreground mb-4">{error.message}</p>
        {onRetry && (
          <Button onClick={onRetry} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle className="text-destructive">
          {statusCode >= 500 ? 'Server Error' : 'Error'}
        </CardTitle>
        <CardDescription>{error.message}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Code */}
        <div className="text-center">
          <code className="bg-muted px-2 py-1 rounded text-sm">
            Error Code: {errorCode}
          </code>
        </div>

        {/* Error Details in Development */}
        {(isDevelopment || showDetails) && (
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Error Details</h4>
            <div className="text-sm font-mono text-muted-foreground">
              <div className="mb-2">
                <strong>Message:</strong> {error.message}
              </div>
              {isAppError && (
                <div className="mb-2">
                  <strong>Code:</strong> {error.code}
                </div>
              )}
              {error.stack && (
                <div>
                  <strong>Stack Trace:</strong>
                  <pre className="mt-1 text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {onRetry && (
            <Button onClick={onRetry} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
          {onGoHome && (
            <Button onClick={onGoHome} variant="outline" className="flex-1">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============= Specific Error Components =============

export function NotFoundError({ resource = 'Resource', onGoBack }: { 
  resource?: string; 
  onGoBack?: () => void; 
}) {
  return (
    <ErrorDisplay
      error={new Error(`${resource} not found`)}
      variant="inline"
      onRetry={onGoBack}
      className="py-16"
    />
  );
}

export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorDisplay
      error={new Error('Network connection failed. Please check your internet connection.')}
      variant="alert"
      onRetry={onRetry}
    />
  );
}

export function ValidationErrors({ errors }: { errors: string[] }) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-1">
          {errors.map((error, index) => (
            <div key={index} className="text-sm">{error}</div>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
}