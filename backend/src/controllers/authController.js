const User = require('../models/User');
const Otp = require('../models/Otp');
const generateToken = require('../utils/generateToken');
const ErrorResponse = require('../utils/errorResponse');
const { sendVerificationOtp } = require('../utils/emailService');

/**
 * Generate a random 6-digit numeric OTP
 */
const generate6DigitOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * @desc    Send 6-digit verification OTP to email
 * @route   POST /api/auth/send-otp
 * @access  Public
 */
const sendOtp = async (req, res, next) => {
  try {
    const { email, name = 'User', type = 'register' } = req.body;

    if (!email || !email.includes('@')) {
      return next(new ErrorResponse('Please provide a valid email address.', 400));
    }

    const cleanEmail = email.toLowerCase().trim();

    // If registering, check if email is already taken
    if (type === 'register') {
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        return next(new ErrorResponse('An account with this email already exists.', 400));
      }
    }

    // Delete any previous pending OTP for this email
    await Otp.deleteMany({ email: cleanEmail });

    // Generate new 6-digit OTP
    const otpCode = generate6DigitOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    await Otp.create({
      email: cleanEmail,
      otp: otpCode,
      expiresAt,
    });

    // Send email via Nodemailer
    const emailResult = await sendVerificationOtp(cleanEmail, name, otpCode);

    res.status(200).json({
      success: true,
      message: `Verification code sent to ${cleanEmail}`,
      devOtp: emailResult.devOtp || undefined,
      expiresInMinutes: 10,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify 6-digit OTP code
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return next(new ErrorResponse('Email and OTP code are required.', 400));
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = String(otp).trim();

    const otpDoc = await Otp.findOne({
      email: cleanEmail,
      otp: cleanOtp,
      expiresAt: { $gt: new Date() },
    });

    if (!otpDoc) {
      return next(new ErrorResponse('Invalid or expired verification code. Please request a new one.', 400));
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, username, email, password, avatar, bio, otp } = req.body;

    // Check if username or email already exists
    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username.toLowerCase().trim();

    const existingUser = await User.findOne({
      $or: [{ email: cleanEmail }, { username: cleanUsername }],
    });

    if (existingUser) {
      if (existingUser.email === cleanEmail) {
        return next(new ErrorResponse('An account with this email already exists.', 400));
      }
      if (existingUser.username === cleanUsername) {
        return next(new ErrorResponse('Username is already taken. Please pick another one.', 400));
      }
    }

    // Verify OTP if provided (or verify from Otp collection)
    let isEmailVerified = false;
    if (otp) {
      const cleanOtp = String(otp).trim();
      const otpDoc = await Otp.findOne({
        email: cleanEmail,
        otp: cleanOtp,
        expiresAt: { $gt: new Date() },
      });

      if (!otpDoc) {
        return next(new ErrorResponse('Invalid or expired verification code. Please check the code sent to your email.', 400));
      }

      isEmailVerified = true;
      await Otp.deleteMany({ email: cleanEmail }); // Clean up after successful use
    }

    // Default avatar if not provided (deterministic SVG initials or avatar URL)
    const initialAvatar = avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=4f46e5,06b6d4,10b981,8b5cf6`;

    const user = await User.create({
      name,
      username: cleanUsername,
      email: cleanEmail,
      password,
      avatar: initialAvatar,
      bio: bio || 'Hey there! I am using ChatFlow AI.',
      status: 'online',
      isEmailVerified,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        status: user.status,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user & get JWT token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email and explicitly select password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return next(new ErrorResponse('Invalid email or password credentials.', 401));
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return next(new ErrorResponse('Invalid email or password credentials.', 401));
    }

    // Update status to online
    user.status = 'online';
    user.lastSeen = Date.now();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        status: user.status,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current authenticated user info
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, avatar } = req.body;
    const fieldsToUpdate = {};

    if (name) fieldsToUpdate.name = name.trim();
    if (bio !== undefined) fieldsToUpdate.bio = bio.trim();
    if (avatar) fieldsToUpdate.avatar = avatar.trim();

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  register,
  login,
  getMe,
  updateProfile,
};
