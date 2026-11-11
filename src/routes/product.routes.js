const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  createProductSchema,
  updateProductSchema,
} = require('../validations/product.validation');
const ROLES = require('../constants/roles');

// Public routes
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);

// Admin restricted routes
router.post(
  '/',
  protect,
  authorize(ROLES.ADMIN),
  validate(createProductSchema),
  productController.createProduct
);

router.put(
  '/:id',
  protect,
  authorize(ROLES.ADMIN),
  validate(updateProductSchema),
  productController.updateProduct
);

router.delete(
  '/:id',
  protect,
  authorize(ROLES.ADMIN),
  productController.deleteProduct
);

module.exports = router;