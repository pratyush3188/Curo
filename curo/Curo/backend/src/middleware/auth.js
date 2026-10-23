import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { fallbackStore } from '../utils/fallbackStore.js';
import mongoose from 'mongoose';

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
    return next(new ApiError(401, 'Not authorized to access this route'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

    let user = null;
    if (mongoose.connection.readyState === 1) {
      try {
        user = await User.findById(decoded.id);
      } catch {
        // ID might be fallback ID format
      }
    }

    if (!user) {
      user = fallbackStore.findUserById(decoded.id);
    }

    if (!user) {
      return next(new ApiError(401, 'User no longer exists'));
    }

    req.user = user;
    next();
  } catch {
    return next(new ApiError(401, 'Token is invalid or expired'));
  }
};
