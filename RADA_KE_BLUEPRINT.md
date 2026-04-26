# RADA KE — Product Blueprint
> Version 1.0 | Initial Plan | Nairobi MVP

---

## 1. CONCEPT

Rada Ke is a **location-aware service discovery platform** for Kenya.

Service providers broadcast their availability with a GPS coordinate and a reach radius. Users open the app and see every service that covers their current location — no typing a city, no browsing a directory. Just *what's available where you are, right now.*

The name *Rada* draws from radar — the app scans your environment for services, resolving from ambient category signals into sharp individual providers when you search.

**Core distinction from Google Maps / competitors:**
- Models informal and mobile providers (fundis, bodaboda, home tutors) who have no fixed address
- Radius-as-service-area: a provider doesn't operate from a pin, they operate from a zone
- Scan-first UX: services are hidden until searched — intentional, not a limitation

---

## 2. TARGET MARKET

**Pilot City:** Nairobi (CBD and surrounding estates)  
**Expand to:** Eldoret, Mombasa, Kisumu  
**Users:** General Kenyan public — anyone needing local services  
**Providers:** Informal and semi-formal service providers — fundis, food vendors, boda operators, tutors, salons, delivery agents, healthcare workers

---

## 3. MVP CATEGORIES (7)

| # | Category | Icon Color | Examples |
|---|----------|------------|---------|
| 1 | Fundi | Blue | Plumber, electrician, mason, carpenter |
| 2 | Food | Orange | Mama mboga, restaurant, home chef |
| 3 | Bodaboda | Yellow | Motorcycle taxi, tuk-tuk |
| 4 | Salon & Barber | Purple | Home visits, walk-in within area |
| 5 | Tutor | Green | Home teachers, subject tutors |
| 6 | Delivery | Red | Parcels, groceries, gas cylinders |
| 7 | Healthcare | Teal | Nurses, doctors doing home visits |

---

## 4. USER TYPES

### 4.1 App User (Customer)
- Searches for services in their current area
- Sets their search radius (default 5km)
- Scans by category to reveal providers
- Views provider profile, contacts, gets directions

### 4.2 Service Provider
- Registers their service with location + radius
- Sets their own reach radius (how far they serve)
- Toggles availability (active / inactive)
- Receives impressions analytics (how many users scanned them)

---

## 5. THE DUAL RADIUS MODEL

This is the core mechanic. Two radii must overlap for a service to appear:

```
Provider sets:   radiusKm = 8   (I serve within 8km of my base)
User sets:       searchKm = 5   (Show me services within 5km of me)

Service appears only if: user's location falls within provider's circle
                         AND provider's location falls within user's search circle
```

**Why this matters:**
- A provider 10km away with a 2km radius won't show up — they can't reach you
- A provider 3km away with a 15km radius will show up — they cover your area
- Keeps results honest: every result shown can actually serve that user
- Providers control their own market reach

---

## 6. UX FLOW

### 6.1 Landing (No Location Yet)

```
┌─────────────────────────────┐
│                             │
│      RADA KE                │
│   What do you need today?   │
│                             │
│  [  Search or tap below  ]  │
│                             │
│  [Fundi][Food][Boda][Salon] │
│  [Tutor][Delivery][Health]  │
│                             │
│  Allow location to see      │
│  what's around you →        │
└─────────────────────────────┘
```

- Category chips answer "what do you need" passively
- Location request is contextual — triggered when user taps a category (not a cold prompt)
- If location denied: default to city-center coordinates (IP-based fallback)

### 6.2 Map Loads (Before Scan)

- Map blooms open — the wow moment
- Category presence indicators float as soft ambient pulses
- NOT individual services — just "there is Food coverage here", "there is Fundi coverage here"
- Pulse size reflects density: faint = 1–2 providers, strong = 10+ providers
- Color coded per category

```
( ( Food ) )     ← soft orange ambient ring, 3 providers
  ( Fundi )      ← faint blue ring, 1 provider nearby
      ( ( Boda ) ) ← bright yellow, 8 providers
```

### 6.3 After Scan (User Taps Category or Searches)

- Category pulse **resolves** into individual sharp provider pings
- Animation: one fuzzy blob splits into multiple precise dots — sonar lock-on
- Bottom sheet slides up with list of providers sorted by distance
- Each provider card shows: name, distance, rating, availability badge, WhatsApp/call CTA

### 6.4 No Results State

```
No Fundis found within 5km.
[Expand search to 15km →]
```

One-tap expansion. Handles sparse coverage gracefully.

---

## 7. MAP UI BEHAVIOR

- Map is the primary canvas — UI floats over it
- Drag any direction: services load dynamically as you pan
- Zoom out: see overlapping radius circles, understand coverage density
- Zoom in: individual pulses, street-level detail
- Top bar: fixed search/filter strip
- Bottom sheet: swipe up for list mode (map → hybrid → full list)
- Each provider on map: outer pulsing ring (reach radius) + inner dot (actual location)

