import Provider from '../models/Provider.js';
import { findNearbyProviders, updateProviderLocation } from '../services/geo.service.js';
import Category from '../models/Category.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Onboard existing user as a provider (like Google My Business)
 * POST /api/providers/onboard
 */
export const onboardAsProvider = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Check if user already has a provider profile
    const existingProvider = await Provider.findOne({ userId });
    if (existingProvider) {
      return errorResponse(res, 'You are already a provider', HTTP_STATUS.CONFLICT);
    }

    const {
      businessName,
      phone,
      whatsapp,
      categoryId,        // Now expecting ObjectId
      description,
      locationLng,
      locationLat,
      locationAddress,
      radiusKm
    } = req.body;

    if (!businessName || !phone || !categoryId || !locationLng || !locationLat) {
      return errorResponse(res, 'Missing required fields: businessName, phone, categoryId, location', HTTP_STATUS.BAD_REQUEST);
    }

    // Validate category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return errorResponse(res, 'Invalid category', HTTP_STATUS.BAD_REQUEST);
    }

    const provider = new Provider({
      userId,
      name: businessName,
      phone,
      whatsapp: whatsapp || phone,
      categoryId: category._id,
      description: description || '',
      profileImage: req.file?.path || null,
      location: {
        type: 'Point',
        coordinates: [parseFloat(locationLng), parseFloat(locationLat)]
      },
      locationAddress: locationAddress || '',
      radiusKm: radiusKm || 5,
      isActive: true,
      isVerified: false,
      totalScans: 0,
      totalContacts: 0
    });

    await provider.save();

    // Populate category for response
    await provider.populate('categoryId', 'name slug iconName color');

    return successResponse(res, {
      message: 'Provider profile created successfully',
      provider: {
        id: provider._id,
        businessName: provider.name,
        category: provider.categoryId.name,
        categorySlug: provider.categoryId.slug,
        iconName: provider.categoryId.iconName,
        color: provider.categoryId.color,
        isActive: provider.isActive,
        isVerified: provider.isVerified,
        radiusKm: provider.radiusKm
      }
    }, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Get provider profile by ID (public)
 * GET /api/providers/:id
 */
export const getProvider = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const provider = await Provider.findById(id);

    if (!provider) {
      return errorResponse(res, 'Provider not found', HTTP_STATUS.NOT_FOUND);
    }

    // Check if the requesting user owns this provider profile
    const isOwner = req.user && provider.userId.toString() === req.user._id.toString();

    successResponse(res, {
      provider,
      isOwner
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user's provider profile
 * GET /api/providers/me
 */
export const getMyProviderProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    const provider = await Provider.findOne({ userId });

    if (!provider) {
      return errorResponse(res, 'You are not a provider yet. Onboard first.', HTTP_STATUS.NOT_FOUND);
    }

    successResponse(res, { provider });
  } catch (error) {
    next(error);
  }
};

/**
 * Update provider profile
 * PUT /api/providers/me
 */
export const updateProvider = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    const allowedUpdates = ['name', 'phone', 'whatsapp', 'description', 'radiusKm', 'priceRange', 'experience', 'tags'];
    const updates = {};
    
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const provider = await Provider.findOneAndUpdate(
      { userId },
      updates,
      { new: true, runValidators: true }
    );

    if (!provider) {
      return errorResponse(res, 'Provider profile not found', HTTP_STATUS.NOT_FOUND);
    }

    successResponse(res, {
      message: 'Provider profile updated successfully',
      provider
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle provider availability
 * PATCH /api/providers/me/toggle
 */
export const toggleAvailability = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    const provider = await Provider.findOne({ userId });
    
    if (!provider) {
      return errorResponse(res, 'Provider profile not found', HTTP_STATUS.NOT_FOUND);
    }

    provider.isActive = !provider.isActive;
    await provider.save();

    successResponse(res, {
      message: provider.isActive ? 'You are now accepting jobs' : 'You are now offline',
      isActive: provider.isActive
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update provider location
 * PATCH /api/providers/me/location
 */
export const updateLocation = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { lng, lat, address } = req.body;

    if (lng === undefined || lat === undefined) {
      return errorResponse(res, 'Longitude and latitude are required', HTTP_STATUS.BAD_REQUEST);
    }

    const provider = await Provider.findOne({ userId });
    
    if (!provider) {
      return errorResponse(res, 'Provider profile not found', HTTP_STATUS.NOT_FOUND);
    }

    provider.location = {
      type: 'Point',
      coordinates: [parseFloat(lng), parseFloat(lat)]
    };
    provider.locationAddress = address || provider.locationAddress;
    await provider.save();

    successResponse(res, {
      message: 'Location updated successfully',
      location: provider.location,
      locationAddress: provider.locationAddress
    });
  } catch (error) {
    next(error);
  }
};


/**
 * Get provider analytics
 * GET /api/providers/me/analytics
 */
export const getProviderAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const provider = await Provider.findOne({ userId });

    if (!provider) {
      return errorResponse(res, 'Provider profile not found', HTTP_STATUS.NOT_FOUND);
    }

    const analytics = {
      totalScans: provider.totalScans || 0,
      totalContacts: provider.totalContacts || 0,
      rating: provider.rating || 0,
      isVerified: provider.isVerified,
      conversionRate: provider.totalScans > 0 
        ? ((provider.totalContacts / provider.totalScans) * 100).toFixed(1)
        : 0,
      recommendations: []
    };

    if (analytics.totalScans < 10) {
      analytics.recommendations.push('Complete your profile to appear in more scans');
    }
    
    if (!provider.isVerified && analytics.totalScans > 50) {
      analytics.recommendations.push('Apply for verification to boost visibility');
    }

    successResponse(res, analytics);
  } catch (error) {
    next(error);
  }
};