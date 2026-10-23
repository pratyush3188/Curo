import { ApiError } from '../utils/ApiError.js';

/**
 * Role-Based Access Control Middleware
 * Ensures req.user has one of the allowed roles
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required before checking permissions.'));
    }

    // Flatten if passed as array
    const roles = allowedRoles.flat();

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Access forbidden: role '${req.user.role}' is not authorized to perform this operation.`
        )
      );
    }

    next();
  };
};

export const authorize = requireRole;
