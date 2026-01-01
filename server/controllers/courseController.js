const courseService = require('../services/courseService');

// ============================================================
// PUBLIC OPERATIONS (READ ONLY)
// ============================================================

exports.getCourses = async (req, res) => {
    try {
        const result = await courseService.getCourses(req.query);
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching courses', error: error.message });
    }
};

exports.getCourseById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id || null;
        const result = await courseService.getCourseById(id, userId);
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        const statusCode = error.message === 'Course not found' ? 404 : 500;
        res.status(statusCode).json({ success: false, message: error.message || 'Error fetching course' });
    }
};

exports.getCategories = async (req, res) => {
    try {
        const categories = await courseService.getCategories();
        res.json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching categories', error: error.message });
    }
};

exports.getTrendingTags = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const trendingTags = await courseService.getTrendingTags(limit);
        res.json({ success: true, data: trendingTags });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching trending tags', error: error.message });
    }
};

exports.searchCourses = async (req, res) => {
    try {
        const { q, page = 1, limit = 12 } = req.query;
        const result = await courseService.searchCourses(q, page, limit);
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        const statusCode = error.message === 'Search query is required' ? 400 : 500;
        res.status(statusCode).json({ success: false, message: error.message || 'Error searching courses' });
    }
};

exports.getSuggestedCourses = async (req, res) => {
    try {
        const { courseId } = req.params;
        const limit = parseInt(req.query.limit) || 6;
        const courses = await courseService.getSuggestedCourses(courseId, limit);
        res.json({
            success: true,
            data: { courses }
        });
    } catch (error) {
        const statusCode = error.message === 'Course ID is required' || error.message === 'Course not found' ? 
                          (error.message === 'Course ID is required' ? 400 : 404) : 500;
        res.status(statusCode).json({ success: false, message: error.message || 'Error fetching suggested courses' });
    }
};

// ============================================================
// ADMIN / INSTRUCTOR CRUD OPERATIONS
// ============================================================

exports.createCourse = async (req, res) => {
    try {
        const newCourse = await courseService.createCourse(req.body, req.user);
        res.status(201).json({
            success: true,
            data: newCourse
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateCourse = async (req, res) => {
    try {
        const updatedCourse = await courseService.updateCourse(req.params.id, req.body, req.user);
        res.status(200).json({
            success: true,
            data: updatedCourse
        });
    } catch (error) {
        const statusCode = error.message === 'No course found with that ID' ? 404 :
                          error.message.includes('permission') ? 403 : 500;
        res.status(statusCode).json({ success: false, message: error.message });
    }
};

exports.deleteCourse = async (req, res) => {
    try {
        await courseService.deleteCourse(req.params.id, req.user);
        res.status(200).json({
            success: true,
            data: null,
            message: 'Course deleted successfully'
        });
    } catch (error) {
        const statusCode = error.message === 'No course found with that ID' ? 404 :
                          error.message.includes('permission') ? 403 : 500;
        res.status(statusCode).json({ success: false, message: error.message });
    }
};

exports.togglePublish = async (req, res) => {
    try {
        const isPublish = req.path.includes('publish') && !req.path.includes('unpublish');
        const { course, message } = await courseService.togglePublish(req.params.id, isPublish, req.user);
        res.status(200).json({
            success: true,
            message,
            data: course
        });
    } catch (error) {
        const statusCode = error.message === 'No course found' ? 404 :
                          error.message === 'Permission denied' ? 403 : 500;
        res.status(statusCode).json({ success: false, message: error.message });
    }
};

exports.assignInstructor = async (req, res) => {
    try {
        const { instructorId } = req.body;
        const course = await courseService.assignInstructor(req.params.id, instructorId);
        res.status(200).json({
            success: true,
            data: course
        });
    } catch (error) {
        const statusCode = error.message === 'No course found' ? 404 : 500;
        res.status(statusCode).json({ success: false, message: error.message });
    }
};

exports.manageTags = async (req, res) => {
    try {
        const { tag } = req.body;
        const isAdd = req.path.includes('add');
        const course = await courseService.manageTags(req.params.id, tag, isAdd, req.user);
        res.status(200).json({
            success: true,
            data: course
        });
    } catch (error) {
        const statusCode = error.message === 'No course found' ? 404 :
                          error.message === 'Permission denied' ? 403 : 500;
        res.status(statusCode).json({ success: false, message: error.message });
    }
};

exports.updateCourseStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status: targetStatus } = req.body;
        const { course, message } = await courseService.updateCourseStatus(id, targetStatus, req.user);
        res.json({ success: true, message, data: course });
    } catch (error) {
        const statusCode = error.message === 'Invalid status' || error.message.includes('Invalid status transition') ? 400 :
                          error.message === 'Course not found' ? 404 :
                          error.message === 'Permission denied' ? 403 : 500;
        res.status(statusCode).json({ success: false, message: error.message });
    }
};
