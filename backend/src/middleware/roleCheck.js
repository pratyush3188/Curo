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

    // Flatten if passed as array and expand equivalent aliases
    const roles = new Set(allowedRoles.flat());
    if (roles.has('hospital_owner')) roles.add('hospital_admin');
    if (roles.has('hospital_admin')) roles.add('hospital_owner');
    if (roles.has('hospital_manager')) roles.add('manager');
    if (roles.has('manager')) roles.add('hospital_manager');
    if (roles.has('clinic')) roles.add('clinic_manager');
    if (roles.has('clinic_manager')) roles.add('clinic');

    // Super admin has platform-wide authority
    if (req.user.role === 'super_admin') {
      return next();
    }

    if (!roles.has(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Access forbidden: role '${req.user.role}' is not authorized to perform this operation. Allowed roles: ${[...roles].join(', ')}`
        )
      );
    }

    next();
  };
};

export const authorize = requireRole;
