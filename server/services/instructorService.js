const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Quiz = require('../models/Quiz');
const Submission = require('../models/Submission');

/**
 * Get instructor statistics
 */
const getInstructorStats = async (instructorId) => {
    // Get courses created by instructor
    const courses = await Course.find({ instructor_id: instructorId }).lean();
    const courseIds = courses.map(c => c._id);

    // Get total enrollment count for all courses
    const enrollmentCount = await Enrollment.countDocuments({
        course_id: { $in: courseIds },
        status: { $in: ['enrolled', 'completed'] }
    });

    // Get all quizzes for instructor's courses
    const quizzes = await Quiz.find({ course_id: { $in: courseIds } }).lean();
    const quizIds = quizzes.map(q => q._id);

    // Get average quiz scores
    let averageQuizScore = 0;
    if (quizIds.length > 0) {
        const submissions = await Submission.find({ quiz_id: { $in: quizIds } }).lean();
        if (submissions.length > 0) {
            const totalScore = submissions.reduce((sum, s) => sum + (s.score || 0), 0);
            averageQuizScore = Math.round((totalScore / submissions.length) * 100) / 100;
        }
    }

    return {
        courses: courses.length,
        enrollments: enrollmentCount,
        averageQuizScore: averageQuizScore
    };
};

module.exports = {
    getInstructorStats,
};

