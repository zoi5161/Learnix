const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
    createExercise,
    getExercise,
    getExercisesByLesson,
    updateExercise,
    deleteExercise,
    runCode,
    submitCode,
    getSubmissions
} = require('../controllers/programmingController');

const router = express.Router({ mergeParams: true });

// All routes require authentication
router.use(protect);

// ==========================================
// INSTRUCTOR / ADMIN ROUTES
// ==========================================

// Create exercise
router.post(
    '/',
    restrictTo(['instructor', 'admin']),
    createExercise
);

// Get all exercises for a lesson
router.get(
    '/',
    getExercisesByLesson
);

// Get single exercise
router.get(
    '/:exerciseId',
    getExercise
);

// Update exercise
router.put(
    '/:exerciseId',
    restrictTo(['instructor', 'admin']),
    updateExercise
);

// Delete exercise
router.delete(
    '/:exerciseId',
    restrictTo(['instructor', 'admin']),
    deleteExercise
);

// ==========================================
// STUDENT ROUTES
// ==========================================

// Run code (test with visible test cases)
router.post(
    '/:exerciseId/run',
    restrictTo(['student', 'instructor', 'admin']),
    runCode
);

// Submit code (run all test cases)
router.post(
    '/:exerciseId/submit',
    restrictTo(['student', 'instructor', 'admin']),
    submitCode
);

// Get submissions
router.get(
    '/:exerciseId/submissions',
    restrictTo(['student', 'instructor', 'admin']),
    getSubmissions
);

module.exports = router;

