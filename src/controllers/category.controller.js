const Category = require('../models/Category.model');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { buildCategoryTree, isCircularDependency } = require('../utils/category.util');

// Helper to generate URL-friendly slug
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// 1. Create a Category (Admin)
exports.createCategory = async (req, res, next) => {
  try {
    const { name, parentId, isActive } = req.body;

    if (parentId) {
      const parentExists = await Category.findById(parentId);
      if (!parentExists) {
        return next(new ApiError(404, 'Parent category does not exist.'));
      }
    }

    const slug = generateSlug(name) + '-' + Date.now().toString().slice(-4);

    const category = await Category.create({
      name,
      slug,
      parentId: parentId || null,
      isActive: isActive !== undefined ? isActive : true,
    });

    return ApiResponse.success(res, 201, 'Category created successfully', { category });
  } catch (error) {
    next(error);
  }
};

// 2. Get Entire Category Tree (Public)
exports.getCategoryTree = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).lean();
    const tree = buildCategoryTree(categories);

    return ApiResponse.success(res, 200, 'Category hierarchy retrieved successfully', { tree });
  } catch (error) {
    next(error);
  }
};

// 3. List Categories Flat (Public with optional filters)
exports.getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find()
      .populate('parentId', 'name slug')
      .sort({ createdAt: -1 });

    return ApiResponse.success(res, 200, 'Categories retrieved successfully', { categories });
  } catch (error) {
    next(error);
  }
};

// 4. Update Category (Admin)
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, parentId, isActive } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return next(new ApiError(404, 'Category not found.'));
    }

    // Circular check if parentId is being updated
    if (parentId !== undefined && parentId !== null && parentId !== '') {
      if (parentId.toString() === id.toString()) {
        return next(new ApiError(400, 'A category cannot be its own parent.'));
      }

      const parentExists = await Category.findById(parentId);
      if (!parentExists) {
        return next(new ApiError(404, 'Target parent category does not exist.'));
      }

      const circular = await isCircularDependency(id, parentId);
      if (circular) {
        return next(
          new ApiError(400, 'Circular dependency detected: Cannot set a descendant as the parent.')
        );
      }
      category.parentId = parentId;
    } else if (parentId === null || parentId === '') {
      category.parentId = null;
    }

    if (name) {
      category.name = name;
      category.slug = generateSlug(name) + '-' + Date.now().toString().slice(-4);
    }

    if (isActive !== undefined) {
      category.isActive = isActive;
    }

    await category.save();

    return ApiResponse.success(res, 200, 'Category updated successfully', { category });
  } catch (error) {
    next(error);
  }
};

// 5. Delete Category (Admin)
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return next(new ApiError(404, 'Category not found.'));
    }

    // Check if category has active children before deleting
    const childCount = await Category.countDocuments({ parentId: id });
    if (childCount > 0) {
      return next(
        new ApiError(400, 'Cannot delete category with subcategories. Reassign or delete child categories first.')
      );
    }

    await Category.findByIdAndDelete(id);

    return ApiResponse.success(res, 200, 'Category deleted successfully');
  } catch (error) {
    next(error);
  }
};