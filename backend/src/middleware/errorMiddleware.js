const ErrorResponse = require('../utils/errorResponse');

/**
 * 404 Route Not Found Handler
 */
const notFound = (req, res, next) => {
  const error = new ErrorResponse(`API route not found: ${req.originalUrl}`, 404);
  next(error);
};

/**
 * Global API Error Handler
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for developers
  if (process.env.NODE_ENV !== 'production') {
    console.error('[Error Middleware]:', err);
  }

  // Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found with id: ${err.value}`;
    error = new ErrorResponse(message, 404);
  }

  // Mongoose Duplicate Key (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate value entered for '${field}'. Please use another value.`;
    error = new ErrorResponse(message, 400);
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    error = new ErrorResponse(message, 400);
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid authorization token';
    error = new ErrorResponse(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Authorization token has expired. Please log in again.';
    error = new ErrorResponse(message, 401);
  }

  // Mongoose Buffering Timeout / Connection Error
  if (err.message && err.message.includes('buffering timed out')) {
    const message = 'Database connection timeout. Please ensure MongoDB is running or configure your MONGODB_URI in backend/.env.';
    error = new ErrorResponse(message, 503);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = {
  notFound,
  errorHandler,
};
