const express = require('express');
const { protect, restrictTo, optionalAuth } = require('../middleware/authMiddleware');
const {
    getCourses,
    getCourseById,
    getCategories,
    getTrendingTags,
    searchCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    publishCourse,
    getInstructorCourses
} = require('../controllers/courseController');
const {
    getCourseLessons,
    getLesson,
    updateProgress,
    createLesson, 
    updateLesson,
    deleteLesson
} = require('../controllers/lessonController');

const router = express.Router();

// Public routes
router.get('/', getCourses);
router.get('/categories', getCategories);
router.get('/tags/trending', getTrendingTags);
router.get('/search', searchCourses);

// Instructor/Admin cần quyền truy cập để quản lý và xem nội dung bài học.
router.route('/:courseId/lessons')
    .get(protect, restrictTo(['student', 'instructor', 'admin']), getCourseLessons)
    .post(protect, restrictTo(['instructor', 'admin']), createLesson); 

router.route('/:courseId/lessons/:lessonId')
    .get(protect, restrictTo(['student', 'instructor', 'admin']), getLesson) 
    .put(protect, restrictTo(['instructor', 'admin']), updateLesson)
    .delete(protect, restrictTo(['instructor', 'admin']), deleteLesson);

// Protected routes - Lesson progress update (student)
router.put('/:courseId/lessons/:lessonId/progress', protect, restrictTo(['student']), updateProgress);

// Protected routes - Course Management (instructor/admin)
router.route('/mine')
    .get(protect, restrictTo(['instructor', 'admin']), getInstructorCourses)
    .post(protect, restrictTo(['instructor', 'admin']), createCourse);

router.route('/:id')
    .put(protect, restrictTo(['instructor', 'admin']), updateCourse)
    .delete(protect, restrictTo(['instructor', 'admin']), deleteCourse);
    
router.put('/:id/publish', protect, restrictTo(['instructor', 'admin']), publishCourse);
router.get('/:id', optionalAuth, getCourseById);

module.exports = router;