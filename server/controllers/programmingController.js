const programmingService = require('../services/programmingService');

// ============================================================
// INSTRUCTOR / ADMIN OPERATIONS
// ============================================================

/**
 * Create programming exercise
 */
exports.createExercise = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const exercise = await programmingService.createExercise(
            lessonId,
            req.body,
            req.user._id,
            req.user.role
        );
        res.status(201).json({
            success: true,
            data: exercise
        });
    } catch (error) {
        const statusCode = error.message === 'Lesson not found' || error.message === 'Course not found' ? 404 :
                          error.message === 'Permission denied' ? 403 :
                          error.message === 'At least one test case is required' || 
                          error.message === 'At least one language is required' ? 400 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message || 'Error creating exercise'
        });
    }
};

/**
 * Get exercise by ID
 */
exports.getExercise = async (req, res) => {
    try {
        const { exerciseId } = req.params;
        const userId = req.user?.id || null;
        const userRole = req.user?.role || null;
        const exercise = await programmingService.getExercise(exerciseId, userId, userRole);
        res.json({
            success: true,
            data: exercise
        });
    } catch (error) {
        const statusCode = error.message === 'Exercise not found' ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message || 'Error fetching exercise'
        });
    }
};

/**
 * Get all exercises for a lesson
 */
exports.getExercisesByLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const exercises = await programmingService.getExercisesByLesson(lessonId);
        res.json({
            success: true,
            data: exercises
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching exercises'
        });
    }
};

/**
 * Update exercise
 */
exports.updateExercise = async (req, res) => {
    try {
        const { exerciseId } = req.params;
        const updatedExercise = await programmingService.updateExercise(
            exerciseId,
            req.body,
            req.user._id,
            req.user.role
        );
        res.json({
            success: true,
            data: updatedExercise
        });
    } catch (error) {
        const statusCode = error.message === 'Exercise not found' ? 404 :
                          error.message === 'Permission denied' ? 403 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message || 'Error updating exercise'
        });
    }
};

/**
 * Delete exercise
 */
exports.deleteExercise = async (req, res) => {
    try {
        const { exerciseId } = req.params;
        const result = await programmingService.deleteExercise(
            exerciseId,
            req.user._id,
            req.user.role
        );
        res.json({
            success: true,
            message: result.message
        });
    } catch (error) {
        const statusCode = error.message === 'Exercise not found' ? 404 :
                          error.message === 'Permission denied' ? 403 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message || 'Error deleting exercise'
        });
    }
};

// ============================================================
// STUDENT OPERATIONS
// ============================================================

/**
 * Run code (test with visible test cases)
 */
exports.runCode = async (req, res) => {
    try {
        const { exerciseId } = req.params;
        const { code, language } = req.body;
        const result = await programmingService.runCode(
            exerciseId,
            code,
            language,
            req.user.id,
            req.user.role
        );
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        const statusCode = error.message === 'Code and language are required' ||
                          error.message.includes('Language') ||
                          error.message === 'No visible test cases available' ||
                          error.message.includes('enrolled') ? 400 :
                          error.message === 'Exercise not found' ? 404 :
                          error.message.includes('enrolled') ? 403 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message || 'Error running code'
        });
    }
};

/**
 * Submit code (run all test cases)
 */
exports.submitCode = async (req, res) => {
    try {
        const { exerciseId } = req.params;
        const { code, language } = req.body;
        const result = await programmingService.submitCode(
            exerciseId,
            code,
            language,
            req.user.id,
            req.user.role
        );
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        const statusCode = error.message === 'Code and language are required' ||
                          error.message.includes('Language') ||
                          error.message.includes('enrolled') ? 400 :
                          error.message === 'Exercise not found' ? 404 :
                          error.message.includes('enrolled') ? 403 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message || 'Error submitting code'
        });
    }
};

/**
 * Get submissions for an exercise
 */
exports.getSubmissions = async (req, res) => {
    try {
        const { exerciseId } = req.params;
        const submissions = await programmingService.getSubmissions(exerciseId, req.user.id);
        res.json({
            success: true,
            data: submissions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching submissions'
        });
    }
};
