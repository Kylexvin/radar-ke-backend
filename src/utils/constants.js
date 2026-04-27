/**
 * Application-wide constants
 * RADA KE - Location-aware service discovery platform
 */

// Search radius defaults
export const DEFAULT_SEARCH_RADIUS_KM = 5;
export const MAX_SEARCH_RADIUS_KM = 50;
export const MIN_SEARCH_RADIUS_KM = 1;

// Provider defaults
export const DEFAULT_PROVIDER_RADIUS_KM = 5;
export const MIN_PROVIDER_RADIUS_KM = 1;
export const MAX_PROVIDER_RADIUS_KM = 50;

// Earth's radius in kilometers (for geospatial calculations)
export const EARTH_RADIUS_KM = 6378.1;

// Nairobi city center coordinates (CBD)
export const NAIROBI_CENTER = {
  lng: 36.8219,  // longitude
  lat: -1.2921   // latitude
};

// MVP Categories (7 core service categories)
export const MVP_CATEGORIES = [
  {
    name: 'Fundi',
    slug: 'fundi',
    iconName: 'wrench',
    color: '#3B82F6', // Blue
    description: 'Plumbers, electricians, masons, carpenters'
  },
  {
    name: 'Food',
    slug: 'food',
    iconName: 'restaurant',
    color: '#F97316', // Orange
    description: 'Mama mboga, restaurants, home chefs'
  },
  {
    name: 'Bodaboda',
    slug: 'bodaboda',
    iconName: 'motorcycle',
    color: '#EAB308', // Yellow
    description: 'Motorcycle taxis, tuk-tuks'
  },
  {
    name: 'Salon & Barber',
    slug: 'salon',
    iconName: 'cut',
    color: '#A855F7', // Purple
    description: 'Home visits, walk-in within area'
  },
  {
    name: 'Tutor',
    slug: 'tutor',
    iconName: 'school',
    color: '#22C55E', // Green
    description: 'Home teachers, subject tutors'
  },
  {
    name: 'Delivery',
    slug: 'delivery',
    iconName: 'cube',
    color: '#EF4444', // Red
    description: 'Parcels, groceries, gas cylinders'
  },
  {
    name: 'Healthcare',
    slug: 'health',
    iconName: 'medical',
    color: '#14B8A6', // Teal
    description: 'Nurses, doctors doing home visits'
  }
];

// Category slugs mapping for quick lookups
export const CATEGORY_SLUGS = {
  FUNDI: 'fundi',
  FOOD: 'food',
  BODABODA: 'bodaboda',
  SALON: 'salon',
  TUTOR: 'tutor',
  DELIVERY: 'delivery',
  HEALTHCARE: 'health'
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};

// User roles
export const USER_ROLES = {
  USER: 'user',
  PROVIDER: 'provider'
};

// MongoDB error codes
export const MONGO_ERRORS = {
  DUPLICATE_KEY: 11000
};

// Pagination defaults
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

// Time constants (in milliseconds)
export const TIME = {
  ONE_DAY: 24 * 60 * 60 * 1000,
  ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
  ONE_MONTH: 30 * 24 * 60 * 60 * 1000,
  JWT_EXPIRY: '7d',
  JWT_REFRESH_EXPIRY: '30d'
};

// Cache durations (in seconds)
export const CACHE_TTL = {
  CATEGORIES: 3600,      // 1 hour
  CLUSTERS: 300,         // 5 minutes
  PROVIDER_DETAILS: 600  // 10 minutes
};

// Validation limits
export const VALIDATION = {
  MAX_DESCRIPTION_LENGTH: 500,
  MIN_PASSWORD_LENGTH: 6,
  MAX_NAME_LENGTH: 100,
  MAX_PHONE_LENGTH: 15
};

// Rate limiting
export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100
};

// File upload limits
export const UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
};