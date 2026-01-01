const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');
const Progress = require('../models/Progress');
const Lesson = require('../models/Lesson');

/**
 * Enroll in a course
 */
const enrollCourse = async (courseId, studentId) => {
    // Get student to check budget
    const student = await User.findById(studentId);

    // Check if course exists and is published
    const course = await Course.findById(courseId);
    if (!course) {
        throw new Error('Course not found');
    }

    if (course.status !== 'published') {
        throw new Error('Course is not available for enrollment');
    }

    // Check budget
    const totalBudget = (student.budget || 0) + (student.bonus_credits || 0);
    const coursePrice = course.price || 0;

    if (totalBudget < coursePrice) {
        const error = new Error('Insufficient budget');
        error.data = {
            required: coursePrice,
            available: totalBudget,
            budget: student.budget || 0,
            bonus_credits: student.bonus_credits || 0
        };
        throw error;
    }

    // Deduct from budget first, then bonus credits
    let remainingCost = coursePrice;
    if (student.budget >= remainingCost) {
        student.budget -= remainingCost;
        remainingCost = 0;
    } else {
        remainingCost -= student.budget;
        student.budget = 0;
        if (student.bonus_credits >= remainingCost) {
            student.bonus_credits -= remainingCost;
        } else {
            throw new Error('Insufficient budget (calculation error)');
        }
    }
    await student.save();

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
        student_id: studentId,
        course_id: courseId
    });

    if (existingEnrollment) {
        if (existingEnrollment.status === 'dropped') {
            // Re-enroll if previously dropped
            existingEnrollment.status = 'enrolled';
            await existingEnrollment.save();
            return {
                enrollment: existingEnrollment,
                message: 'Successfully re-enrolled in course',
                isReEnroll: true
            };
        }
        throw new Error('Already enrolled in this course');
    }

    // Create enrollment
    const enrollment = await Enrollment.create({
        student_id: studentId,
        course_id: courseId,
        status: 'enrolled'
    });

    return {
        enrollment,
        message: 'Successfully enrolled in course',
        remainingBudget: student.budget,
        remainingBonusCredits: student.bonus_credits
    };
};

/**
 * Unenroll from a course
 */
const unenrollCourse = async (courseId, studentId) => {
    // Validate courseId format
    if (!courseId || courseId.trim() === '') {
        throw new Error('Course ID is required');
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
        throw new Error('Course not found');
    }

    // Check if enrollment exists and is active (enrolled or completed)
    const enrollment = await Enrollment.findOne({
        student_id: studentId,
        course_id: courseId
    });

    if (!enrollment) {
        throw new Error('You are not enrolled in this course');
    }

    if (enrollment.status === 'dropped') {
        throw new Error('You have already unenrolled from this course');
    }

    if (enrollment.status === 'suspended') {
        throw new Error('Cannot unenroll from a suspended course');
    }

    // Update status to dropped
    enrollment.status = 'dropped';
    await enrollment.save();

    // TODO: Add refund logic for student if needed

    return {
        enrollment,
        message: 'Successfully unenrolled from course'
    };
};

/**
 * Get student's enrollments
 */
const getMyEnrollments = async (studentId) => {

    const enrollments = await Enrollment.find({
        student_id: studentId,
        status: { $in: ['enrolled', 'completed'] }
    })
        .populate({
            path: 'course_id',
            select: 'title description level thumbnail price category tags summary'
        })
        .sort({ createdAt: -1 })
        .lean();

    // Get progress for each course
    const enrollmentsWithProgress = await Promise.all(
        enrollments.map(async (enrollment) => {
            const courseId = enrollment.course_id._id;

            const totalLessons = await Lesson.countDocuments({ course_id: courseId });

            const completedLessons = await Progress.countDocuments({
                student_id: studentId,
                course_id: courseId,
                status: 'completed'
            });

            const completionPercentage = totalLessons > 0
                ? Math.round((completedLessons / totalLessons) * 100)
                : 0;

            return {
                ...enrollment,
                progress: {
                    completed: completedLessons,
                    total: totalLessons,
                    percentage: completionPercentage
                },
                status: enrollment.status === 'completed' ? 'completed' :
                    (completionPercentage === 100 ? 'completed' : 'in-progress')
            };
        })
    );

    return enrollmentsWithProgress;
};

module.exports = {
    enrollCourse,
    unenrollCourse,
    getMyEnrollments,
};

