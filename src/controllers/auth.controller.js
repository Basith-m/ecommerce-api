const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ApiError(409, 'Email is already registered.'));
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || undefined,
    });

    const token = generateToken(user._id, user.role);

    return ApiResponse.success(
      res,
      201,
      'User registered successfully',
      {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      }
    );
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return next(new ApiError(401, 'Invalid email or password.'));
    }

    if (!user.isActive) {
      return next(new ApiError(403, 'Your account has been deactivated.'));
    }

    const token = generateToken(user._id, user.role);

    return ApiResponse.success(
      res,
      200,
      'Login successful',
      {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      }
    );
  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    return ApiResponse.success(res, 200, 'User profile retrieved successfully', { user });
  } catch (error) {
    next(error);
  }
};