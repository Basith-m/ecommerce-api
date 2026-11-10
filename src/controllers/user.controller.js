const User = require('../models/User.model');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

// Admin only: Get all users with pagination
exports.getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(),
    ]);

    return ApiResponse.success(
      res,
      200,
      'Users retrieved successfully',
      { users },
      { page, limit, total, totalPages: Math.ceil(total / limit) }
    );
  } catch (error) {
    next(error);
  }
};

// Admin only: Activate/Deactivate user
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // Prevent admin from deactivating themselves
    if (req.user._id.toString() === id && isActive === false) {
      return next(new ApiError(400, 'You cannot deactivate your own admin account.'));
    }

    const user = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, runValidators: true }
    );

    if (!user) {
      return next(new ApiError(404, 'User not found.'));
    }

    return ApiResponse.success(
      res,
      200,
      `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      { user }
    );
  } catch (error) {
    next(error);
  }
};