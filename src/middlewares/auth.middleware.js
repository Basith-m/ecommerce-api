const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const ApiError = require('../utils/apiError');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ApiError(401, 'Access denied. No token provided.'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new ApiError(401, 'User no longer exists.'));
    }

    if (!user.isActive) {
      return next(new ApiError(403, 'Your account has been deactivated. Contact admin.'));
    }

    req.user = user;
    next();
  } catch (error) {
    return next(new ApiError(401, 'Invalid or expired token.'));
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, `User role '${req.user.role}' is not authorized to access this route.`));
    }
    next();
  };
};

module.exports = { protect, authorize };