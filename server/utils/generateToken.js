// utils/generateToken.js
const jwt = require('jsonwebtoken');

// Secret key cho access token
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'access-secret';

/**
 * Tạo JWT token
 * @param {Object} payload - Thông tin user: id, role, email, name...
 * @param {string} expiresIn - Thời gian sống token (ví dụ: '1h', '15m')
 * @param {string} type - 'access' hoặc 'refresh' (tuỳ chọn)
 * @returns {string} JWT token
 */
const generateToken = (payload, expiresIn = '1h', type = 'access') => {
    const secret = type === 'access' ? ACCESS_TOKEN_SECRET : process.env.REFRESH_TOKEN_SECRET;
    if (!secret) throw new Error(`Missing ${type} token secret`);

    return jwt.sign(payload, secret, { expiresIn });
};

module.exports = generateToken;
