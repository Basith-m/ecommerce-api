const Category = require('../models/Category.model');

/**
 * Builds a nested tree structure from a flat array of categories in O(N) time.
 */
const buildCategoryTree = (categories, parentId = null) => {
  const categoryMap = new Map();
  const tree = [];

  // Initialize lookup map and empty children arrays
  categories.forEach((cat) => {
    categoryMap.set(cat._id.toString(), {
      ...cat.toObject(),
      children: [],
    });
  });

  // Assemble parent-child hierarchy
  categoryMap.forEach((node) => {
    if (node.parentId) {
      const parent = categoryMap.get(node.parentId.toString());
      if (parent) {
        parent.children.push(node);
      } else {
        // Parent is deactivated or missing, keep at top-level
        tree.push(node);
      }
    } else {
      tree.push(node);
    }
  });

  return tree;
};

/**
 * Checks if targetParentId is a descendant of categoryId (circular dependency check).
 */
const isCircularDependency = async (categoryId, targetParentId) => {
  if (!targetParentId) return false;
  if (categoryId.toString() === targetParentId.toString()) return true;

  let currentParentId = targetParentId;

  while (currentParentId) {
    const parentCategory = await Category.findById(currentParentId).select('parentId');
    if (!parentCategory) break;

    if (parentCategory._id.toString() === categoryId.toString()) {
      return true; // Cycle detected: target parent is a child/descendant of this category
    }

    currentParentId = parentCategory.parentId;
  }

  return false;
};

/**
 * Recursively gets all descendant category IDs for a given parent category ID.
 * Used for product search by parent category.
 */
const getAllDescendantCategoryIds = async (categoryId) => {
  const descendants = [];

  const getChildren = async (parentId) => {
    const children = await Category.find({ parentId, isActive: true }).select('_id');
    for (const child of children) {
      descendants.push(child._id);
      await getChildren(child._id);
    }
  };

  await getChildren(categoryId);
  return descendants;
};

module.exports = {
  buildCategoryTree,
  isCircularDependency,
  getAllDescendantCategoryIds,
};