---

## 8. RADIUS SETTINGS

**Default search radius:** 5km  
**Smart default logic:**
- Dense area (many category clusters near user) → default 2km
- Sparse/rural area → default 10km automatically

**User setting:** Single slider in Settings
```
Search radius: [====•--------] 5km

[Nearby 2km]  [Standard 5km]  [Wide 15km]
```

**Provider setting:** Set during onboarding, editable in dashboard  
**Range:** 1km minimum, 50km maximum

---

## 9. TECH STACK

| Layer | Technology |
|-------|-----------|
| Mobile App | React Native (Expo) |
| Maps | react-native-maps |
| Location | expo-location |
| Backend | Node.js + Express |
| Database | MongoDB Atlas (2dsphere geo indexes) |
| Auth | JWT (access + refresh tokens) |
| Media Storage | Cloudinary (provider profile images) |
| Hosting | Render |
| Real-time (future) | Firebase (availability toggling) |

---

## 10. BACKEND FILE STRUCTURE

```
rada-ke-backend/
├── src/
│   ├── config/
│   │   ├── db.js                  # MongoDB Atlas connection
│   │   └── env.js                 # Environment variable validation
│   │
│   ├── models/
│   │   ├── Provider.js            # Core provider + geo data
│   │   ├── User.js                # App users
│   │   ├── Category.js            # MVP categories + metadata
│   │   └── Scan.js                # Scan/impression logs
│   │
│   ├── routes/
│   │   ├── auth.routes.js         # Provider + user auth
│   │   ├── provider.routes.js     # Provider CRUD, location, radius
│   │   ├── user.routes.js         # User profile, radius settings
│   │   ├── scan.routes.js         # Core geo query endpoints
│   │   └── category.routes.js     # Category list + metadata
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── provider.controller.js
│   │   ├── user.controller.js
│   │   ├── scan.controller.js
│   │   └── category.controller.js
│   │
│   ├── services/
│   │   ├── geo.service.js         # All geospatial logic
│   │   └── notification.service.js  # Future — push alerts
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js     # JWT verify
│   │   ├── error.middleware.js    # Global error handler
│   │   └── validate.middleware.js # Request body validation
│   │
│   └── utils/
│       ├── constants.js           # Radius limits, category list
│       └── response.js            # Standardized API response helpers
│
├── .env
├── .env.example
├── .gitignore
├── package.json
└── server.js
```

---

## 11. DATA MODELS

### Provider
```js
{
  name: String,
  phone: String,
  whatsapp: String,
  email: String,
  category: ObjectId → Category,
  description: String,
  profileImage: String,         // Cloudinary URL
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number]       // [lng, lat] — GeoJSON order
  },
  radiusKm: { type: Number, default: 5, max: 50 },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  scanImpressions: { type: Number, default: 0 },
  createdAt: Date
}
// Index: { location: '2dsphere' }
```

### User
```js
{
  name: String,
  phone: String,
  email: String,
  searchRadiusKm: { type: Number, default: 5 },
  lastLocation: {
    type: { type: String, default: 'Point' },
    coordinates: [Number]       // [lng, lat]
  },
  createdAt: Date
}
```

### Category
```js
{
  name: String,                 // "Fundi", "Food", etc.
  slug: String,                 // "fundi", "food"
  iconName: String,             // icon identifier for app
  color: String,                // hex color for map pulse
  isActive: Boolean
}
```

### Scan (Analytics Log)
```js
{
  category: ObjectId → Category,
  userCoordinates: [Number],    // [lng, lat]
  searchRadiusKm: Number,
  resultsReturned: Number,
  timestamp: { type: Date, default: Date.now }
}
```

---

## 12. CORE API ENDPOINTS

### Auth
```
POST   /api/auth/register/user       → Register app user
POST   /api/auth/register/provider   → Register service provider
POST   /api/auth/login               → Login (user or provider)
POST   /api/auth/refresh             → Refresh JWT
```

### Scan (The Core)
```
GET    /api/scan/clusters            → Category presence before search
       ?lng=&lat=&radius=
       Returns: [{ category, count, centerLng, centerLat }]

GET    /api/scan/services            → Individual providers after search
       ?lng=&lat=&radius=&category=
       Returns: [{ provider details + distance }]
```

### Provider
```
GET    /api/providers/:id            → Provider public profile
PUT    /api/providers/:id            → Update profile (auth)
PATCH  /api/providers/:id/location   → Update coordinates + radius
PATCH  /api/providers/:id/toggle     → Toggle isActive
GET    /api/providers/:id/analytics  → Scan impressions
```

