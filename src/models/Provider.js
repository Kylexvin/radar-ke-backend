import mongoose from 'mongoose';

const providerSchema = new mongoose.Schema({
  // Link to User account (for authentication)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Provider profile fields
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  whatsapp: {
    type: String
  },
  category: {
    type: String,
    required: true,
    enum: ['fundi', 'food', 'bodaboda', 'salon', 'tutor', 'delivery', 'health']
  },
  description: {
    type: String,
    maxlength: 500
  },
  profileImage: String,
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  locationAddress: String,
  radiusKm: {
    type: Number,
    default: 5,
    min: 1,
    max: 50
  },
  isActive: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  totalScans: {
    type: Number,
    default: 0
  },
  totalContacts: {
    type: Number,
    default: 0
  },
  priceRange: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  experience: {
    type: Number,
    default: 0
  },
  tags: [String]
}, {
  timestamps: true
});

// Indexes
providerSchema.index({ location: '2dsphere' });
providerSchema.index({ userId: 1 });
providerSchema.index({ category: 1, isActive: 1, rating: -1 });
providerSchema.index({ isVerified: -1, rating: -1 });

const Provider = mongoose.model('Provider', providerSchema);
export default Provider;