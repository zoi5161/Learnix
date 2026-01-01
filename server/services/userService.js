const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

/**
 * Get user profile data
 */
const getUserProfile = async (user) => {
    return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isLocked: user.isLocked,
    };
};

/**
 * Update user profile (placeholder)
 */
const updateUserProfile = async (userId, updateData) => {
    // TODO: Implement profile update logic
    return { message: 'Profile updated successfully (placeholder)' };
};

/**
 * Get all users (Admin only)
 */
const getAllUsers = async () => {
    const users = await User.find({}, '-password_hash');
    return users;
};

/**
 * Update user role (Admin only)
 */
const updateUserRole = async (userId, role) => {
    if (!userId || !role) {
        throw new Error('Missing userId or role');
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    user.role = role;
    await user.save();

    return { message: 'Role updated', user };
};

/**
 * Lock/unlock user (Admin only)
 */
const setUserLock = async (userId, isLocked) => {
    if (typeof isLocked !== 'boolean' || !userId) {
        throw new Error('Missing userId or isLocked');
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    user.isLocked = isLocked;
    await user.save();

    return { message: `User ${isLocked ? 'locked' : 'unlocked'}`, user };
};

/**
 * Get system statistics (Admin only)
 */
const getSystemStats = async () => {
    const [userCount, courseCount, enrollmentWithValidStudent] = await Promise.all([
        User.countDocuments(),
        Course.countDocuments(),
        // Only count active enrollments (enrolled/completed) whose student account still exists
        Enrollment.aggregate([
            {
                $match: {
                    status: { $in: ['enrolled', 'completed'] }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'student_id',
                    foreignField: '_id',
                    as: 'student'
                }
            },
            { $match: { student: { $ne: [] } } },
            { $count: 'count' }
        ])
    ]);

    const enrollmentCount = (Array.isArray(enrollmentWithValidStudent) && enrollmentWithValidStudent[0])
        ? enrollmentWithValidStudent[0].count
        : 0;

    return {
        users: userCount,
        courses: courseCount,
        enrollments: enrollmentCount
    };
};

module.exports = {
    getUserProfile,
    updateUserProfile,
    getAllUsers,
    updateUserRole,
    setUserLock,
    getSystemStats,
};

