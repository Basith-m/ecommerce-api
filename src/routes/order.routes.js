const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  createOrderSchema,
  updateOrderStatusSchema,
} = require('../validations/order.validation');
const ROLES = require('../constants/roles');

// All order endpoints require authentication
router.use(protect);

// Customer endpoints
router.post('/', authorize(ROLES.CUSTOMER, ROLES.ADMIN), validate(createOrderSchema), orderController.createOrder);
router.get('/my-orders', authorize(ROLES.CUSTOMER, ROLES.ADMIN), orderController.getMyOrders);

// Admin endpoints
router.get('/admin/all', authorize(ROLES.ADMIN), orderController.getAllOrders);
router.patch(
  '/:id/status',
  authorize(ROLES.ADMIN),
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus
);

// Shared (Customer can view their own, Admin can view any)
router.get('/:id', orderController.getOrderById);

module.exports = router;