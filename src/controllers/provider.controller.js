import Provider from '../models/Provider.js';
import { findNearbyProviders, updateProviderLocation } from '../services/geo.service.js';
import Category from '../models/Category.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../utils/constants.js';

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Safe provider shape for public responses (scan results, detail screen)
 */
const publicProviderShape = (p) => ({
  id: p._id,
  name: p.name,
  phone: p.phone,
  whatsapp: p.whatsapp,
  description: p.description,
  location: p.location,
  locationAddress: p.locationAddress,
  radiusKm: p.radiusKm,
  distance: p.distance,
  rating: p.rating,
  totalRatings: p.totalRatings,
  isVerified: p.isVerified,
  isActive: p.isActive,
  category: p.category,
  capabilities: {
    canBeContacted: p.capabilities?.canBeContacted ?? true,
    hasShowcase: p.capabilities?.hasShowcase ?? false,
    hasShop: p.capabilities?.hasShop ?? false,
    takesBookings: p.capabilities?.takesBookings ?? false,
  },
});

/**
 * Safe provider shape for the owner (my profile responses)
 */
const ownerProviderShape = (p) => ({
  id: p._id,
  businessName: p.name,
  phone: p.phone,
  whatsapp: p.whatsapp,
  email: p.email,
  description: p.description,
  locationAddress: p.locationAddress,
  radiusKm: p.radiusKm,
  isActive: p.isActive,
  isVerified: p.isVerified,
  rating: p.rating,
  totalRatings: p.totalRatings,
  totalScans: p.totalScans,
  totalContacts: p.totalContacts,
  priceRange: p.priceRange,
  experience: p.experience,
  tags: p.tags,
  capabilities: {
    canBeContacted: p.capabilities?.canBeContacted ?? true,
    hasShowcase: p.capabilities?.hasShowcase ?? false,
    hasShop: p.capabilities?.hasShop ?? false,
    takesBookings: p.capabilities?.takesBookings ?? false,
  },
  categoryId: p.categoryId,
  createdAt: p.createdAt,
});

// ─────────────────────────────────────────────────────────────
// ONBOARDING
// ─────────────────────────────────────────────────────────────

/**
 * Onboard existing user as a provider
 * POST /api/providers/onboard
 */
export const onboardAsProvider = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const existingProvider = await Provider.findOne({ userId });
    if (existingProvider) {
      return errorResponse(res, 'You are already a provider', HTTP_STATUS.CONFLICT);
    }

    const {
      businessName,
      phone,
      whatsapp,
      categoryId,
      description,
      locationLng,
      locationLat,
      locationAddress,
      radiusKm,
    } = req.body;

    if (!businessName || !phone || !categoryId || !locationLng || !locationLat) {
      return errorResponse(
        res,
        'Missing required fields: businessName, phone, categoryId, location',
        HTTP_STATUS.BAD_REQUEST
      );
    }

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
        coordinates: [parseFloat(locationLng), parseFloat(locationLat)],
      },
      locationAddress: locationAddress || '',
      radiusKm: radiusKm || 5,
      isActive: true,
      isVerified: false,
      capabilities: {
        canBeContacted: true,
        hasShowcase: false,
        hasShop: false,
        takesBookings: false,
      },
    });

    await provider.save();
    await provider.populate('categoryId', 'name slug iconName color');

    return successResponse(res, {
      message: 'Provider profile created successfully',
      provider: {
        id: provider._id,
        businessName: provider.name,
        phone: provider.phone,
        isActive: provider.isActive,
        isVerified: provider.isVerified,
        radiusKm: provider.radiusKm,
        category: provider.categoryId.name,
        categorySlug: provider.categoryId.slug,
        iconName: provider.categoryId.iconName,
        color: provider.categoryId.color,
        capabilities: provider.capabilities,
      },
    }, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────

/**
 * Get own provider profile
 * GET /api/providers/me
 */
export const getMyProviderProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const provider = await Provider.findOne({ userId }).populate('categoryId', 'name slug iconName color');

    if (!provider) {
      return errorResponse(res, 'Provider profile not found', HTTP_STATUS.NOT_FOUND);
    }

    return successResponse(res, { provider: ownerProviderShape(provider) });
  } catch (error) {
    next(error);
  }
};

/**
 * Get public provider profile by ID
 * GET /api/providers/:id
 */
export const getProvider = async (req, res, next) => {
  try {
    const provider = await Provider.findById(req.params.id)
      .populate('categoryId', 'name slug iconName color');

    if (!provider) {
      return errorResponse(res, 'Provider not found', HTTP_STATUS.NOT_FOUND);
    }

    return successResponse(res, { provider: publicProviderShape(provider) });
  } catch (error) {
    next(error);
  }
};

