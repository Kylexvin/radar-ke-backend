import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true
    // Removed unique: true - will use schema.index() instead
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    lowercase: true,
    trim: true
    // Removed unique: true - will use schema.index() instead
  },
  iconName: {
    type: String,
    required: [true, 'Icon name is required'],
    trim: true
  },
  color: {
    type: String,
    required: [true, 'Color is required'],
    validate: {
      validator: function(v) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: 'Color must be a valid hex code (e.g., #3B82F6)'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: {
    createdAt: true,
    updatedAt: true
  }
});

// ALL indexes defined here ONLY - no duplicates
categorySchema.index({ name: 1 }, { unique: true });
categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ isActive: 1, name: 1 });

const Category = mongoose.model('Category', categorySchema);

export default Category;