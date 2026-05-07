rada-ke-backend/
├── src/
│   ├── config/
│   │   ├── db.js              # MongoDB Atlas connection
│   │   └── env.js             # Environment variable validation
│   │
│   ├── models/
│   │   ├── Provider.js        # Core provider + geo data
│   │   ├── User.js            # App users
│   │   ├── Category.js        # The 7-10 MVP categories
│   │   └── Scan.js            # Scan/impression logs (analytics)
│   │
│   ├── routes/
│   │   ├── auth.routes.js     # Provider + user auth
│   │   ├── provider.routes.js # Provider CRUD, location, radius
│   │   ├── user.routes.js     # User profile, radius settings
│   │   ├── scan.routes.js     # The core geo query endpoints
│   │   └── category.routes.js # Category list, icons, metadata
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── provider.controller.js
│   │   ├── user.controller.js
│   │   ├── scan.controller.js
│   │   └── category.controller.js
│   │
│   ├── services/
│   │   ├── geo.service.js     # All geospatial logic lives here
│   │   └── notification.service.js  # Future — push alerts
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js  # JWT verify
│   │   ├── error.middleware.js # Global error handler
│   │   └── validate.middleware.js  # Request validation
│   │
│   └── utils/
│       ├── constants.js        # DEFAULT_RADIUS_KM, MAX_RADIUS_KM, etc
│       └── response.js         # Standardized API response helpers
│
├── .env
├── .env.example
├── .gitignore
├── package.json
└── server.js                  # Entry point