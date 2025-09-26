// ============= Custom Error Classes =============

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(
      field ? `Validation error for ${field}: ${message}` : `Validation error: ${message}`,
      'VALIDATION_ERROR',
      400
    );
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTH_ERROR', 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 'AUTHORIZATION_ERROR', 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 'CONFLICT', 409);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 'DATABASE_ERROR', 500);
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network request failed') {
    super(message, 'NETWORK_ERROR', 503);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT', 429);
  }
}

// ============= Error Handling Utilities =============

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
    timestamp: string;
  };
}

export function createErrorResponse(error: AppError | Error, includeStack: boolean = false): ErrorResponse {
  const isAppError = error instanceof AppError;
  
  return {
    error: {
      code: isAppError ? error.code : 'UNKNOWN_ERROR',
      message: error.message,
      details: includeStack ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    },
  };
}

export function handleAsyncError<T>(
  promise: Promise<T>
): Promise<[T | null, AppError | null]> {
  return promise
    .then<[T, null]>((data: T) => [data, null])
    .catch<[null, AppError]>((error: Error) => {
      const appError = error instanceof AppError ? error : new AppError(error.message);
      return [null, appError];
    });
}

export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

// ============= Error Logging =============

export interface ErrorLog {
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  code?: string;
  stack?: string;
  context?: Record<string, unknown>;
}

export class Logger {
  private static instance: Logger;
  private logs: ErrorLog[] = [];

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public error(message: string, error?: Error, context?: Record<string, unknown>): void {
    const log: ErrorLog = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      code: error instanceof AppError ? error.code : undefined,
      stack: error?.stack,
      context,
    };

    this.logs.push(log);
    console.error('[ERROR]', log);

    // In production, send to external logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService(log);
    }
  }

  public warn(message: string, context?: Record<string, unknown>): void {
    const log: ErrorLog = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      context,
    };

    this.logs.push(log);
    console.warn('[WARN]', log);
  }

  public info(message: string, context?: Record<string, unknown>): void {
    const log: ErrorLog = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      context,
    };

    this.logs.push(log);
    console.info('[INFO]', log);
  }

  public getLogs(level?: 'error' | 'warn' | 'info'): ErrorLog[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
  }

  private sendToExternalService(log: ErrorLog): void {
    // Implementation for external logging service (e.g., Sentry, LogRocket)
    // This would be configured based on the specific service
  }
}

export const logger = Logger.getInstance();