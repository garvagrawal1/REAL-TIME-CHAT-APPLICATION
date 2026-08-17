const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

/**
 * Protect routes - verifies JWT in Authorization Bearer header
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route. Please login.', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(new ErrorResponse('User account associated with token no longer exists.', 401));
    }

    req.user = user;
    next();
  } catch (err) {
    return next(new ErrorResponse('Invalid or expired token. Please log in again.', 401));
  }
};

/**
 * Verify JWT token string directly (useful for Socket.io authentication)
 */
const verifyTokenDirect = async (token) => {
  if (!token) throw new Error('No token provided');
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).select('-password');
  if (!user) throw new Error('User not found');
  return user;
};

module.exports = {
  protect,
  verifyTokenDirect,
};
