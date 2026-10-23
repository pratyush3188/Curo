import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

/**
 * Global Error Handler Middleware Stub
 * TODO: Add detailed database error handlers (CastError, ValidationError, Mongo duplicate key)
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  logger.error(`${req.method} ${req.originalUrl} - ${error.message}`);

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors,
    ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {}),
  };

  return res.status(error.statusCode).json(response);
};
