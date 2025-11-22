const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { verifyRefreshToken, generateRefreshToken } = require('../utils/refreshToken');

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;

const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            message: 'Password must be at least 8 characters long and include uppercase letters, lowercase letters, and numbers.'
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
            email: user.email
        };

        res.json({
            accessToken: generateToken(data, '1h', 'access'),   // access token 1h
            refreshToken: generateToken(data, '7d', 'refresh') // refresh token 7 ngày
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
        email: user.email
    };

    const accessToken = generateToken(data, '1h', 'access');
    const refreshToken = generateToken(data, '7d', 'refresh');
    const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/oauth-success?accessToken=${accessToken}&refreshToken=${refreshToken}`;
    res.redirect(redirectUrl);
};

const refreshNewToken = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: "No refresh token" });

    try {
        const payload = verifyRefreshToken(refreshToken); // verify refresh token

        // Generate new access token (15 phút) và refresh token nếu muốn
        const newAccessToken = generateToken({ id: payload.id, role: payload.role, email: payload.email, name: payload.name }, "1h");
        const newRefreshToken = generateRefreshToken({ id: payload.id, role: payload.role, email: payload.email, name: payload.name }); // tuỳ logic backend
        // console.log("New Access Token:", newAccessToken);
        // console.log("Payload from Refresh Token:", payload);
        res.json({ accessToken: newAccessToken });
    } catch (err) {
        res.status(401).json({ message: "Invalid refresh token" });
    }
};

module.exports = { registerUser, authUser, googleLoginSuccess, refreshNewToken };