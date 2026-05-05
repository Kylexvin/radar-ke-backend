# RADA KE — Product Blueprint
> Version 2.0 | Updated with Marketplace Module

---

## 1. CONCEPT

Rada Ke is a **location-aware service discovery and marketplace platform** for Kenya.

Two core modes on one app:

**SCAN mode** — Service providers broadcast availability with a GPS coordinate and reach radius. Users scan by category to see fundis, bodaboda, tutors, salons, delivery agents, and healthcare workers that can actually reach them right now.

**MARKETPLACE mode** — Physical and semi-fixed shops list their products. Users browse shops on a map, see what's in stock nearby, and order with M-Pesa delivery.

The name *Rada* draws from radar — the app scans your environment and resolves ambient signals into sharp individual results when you search.

**Core distinction from Google Maps / competitors:**
- Models informal and mobile providers who have no fixed address
- Radius-as-service-area: providers operate from a zone, not a pin
- Scan-first UX: services hidden until searched — intentional, not a limitation
- Marketplace with M-Pesa-native checkout, no card infrastructure needed

---

## 2. TARGET MARKET

**Pilot City:** Nairobi (CBD and surrounding estates)
**Expand to:** Eldoret, Mombasa, Kisumu
**Users:** General Kenyan public — anyone needing local services or products
**Providers:** Informal and semi-formal service providers
**Shop Owners:** Grocery vendors, pharmacies, electronics shops, food outlets, clothing sellers, hardware stores

---

## 3. MVP CATEGORIES

### 3.1 Scan Categories (7)

| # | Category | Color | Examples |
|---|----------|-------|---------|
| 1 | Fundi | Red `#FF4444` | Plumber, electrician, mason, carpenter |
| 2 | Food | Orange `#FF8C00` | Mama mboga, restaurant, home chef |
| 3 | Bodaboda | Yellow `#FFD700` | Motorcycle taxi, tuk-tuk |
| 4 | Salon & Barber | Pink `#FF69B4` | Home visits, walk-in within area |
| 5 | Tutor | Light Red `#FF5555` | Home teachers, subject tutors |
| 6 | Delivery | Bright Red `#FF2020` | Parcels, groceries, gas cylinders |
| 7 | Healthcare | Teal `#14B8A6` | Nurses, doctors doing home visits |

### 3.2 Marketplace Shop Categories (6)

| # | Category | Color | Examples |
|---|----------|-------|---------|
| 1 | Grocery | Green `#22C55E` | Mama mboga, mini-supermarket, cereals |
| 2 | Pharmacy | Teal `#14B8A6` | Chemist, OTC medicines, supplements |
| 3 | Electronics | Blue `#3B82F6` | Phone accessories, cables, repair parts |
| 4 | Clothing | Purple `#A855F7` | Boutique, mitumba, shoes |
| 5 | Hardware | Orange `#FF8C00` | Tools, building materials, plumbing |
| 6 | Food | Orange `#F97316` | Fast food, restaurants with delivery |

---

## 4. USER TYPES

### 4.1 App User (Customer)
- Scans for services in their area (Scan tab)
- Browses shops and orders products (Marketplace tab)
- Sets search radius (default 5km)
- Orders via M-Pesa STK push
- Contacts providers via WhatsApp or phone

### 4.2 Service Provider
- Registers with location + radius
- Toggles availability (active / inactive)
- Receives scan impression analytics

### 4.3 Shop Owner
- Registers shop with fixed location + delivery radius
- Lists products with prices and stock status
- Receives orders, confirms via app or WhatsApp
- Manages product catalogue

---

## 5. THE DUAL RADIUS MODEL

### 5.1 Scan (Services)
Two radii must overlap for a service to appear:

```
Provider sets:   radiusKm = 8   (I serve within 8km of my base)
User sets:       searchKm = 5   (Show me services within 5km of me)

Service appears only if: user's location falls within provider's circle
```

### 5.2 Marketplace (Shops)
Shops have a delivery radius. Users see shops whose delivery circle covers their location:

```
Shop sets:       deliveryRadiusKm = 3   (I deliver within 3km)
Walk-in shops:   deliveryRadiusKm = 0.5 (Nearby only)

Shop appears if: user is within shop's delivery radius
```

