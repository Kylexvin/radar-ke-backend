import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const providerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Provider name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  whatsapp: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    // REMOVED: sparse: true
  },
  password: {
    type: String,
    required: function() {
      return this.authProvider === 'local';
    },
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  googleId: {
    type: String
    // REMOVED: sparse: true
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  profileImage: {
    type: String,
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true
    },
    coordinates: {
      type: [Number],
      required: [true, 'Location coordinates are required'],
      validate: {
        validator: function(coords) {
          return coords.length === 2 && 
                 coords[0] >= -180 && coords[0] <= 180 && 
                 coords[1] >= -90 && coords[1] <= 90;
        },
        message: 'Coordinates must be [longitude, latitude] within valid ranges'
      }
    }
  },
  radiusKm: {
    type: Number,
    default: 5,
    min: [1, 'Radius cannot be less than 1km'],
    max: [50, 'Radius cannot exceed 50km']
  },
  isActive: {
    type: Boolean,
    default: true
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
    default: 0,
    min: 0
  },
  scanImpressions: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// ALL indexes defined ONLY here
providerSchema.index({ location: '2dsphere' });
providerSchema.index({ category: 1, isActive: 1, rating: -1 });
providerSchema.index({ radiusKm: 1 });
providerSchema.index({ phone: 1 }, { unique: true });
providerSchema.index({ email: 1 }, { unique: true, sparse: true });
providerSchema.index({ googleId: 1 }, { unique: true, sparse: true });

providerSchema.pre('save', async function(next) {
  if (!this.isModified('password') || this.authProvider !== 'local' || !this.password) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

providerSchema.methods.comparePassword = async function(candidatePassword) {
  if (this.authProvider !== 'local' || !this.password) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

const Provider = mongoose.model('Provider', providerSchema);

export default Provider;