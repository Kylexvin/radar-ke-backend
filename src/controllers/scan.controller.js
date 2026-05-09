import Category from '../models/Category.js';
import Provider from '../models/Provider.js';
import { findNearbyProviders } from '../services/geo.service.js';  // ADD THIS IMPORT
import { successResponse, errorResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../utils/constants.js';


/**
 * Get category presence (which categories have providers nearby)
 * GET /api/scan/categories/presence
 */
export const getCategoryPresence = async (req, res, next) => {
  try {
    const { lng, lat, radiusKm = 20 } = req.query;

    if (!lng || !lat) {
      return errorResponse(res, 'Location (lng, lat) are required', HTTP_STATUS.BAD_REQUEST);
    }

    // Get all active categories from database
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });

    if (!categories.length) {
      return errorResponse(res, 'No categories found', HTTP_STATUS.NOT_FOUND);
    }

    // For each category, count active providers nearby using categoryId
    const presence = await Promise.all(categories.map(async (category) => {
      const count = await Provider.countDocuments({
        categoryId: category._id,  // FIXED: Use ObjectId, not string slug
        isActive: true,
        location: {
          $geoWithin: {
            $centerSphere: [[parseFloat(lng), parseFloat(lat)], parseFloat(radiusKm) / 6378.1]
          }
        }
      });
      
      return {
        id: category._id,
        slug: category.slug,
        name: category.name,
        iconName: category.iconName,
        color: category.color,
        hasProviders: count > 0,
        count: count
      };
    }));

    // Sort: categories with providers first, then by name
    presence.sort((a, b) => {
      if (a.hasProviders === b.hasProviders) {
        return a.name.localeCompare(b.name);
      }
      return a.hasProviders ? -1 : 1;
    });

    successResponse(res, {
      location: { lng: parseFloat(lng), lat: parseFloat(lat) },
      radiusKm: parseFloat(radiusKm),
      categories: presence,
      totalCategoriesWithProviders: presence.filter(c => c.hasProviders).length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Scan for nearby providers (public)
 * GET /api/providers/scan
 */
/**
 * Scan for providers nearby
 * GET /api/scan/providers
 */
export const scanProviders = async (req, res, next) => {
  try {
    const { lng, lat, category, radiusKm = 5, limit = 50 } = req.query;

    if (!lng || !lat || !category) {
      return errorResponse(res, 'Location (lng, lat) and category are required', HTTP_STATUS.BAD_REQUEST);
    }

    // Validate category exists
    const validCategory = await Category.findOne({ slug: category, isActive: true });
    if (!validCategory) {
      return errorResponse(res, 'Invalid category', HTTP_STATUS.BAD_REQUEST);
    }

    // Find nearby providers using geo service
    const providers = await findNearbyProviders({
      userLng: parseFloat(lng),
      userLat: parseFloat(lat),
      searchRadiusKm: parseFloat(radiusKm),
      categorySlug: category,  // Pass the slug
      limit: parseInt(limit)
    });

    // Increment scan counts for analytics
    if (providers.length > 0) {
      const providerIds = providers.map(p => p._id);
      await Provider.updateMany(
        { _id: { $in: providerIds } },
        { $inc: { totalScans: 1 } }
      );
    }

    successResponse(res, {
      meta: {
        scanLocation: { lng: parseFloat(lng), lat: parseFloat(lat) },
        radiusKm: parseFloat(radiusKm),
        category: category,
        totalResults: providers.length
      },
      providers: providers.map(p => ({
        id: p._id,
        name: p.name,
        phone: p.phone,
        whatsapp: p.whatsapp,
        description: p.description,
        location: p.location,
        locationAddress: p.locationAddress,
        distance: p.distance,
        rating: p.rating,
        isVerified: p.isVerified,
        category: p.category
      }))
    });
  } catch (error) {
    next(error);
  }
};