---

## 6. APP NAVIGATION

```
Bottom Tab Navigator
├── Scan Tab          (radio icon)
│   └── MapScreen     — location-aware service discovery
└── Marketplace Tab   (storefront icon)
│   └── MarketplaceScreen   — map with shop pins
│   └── ShopScreen          — shop profile + product grid
│   └── CartScreen          — order review + M-Pesa checkout
└── Settings Tab      (settings icon)
```

---

## 7. UX FLOWS

### 7.1 Scan Flow (unchanged from v1)
Landing → Location permission → Map loads → Tap category → Sonar animation → Results in bottom sheet → Select provider → WhatsApp/Call CTA

### 7.2 Marketplace Flow

```
Marketplace Tab opens
→ Map loads with all shop pins visible (labelled with shop name)
→ Category chips at bottom: All | Grocery | Pharmacy | Electronics | Clothing | Hardware | Food
→ Tap category chip → filters pins, bottom sheet slides up with shop cards
→ Tap a pin OR card → shop card highlights, delivery radius circle appears
→ Tap "→" on card → ShopScreen opens
→ ShopScreen: hero info + products grid + info tab
→ Add products to cart → floating cart bar appears
→ Cart → enter delivery address + M-Pesa number → confirm → STK push
```

### 7.3 Cart Flow

```
Cart is global (persists across navigation)
→ CartScreen groups items by shop
→ Quantity controls inline
→ Address + M-Pesa number input
→ Confirm screen with full order summary
→ Pay → M-Pesa STK push triggered (Daraja API)
→ Success screen
```

---

## 8. MAP BEHAVIOR

### Scan Map
- Dark Google Maps style
- User location dot with sonar rings on scan
- Provider pins appear after scan resolves
- Selected provider shows reach radius circle
- Long-press to set custom scan origin

### Marketplace Map
- Same dark style
- Shop pins are labelled pill-style (icon + first word of shop name)
- Selected shop shows delivery radius circle
- Category filter changes which pins are visible
- All shops visible by default

---

## 9. TECH STACK

| Layer | Technology |
|-------|-----------|
| Mobile App | React Native (Expo) |
| Maps | react-native-maps (Google Maps) |
| Location | expo-location |
| Haptics | expo-haptics |
| Blur | expo-blur |
| Cart State | React Context (CartContext) |
| Backend | Node.js + Express |
| Database | MongoDB Atlas (2dsphere geo indexes) |
| Auth | JWT (access + refresh tokens) |
| Media Storage | Cloudinary (provider + product images) |
| Hosting | Render |
| Payments | Safaricom Daraja API (M-Pesa STK push) |
| Real-time (future) | Firebase (availability + order status) |

---

## 10. BACKEND FILE STRUCTURE

```
rada-ke-backend/
├── src/
│   ├── config/
│   │   ├── db.js
│   │   └── env.js
│   │
│   ├── models/
│   │   ├── Provider.js            # Service provider + geo
│   │   ├── User.js                # App users
│   │   ├── Category.js            # Scan categories
│   │   ├── Scan.js                # Scan impression logs
│   │   ├── Shop.js                # Marketplace shops + geo   [NEW]
│   │   ├── Product.js             # Shop product catalogue    [NEW]
│   │   └── Order.js               # Customer orders           [NEW]
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── provider.routes.js
│   │   ├── user.routes.js
│   │   ├── scan.routes.js
│   │   ├── category.routes.js
│   │   ├── shop.routes.js         # Shop CRUD + geo           [NEW]
│   │   ├── product.routes.js      # Product CRUD              [NEW]
│   │   └── order.routes.js        # Order + M-Pesa webhook    [NEW]
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── provider.controller.js
│   │   ├── user.controller.js
│   │   ├── scan.controller.js
│   │   ├── category.controller.js
│   │   ├── shop.controller.js     [NEW]
│   │   ├── product.controller.js  [NEW]
│   │   └── order.controller.js    [NEW]
│   │
│   ├── services/
│   │   ├── geo.service.js         # All geospatial logic
│   │   ├── mpesa.service.js       # Daraja STK push           [NEW]
│   │   └── notification.service.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   └── validate.middleware.js
│   │
│   └── utils/
│       ├── constants.js
│       └── response.js
│
├── .env
├── .env.example
├── .gitignore
├── package.json
└── server.js
```

