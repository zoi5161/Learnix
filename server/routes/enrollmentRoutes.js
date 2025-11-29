const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
    enrollCourse,
    unenrollCourse,
    getMyEnrollments
} = require('../controllers/enrollmentController');

const router = express.Router();

// All routes require authentication and student role
router.use(protect);
router.use(restrictTo(['student']));

// Get my enrollments
router.get('/my-courses', getMyEnrollments);

// Enroll in a course
router.post('/courses/:courseId/enroll', enrollCourse);

// Unenroll from a course
router.delete('/courses/:courseId/enroll', unenrollCourse);

module.exports = router;

