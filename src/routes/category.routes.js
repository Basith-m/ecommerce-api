const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  createCategorySchema,
  updateCategorySchema,
} = require('../validations/category.validation');
const ROLES = require('../constants/roles');

// Public routes
router.get('/tree', categoryController.getCategoryTree);
router.get('/', categoryController.getAllCategories);

// Admin restricted routes
router.post(
  '/',
  protect,
  authorize(ROLES.ADMIN),
  validate(createCategorySchema),
  categoryController.createCategory
);

router.put(
  '/:id',
  protect,
  authorize(ROLES.ADMIN),
  validate(updateCategorySchema),
  categoryController.updateCategory
);

router.delete(
  '/:id',
  protect,
  authorize(ROLES.ADMIN),
  categoryController.deleteCategory
);

module.exports = router;