---

## 11. DATA MODELS

### Provider (unchanged)
```js
{
  name: String,
  phone: String,
  whatsapp: String,
  category: ObjectId → Category,
  description: String,
  profileImage: String,
  location: { type: 'Point', coordinates: [lng, lat] },
  radiusKm: { type: Number, default: 5, max: 50 },
  isActive: Boolean,
  isVerified: Boolean,
  rating: Number,
  scanImpressions: Number,
  createdAt: Date
}
// Index: { location: '2dsphere' }
```

### Shop [NEW]
```js
{
  name: String,
  ownerId: ObjectId → User,
  phone: String,
  whatsapp: String,
  category: String,              // 'grocery' | 'pharmacy' | 'electronics' | 'clothing' | 'hardware' | 'food'
  description: String,
  profileImage: String,          // Cloudinary URL
  location: { type: 'Point', coordinates: [lng, lat] },
  deliveryRadiusKm: { type: Number, default: 3, max: 20 },
  address: String,
  hours: String,
  isOpen: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 80 },
  minOrder: { type: Number, default: 0 },
  tags: [String],
  createdAt: Date
}
// Index: { location: '2dsphere' }
```

### Product [NEW]
```js
{
  shopId: ObjectId → Shop,
  name: String,
  description: String,
  price: Number,
  images: [String],              // Cloudinary URLs
  category: String,              // Product sub-category
  unit: String,                  // 'per kg', 'each', 'per pack'
  inStock: { type: Boolean, default: true },
  createdAt: Date
}
```

### Order [NEW]
```js
{
  userId: ObjectId → User,
  shopId: ObjectId → Shop,
  items: [{
    productId: ObjectId → Product,
    name: String,
    price: Number,
    quantity: Number,
  }],
  subtotal: Number,
  deliveryFee: Number,
  total: Number,
  deliveryAddress: String,
  phone: String,                 // M-Pesa number
  status: {
    type: String,
    enum: ['pending', 'paid', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  mpesaRef: String,              // Safaricom transaction ID
  createdAt: Date
}
```

### User (updated)
```js
{
  name: String,
  phone: String,
  email: String,
  searchRadiusKm: { type: Number, default: 5 },
  lastLocation: { type: 'Point', coordinates: [lng, lat] },
  defaultAddress: String,        // [NEW] saved delivery address
  createdAt: Date
}
```

---

## 12. CORE API ENDPOINTS

### Auth (unchanged)
```
POST   /api/auth/register/user
POST   /api/auth/register/provider
POST   /api/auth/login
POST   /api/auth/refresh
```

### Scan (unchanged)
```
GET    /api/scan/clusters     → Category presence indicators
GET    /api/scan/services     → Individual providers after scan
```

### Marketplace [NEW]
```
GET    /api/shops/nearby      → Shops within user's area
       ?lng=&lat=&radius=&category=
       Returns: [{ shop details + distance }]

GET    /api/shops/:id         → Shop public profile
GET    /api/shops/:id/products → Paginated product list
       ?category=&inStock=

POST   /api/shops             → Create shop (auth, shop owner)
PUT    /api/shops/:id         → Update shop profile (auth)
PATCH  /api/shops/:id/toggle  → Toggle isOpen (auth)
```

### Products [NEW]
```
POST   /api/products          → Add product to shop (auth)
PUT    /api/products/:id      → Update product (auth)
DELETE /api/products/:id      → Remove product (auth)
PATCH  /api/products/:id/stock → Toggle inStock (auth)
```

### Orders [NEW]
```
POST   /api/orders            → Create order + trigger STK push
GET    /api/orders/my         → User's order history (auth)
GET    /api/orders/:id        → Single order status
PATCH  /api/orders/:id/status → Update status (shop owner auth)
POST   /api/orders/mpesa/callback → Daraja webhook
```

