import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@utils/errors';
import logger from '@utils/logger';

export interface ErrorResponse {
  success: false;
  message: string;
  error?: any;
  statusCode: number;
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error | ApiError,
  req: Request,
  res: Response,
  _next: NextFunction,
): Response<ErrorResponse> {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: err.details,
      statusCode: err.statusCode,
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: err.message,
      statusCode: 401,
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      error: err.message,
      statusCode: 401,
    });
  }

  // Default error
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    statusCode: 500,
  });
}

/**
 * 404 handler
 */
export function notFoundHandler(req: Request, res: Response): Response {
  return res.status(404).json({
    success: false,
    message: `Route ${req.path} not found`,
    statusCode: 404,
  });
}

/**
 * Async error handler wrapper
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
