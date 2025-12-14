const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { getUserProfile, updateUserProfile, getAllUsers, updateUserRole, setUserLock, getSystemStats } = require('../controllers/userController');

const router = express.Router();
// User profile
router.route('/profile').get(getUserProfile).put(updateUserProfile);

// Admin: system statistics
router.get('/stats', restrictTo(['admin']), getSystemStats);

// Admin: get all users
router.get('/all', restrictTo(['admin']), getAllUsers);

// Admin: update user role
router.put('/role', restrictTo(['admin']), updateUserRole);

// Admin: lock/unlock user
router.put('/lock', restrictTo(['admin']), setUserLock);

module.exports = router;