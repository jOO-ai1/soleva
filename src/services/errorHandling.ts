// Enhanced error handling service
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string = 'GENERIC_ERROR',
    statusCode?: number,
    isOperational: boolean = true
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

export const ErrorCodes = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  CONNECTION_REFUSED: 'CONNECTION_REFUSED',
  TIMEOUT: 'TIMEOUT',
  
  // API errors
  API_UNAVAILABLE: 'API_UNAVAILABLE',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  RATE_LIMITED: 'RATE_LIMITED',
  
  // Auth errors
  AUTH_FAILED: 'AUTH_FAILED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  
  // Data errors
  DATA_NOT_FOUND: 'DATA_NOT_FOUND',
  INVALID_DATA: 'INVALID_DATA',
  
  // General errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

export function handleApiError(error: any): AppError {
  // Network connection errors
  if (error.message?.includes('net::ERR_CONNECTION_REFUSED') || 
      error.message?.includes('Failed to fetch') ||
      error.code === 'ECONNREFUSED') {
    return new AppError(
      'Unable to connect to server. The application will use offline data.',
      ErrorCodes.CONNECTION_REFUSED,
      0
    );
  }
  
  // Timeout errors
  if (error.message?.includes('timeout') || error.message?.includes('Request timeout')) {
    return new AppError(
      'Request timed out. Please try again.',
      ErrorCodes.TIMEOUT,
      408
    );
  }
  
  // Rate limiting
  if (error.status === 429 || error.statusCode === 429) {
    return new AppError(
      'Too many requests. Please wait a moment and try again.',
      ErrorCodes.RATE_LIMITED,
      429
    );
  }
  
  // Authentication errors
  if (error.status === 401 || error.statusCode === 401) {
    return new AppError(
      'Authentication required. Please log in.',
      ErrorCodes.UNAUTHORIZED,
      401
    );
  }
  
  // Not found
  if (error.status === 404 || error.statusCode === 404) {
    return new AppError(
      'The requested resource was not found.',
      ErrorCodes.DATA_NOT_FOUND,
      404
    );
  }
  
  // Server errors
  if (error.status >= 500 || error.statusCode >= 500) {
    return new AppError(
      'Server error. Please try again later.',
      ErrorCodes.API_UNAVAILABLE,
      error.status || error.statusCode || 500
    );
  }
  
  // Generic error
  return new AppError(
    error.message || 'An unexpected error occurred.',
    ErrorCodes.UNKNOWN_ERROR,
    error.status || error.statusCode
  );
}

export function logError(error: Error | AppError, context?: string) {
  const timestamp = new Date().toISOString();
  const contextStr = context ? `[${context}]` : '';
  
  if (import.meta.env.DEV) {
    console.error(`${timestamp} ${contextStr} Error:`, {
      message: error.message,
      code: error instanceof AppError ? error.code : 'GENERIC_ERROR',
      statusCode: error instanceof AppError ? error.statusCode : undefined,
      stack: error.stack
    });
  }
}

export function isRecoverableError(error: AppError): boolean {
  const recoverableErrors = [
    ErrorCodes.NETWORK_ERROR,
    ErrorCodes.CONNECTION_REFUSED,
    ErrorCodes.TIMEOUT,
    ErrorCodes.RATE_LIMITED,
    ErrorCodes.API_UNAVAILABLE
  ];
  
  return recoverableErrors.includes(error.code as any);
}