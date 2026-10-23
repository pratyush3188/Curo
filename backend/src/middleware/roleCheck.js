/**
 * Role-Based Access Control Middleware Stub
 * TODO: Check if req.user role matches one of the allowed roles
 */
// eslint-disable-next-line no-unused-vars
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // TODO: Verify if req.user is set
    // TODO: Verify if allowedRoles.includes(req.user.role)
    // TODO: Return 403 Forbidden ApiError if role does not match
    next();
  };
};
