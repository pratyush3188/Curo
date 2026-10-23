import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

export const authenticate = async (req, res, next) => {
  let token = null;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(new ApiError(401, 'Authentication token missing. Please sign in.'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new ApiError(401, 'User account associated with this token no longer exists.'));
    }

    if (user.accountStatus === 'suspended') {
      return next(new ApiError(403, 'Your account has been suspended by platform administration.'));
    }

    if (user.accountStatus === 'inactive') {
      return next(new ApiError(403, 'Your account is currently inactive. Please contact administration.'));
    }

    req.user = user;
    next();
  } catch {
    return next(new ApiError(401, 'Session token is invalid or has expired. Please log in again.'));
  }
};