### Provider (unchanged)
```
GET    /api/providers/:id
PUT    /api/providers/:id
PATCH  /api/providers/:id/location
PATCH  /api/providers/:id/toggle
GET    /api/providers/:id/analytics
```

---

## 13. GEO QUERIES

### Scan services (unchanged)
```js
// geo.service.js
const scanServices = async (userLng, userLat, searchRadiusKm, categoryId) => {
  return await Provider.find({
    category: categoryId,
    isActive: true,
    location: {
      $geoWithin: {
        $centerSphere: [[userLng, userLat], searchRadiusKm / 6378.1]
      }
    }
  }).sort({ radiusKm: 1 });
};
```

### Nearby shops [NEW]
```js
const getNearbyShops = async (userLng, userLat, category = null) => {
  const query = {
    // Find shops whose delivery radius covers the user's point
    // Using $geoWithin on the shop's deliveryRadiusKm
    // Simplified: find shops within 20km, then filter by deliveryRadius in app layer
    // Full implementation: store shop coverage as a Polygon or use $nearSphere
    location: {
      $nearSphere: {
        $geometry: { type: 'Point', coordinates: [userLng, userLat] },
        $maxDistance: 20000 // 20km in meters, filter by deliveryRadius in controller
      }
    }
  };
  if (category) query.category = category;
  return await Shop.find(query).limit(50);
};
```

---

## 14. M-PESA INTEGRATION (Daraja API)

```js
// services/mpesa.service.js

const initiateSTKPush = async ({ phone, amount, orderId, description }) => {
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');

  const response = await axios.post(
    'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phone,           // Customer phone e.g. 254712345678
      PartyB: SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: `${BASE_URL}/api/orders/mpesa/callback`,
      AccountReference: `RADA-${orderId}`,
      TransactionDesc: description,
    },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return response.data;
};
```

**Callback handler:**
```js
// Daraja calls this after payment
POST /api/orders/mpesa/callback
→ Extract ResultCode, MpesaReceiptNumber
→ If ResultCode === 0: mark order as 'paid', save mpesaRef
→ Notify shop owner (push notification / WhatsApp)
```

---

## 15. CONSTANTS

```js
// utils/constants.js

// Scan
export const DEFAULT_SEARCH_RADIUS_KM = 5;
export const MAX_SEARCH_RADIUS_KM = 50;
export const MIN_SEARCH_RADIUS_KM = 1;
export const DEFAULT_PROVIDER_RADIUS_KM = 5;

// Marketplace
export const DEFAULT_DELIVERY_RADIUS_KM = 3;
export const MAX_DELIVERY_RADIUS_KM = 20;
export const DEFAULT_DELIVERY_FEE = 80;

export const EARTH_RADIUS_KM = 6378.1;

export const NAIROBI_CENTER = { lng: 36.8219, lat: -1.2921 };

export const MVP_SCAN_CATEGORIES = [
  { name: 'Fundi',    slug: 'fundi',    color: '#FF4444' },
  { name: 'Food',     slug: 'food',     color: '#FF8C00' },
  { name: 'Bodaboda', slug: 'bodaboda', color: '#FFD700' },
  { name: 'Salon',    slug: 'salon',    color: '#FF69B4' },
  { name: 'Tutor',    slug: 'tutor',    color: '#FF5555' },
  { name: 'Delivery', slug: 'delivery', color: '#FF2020' },
  { name: 'Health',   slug: 'health',   color: '#14B8A6' },
];

export const MVP_SHOP_CATEGORIES = [
  { name: 'Grocery',     slug: 'grocery',     color: '#22C55E' },
  { name: 'Pharmacy',    slug: 'pharmacy',    color: '#14B8A6' },
  { name: 'Electronics', slug: 'electronics', color: '#3B82F6' },
  { name: 'Clothing',    slug: 'clothing',    color: '#A855F7' },
  { name: 'Hardware',    slug: 'hardware',    color: '#FF8C00' },
  { name: 'Food',        slug: 'food',        color: '#F97316' },
];
```

---

## 16. BUILD ORDER

### Phase 1 — Backend Foundation (Services)
1. `server.js` + `db.js` + `env.js`
2. `Provider.js` + `Category.js` + `User.js` + `Scan.js` models
3. `geo.service.js`
4. Auth routes
5. Scan endpoints (`/clusters` + `/services`)
6. Seed 7 scan categories

