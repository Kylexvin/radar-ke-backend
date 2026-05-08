import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Provider from '../models/Provider.js';
import Category from '../models/Category.js';
import { successResponse, errorResponse, createdResponse } from '../utils/response.js';
import { HTTP_STATUS, TIME, NAIROBI_CENTER } from '../utils/constants.js';

/**
 * Generate JWT access token
 * @param {Object} payload - Token payload
 * @returns {string} JWT token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: TIME.JWT_EXPIRY });
};

/**
 * Generate JWT refresh token
 * @param {Object} payload - Token payload
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: TIME.JWT_REFRESH_EXPIRY });
};


/**
 * Register a new user
 * POST /api/auth/register/user
 */
export const registerUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Check if username exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return errorResponse(res, 'Username already taken', HTTP_STATUS.CONFLICT);
    }

    // Check if email exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return errorResponse(res, 'Email already registered', HTTP_STATUS.CONFLICT);
    }

    // Create user - name defaults to username
    const user = new User({
      username,
      name: username,
      email,
      password,
      authProvider: 'local',
      searchRadiusKm: 5,
      lastLocation: {
        type: 'Point',
        coordinates: [NAIROBI_CENTER.lng, NAIROBI_CENTER.lat]
      }
    });

    await user.save();

    const accessToken = generateAccessToken({ userId: user._id });
    const refreshToken = generateRefreshToken({ userId: user._id });

    return createdResponse(res, {
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      },
      tokens: { accessToken, refreshToken, expiresIn: TIME.JWT_EXPIRY }
    }, 'User registered successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Register a new service provider
 * POST /api/auth/register/provider
 * @deprecated - Use /api/providers/onboard instead
 */
export const registerProvider = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      whatsapp,
      email,
      password,
      category,
      description,
      profileImage,
      location,
      radiusKm
    } = req.body;

    // Check if provider already exists
    const existingProvider = await Provider.findOne({ $or: [{ phone }, { email }] });
    if (existingProvider) {
      if (existingProvider.phone === phone) {
        return errorResponse(res, 'Phone number already registered', HTTP_STATUS.CONFLICT);
      }
      if (email && existingProvider.email === email) {
        return errorResponse(res, 'Email already registered', HTTP_STATUS.CONFLICT);
      }
    }

    // Verify category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return errorResponse(res, 'Invalid category', HTTP_STATUS.BAD_REQUEST);
    }

    // Create new provider
    const provider = new Provider({
      name,
      phone,
      whatsapp: whatsapp || phone,
      email: email || null,
      password,
      authProvider: 'local',
      category,
      description: description || '',
      profileImage: profileImage || '',
      location: {
        type: 'Point',
        coordinates: location.coordinates || [NAIROBI_CENTER.lng, NAIROBI_CENTER.lat]
      },
      radiusKm: radiusKm || 5,
      isActive: true,
      isVerified: false,
      rating: 0,
      totalRatings: 0,
      scanImpressions: 0
    });

    await provider.save();

    // Generate tokens
    const accessToken = generateAccessToken({ providerId: provider._id });
    const refreshToken = generateRefreshToken({ providerId: provider._id });

    // Return provider data
    const providerData = {
      id: provider._id,
      name: provider.name,
      phone: provider.phone,
      whatsapp: provider.whatsapp,
      email: provider.email,
      category: provider.category,
      description: provider.description,
      profileImage: provider.profileImage,
      location: provider.location,
      radiusKm: provider.radiusKm,
      isActive: provider.isActive,
      isVerified: provider.isVerified,
      createdAt: provider.createdAt
    };

    return createdResponse(res, {
      provider: providerData,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: TIME.JWT_EXPIRY
      }
    }, 'Provider registered successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Login user with usernameOrEmail + password
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { usernameOrEmail, password, role } = req.body;

    let user = null;
    let provider = null;
    let userType = null;

    // Check if usernameOrEmail is email or username
    const isEmail = usernameOrEmail.includes('@');

    // Find user by email OR username
    if (!role || role === 'user') {
      const query = isEmail 
        ? { email: usernameOrEmail.toLowerCase() }
        : { username: usernameOrEmail };
      
      console.log('Query:', query);
      
      user = await User.findOne(query).select('+password');
      console.log('Found user:', user ? user.username : 'null');
      
      if (user) {
        userType = 'user';
      }
    }

    if (!user && (!role || role === 'provider')) {
      const query = isEmail 
        ? { email: usernameOrEmail.toLowerCase() }
        : { username: usernameOrEmail };
      
      provider = await Provider.findOne(query).select('+password');
      if (provider) {
        userType = 'provider';
      }
    }

    if (!user && !provider) {
      return errorResponse(res, 'Account not found. Please register first', HTTP_STATUS.NOT_FOUND);
    }

    // Verify password
    let isValidPassword = false;
    if (userType === 'user') {
      isValidPassword = await user.comparePassword(password);
    } else {
      isValidPassword = await provider.comparePassword(password);
    }

    if (!isValidPassword) {
      return errorResponse(res, 'Invalid credentials', HTTP_STATUS.UNAUTHORIZED);
    }

    // Generate tokens
    let accessToken;
    let refreshToken;
    let responseData = {};

    if (userType === 'user') {
      accessToken = generateAccessToken({ userId: user._id });
      refreshToken = generateRefreshToken({ userId: user._id });
      
      // Check if this user has a provider profile (onboarded as provider)
      const providerProfile = await Provider.findOne({ userId: user._id });
      
      responseData = {
        userType: 'user',
        user: {
          id: user._id,
          username: user.username,
          name: user.name,
          email: user.email,
          searchRadiusKm: user.searchRadiusKm
        },
        hasProviderProfile: !!providerProfile,  // true if provider record exists
        providerProfile: providerProfile ? {
          id: providerProfile._id,
          businessName: providerProfile.name,
          category: providerProfile.category,
          isActive: providerProfile.isActive,
          isVerified: providerProfile.isVerified
        } : null,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: TIME.JWT_EXPIRY
        }
      };
    } else {
      accessToken = generateAccessToken({ providerId: provider._id });
      refreshToken = generateRefreshToken({ providerId: provider._id });
      
      responseData = {
        userType: 'provider',
        isProfileComplete: !!(provider.category && provider.location?.coordinates),
        provider: {
          id: provider._id,
          name: provider.name,
          email: provider.email,
          category: provider.category,
          isActive: provider.isActive,
          isVerified: provider.isVerified
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: TIME.JWT_EXPIRY
        }
      };
    }

    return successResponse(res, responseData, 'Login successful');
  } catch (error) {
    next(error);
  }
};

