// utils/refreshToken.js
const jwt = require('jsonwebtoken');

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh-secret';
const REFRESH_TOKEN_EXPIRES_IN = '7d'; // mặc định 7 ngày

/**
 * Tạo refresh token từ payload user
 * @param {Object} payload - Thông tin user: id, role, email, name...
 * @returns {string} refresh token
 */
const generateRefreshToken = (payload) => {
    return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
};

/**
 * Verify refresh token
 * @param {string} token - refresh token
 * @returns {Object} payload decoded
 * @throws nếu token invalid hoặc expired
 */
const verifyRefreshToken = (token) => {
    try {
        const payload = jwt.verify(token, REFRESH_TOKEN_SECRET);
        return payload; // { id, role, email, name, iat, exp }
    } catch (err) {
        throw new Error('Invalid refresh token');
    }
};

module.exports = { generateRefreshToken, verifyRefreshToken };