### Phase 2 — Backend: Marketplace
1. `Shop.js` + `Product.js` + `Order.js` models
2. `shop.routes.js` + `product.routes.js`
3. `getNearbyShops` geo query
4. `order.routes.js` + `mpesa.service.js`
5. Daraja sandbox integration + callback handler

### Phase 3 — Mobile: Scan Tab
1. Landing + category chips
2. Location permission flow
3. Map + sonar animation
4. Provider detail bottom sheet
5. Call / WhatsApp / directions actions
6. Radius settings

### Phase 4 — Mobile: Marketplace Tab
1. `MarketplaceScreen` — map + shop pins + category filter
2. `ShopScreen` — profile + product grid
3. `CartContext` — global cart state
4. `CartScreen` — review + M-Pesa checkout
5. Order confirmation + success screen

### Phase 5 — Provider & Shop Dashboards
1. Provider registration + onboarding
2. Map pin placement (set location)
3. Radius + category selection
4. Availability toggle + analytics
5. Shop owner: product management (add/edit/stock toggle)
6. Shop owner: order management screen

### Phase 6 — Polish
1. Real API integration (replace dummy data)
2. Push notifications (order status)
3. Rating system
4. Verified badge flow
5. Onboarding for new users
6. Smart radius defaults (dense vs sparse areas)

---

## 17. MONETIZATION (POST-MVP)

| Tier | Model | Target |
|------|-------|--------|
| Free listing | Basic presence on map | All providers + shops |
| Boosted | Appear first in category results | KES 500/month |
| Verified badge | Trust signal, priority support | KES 300/month |
| Analytics+ | Scan heatmaps, peak hours, order trends | KES 800/month |
| Transaction fee | 2–3% per marketplace order | All shop orders |
| SMS/USSD fallback | For providers without smartphones | Per-use billing |

---

## 18. KEY DECISIONS LOG

| Decision | Choice | Reason |
|----------|--------|--------|
| App type | Mobile only | Location-dependent, mobile-first Kenya |
| Scan mode | Radius-based geo query | Models informal providers accurately |
| Marketplace | Separate tab, same app | Natural extension of location discovery |
| Payment | M-Pesa STK push (Daraja) | 95%+ Kenyan mobile money penetration |
| Cart state | React Context | Simple, no extra dependency, MVP scope |
| Pilot city | Nairobi | Density, ground knowledge |
| Map library | react-native-maps | Expo compatible, mature |
| Geo query | MongoDB $geoWithin / $nearSphere | Native, no extra geo services needed |
| Product images | Phase 4+ | Keep MVP scope tight |

---

*Blueprint v2.0 — Updated to include Marketplace module, Shop/Product/Order models, M-Pesa integration plan, and updated navigation structure.*


This is solid. Not just an idea — it’s actually buildable and structured like a real product. But there are a few **critical gaps + optimizations** you should fix early before writing too much code.

---

# 1. What’s Strong (keep as-is)

### ✔ Clear differentiation

* Scan vs Marketplace separation is clean
* Radius-based logic fits Kenya perfectly (informal sector)

### ✔ MVP scope is controlled

* Categories are limited (good)
* Tech stack is realistic (you won’t get blocked)

### ✔ Backend structure

* Clean separation (models/routes/controllers/services)
* Geo logic centralized → very good decision

---

# 2. Critical Issues You Should Fix

## 2.1 Scan Logic is Incorrect (Important)

Your current query:

```js
$geoWithin: {
  $centerSphere: [[userLng, userLat], searchRadiusKm / 6378.1]
}
```

❌ Problem:

* This only checks **user radius**
* It completely ignores **provider.radiusKm**

### ✔ Correct Logic (Dual Radius)

You need BOTH:

**Condition:**

```
distance(user, provider) <= provider.radiusKm
AND
distance(user, provider) <= user.searchRadiusKm
```

### ✔ Fix Approach

Use `$geoNear` instead:

