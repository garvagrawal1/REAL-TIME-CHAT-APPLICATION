const validator = require('validator');
const ErrorResponse = require('../utils/errorResponse');

/**
 * Validate registration request body
 */
const validateRegister = (req, res, next) => {
  const { name, username, email, password, confirmPassword } = req.body;

  if (!name || !username || !email || !password) {
    return next(new ErrorResponse('Please provide all required fields: name, username, email, and password.', 400));
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    return next(new ErrorResponse('Passwords do not match.', 400));
  }

  if (!validator.isEmail(email)) {
    return next(new ErrorResponse('Please provide a valid email address.', 400));
  }

  if (username.length < 3 || username.length > 20) {
    return next(new ErrorResponse('Username must be between 3 and 20 characters.', 400));
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return next(new ErrorResponse('Username can only contain alphanumeric characters and underscores.', 400));
  }

  if (password.length < 6) {
    return next(new ErrorResponse('Password must be at least 6 characters long.', 400));
  }

  // Sanitize fields
  req.body.name = validator.trim(name);
  req.body.username = validator.trim(username).toLowerCase();
  req.body.email = validator.normalizeEmail(email);

  next();
};

/**
 * Validate login request body
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorResponse('Please provide both email and password.', 400));
  }

  if (!validator.isEmail(email)) {
    return next(new ErrorResponse('Please provide a valid email address.', 400));
  }

  req.body.email = validator.normalizeEmail(email);
  next();
};

/**
 * Validate room creation
 */
const validateRoom = (req, res, next) => {
  const { name, description } = req.body;

  if (!name || !validator.trim(name)) {
    return next(new ErrorResponse('Room name is required.', 400));
  }

  if (name.trim().length < 2 || name.trim().length > 50) {
    return next(new ErrorResponse('Room name must be between 2 and 50 characters.', 400));
  }

  req.body.name = validator.trim(name);
  if (description) {
    req.body.description = validator.trim(description);
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateRoom,
};
