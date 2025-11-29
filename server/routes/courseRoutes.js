const express = require('express');
const { protect, restrictTo, optionalAuth } = require('../middleware/authMiddleware');
const {
    getCourses,
    getCourseById,
    getCategories,
    getTrendingTags,
    searchCourses
} = require('../controllers/courseController');
const {
    getCourseLessons,
    getLesson,
    updateProgress
} = require('../controllers/lessonController');

const router = express.Router();

// Public routes
router.get('/', getCourses);
router.get('/categories', getCategories);
router.get('/tags/trending', getTrendingTags);
router.get('/search', searchCourses);
router.get('/:id', optionalAuth, getCourseById);

// Protected routes - Lesson viewing (student only)
router.get('/:courseId/lessons', protect, restrictTo(['student']), getCourseLessons);
router.get('/:courseId/lessons/:lessonId', protect, restrictTo(['student']), getLesson);
router.put('/:courseId/lessons/:lessonId/progress', protect, restrictTo(['student']), updateProgress);

// Protected routes - Course creation (instructor/admin)
router.post('/', protect, restrictTo(['instructor', 'admin']), (req, res) => {
    res.json({ message: 'Course created successfully (placeholder)' });
});

module.exports = router;
