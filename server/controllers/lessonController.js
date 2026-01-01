const lessonService = require('../services/lessonService');

// Get lesson content (only for enrolled students or free lessons)
exports.getLesson = async (req, res) => {
    try {
        const { courseId, lessonId } = req.params;
        const studentId = req.user?.id || null;
        const result = await lessonService.getLesson(courseId, lessonId, studentId);
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        const statusCode = error.message === 'Lesson not found' || error.message === 'Course not found or not published' ? 404 :
                          error.message === 'Access denied' ? 403 :
                          error.message === 'Lesson does not belong to this course' ? 400 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message || 'Error fetching lesson'
        });
    }
};

// Update lesson progress
exports.updateProgress = async (req, res) => {
    try {
        const { courseId, lessonId } = req.params;
        const studentId = req.user.id;
        const { status, completion_percentage, time_spent, notes } = req.body;
        const progress = await lessonService.updateProgress(courseId, lessonId, studentId, {
            status,
            completion_percentage,
            time_spent,
            notes
        });
        res.json({
            success: true,
            message: 'Progress updated successfully',
            data: { progress }
        });
    } catch (error) {
        const statusCode = error.message === 'Not enrolled in this course' ? 403 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message || 'Error updating progress'
        });
    }
};

// Get all lessons for a course (for enrolled students)
exports.getCourseLessons = async (req, res) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user.id;
        const lessons = await lessonService.getCourseLessons(courseId, studentId);
        res.json({
            success: true,
            data: { lessons }
        });
    } catch (error) {
        const statusCode = error.message === 'Not enrolled in this course' ? 403 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message || 'Error fetching lessons'
        });
    }
};

// ============================================================
// INSTRUCTOR / ADMIN OPERATIONS
// ============================================================

// Get all lessons (For Instructor/Admin - No enrollment check required)
exports.getLessonsByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const lessons = await lessonService.getLessonsByCourse(courseId);
        res.json({ success: true, data: lessons });
    } catch (error) {
        const statusCode = error.message === 'Course not found' ? 404 : 500;
        res.status(statusCode).json({ success: false, message: error.message });
    }
};

// Create Lesson
exports.createLesson = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { title, content_type, content, description, duration, is_free } = req.body;
        const newLesson = await lessonService.createLesson(
            courseId,
            { title, content_type, content, description, duration, is_free },
            req.user.id,
            req.user.role
        );
        res.status(201).json({ success: true, data: newLesson });
    } catch (error) {
        const statusCode = error.message === 'Course not found' ? 404 :
                          error.message === 'Permission denied' ? 403 : 500;
        res.status(statusCode).json({ success: false, message: error.message });
    }
};

// Update Lesson
exports.updateLesson = async (req, res) => {
    try {
        const { courseId, lessonId } = req.params;
        const updatedLesson = await lessonService.updateLesson(
            courseId,
            lessonId,
            req.body,
            req.user.id,
            req.user.role
        );
        res.json({ success: true, data: updatedLesson });
    } catch (error) {
        const statusCode = error.message === 'Course not found' || error.message === 'Lesson not found' ? 404 :
                          error.message === 'Permission denied' ? 403 : 500;
        res.status(statusCode).json({ success: false, message: error.message });
    }
};

// Delete Lesson
exports.deleteLesson = async (req, res) => {
    try {
        const { courseId, lessonId } = req.params;
        await lessonService.deleteLesson(courseId, lessonId, req.user.id, req.user.role);
        res.json({ success: true, message: 'Lesson deleted' });
    } catch (error) {
        const statusCode = error.message === 'Course not found' || error.message === 'Lesson not found' ? 404 :
                          error.message === 'Permission denied' ? 403 : 500;
        res.status(statusCode).json({ success: false, message: error.message });
    }
};

// Reorder Lessons
exports.reorderLessons = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { lessons } = req.body;
        const result = await lessonService.reorderLessons(courseId, lessons, req.user.id, req.user.role);
        res.json({ success: true, message: result.message });
    } catch (error) {
        const statusCode = error.message === 'Course not found' ? 404 :
                          error.message === 'Permission denied' ? 403 : 500;
        res.status(statusCode).json({ success: false, message: error.message });
    }
};
