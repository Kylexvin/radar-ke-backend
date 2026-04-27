import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Provider from '../models/Provider.js';
import { errorResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Verify JWT token and attach user or provider to req object
 * Supports both user and provider authentication
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Access denied. No token provided', HTTP_STATUS.UNAUTHORIZED);
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if it's a user or provider token
    if (decoded.userId) {
      // User authentication
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return errorResponse(res, 'User not found', HTTP_STATUS.UNAUTHORIZED);
      }
      req.user = user;
      req.userType = 'user';
    } else if (decoded.providerId) {
      // Provider authentication
      const provider = await Provider.findById(decoded.providerId);
      if (!provider) {
        return errorResponse(res, 'Provider not found', HTTP_STATUS.UNAUTHORIZED);
      }
      req.provider = provider;
      req.userType = 'provider';
    } else {
      return errorResponse(res, 'Invalid token format', HTTP_STATUS.UNAUTHORIZED);
    }

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 'Invalid token', HTTP_STATUS.UNAUTHORIZED);
    }
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token expired', HTTP_STATUS.UNAUTHORIZED);
    }
    next(error);
  }
};

/**
 * Optional authentication - doesn't require token but attaches user if present
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.userId) {
        const user = await User.findById(decoded.userId).select('-password');
        if (user) {
          req.user = user;
          req.userType = 'user';
        }
      } else if (decoded.providerId) {
        const provider = await Provider.findById(decoded.providerId);
        if (provider) {
          req.provider = provider;
          req.userType = 'provider';
        }
      }
    }
    next();
  } catch (error) {
    // Don't fail on auth errors for optional auth
    next();
  }
};

/**
 * Require user role (not provider)
 */
export const requireUser = (req, res, next) => {
  if (!req.user || req.userType !== 'user') {
    return errorResponse(res, 'Access denied. User authentication required', HTTP_STATUS.FORBIDDEN);
  }
  next();
};

/**
 * Require provider role (not user)
 */
export const requireProvider = (req, res, next) => {
  if (!req.provider || req.userType !== 'provider') {
    return errorResponse(res, 'Access denied. Provider authentication required', HTTP_STATUS.FORBIDDEN);
  }
  next();
};