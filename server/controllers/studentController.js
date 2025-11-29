const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Progress = require('../models/Progress');
const User = require('../models/User');

// Get student dashboard data
exports.getDashboard = async (req, res) => {
    try {
        const studentId = req.user.id;

        if (req.user.role !== 'student') {
            return res.status(403).json({
                success: false,
                message: 'Only students can access dashboard'
            });
        }

        // Get student info with budget
        const student = await User.findById(studentId).select('name email budget bonus_credits');
        
        // Get enrollments
        const enrollments = await Enrollment.find({
            student_id: studentId,
            status: { $in: ['enrolled', 'completed'] }
        })
            .populate({
                path: 'course_id',
                select: 'title description level thumbnail price category tags summary instructor_id',
                populate: {
                    path: 'instructor_id',
                    select: 'name email'
                }
            })
            .sort({ createdAt: -1 })
            .lean();

        // Calculate progress for each course
        const coursesWithProgress = await Promise.all(
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

                // Determine status
                let status = 'in-progress';
                if (enrollment.status === 'completed' || completionPercentage === 100) {
                    status = 'completed';
                }

                return {
                    _id: enrollment.course_id._id,
                    title: enrollment.course_id.title,
                    description: enrollment.course_id.description,
                    level: enrollment.course_id.level,
                    thumbnail: enrollment.course_id.thumbnail,
                    category: enrollment.course_id.category,
                    tags: enrollment.course_id.tags,
                    instructor: enrollment.course_id.instructor_id || {
                        _id: '',
                        name: 'Unknown Instructor',
                        email: ''
                    },
                    progress: {
                        completed: completedLessons,
                        total: totalLessons,
                        percentage: completionPercentage
                    },
                    status,
                    enrolledAt: enrollment.createdAt
                };
            })
        );

        // Calculate overall statistics
        const totalEnrolled = coursesWithProgress.length;
        const totalCompleted = coursesWithProgress.filter(c => c.status === 'completed').length;
        const overallProgress = coursesWithProgress.length > 0
            ? Math.round(coursesWithProgress.reduce((sum, c) => sum + c.progress.percentage, 0) / coursesWithProgress.length)
            : 0;

        // Get suggested courses (based on categories of enrolled courses)
        const enrolledCategories = [...new Set(coursesWithProgress.map(c => c.category).filter(Boolean))];
        const suggestedCourses = await Course.find({
            status: 'published',
            _id: { $nin: coursesWithProgress.map(c => c._id) },
            category: { $in: enrolledCategories }
        })
            .populate('instructor_id', 'name email')
            .select('title description level thumbnail price category tags summary')
            .limit(6)
            .lean();

        // Get enrollment counts for suggested courses
        const EnrollmentModel = require('../models/Enrollment');
        const suggestedWithCounts = await Promise.all(
            suggestedCourses.map(async (course) => {
                const enrollmentsCount = await EnrollmentModel.countDocuments({
                    course_id: course._id,
                    status: { $in: ['enrolled', 'completed'] }
                });
                const lessonsCount = await Lesson.countDocuments({ course_id: course._id });
                return {
                    ...course,
                    enrollmentsCount,
                    lessonsCount
                };
            })
        );

        res.json({
            success: true,
            data: {
                student: {
                    name: student.name,
                    email: student.email,
                    budget: student.budget || 0,
                    bonus_credits: student.bonus_credits || 0,
                    total_budget: (student.budget || 0) + (student.bonus_credits || 0)
                },
                statistics: {
                    totalEnrolled,
                    totalCompleted,
                    overallProgress
                },
                enrolledCourses: coursesWithProgress,
                suggestedCourses: suggestedWithCounts
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard data',
            error: error.message
        });
    }
};

// Get student budget info
exports.getBudget = async (req, res) => {
    try {
        const studentId = req.user.id;

        if (req.user.role !== 'student') {
            return res.status(403).json({
                success: false,
                message: 'Only students can view budget'
            });
        }

        const student = await User.findById(studentId).select('budget bonus_credits');

        res.json({
            success: true,
            data: {
                budget: student.budget || 0,
                bonus_credits: student.bonus_credits || 0,
                total: (student.budget || 0) + (student.bonus_credits || 0)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching budget',
            error: error.message
        });
    }
};

