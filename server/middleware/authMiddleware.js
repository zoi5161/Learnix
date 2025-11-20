const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            req.user = await User.findById(decoded.id).select('-password_hash');
            req.role = decoded.role; 
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const restrictTo = (roles) => (req, res, next) => {
    if (!req.role || !roles.includes(req.role)) {
        return res.status(403).json({ message: 'Forbidden: You do not have permission to access this route' });
    }
    next();
};

module.exports = { protect, restrictTo };