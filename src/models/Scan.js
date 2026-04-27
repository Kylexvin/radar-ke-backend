import mongoose from 'mongoose';

const scanSchema = new mongoose.Schema({
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  userCoordinates: {
    type: [Number],
    required: [true, 'User coordinates are required'],
    validate: {
      validator: function(coords) {
        return coords.length === 2 && 
               coords[0] >= -180 && coords[0] <= 180 && 
               coords[1] >= -90 && coords[1] <= 90;
      },
      message: 'Coordinates must be [longitude, latitude] within valid ranges'
    }
  },
  searchRadiusKm: {
    type: Number,
    required: [true, 'Search radius is required'],
    min: [1, 'Search radius cannot be less than 1km'],
    max: [50, 'Search radius cannot exceed 50km']
  },
  resultsReturned: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound index for analytics queries
scanSchema.index({ category: 1, timestamp: -1 });
scanSchema.index({ timestamp: -1 });
scanSchema.index({ userCoordinates: '2dsphere' });
scanSchema.index({ searchRadiusKm: 1, resultsReturned: 1 });

const Scan = mongoose.model('Scan', scanSchema);

export default Scan;