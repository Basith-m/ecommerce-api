const mongoose = require('mongoose');
const Order = require('../models/Order.model');
const Product = require('../models/Product.model');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const ORDER_STATUS = require('../constants/orderStatus');

// Helper to generate unique order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${timestamp}-${random}`;
};

// 1. Create Order (Authenticated Customer)
exports.createOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items, shippingAddress } = req.body;
    const userId = req.user._id;

    const orderItems = [];
    let calculatedTotal = 0;

    for (const item of items) {
      // Find product within transaction session
      const product = await Product.findById(item.productId).session(session);

      if (!product) {
        throw new ApiError(404, `Product not found with ID: ${item.productId}`);
      }

      if (product.status !== 'Active') {
        throw new ApiError(400, `Product '${product.name}' is currently unavailable.`);
      }

      if (product.stock < item.quantity) {
        throw new ApiError(
          400,
          `Insufficient stock for '${product.name}'. Available: ${product.stock}, Requested: ${item.quantity}`
        );
      }

      // Backend price determination (never trust client)
      const unitPrice =
        product.salePrice !== null && product.salePrice !== undefined
          ? product.salePrice
          : product.price;

      const subtotal = Number((unitPrice * item.quantity).toFixed(2));
      calculatedTotal += subtotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        sku: product.sku,
        price: unitPrice,
        quantity: item.quantity,
        subtotal,
      });

      // Atomically reduce stock
      await Product.findByIdAndUpdate(
        product._id,
        { $inc: { stock: -item.quantity } },
        { session }
      );
    }

    // Persist order within transaction
    const order = await Order.create(
      [
        {
          orderNumber: generateOrderNumber(),
          user: userId,
          items: orderItems,
          totalAmount: Number(calculatedTotal.toFixed(2)),
          shippingAddress,
          status: ORDER_STATUS.CONFIRMED,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return ApiResponse.success(res, 201, 'Order placed successfully', { order: order[0] });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// 2. Get Customer's Orders (Customer self-view)
exports.getMyOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('items.product', 'name sku price'),
      Order.countDocuments({ user: req.user._id }),
    ]);

    return ApiResponse.success(
      res,
      200,
      'Your orders retrieved successfully',
      { orders },
      { page, limit, total, totalPages: Math.ceil(total / limit) }
    );
  } catch (error) {
    next(error);
  }
};

// 3. Get Single Order Details (Owner or Admin)
exports.getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate('user', 'name email')
      .populate('items.product', 'name sku price');

    if (!order) {
      return next(new ApiError(404, 'Order not found.'));
    }

    // Check ownership if not admin
    if (req.user.role !== 'Admin' && order.user._id.toString() !== req.user._id.toString()) {
      return next(new ApiError(403, 'You are not authorized to view this order.'));
    }

    return ApiResponse.success(res, 200, 'Order retrieved successfully', { order });
  } catch (error) {
    next(error);
  }
};

// 4. Get All Orders (Admin only)
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (status) filter.status = status;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Order.countDocuments(filter),
    ]);

    return ApiResponse.success(
      res,
      200,
      'All orders retrieved successfully',
      { orders },
      { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
    );
  } catch (error) {
    next(error);
  }
};

// 5. Update Order Status (Admin only)
exports.updateOrderStatus = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id).session(session);
    if (!order) {
      throw new ApiError(404, 'Order not found.');
    }

    // If order is transitioning to Cancelled from another status, restore product stock
    if (status === ORDER_STATUS.CANCELLED && order.status !== ORDER_STATUS.CANCELLED) {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity } },
          { session }
        );
      }
    }

    order.status = status;
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    return ApiResponse.success(res, 200, `Order status updated to '${status}' successfully`, {
      order,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};