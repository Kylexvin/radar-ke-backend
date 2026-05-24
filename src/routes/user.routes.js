import express from 'express';
import {
  registerUser,
  getMe,
  login,
  googleAuth,
  refreshToken,
  logout
} from '../controllers/auth.controller.js';
import { validateRequired, validateSchema, validators } from '../middleware/validate.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';  

const router = express.Router();

// Register user route
router.post('/register/user',
  validateSchema({
    username: { 
      required: true, 
      type: 'string', 
      minLength: 3, 
      maxLength: 30 
    },
    email: { 
      required: true, 
      type: 'string', 
      validate: validators.isEmail 
    },
    password: { 
      required: true, 
      type: 'string', 
      minLength: 6 
    },
    name: { 
      required: false, 
      type: 'string', 
      minLength: 2 
    }
  }),
  asyncHandler(registerUser)
);

// Get current user (protected route)
router.get('/me', authenticate, asyncHandler(getMe));  // ADDED authenticate

// Login route
router.post('/login',
  validateRequired(['usernameOrEmail', 'password']),
  asyncHandler(login)
);

/**
 * @route   POST /api/auth/google
 * @desc    Google OAuth login/register
 * @access  Public
 */
router.post('/google',
  validateSchema({
    googleId: { required: true, type: 'string' },
    email: { 
      required: true, 
      type: 'string', 
      validate: validators.isEmail 
    },
    name: { required: true, type: 'string', minLength: 2, maxLength: 100 },
    phone: { 
      required: function(body) {
        return body.role === 'provider';
      }, 
      type: 'string', 
      validate: validators.isPhone 
    },
    role: { 
      required: true, 
      type: 'string',
      validate: (value) => {
        if (!['user', 'provider'].includes(value)) {
          return 'Role must be either "user" or "provider"';
        }
        return null;
      }
    }
  }),
  asyncHandler(googleAuth)
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh',
  validateRequired(['refreshToken']),
  asyncHandler(refreshToken)
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user/provider (client-side token discard)
 * @access  Public
 */
router.post('/logout',
  asyncHandler(logout)
);

export default router;