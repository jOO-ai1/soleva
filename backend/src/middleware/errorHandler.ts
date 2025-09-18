import { Request, Response, NextFunction } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ZodError } from 'zod';

export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

interface ErrorDetails {
  field?: string | string[] | undefined;
  code?: string | undefined;
  relation?: string | undefined;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }> | undefined;
}

export const errorHandler = (
error: CustomError | Error | PrismaClientKnownRequestError,
req: Request,
res: Response,
_next: NextFunction)
: void => {
  let statusCode = 500;
  let message = 'Internal server error';
  let details: ErrorDetails | null = null;

  // Handle different error types
  if ('statusCode' in error && error.statusCode) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error instanceof PrismaClientKnownRequestError) {
    // Handle Prisma errors
    switch (error.code) {
      case 'P2002':
        statusCode = 409;
        message = 'A record with this information already exists';
        details = {
          field: error.meta?.target as string | string[] | undefined,
          code: error.code
        };
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Record not found';
        details = {
          code: error.code
        };
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Foreign key constraint failed';
        details = {
          field: error.meta?.field_name as string | string[] | undefined,
          code: error.code
        };
        break;
      case 'P2014':
        statusCode = 400;
        message = 'Invalid relation';
        details = {
          relation: error.meta?.relation_name as string | undefined,
          code: error.code
        };
        break;
      default:
        statusCode = 500;
        message = 'Database error occurred';
        details = {
          code: error.code
        };
    }
  } else if (error instanceof ZodError) {
    // Handle validation errors
    statusCode = 400;
    message = 'Validation failed';
    details = {
      errors: error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }))
    };
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (error.name === 'MulterError') {
    statusCode = 400;
    message = 'File upload error';
    details = {
      code: error.message
    };
  }

  // Log error for debugging (only in development)
  if (statusCode >= 500 && process.env.NODE_ENV === 'development') {
    console.error('Server Error:', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }

  // Send error response
  interface ErrorResponse {
    error: string;
    timestamp: string;
    path: string;
    method: string;
    details?: ErrorDetails;
    stack?: string;
  }

  const response: ErrorResponse = {
    error: message,
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method
  };

  if (details) {
    response.details = details;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && error.stack) {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

// Custom error classes
export class ValidationError extends Error {
  statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  statusCode = 404;

  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  statusCode = 401;

  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  statusCode = 403;

  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends Error {
  statusCode = 409;

  constructor(message: string = 'Conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}

// Async error wrapper
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};