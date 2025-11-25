const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware bảo vệ route: chỉ cho phép người dùng có token hợp lệ
 */
const protect = async (req, res, next) => {
    let token;

    // Lấy token từ header Authorization: "Bearer <token>"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    try {
        // Verify token với secret riêng cho access token
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // Lấy user từ database (loại bỏ password)
        const user = await User.findById(decoded.id).select('-password_hash');
        if (!user) {
            return res.status(401).json({ message: 'Not authorized, user not found' });
        }

        req.user = user; // Gắn thông tin user vào req
        req.role = decoded.role; // Gắn role từ token vào req
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
    }
};

/**
 * Middleware phân quyền: chỉ cho phép các role cụ thể
 * @param {Array<string>} roles - danh sách role được phép
 */
const restrictTo = (roles) => (req, res, next) => {
    if (!req.role || !roles.includes(req.role)) {
        return res
            .status(403)
            .json({ message: 'Forbidden: You do not have permission to access this route' });
    }
    next();
};

module.exports = { protect, restrictTo };