```js
Provider.aggregate([
  {
    $geoNear: {
      near: { type: 'Point', coordinates: [userLng, userLat] },
      distanceField: 'distance',
      spherical: true
    }
  },
  {
    $match: {
      isActive: true,
      category: categoryId,
      $expr: {
        $and: [
          { $lte: ['$distance', searchRadiusKm * 1000] },
          { $lte: ['$distance', { $multiply: ['$radiusKm', 1000] }] }
        ]
      }
    }
  }
]);
```

👉 This is **non-negotiable** if you want accuracy.

---

## 2.2 Marketplace Geo Logic is Weak

You wrote:

> "find within 20km, then filter in controller"

❌ That will break at scale.

### ✔ Correct Model

You need:

```
distance(user, shop) <= shop.deliveryRadiusKm
```

### ✔ Fix

Same pattern:

```js
Shop.aggregate([
  {
    $geoNear: {
      near: { type: 'Point', coordinates: [userLng, userLat] },
      distanceField: 'distance',
      spherical: true
    }
  },
  {
    $match: {
      $expr: {
        $lte: ['$distance', { $multiply: ['$deliveryRadiusKm', 1000] }]
      }
    }
  }
]);
```

---

## 2.3 Order Model Limitation

```js
shopId: ObjectId
```

❌ This assumes:

* One cart = one shop

But your UX says:

> "Cart groups items by shop"

### You must choose:

### Option A (simpler, MVP) ✅

* One order per shop
* Force cart split per shop

👉 Recommended for MVP

---

### Option B (complex)

* Multi-shop order
* Requires:

  * Multiple STK splits ❌
  * Complex delivery logic ❌

👉 Don’t do this now

---

## 2.4 Missing Real-Time Layer

You mentioned Firebase (future), but:

### You NEED it for:

* Provider availability (Scan mode)
* Order status updates

### Minimal fix:

* Use Firebase ONLY for:

  * `provider.isActive`
  * `order.status`

Keep MongoDB as source of truth.

---

## 2.5 No Anti-Spam / Quality Control

Right now:

* Anyone can register
* Anyone appears in scan

❌ That will destroy trust fast

### Add immediately:

#### Provider:

```js
isVerified: false
```

#### Scan filter:

```js
isVerified: true OR rating > threshold
```

#### Soft ranking:

* Verified first
* Then distance
* Then rating

---

# 3. Product-Level Gaps

## 3.1 Cold Start Problem

At launch:

* No providers → empty scan → users leave

### Fix:

Seed manually:

* 20–50 providers per category (fake or recruited)
* Especially:

  * Bodaboda
  * Fundi
  * Food

---

## 3.2 No Retention Mechanism

Right now:

* User comes → scans → leaves

### Add:

* “Recent providers”
* “Favorites”
* “Reorder” (Marketplace)

---

## 3.3 Payment Risk

M-Pesa STK:

* User can ignore prompt
* Payment may fail silently

### Add:

* Timeout (60–90s)
* Retry button
* “Pay later” fallback (WhatsApp)

---

# 4. UX Improvements (High Impact)

### Scan Mode

* Show **ghost indicators** before scan (heat zones)
* Makes app feel alive

### Marketplace

* Default to **list view + map toggle**
* Maps alone are slow for shopping

---

# 5. Smart Strategic Advice

This part matters most.

## Start Narrow

Don’t launch all categories.

### Best entry point:

1. Bodaboda
2. Fundi
3. Food delivery

👉 These have:

* High frequency
* Immediate need
* Low trust barrier

---

## Marketplace Later (or limited)

Marketplace is:

* Logistics heavy
* Trust heavy
* Support heavy

👉 Launch with:

* Only **Food + Grocery**

---

# 6. Final Verdict

### Score: 8.5/10

### Why not 10:

* Geo logic needs correction
* Real-time missing
* Trust layer missing
* Marketplace complexity underestimated

---

# 7. What You Should Do Next (Action Plan)

### Step 1

Fix:

* Scan geo query
* Shop geo query

### Step 2

Lock MVP scope:

* 3 scan categories
* 2 marketplace categories

### Step 3

Build:

* Scan tab (fully working)
* Provider onboarding

### Step 4

Seed providers manually

### Step 5

Then add marketplace

