import express from 'express';
import {
  registerUser,
  registerProvider,
  login,
  googleAuth,
  refreshToken,
  logout
} from '../controllers/auth.controller.js';
import { validateRequired, validateSchema, validators } from '../middleware/validate.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';

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

// Login route
router.post('/login',
  validateRequired(['usernameOrEmail', 'password']),
  asyncHandler(login)
);

/**
 * @route   POST /api/auth/register/provider
 * @desc    Register a new service provider (local auth - email/password)
 * @access  Public
 */
router.post('/register/provider',
  validateSchema({
    name: { required: true, type: 'string', minLength: 2, maxLength: 100 },
    phone: { 
      required: true, 
      type: 'string', 
      validate: validators.isPhone 
    },
    whatsapp: { 
      required: false, 
      type: 'string', 
      validate: validators.isPhone 
    },
    email: { 
      required: false, 
      type: 'string', 
      validate: validators.isEmail 
    },
    password: { required: true, type: 'string', minLength: 6 },
    category: { required: true, type: 'string' },
    description: { required: false, type: 'string', maxLength: 500 },
    profileImage: { required: false, type: 'string' },
    location: { 
      required: true, 
      type: 'object',
      validate: (value) => {
        if (!value.coordinates || !Array.isArray(value.coordinates) || value.coordinates.length !== 2) {
          return 'Location must have coordinates array [lng, lat]';
        }
        return validators.isCoordinate(value.coordinates);
      }
    },
    radiusKm: { required: false, type: 'number', min: 1, max: 50 }
  }),
  asyncHandler(registerProvider)
);



/**
 * @route   POST /api/auth/google
 * @desc    Google OAuth login/register (supports both user and provider)
 * @access  Public
 * 
 * @body    { googleId, email, name, phone, role }
 * 
 * Example for user:
 * {
 *   "googleId": "1234567890",
 *   "email": "john@gmail.com",
 *   "name": "John Doe",
 *   "phone": "0712345678",
 *   "role": "user"
 * }
 * 
 * Example for provider:
 * {
 *   "googleId": "1234567890",
 *   "email": "provider@gmail.com",
 *   "name": "Provider Name",
 *   "phone": "0712345678",
 *   "role": "provider"
 * }
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
        // Phone is required only for providers, optional for users
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