/**
 * Update own provider profile
 * PUT /api/providers/me
 */
export const updateProvider = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const provider = await Provider.findOne({ userId });

    if (!provider) {
      return errorResponse(res, 'Provider profile not found', HTTP_STATUS.NOT_FOUND);
    }

    const {
      businessName,
      phone,
      whatsapp,
      description,
      locationAddress,
      radiusKm,
      priceRange,
      experience,
      tags,
      categoryId,
    } = req.body;

    // Only update fields that were sent
    if (businessName) provider.name = businessName.trim();
    if (phone) provider.phone = phone.trim();
    if (whatsapp !== undefined) provider.whatsapp = whatsapp.trim();
    if (description !== undefined) provider.description = description.trim();
    if (locationAddress !== undefined) provider.locationAddress = locationAddress.trim();
    if (radiusKm) provider.radiusKm = Math.min(50, Math.max(1, Number(radiusKm)));
    if (priceRange) provider.priceRange = priceRange;
    if (experience !== undefined) provider.experience = experience;
    if (tags) provider.tags = tags;

    if (categoryId) {
      const category = await Category.findById(categoryId);
      if (!category) return errorResponse(res, 'Invalid category', HTTP_STATUS.BAD_REQUEST);
      provider.categoryId = category._id;
    }

    await provider.save();

    return successResponse(res, {
      message: 'Profile updated successfully',
      provider: ownerProviderShape(provider),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle provider active/inactive (Live toggle)
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

    return successResponse(res, {
      message: `You are now ${provider.isActive ? 'live' : 'hidden'}`,
      isActive: provider.isActive,
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
    const { locationLng, locationLat, locationAddress } = req.body;

    if (!locationLng || !locationLat) {
      return errorResponse(res, 'locationLng and locationLat are required', HTTP_STATUS.BAD_REQUEST);
    }

    const provider = await Provider.findOne({ userId });
    if (!provider) {
      return errorResponse(res, 'Provider profile not found', HTTP_STATUS.NOT_FOUND);
    }

    provider.location = {
      type: 'Point',
      coordinates: [parseFloat(locationLng), parseFloat(locationLat)],
    };
    if (locationAddress) provider.locationAddress = locationAddress;

    await provider.save();

    return successResponse(res, {
      message: 'Location updated',
      location: provider.location,
      locationAddress: provider.locationAddress,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// CAPABILITIES
// ─────────────────────────────────────────────────────────────

/**
 * Update capabilities
 * PATCH /api/providers/me/capabilities
 */
export const updateCapabilities = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const provider = await Provider.findOne({ userId });

    if (!provider) {
      return errorResponse(res, 'Provider profile not found', HTTP_STATUS.NOT_FOUND);
    }

    const { hasShowcase, hasShop, takesBookings } = req.body;

    // canBeContacted is always true — never allow it to be turned off
    if (hasShowcase !== undefined) provider.capabilities.hasShowcase = !!hasShowcase;
    if (hasShop !== undefined) provider.capabilities.hasShop = !!hasShop;
    if (takesBookings !== undefined) provider.capabilities.takesBookings = !!takesBookings;

    await provider.save();

    return successResponse(res, {
      message: 'Capabilities updated',
      capabilities: provider.capabilities,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// SHOWCASE — OWNER (manage)
// ─────────────────────────────────────────────────────────────

/**
 * Add showcase item
 * POST /api/providers/me/showcase
 */
export const addShowcaseItem = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const provider = await Provider.findOne({ userId });

    if (!provider) {
      return errorResponse(res, 'Provider profile not found', HTTP_STATUS.NOT_FOUND);
    }

    if (!provider.capabilities.hasShowcase) {
      return errorResponse(res, 'Enable Showcase capability first', HTTP_STATUS.FORBIDDEN);
    }

    const { name, description, price, priceLabel, category, imageUrl } = req.body;

    if (!name || price === undefined) {
      return errorResponse(res, 'name and price are required', HTTP_STATUS.BAD_REQUEST);
    }

    provider.showcaseItems.push({
      name: name.trim(),
      description: description?.trim(),
      price: Number(price),
      priceLabel: priceLabel?.trim(),
      category: category?.trim(),
      imageUrl,
      isAvailable: true,
    });

    await provider.save();
    const newItem = provider.showcaseItems[provider.showcaseItems.length - 1];

    return successResponse(res, { message: 'Item added', item: newItem }, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Update showcase item
 * PUT /api/providers/me/showcase/:itemId
 */
export const updateShowcaseItem = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { itemId } = req.params;

    const provider = await Provider.findOne({ userId });
    if (!provider) {
      return errorResponse(res, 'Provider profile not found', HTTP_STATUS.NOT_FOUND);
    }

    const item = provider.showcaseItems.id(itemId);
    if (!item) {
      return errorResponse(res, 'Item not found', HTTP_STATUS.NOT_FOUND);
    }

    const { name, description, price, priceLabel, category, imageUrl, isAvailable } = req.body;

    if (name !== undefined) item.name = name.trim();
    if (description !== undefined) item.description = description.trim();
    if (price !== undefined) item.price = Number(price);
    if (priceLabel !== undefined) item.priceLabel = priceLabel.trim();
    if (category !== undefined) item.category = category.trim();
    if (imageUrl !== undefined) item.imageUrl = imageUrl;
    if (isAvailable !== undefined) item.isAvailable = !!isAvailable;

    await provider.save();

    return successResponse(res, { message: 'Item updated', item });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete showcase item
 * DELETE /api/providers/me/showcase/:itemId
 */
export const deleteShowcaseItem = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { itemId } = req.params;

    const provider = await Provider.findOne({ userId });
    if (!provider) {
      return errorResponse(res, 'Provider profile not found', HTTP_STATUS.NOT_FOUND);
    }

    const item = provider.showcaseItems.id(itemId);
    if (!item) {
      return errorResponse(res, 'Item not found', HTTP_STATUS.NOT_FOUND);
    }

    item.deleteOne();
    await provider.save();

    return successResponse(res, { message: 'Item removed' });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle showcase item availability
 * PATCH /api/providers/me/showcase/:itemId/toggle
 */
export const toggleShowcaseItem = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { itemId } = req.params;

    const provider = await Provider.findOne({ userId });
    if (!provider) {
      return errorResponse(res, 'Provider profile not found', HTTP_STATUS.NOT_FOUND);
    }

    const item = provider.showcaseItems.id(itemId);
    if (!item) {
      return errorResponse(res, 'Item not found', HTTP_STATUS.NOT_FOUND);
    }

    item.isAvailable = !item.isAvailable;
    await provider.save();

    return successResponse(res, {
      message: `Item is now ${item.isAvailable ? 'available' : 'unavailable'}`,
      isAvailable: item.isAvailable,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// SHOWCASE — PUBLIC (browse)
// ─────────────────────────────────────────────────────────────

/**
 * Get provider showcase items (public)
 * GET /api/providers/:id/showcase
 */
export const getProviderShowcase = async (req, res, next) => {
  try {
    const provider = await Provider.findById(req.params.id).select('name showcaseItems capabilities isActive');

    if (!provider) {
      return errorResponse(res, 'Provider not found', HTTP_STATUS.NOT_FOUND);
    }

    if (!provider.capabilities?.hasShowcase) {
      return errorResponse(res, 'This provider has no showcase', HTTP_STATUS.NOT_FOUND);
    }

    // Separate available and unavailable
    const available = provider.showcaseItems.filter(i => i.isAvailable);
    const unavailable = provider.showcaseItems.filter(i => !i.isAvailable);

    return successResponse(res, {
      providerName: provider.name,
      isActive: provider.isActive,
      totalItems: provider.showcaseItems.length,
      available,
      unavailable,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────────────────────

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

    // Profile completeness
    const completionChecks = [
      !!provider.name,
      !!provider.phone,
      !!provider.whatsapp,
      !!provider.description,
      !!provider.categoryId,
    ];
    const completionPct = Math.round(
      (completionChecks.filter(Boolean).length / completionChecks.length) * 100
    );

    // Conversion rate
    const conversionRate = provider.totalScans > 0
      ? ((provider.totalContacts / provider.totalScans) * 100).toFixed(1)
      : 0;

    // Recommendations
    const recommendations = [];
    if (!provider.description) recommendations.push('Add a description to get more contacts');
    if (!provider.whatsapp) recommendations.push('Add WhatsApp to get 3x more contacts');
    if (completionPct < 100) recommendations.push('Complete your profile to appear in more scans');
    if (!provider.isVerified && provider.totalScans > 50) {
      recommendations.push('Apply for verification to boost visibility');
    }
    if (!provider.capabilities.hasShowcase) {
      recommendations.push('Enable Showcase to display what you offer');
    }

    return successResponse(res, {
      totalScans: provider.totalScans || 0,
      totalContacts: provider.totalContacts || 0,
      rating: provider.rating || 0,
      totalRatings: provider.totalRatings || 0,
      isVerified: provider.isVerified,
      conversionRate: Number(conversionRate),
      completionPct,
      showcaseItemCount: provider.showcaseItems?.length || 0,
      recommendations,
    });
  } catch (error) {
    next(error);
  }
};