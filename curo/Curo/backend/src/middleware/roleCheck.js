import { ApiError } from '../utils/ApiError.js';

/**
 * Server-side Role-Based Access Control Middleware
 * Verifies req.user exists and that req.user.role matches one of allowedRoles
 */
export const requireRole = (...allowedRoles) => {
  const expandedRoles = new Set(allowedRoles);
  if (expandedRoles.has('hospital_owner')) expandedRoles.add('hospital_admin');
  if (expandedRoles.has('hospital_admin')) expandedRoles.add('hospital_owner');

  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    if (!expandedRoles.has(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Access denied. Allowed roles: ${[...expandedRoles].join(', ')}. Current role: ${req.user.role}`
        )
      );
    }

    next();
  };
};
