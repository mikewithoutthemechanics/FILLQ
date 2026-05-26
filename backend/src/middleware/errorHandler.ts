import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'express-validator';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Error handling middleware
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error for debugging
  console.error('Error:', err);

  // Default error values
  let statusCode = 500;
  let message = 'Internal server error';
  let errors: any[] = [];

  // Handle ApiError instances
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors || [];
  }
  // Handle ValidationError from express-validator
  else if (err instanceof ValidationError) {
    statusCode = 400;
    message = 'Validation failed';
    errors = err.array();
  }
  // Handle Mongoose validation errors
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    // Extract errors from Mongoose validation
    errors = Object.values(err.errors).map((val: any) => ({
      msg: val.message,
      param: val.path,
      value: val.value,
    }));
  }
  // Handle JSON parsing errors
  else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON';
  }
  // Handle other errors
  else {
    // In production, don't leak error details
    if (process.env.NODE_ENV === 'production' && !err.isOperational) {
      message = 'Internal server error';
    } else {
      message = err.message;
    }
    errors = err.errors || [];
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(errors.length > 0 && { errors }),
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

/**
 * Not found middleware
 */
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    success: false,
    error: `Not found - ${req.originalUrl}`,
  });
};