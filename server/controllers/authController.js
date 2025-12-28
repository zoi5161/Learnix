const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { verifyRefreshToken, generateRefreshToken } = require('../utils/refreshToken');

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            message:
                'Password must be at least 8 characters long and include uppercase letters, lowercase letters, numbers, and a special character (!@#$%^&*).',
        });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ name, email, password_hash: password });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

const authUser = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password_hash');

    if (user && user.password_hash && (await user.matchPassword(password))) {
        const data = {
            id: user._id,
            role: user.role,
            name: user.name,
            email: user.email,
        };

        res.json({
            accessToken: generateToken(data, '1h', 'access'), // access token 1h
            refreshToken: generateToken(data, '7d', 'refresh'), // refresh token 7 ngày
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

const googleLoginSuccess = async (req, res) => {
    if (!req.user) {
        return res.redirect('/login');
    }

    const user = req.user;
    const data = {
        id: user._id,
        role: user.role,
        name: user.name,
        email: user.email,
    };

    const accessToken = generateToken(data, '1h', 'access');
    const refreshToken = generateToken(data, '7d', 'refresh');
    const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/login/oauth/success?accessToken=${accessToken}&refreshToken=${refreshToken}`;
    res.redirect(redirectUrl);
};

const refreshNewToken = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'No refresh token' });

    try {
        const payload = verifyRefreshToken(refreshToken); // verify refresh token

        // Generate new access token (15 phút) và refresh token nếu muốn
        const newAccessToken = generateToken(
            { id: payload.id, role: payload.role, email: payload.email, name: payload.name },
            '1h'
        );
        const newRefreshToken = generateRefreshToken({
            id: payload.id,
            role: payload.role,
            email: payload.email,
            name: payload.name,
        }); // tuỳ logic backend
        // console.log("New Access Token:", newAccessToken);
        // console.log("Payload from Refresh Token:", payload);
        res.json({ accessToken: newAccessToken });
    } catch (err) {
        res.status(401).json({ message: 'Invalid refresh token' });
    }
};

// Helper: create nodemailer transporter from env
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

const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });

    // Luôn trả về message chung để tránh lộ thông tin user tồn tại hay không
    const genericMessage =
        'If an account with that email exists, a password reset link has been sent.';

    if (!user) {
        return res.json({ message: genericMessage });
    }

    // Tạo reset token
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
            // Không lộ lỗi cụ thể cho client
        }
    }

    // Trong môi trường dev, trả về resetUrl để dễ test
    const response = { message: genericMessage };
    if (process.env.NODE_ENV !== 'production') {
        response.resetUrl = resetUrl;
    }

    res.json(response);
};

const resetPassword = async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            message:
                'Password must be at least 8 characters long and include uppercase letters, lowercase letters, numbers, and a special character (!@#$%^&*).',
        });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
        resetPasswordToken: tokenHash,
        resetPasswordExpires: { $gt: Date.now() },
    }).select('+password_hash');

    if (!user) {
        return res.status(400).json({ message: 'Invalid or expired password reset token' });
    }

    user.password_hash = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password has been reset successfully.' });
};

module.exports = {
    registerUser,
    authUser,
    googleLoginSuccess,
    refreshNewToken,
    forgotPassword,
    resetPassword,
};