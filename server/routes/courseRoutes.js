const express = require('express');
const { protect, restrictTo, optionalAuth } = require('../middleware/authMiddleware');
const {
    getCourses,
    getCourseById,
    getCategories,
    getTrendingTags,
    searchCourses
} = require('../controllers/courseController');

const router = express.Router();

// Public routes
router.get('/', getCourses);
router.get('/categories', getCategories);
router.get('/tags/trending', getTrendingTags);
router.get('/search', searchCourses);
router.get('/:id', optionalAuth, getCourseById);

// Protected routes
router.post('/', protect, restrictTo(['instructor', 'admin']), (req, res) => {
    res.json({ message: 'Course created successfully (placeholder)' });
});

module.exports = router;
