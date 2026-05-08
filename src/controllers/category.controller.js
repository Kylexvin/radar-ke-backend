import Category from '../models/Category.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Create a new category (Admin only)
 * POST /api/categories
 */
export const createCategory = async (req, res, next) => {
  try {
    const { name, slug, iconName, color, isActive } = req.body;

    // Check if category already exists
    const existingCategory = await Category.findOne({ $or: [{ name }, { slug }] });
    if (existingCategory) {
      return errorResponse(res, 'Category with this name or slug already exists', HTTP_STATUS.CONFLICT);
    }

    const category = new Category({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      iconName,
      color,
      isActive: isActive !== undefined ? isActive : true
    });

    await category.save();

    return successResponse(res, {
      category
    }, 'Category created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all categories
 * GET /api/categories
 */
export const getCategories = async (req, res, next) => {
  try {
    const { isActive, type } = req.query;
    
    let query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    const categories = await Category.find(query).sort({ displayOrder: 1, name: 1 });

    return successResponse(res, {
      categories,
      total: categories.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single category by ID or slug
 * GET /api/categories/:id
 */
export const getCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if id is a valid ObjectId or slug
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const query = isObjectId ? { _id: id } : { slug: id };
    
    const category = await Category.findOne(query);
    
    if (!category) {
      return errorResponse(res, 'Category not found', HTTP_STATUS.NOT_FOUND);
    }

    return successResponse(res, { category });
  } catch (error) {
    next(error);
  }
};

/**
 * Update category (Admin only)
 * PUT /api/categories/:id
 */
export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, slug, iconName, color, isActive, displayOrder } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return errorResponse(res, 'Category not found', HTTP_STATUS.NOT_FOUND);
    }

    // Check for duplicate name/slug if changing
    if (name && name !== category.name) {
      const existingName = await Category.findOne({ name, _id: { $ne: id } });
      if (existingName) {
        return errorResponse(res, 'Category name already exists', HTTP_STATUS.CONFLICT);
      }
    }
    
    if (slug && slug !== category.slug) {
      const existingSlug = await Category.findOne({ slug, _id: { $ne: id } });
      if (existingSlug) {
        return errorResponse(res, 'Category slug already exists', HTTP_STATUS.CONFLICT);
      }
    }

    // Update fields
    if (name) category.name = name;
    if (slug) category.slug = slug;
    if (iconName) category.iconName = iconName;
    if (color) category.color = color;
    if (isActive !== undefined) category.isActive = isActive;
    if (displayOrder !== undefined) category.displayOrder = displayOrder;

    await category.save();

    return successResponse(res, { category }, 'Category updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete category (Admin only)
 * DELETE /api/categories/:id
 */
export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findById(id);
    if (!category) {
      return errorResponse(res, 'Category not found', HTTP_STATUS.NOT_FOUND);
    }

    // Check if any providers use this category
    const Provider = (await import('../models/Provider.js')).default;
    const providerCount = await Provider.countDocuments({ categoryId: id });
    
    if (providerCount > 0) {
      return errorResponse(res, `Cannot delete category. ${providerCount} providers are using it.`, HTTP_STATUS.BAD_REQUEST);
    }

    await category.deleteOne();

    return successResponse(res, null, 'Category deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Seed default categories (Admin only - one-time use)
 * POST /api/categories/seed
 */
export const seedDefaultCategories = async (req, res, next) => {
  try {
    const defaultCategories = [
      { name: 'Fundi', slug: 'fundi', iconName: 'wrench', color: '#FF4444', displayOrder: 1 },
      { name: 'Food', slug: 'food', iconName: 'restaurant', color: '#FF8C00', displayOrder: 2 },
      { name: 'Bodaboda', slug: 'bodaboda', iconName: 'motorcycle', color: '#FFD700', displayOrder: 3 },
      { name: 'Salon & Barber', slug: 'salon', iconName: 'scissors', color: '#FF69B4', displayOrder: 4 },
      { name: 'Tutor', slug: 'tutor', iconName: 'school', color: '#FF5555', displayOrder: 5 },
      { name: 'Delivery', slug: 'delivery', iconName: 'delivery', color: '#FF2020', displayOrder: 6 },
      { name: 'Healthcare', slug: 'health', iconName: 'medical', color: '#14B8A6', displayOrder: 7 }
    ];

    let created = 0;
    let skipped = 0;

    for (const cat of defaultCategories) {
      const exists = await Category.findOne({ slug: cat.slug });
      if (!exists) {
        await Category.create(cat);
        created++;
      } else {
        skipped++;
      }
    }

    return successResponse(res, {
      created,
      skipped,
      categories: await Category.find().sort({ displayOrder: 1 })
    }, `Seeded ${created} new categories`);
  } catch (error) {
    next(error);
  }
};