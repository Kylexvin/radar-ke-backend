import Provider from '../models/Provider.js';

/**
 * Find providers within both user's search radius AND provider's service radius
 * Dual Radius Model implementation
 */
export const findNearbyProviders = async ({
  userLng,
  userLat,
  searchRadiusKm,
  category,
  limit = 50
}) => {
  const pipeline = [
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [parseFloat(userLng), parseFloat(userLat)]
        },
        distanceField: 'distance',
        distanceMultiplier: 0.001, // Convert meters to km
        spherical: true,
        key: 'location'
      }
    },
    {
      $match: {
        isActive: true,
        category: category
      }
    },
    {
      $match: {
        $expr: {
          $and: [
            { $lte: ['$distance', searchRadiusKm] }, // Within user's radius
            { $lte: ['$distance', '$radiusKm'] }     // Within provider's radius
          ]
        }
      }
    },
    {
      $sort: {
        isVerified: -1,
        rating: -1,
        distance: 1
      }
    },
    {
      $limit: limit
    }
  ];

  return await Provider.aggregate(pipeline);
};

/**
 * Update provider's location
 */
export const updateProviderLocation = async (providerId, lng, lat, address) => {
  return await Provider.findByIdAndUpdate(
    providerId,
    {
      location: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      locationAddress: address
    },
    { new: true }
  );
};

/**
 * Get distance between two points in km
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Get provider by ID with service area
 */
export const getProviderWithServiceArea = async (providerId) => {
  const provider = await Provider.findById(providerId)
    .populate('categoryId', 'name color');
  
  if (!provider) return null;
  
  const [lng, lat] = provider.location.coordinates;
  
  return {
    ...provider.toObject(),
    serviceArea: {
      center: { latitude: lat, longitude: lng },
      radiusKm: provider.radiusKm,
      address: provider.locationAddress
    }
  };
};

/**
 * Get provider analytics data
 */
export const getProviderStats = async (providerId) => {
  const provider = await Provider.findById(providerId);
  
  if (!provider) return null;
  
  return {
    totalScans: provider.totalScans || 0,
    totalContacts: provider.totalContacts || 0,
    rating: provider.rating || 0,
    totalRatings: provider.totalRatings || 0,
    isVerified: provider.isVerified,
    isActive: provider.isActive,
    conversionRate: provider.totalScans > 0 
      ? ((provider.totalContacts / provider.totalScans) * 100).toFixed(1)
      : 0
  };
}; 