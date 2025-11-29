const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');
const Progress = require('../models/Progress');
const Lesson = require('../models/Lesson');

// Enroll in a course
exports.enrollCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user.id;

        // Check if user is a student
        if (req.user.role !== 'student') {
            return res.status(403).json({
                success: false,
                message: 'Only students can enroll in courses'
            });
        }

        // Check if course exists and is published
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        if (course.status !== 'published') {
            return res.status(400).json({
                success: false,
                message: 'Course is not available for enrollment'
            });
        }

        // Check budget
        const student = await User.findById(studentId);
        const totalBudget = (student.budget || 0) + (student.bonus_credits || 0);
        const coursePrice = course.price || 0;

        if (totalBudget < coursePrice) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient budget',
                data: {
                    required: coursePrice,
                    available: totalBudget,
                    budget: student.budget || 0,
                    bonus_credits: student.bonus_credits || 0
                }
            });
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
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient budget (calculation error)'
                });
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
                return res.json({
                    success: true,
                    message: 'Successfully re-enrolled in course',
                    data: { enrollment: existingEnrollment }
                });
            }
            return res.status(400).json({
                success: false,
                message: 'Already enrolled in this course'
            });
        }

        // Create enrollment
        const enrollment = await Enrollment.create({
            student_id: studentId,
            course_id: courseId,
            status: 'enrolled'
        });

        res.json({
            success: true,
            message: 'Successfully enrolled in course',
            data: {
                enrollment,
                remainingBudget: student.budget,
                remainingBonusCredits: student.bonus_credits
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error enrolling in course',
            error: error.message
        });
    }
};

// Unenroll from a course
exports.unenrollCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user.id;

        // Check if user is a student
        if (req.user.role !== 'student') {
            return res.status(403).json({
                success: false,
                message: 'Only students can unenroll from courses'
            });
        }

        const enrollment = await Enrollment.findOne({
            student_id: studentId,
            course_id: courseId
        });

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: 'Not enrolled in this course'
            });
        }

        if (enrollment.status === 'dropped') {
            return res.status(400).json({
                success: false,
                message: 'Already unenrolled from this course'
            });
        }

        // Update status to dropped
        enrollment.status = 'dropped';
        await enrollment.save();

        // SAU NÀY THÊM LOGIC HOÀN TIỀN CHO STUDENT NẾU CẦN

        res.json({
            success: true,
            message: 'Successfully unenrolled from course',
            data: { enrollment }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error unenrolling from course',
            error: error.message
        });
    }
};

// Get student's enrollments
exports.getMyEnrollments = async (req, res) => {
    try {
        const studentId = req.user.id;

        if (req.user.role !== 'student') {
            return res.status(403).json({
                success: false,
                message: 'Only students can view enrollments'
            });
        }

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

                // Get total lessons count
                const totalLessons = await Lesson.countDocuments({ course_id: courseId });

                // Get completed lessons count
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

        res.json({
            success: true,
            data: { enrollments: enrollmentsWithProgress }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching enrollments',
            error: error.message
        });
    }
};

