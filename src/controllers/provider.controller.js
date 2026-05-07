import  Provider from '../models/Provider.js';
import { findNearbyProviders, updateProviderLocation } from '../services/geo.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Get provider profile by ID (public)
 * GET /api/providers/:id
 */
export const getProvider = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const provider = await Provider.findById(id)
      .populate('categoryId', 'name color');

    if (!provider) {
      return errorResponse(res, 'Provider not found', HTTP_STATUS.NOT_FOUND);
    }

    successResponse(res, {
      provider,
      isOwner: req.provider && req.provider._id.toString() === id
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current provider's own profile (requires provider auth)
 * GET /api/providers/me
 */
export const getMyProviderProfile = async (req, res, next) => {
  try {
    // req.provider is attached by authenticate middleware
    const provider = await Provider.findById(req.provider._id)
      .populate('categoryId', 'name color');

    if (!provider) {
      return errorResponse(res, 'Provider profile not found', HTTP_STATUS.NOT_FOUND);
    }

    successResponse(res, { provider });
  } catch (error) {
    next(error);
  }
};

/**
 * Update provider profile (requires provider auth)
 * PUT /api/providers/me
 */
export const updateProvider = async (req, res, next) => {
  try {
    const updates = req.body;
    const allowedUpdates = [
      'name', 'phone', 'whatsapp', 'description', 
      'radiusKm', 'priceRange', 'experience', 'tags'
    ];
    
    const filteredUpdates = {};
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    const provider = await Provider.findByIdAndUpdate(
      req.provider._id,
      filteredUpdates,
      { new: true, runValidators: true }
    );

    successResponse(res, {
      message: 'Provider profile updated successfully',
      provider
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle provider availability (requires provider auth)
 * PATCH /api/providers/me/toggle
 */
export const toggleAvailability = async (req, res, next) => {
  try {
    const provider = await Provider.findById(req.provider._id);
    
    if (!provider) {
      return errorResponse(res, 'Provider not found', HTTP_STATUS.NOT_FOUND);
    }

    provider.isActive = !provider.isActive;
    await provider.save();

    successResponse(res, {
      message: `Provider is now ${provider.isActive ? 'active' : 'inactive'}`,
      isActive: provider.isActive
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update provider location (requires provider auth)
 * PATCH /api/providers/me/location
 */
export const updateLocation = async (req, res, next) => {
  try {
    const { lng, lat, address } = req.body;

    if (lng === undefined || lat === undefined) {
      return errorResponse(res, 'Longitude and latitude are required', HTTP_STATUS.BAD_REQUEST);
    }

    const provider = await updateProviderLocation(
      req.provider._id,
      parseFloat(lng),
      parseFloat(lat),
      address || 'Updated location'
    );

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
 * Scan for nearby providers (user action - requires user auth OR optional)
 * GET /api/providers/scan
 */
export const scanProviders = async (req, res, next) => {
  try {
    const {
      lng,
      lat,
      category,
      radiusKm = 5,
      limit = 50
    } = req.query;

    if (!lng || !lat || !category) {
      return errorResponse(res, 'Location (lng, lat) and category are required', HTTP_STATUS.BAD_REQUEST);
    }

    // Validate category
    const validCategories = ['fundi', 'food', 'bodaboda', 'salon', 'tutor', 'delivery', 'health'];
    if (!validCategories.includes(category)) {
      return errorResponse(res, 'Invalid category', HTTP_STATUS.BAD_REQUEST);
    }

    // Find nearby providers using dual radius logic
    const providers = await findNearbyProviders({
      userLng: parseFloat(lng),
      userLat: parseFloat(lat),
      searchRadiusKm: parseFloat(radiusKm),
      category,
      limit: parseInt(limit)
    });

    // Log scan for analytics (if user is authenticated)
    if (req.user) {
      // Increment scan counts
      const providerIds = providers.map(p => p._id);
      await Provider.updateMany(
        { _id: { $in: providerIds } },
        { $inc: { totalScans: 1 } }
      );
    }

    successResponse(res, {
      meta: {
        scanLocation: { lng, lat },
        radiusKm: parseFloat(radiusKm),
        category,
        totalResults: providers.length
      },
      providers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get provider analytics (requires provider auth)
 * GET /api/providers/me/analytics
 */
export const getProviderAnalytics = async (req, res, next) => {
  try {
    const provider = await Provider.findById(req.provider._id);

    const analytics = {
      totalScans: provider.totalScans || 0,
      totalContacts: provider.totalContacts || 0,
      rating: provider.rating || 0,
      isVerified: provider.isVerified,
      conversionRate: provider.totalContacts > 0 
        ? ((provider.totalContacts / provider.totalScans) * 100).toFixed(1)
        : 0,
      recommendations: []
    };

    // Add recommendations
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