### User
```
GET    /api/users/profile            → Get profile (auth)
PUT    /api/users/profile            → Update profile
PATCH  /api/users/radius             → Update searchRadiusKm
```

### Categories
```
GET    /api/categories               → All active categories
```

---

## 13. THE GEO QUERY (geo.service.js)

The query that powers everything. Finds providers whose service radius covers the user's point:

```js
const EARTH_RADIUS_KM = 6378.1;

// For scan/services — individual providers
const scanServices = async (userLng, userLat, searchRadiusKm, categoryId) => {
  return await Provider.find({
    category: categoryId,
    isActive: true,
    location: {
      $geoWithin: {
        $centerSphere: [
          [userLng, userLat],
          searchRadiusKm / EARTH_RADIUS_KM
        ]
      }
    }
  }).sort({ radiusKm: 1 }); // tightest-reach providers first = most local
};

// For scan/clusters — category presence indicators
const getCategoryClusters = async (userLng, userLat, searchRadiusKm) => {
  return await Provider.aggregate([
    {
      $match: {
        isActive: true,
        location: {
          $geoWithin: {
            $centerSphere: [
              [userLng, userLat],
              searchRadiusKm / EARTH_RADIUS_KM
            ]
          }
        }
      }
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        centerLng: { $avg: { $arrayElemAt: ['$location.coordinates', 0] } },
        centerLat: { $avg: { $arrayElemAt: ['$location.coordinates', 1] } }
      }
    }
  ]);
};
```

---

## 14. CONSTANTS

```js
// utils/constants.js

export const DEFAULT_SEARCH_RADIUS_KM = 5;
export const MAX_SEARCH_RADIUS_KM = 50;
export const MIN_SEARCH_RADIUS_KM = 1;
export const DEFAULT_PROVIDER_RADIUS_KM = 5;
export const EARTH_RADIUS_KM = 6378.1;

export const NAIROBI_CENTER = {
  lng: 36.8219,
  lat: -1.2921
};

export const MVP_CATEGORIES = [
  { name: 'Fundi',          slug: 'fundi',    color: '#3B82F6' },
  { name: 'Food',           slug: 'food',     color: '#F97316' },
  { name: 'Bodaboda',       slug: 'bodaboda', color: '#EAB308' },
  { name: 'Salon & Barber', slug: 'salon',    color: '#A855F7' },
  { name: 'Tutor',          slug: 'tutor',    color: '#22C55E' },
  { name: 'Delivery',       slug: 'delivery', color: '#EF4444' },
  { name: 'Healthcare',     slug: 'health',   color: '#14B8A6' },
];
```

---

## 15. BUILD ORDER

### Phase 1 — Backend Foundation
1. `server.js` + `db.js` + `env.js`
2. `Provider.js` model (2dsphere index)
3. `User.js` + `Category.js` + `Scan.js` models
4. `geo.service.js` — the core query
5. Auth routes (register + login)
6. Scan endpoints (`/clusters` + `/services`)
7. Seed categories (the 7 MVP slugs)

### Phase 2 — Provider Dashboard (React Native)
1. Provider registration + onboarding
2. Map pin placement (set location)
3. Radius + category selection
4. Availability toggle
5. Basic analytics screen (scan impressions)

### Phase 3 — User App (React Native)
1. Landing screen + category chips
2. Location permission flow
3. Map with category pulse clusters
4. Scan → resolve animation
5. Provider detail bottom sheet
6. Radius settings screen
7. Call / WhatsApp / directions actions

### Phase 4 — Polish
1. No-results expansion prompt
2. Loading skeletons
3. Rating system
4. Verified badge flow
5. Onboarding for new users

---

## 16. MONETIZATION (POST-MVP)

| Tier | Model | Target |
|------|-------|--------|
| Free listing | Basic presence on map | All providers |
| Boosted | Appear first in category scan results | KES 500/month |
| Verified badge | Trust signal, priority support | KES 300/month |
| Analytics+ | Detailed scan heatmaps, peak hours | KES 800/month |
| SMS/USSD fallback | For providers without smartphones | Per-use billing |

---

## 17. KEY DECISIONS LOG

| Decision | Choice | Reason |
|----------|--------|--------|
| App type | Mobile only (no web) | Location-dependent, mobile-first Kenya |
| Provider onboarding | Mobile app | Same codebase, simpler |
| Pilot city | Nairobi | Density, ground knowledge |
| Categories | 7 fixed for MVP | Controlled quality, expandable |
| Default radius | 5km | Local but always returns results |
| Map library | react-native-maps | Expo compatible, mature |
| Before-scan UI | Category clusters only | Privacy, performance, UX clarity |
| Geo query approach | MongoDB $geoWithin $centerSphere | Native, no extra services needed |

---

*Blueprint written at project inception. Update this document when core decisions change.*
