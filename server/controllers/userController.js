const userService = require('../services/userService');

exports.getUserProfile = async (req, res) => {
    try {
        const user = await userService.getUserProfile(req.user);
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server error' });
    }
};

exports.updateUserProfile = async (req, res) => {
    try {
        const result = await userService.updateUserProfile(req.user._id, req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server error' });
    }
};

// ADMIN: Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server error' });
    }
};

// ADMIN: Update user role
exports.updateUserRole = async (req, res) => {
    try {
        const { userId, role } = req.body;
        const result = await userService.updateUserRole(userId, role);
        res.json(result);
    } catch (error) {
        const statusCode = error.message === 'Missing userId or role' ? 400 : 
                          error.message === 'User not found' ? 404 : 500;
        res.status(statusCode).json({ message: error.message || 'Server error' });
    }
};

// ADMIN: Lock/unlock user
exports.setUserLock = async (req, res) => {
    try {
        const { userId, isLocked } = req.body;
        const result = await userService.setUserLock(userId, isLocked);
        res.json(result);
    } catch (error) {
        const statusCode = error.message === 'Missing userId or isLocked' ? 400 : 
                          error.message === 'User not found' ? 404 : 500;
        res.status(statusCode).json({ message: error.message || 'Server error' });
    }
};

// ADMIN: System statistics
exports.getSystemStats = async (req, res) => {
    try {
        const stats = await userService.getSystemStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server error' });
    }
};