/**
 * Register/Login with Google
 * POST /api/auth/google
 */
export const googleAuth = async (req, res, next) => {
  try {
    const { googleId, email, name, phone, role } = req.body;

    if (role === 'provider') {
      // Check if provider exists with googleId OR email
      let provider = await Provider.findOne({ 
        $or: [{ googleId }, { email }] 
      });

      if (!provider) {
        // Create new provider with Google auth
        provider = new Provider({
          googleId,
          email,
          name,
          phone: phone,
          authProvider: 'google',
          isVerified: true,
          category: null,
          location: {
            type: 'Point',
            coordinates: [NAIROBI_CENTER.lng, NAIROBI_CENTER.lat]
          },
          radiusKm: 5,
          isActive: true
        });
        await provider.save();
      } else if (!provider.googleId) {
        provider.googleId = googleId;
        provider.authProvider = 'google';
        await provider.save();
      }

      const accessToken = generateAccessToken({ providerId: provider._id });
      const refreshToken = generateRefreshToken({ providerId: provider._id });

      const isProfileComplete = !!(provider.category && 
                                   provider.location && 
                                   provider.location.coordinates);

      return successResponse(res, {
        userType: 'provider',
        isProfileComplete,
        provider: {
          id: provider._id,
          name: provider.name,
          email: provider.email,
          phone: provider.phone,
          category: provider.category,
          isActive: provider.isActive,
          isVerified: provider.isVerified,
          profileImage: provider.profileImage,
          radiusKm: provider.radiusKm
        },
        tokens: { 
          accessToken, 
          refreshToken, 
          expiresIn: TIME.JWT_EXPIRY 
        }
      }, 'Google login successful');
    } 
    
    else if (role === 'user') {
      let user = await User.findOne({ 
        $or: [{ googleId }, { email }] 
      });

      if (!user) {
        user = new User({
          googleId,
          email,
          name,
          phone: phone || '',
          authProvider: 'google',
          searchRadiusKm: 5,
          lastLocation: {
            type: 'Point',
            coordinates: [NAIROBI_CENTER.lng, NAIROBI_CENTER.lat]
          }
        });
        await user.save();
      } else if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
        await user.save();
      }

      const accessToken = generateAccessToken({ userId: user._id });
      const refreshToken = generateRefreshToken({ userId: user._id });

      // Check if this user has a provider profile
      const providerProfile = await Provider.findOne({ userId: user._id });

      return successResponse(res, {
        userType: 'user',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          searchRadiusKm: user.searchRadiusKm
        },
        hasProviderProfile: !!providerProfile,
        providerProfile: providerProfile ? {
          id: providerProfile._id,
          businessName: providerProfile.name,
          category: providerProfile.category,
          isActive: providerProfile.isActive,
          isVerified: providerProfile.isVerified
        } : null,
        tokens: { 
          accessToken, 
          refreshToken, 
          expiresIn: TIME.JWT_EXPIRY 
        }
      }, 'Google login successful');
    }
    
    else {
      return errorResponse(res, 'Invalid role specified', HTTP_STATUS.BAD_REQUEST);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token using refresh token
 * POST /api/auth/refresh
 */
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: refreshTokenValue } = req.body;

    if (!refreshTokenValue) {
      return errorResponse(res, 'Refresh token required', HTTP_STATUS.BAD_REQUEST);
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshTokenValue, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return errorResponse(res, 'Refresh token expired. Please login again', HTTP_STATUS.UNAUTHORIZED);
      }
      return errorResponse(res, 'Invalid refresh token', HTTP_STATUS.UNAUTHORIZED);
    }

    let newAccessToken;
    let userType;

    if (decoded.userId) {
      const user = await User.findById(decoded.userId);
      if (!user) {
        return errorResponse(res, 'User no longer exists', HTTP_STATUS.UNAUTHORIZED);
      }
      newAccessToken = generateAccessToken({ userId: user._id });
      userType = 'user';
    } else if (decoded.providerId) {
      const provider = await Provider.findById(decoded.providerId);
      if (!provider) {
        return errorResponse(res, 'Provider no longer exists', HTTP_STATUS.UNAUTHORIZED);
      }
      newAccessToken = generateAccessToken({ providerId: provider._id });
      userType = 'provider';
    } else {
      return errorResponse(res, 'Invalid token payload', HTTP_STATUS.UNAUTHORIZED);
    }

    return successResponse(res, {
      userType,
      accessToken: newAccessToken,
      expiresIn: TIME.JWT_EXPIRY
    }, 'Token refreshed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Logout (client-side token discard)
 * POST /api/auth/logout
 */
export const logout = async (req, res, next) => {
  try {
    return successResponse(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};