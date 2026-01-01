const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { verifyRefreshToken, generateRefreshToken } = require('../utils/refreshToken');

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

/**
 * Validate password format
 */
const validatePassword = (password) => {
    return passwordRegex.test(password);
};

/**
 * Create nodemailer transporter from env
 */
const createTransporter = () => {
    const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = process.env;
    console.log('SMTP Config:', { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER });
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
        return null;
    }

    return nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT) || 587,
        secure: SMTP_SECURE === 'true',
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    });
};

/**
 * Register a new user
 */
const registerUser = async (name, email, password) => {
    if (!validatePassword(password)) {
        throw new Error(
            'Password must be at least 8 characters long and include uppercase letters, lowercase letters, numbers, and a special character (!@#$%^&*).'
        );
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
        throw new Error('User already exists');
    }

    const user = await User.create({ name, email, password_hash: password });

    if (!user) {
        throw new Error('Invalid user data');
    }

    return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
    };
};

/**
 * Authenticate user login
 */
const authUser = async (email, password) => {
    const user = await User.findOne({ email }).select('+password_hash');

    if (!user || !user.password_hash || !(await user.matchPassword(password))) {
        throw new Error('Invalid email or password');
    }

    const data = {
        id: user._id,
        role: user.role,
        name: user.name,
        email: user.email,
    };

    return {
        accessToken: generateToken(data, '1h', 'access'),
        refreshToken: generateToken(data, '7d', 'refresh'),
    };
};

/**
 * Handle Google OAuth login success
 */
const googleLoginSuccess = async (user) => {
    const data = {
        id: user._id,
        role: user.role,
        name: user.name,
        email: user.email,
    };

    const accessToken = generateToken(data, '1h', 'access');
    const refreshToken = generateToken(data, '7d', 'refresh');
    const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/login/oauth/success?accessToken=${accessToken}&refreshToken=${refreshToken}`;
    
    return { redirectUrl };
};

/**
 * Refresh access token using refresh token
 */
const refreshNewToken = async (refreshToken) => {
    if (!refreshToken) {
        throw new Error('No refresh token');
    }

    const payload = verifyRefreshToken(refreshToken);

    const newAccessToken = generateToken(
        { id: payload.id, role: payload.role, email: payload.email, name: payload.name },
        '1h'
    );
    const newRefreshToken = generateRefreshToken({
        id: payload.id,
        role: payload.role,
        email: payload.email,
        name: payload.name,
    });

    return { accessToken: newAccessToken };
};

/**
 * Send forgot password email
 */
const forgotPassword = async (email) => {
    if (!email) {
        throw new Error('Email is required');
    }

    const user = await User.findOne({ email });

    // Generic message to avoid revealing if user exists
    const genericMessage =
        'If an account with that email exists, a password reset link has been sent.';

    if (!user) {
        return { message: genericMessage };
    }

    // Create reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
    await user.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    const transporter = createTransporter();

    if (transporter) {
        try {
            await transporter.sendMail({
                from: process.env.SMTP_FROM || 'no-reply@example.com',
                to: email,
                subject: 'Password Reset Request',
                text: `You requested a password reset. Please click the link below to reset your password:\n${resetUrl}\n\nIf you did not request this, please ignore this email.`,
            });
        } catch (err) {
            console.error('Error sending reset email:', err);
        }
    }

    const response = { message: genericMessage };
    if (process.env.NODE_ENV !== 'production') {
        response.resetUrl = resetUrl;
    }

    return response;
};

/**
 * Reset password with token
 */
const resetPassword = async (token, password) => {
    if (!token || !password) {
        throw new Error('Token and new password are required');
    }

    if (!validatePassword(password)) {
        throw new Error(
            'Password must be at least 8 characters long and include uppercase letters, lowercase letters, numbers, and a special character (!@#$%^&*).'
        );
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
        resetPasswordToken: tokenHash,
        resetPasswordExpires: { $gt: Date.now() },
    }).select('+password_hash');

    if (!user) {
        throw new Error('Invalid or expired password reset token');
    }

    user.password_hash = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return { message: 'Password has been reset successfully.' };
};

module.exports = {
    registerUser,
    authUser,
    googleLoginSuccess,
    refreshNewToken,
    forgotPassword,
    resetPassword,
};

