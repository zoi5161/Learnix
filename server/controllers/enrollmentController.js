const enrollmentService = require('../services/enrollmentService');

// Enroll in a course
exports.enrollCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user.id;
        const result = await enrollmentService.enrollCourse(courseId, studentId);
        const response = {
            success: true,
            message: result.message,
            data: result.isReEnroll 
                ? { enrollment: result.enrollment }
                : {
                    enrollment: result.enrollment,
                    remainingBudget: result.remainingBudget,
                    remainingBonusCredits: result.remainingBonusCredits
                }
        };
        res.json(response);
    } catch (error) {
        const statusCode = error.message === 'Only students can enroll in courses' ? 403 :
                          error.message === 'Course not found' ? 404 :
                          error.message === 'Course is not available for enrollment' || 
                          error.message === 'Insufficient budget' || 
                          error.message === 'Already enrolled in this course' ? 400 : 500;
        const response = {
            success: false,
            message: error.message || 'Error enrolling in course'
        };
        if (error.data) {
            response.data = error.data;
        }
        res.status(statusCode).json(response);
    }
};

// Unenroll from a course
exports.unenrollCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user.id;
        const result = await enrollmentService.unenrollCourse(courseId, studentId);
        res.json({
            success: true,
            message: result.message,
            data: { enrollment: result.enrollment }
        });
    } catch (error) {
        const statusCode = error.message === 'Only students can unenroll from courses' ? 403 :
                          error.message === 'Course ID is required' || 
                          error.message.includes('already unenrolled') ||
                          error.message.includes('Cannot unenroll') ? 400 :
                          error.message === 'Course not found' || 
                          error.message === 'You are not enrolled in this course' ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message || 'Error unenrolling from course'
        });
    }
};

// Get student's enrollments
exports.getMyEnrollments = async (req, res) => {
    try {
        const studentId = req.user.id;
        const enrollments = await enrollmentService.getMyEnrollments(studentId);
        res.json({
            success: true,
            data: { enrollments }
        });
    } catch (error) {
        const statusCode = error.message === 'Only students can view enrollments' ? 403 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message || 'Error fetching enrollments'
        });
    }
};
