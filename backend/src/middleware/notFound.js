import { ApiError } from '../utils/ApiError.js';

/**
 * 404 Not Found Middleware Stub
 */
export const notFound = (req, res, next) => {
  const error = new ApiError(404, `Route not found - ${req.originalUrl}`);
  next(error);
};
