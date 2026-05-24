import mongoose from 'mongoose';

// Showcase item subdocument
const showcaseItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 300,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  priceLabel: {
    type: String,
    trim: true,
    maxlength: 50, // e.g. "from KSh 500", "KSh 500/hr"
  },
  category: {
    type: String,
    trim: true,
    maxlength: 50,
  },
  imageUrl: String,
  isAvailable: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true, _id: true });

const providerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  whatsapp: String,
  email: {
    type: String,
    sparse: true,
    lowercase: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  description: {
    type: String,
    maxlength: 500,
  },
  profileImage: String,
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  locationAddress: String,
  radiusKm: {
    type: Number,
    default: 5,
    min: 1,
    max: 50,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  rating: {
    type: Number,
    default: 0,
  },
  totalRatings: {
    type: Number,
    default: 0,
  },
  totalScans: {
    type: Number,
    default: 0,
  },
  totalContacts: {
    type: Number,
    default: 0,
  },
  priceRange: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  experience: Number,
  tags: [String],

  // Capabilities — what this provider can do
  capabilities: {
    canBeContacted: { type: Boolean, default: true },   // always true, locked
    hasShowcase: { type: Boolean, default: false },      // can display items
    hasShop: { type: Boolean, default: false },          // cart + checkout (future)
    takesBookings: { type: Boolean, default: false },    // date-based bookings (future)
  },

  // Showcase items — embedded, no separate collection needed at this scale
  showcaseItems: [showcaseItemSchema],

}, { timestamps: true });

// Indexes
providerSchema.index({ location: '2dsphere' });
providerSchema.index({ phone: 1 });
providerSchema.index({ email: 1 }, { sparse: true });
providerSchema.index({ categoryId: 1, isActive: 1, rating: -1 });
providerSchema.index({ userId: 1 });

const Provider = mongoose.model('Provider', providerSchema);
export default Provider;