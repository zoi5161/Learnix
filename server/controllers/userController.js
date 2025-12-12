const User = require('../models/User');

const getUserProfile = async (req, res) => {
    const user = {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        isLocked: req.user.isLocked,
    };
    res.json(user);
};

const updateUserProfile = async (req, res) => {
    res.json({ message: 'Profile updated successfully (placeholder)' });
};

// ADMIN: Get all users
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, '-password_hash');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ADMIN: Update user role
const updateUserRole = async (req, res) => {
    const { userId, role } = req.body;
    if (!userId || !role) return res.status(400).json({ message: 'Missing userId or role' });
    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        user.role = role;
        await user.save();
        res.json({ message: 'Role updated', user });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ADMIN: Lock/unlock user
const setUserLock = async (req, res) => {
    const { userId, isLocked } = req.body;
    if (typeof isLocked !== 'boolean' || !userId) return res.status(400).json({ message: 'Missing userId or isLocked' });
    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        user.isLocked = isLocked;
        await user.save();
        res.json({ message: `User ${isLocked ? 'locked' : 'unlocked'}`, user });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getUserProfile, updateUserProfile, getAllUsers, updateUserRole, setUserLock };
